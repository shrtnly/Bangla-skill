import { useEffect, useState, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, CheckCircle, BookOpen } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type QuizQuestion = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer?: string; // optional on client: server should keep correct answers
  order_index?: number;
};

export default function QuizPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get("moduleId");

  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState<any>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [allowedReason, setAllowedReason] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  // track start time to compute timeSpent
  const startTimeRef = useRef<number | null>(null);

  // tab visibility / blur detection (simple deterrent)
  const blurCountRef = useRef(0);
  useEffect(() => {
    const onBlur = () => { blurCountRef.current += 1; };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  // fetch module & questions
  const fetchQuizData = useCallback(async () => {
    if (!moduleId) return;
    try {
      setLoading(true);

      // module
      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .select("*")
        .eq("id", moduleId)
        .single();
      if (moduleError) throw moduleError;
      setModule(moduleData);

      // questions (server should not return correct_answer unless you intend)
      const { data: qData, error: qError } = await supabase
        .from<QuizQuestion>("quiz_questions")
        .select("*")
        .eq("module_id", moduleId)
        .order("order_index", { ascending: true });

      if (qError) throw qError;
      setQuestions(qData || []);

      // check RPC for attempt allowance
      if (user?.id) {
        try {
          const rpcRes: any = await supabase.rpc("can_attempt_quiz", {
            p_user_id: user.id,
            p_module_id: Number(moduleId),
          });
          // rpc can return boolean or object { allowed: boolean, reason: text }
          if (typeof rpcRes === "boolean") {
            setIsAllowed(rpcRes);
            setAllowedReason(rpcRes ? null : "Attempt blocked by server");
          } else {
            setIsAllowed(Boolean(rpcRes?.allowed ?? true));
            setAllowedReason(rpcRes?.reason ?? null);
          }
        } catch (rpcErr) {
          console.warn("can_attempt_quiz RPC failed, allowing attempt client-side:", rpcErr);
          // Fallback: allow attempt but inform user
          setIsAllowed(true);
          setAllowedReason("Attempt check unavailable; proceeding.");
        }
      } else {
        setIsAllowed(false);
        setAllowedReason("Please sign in to take the quiz");
      }

      // start timer
      startTimeRef.current = Date.now();
    } catch (err: any) {
      console.error("Error loading quiz data:", err);
      toast.error("কুইজ লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  }, [moduleId, user]);

  useEffect(() => {
    fetchQuizData();
    // reset results/answers on module change
    setAnswers({});
    setResult(null);
    blurCountRef.current = 0;
  }, [fetchQuizData]);

  // answer selection
  const selectAnswer = (qId: string, option: string) => {
    setAnswers((s) => ({ ...s, [qId]: option }));
  };

  // compute score (if correct_answer fields are present client-side; otherwise server will evaluate)
  const computeScore = (): { score: number; correctCount: number } => {
    if (questions.length === 0) return { score: 0, correctCount: 0 };
    let correct = 0;
    for (const q of questions) {
      const chosen = answers[q.id];
      // if server does not provide correct_answer in query, skip client scoring
      if (typeof q.correct_answer !== "undefined") {
        if (chosen && chosen === q.correct_answer) correct += 1;
      }
    }
    const score = Math.round((correct / questions.length) * 100);
    return { score, correctCount: correct };
  };

  // submit quiz
  const submitQuiz = async () => {
    if (!user?.id) {
      toast.error("প্রথমে সাইন ইন করুন");
      return;
    }
    if (!isAllowed) {
      toast.error(allowedReason ?? "আপনি এখন কুইজ দিতে পারবেন না");
      return;
    }
    if (questions.length === 0) {
      toast.error("কোনো প্রশ্ন নেই");
      return;
    }

    try {
      setIsSubmitting(true);
      const endTime = Date.now();
      const timeSpentMs = startTimeRef.current ? endTime - startTimeRef.current : 0;
      const timeSpentSec = Math.round(timeSpentMs / 1000);

      // Prepare metadata
      const metadata = {
        answers,
        timeSpentSec,
        blurCount: blurCountRef.current,
      };

      // If questions include correct_answer, compute client score, else let server handle (we still record what user answered)
      const { score: clientScore } = computeScore();

      // Insert attempt
      const { data: attemptData, error: insertError } = await supabase
        .from("quiz_attempts")
        .insert({
          user_id: user.id,
          module_id: moduleId,
          score: clientScore, // store client computed score (server should validate/trust or recompute)
          attempt_at: new Date().toISOString(),
          metadata,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Optionally call an RPC to evaluate score on server (if you have one). For now we accept clientScore.
      const passed = clientScore >= 70;

      setResult({ score: clientScore, passed });

      toast.success(`কুইজ জমা হয়েছে — স্কোর ${clientScore}%`);

      // If passed, mark module complete server-side
      if (passed) {
        const { error: upsertError } = await supabase
          .from("module_progress")
          .upsert(
            {
              user_id: user.id,
              module_id: moduleId,
              completed: true,
              completed_at: new Date().toISOString(),
            },
            { onConflict: "user_id,module_id" }
          );
        if (upsertError) throw upsertError;

        toast.success("মডিউল সম্পন্ন হয়েছে — শুভকামনা!");
        // navigate to dashboard or certificate after short delay
        setTimeout(() => navigate("/dashboard"), 800);
      } else {
        // not passed — allow retry if RPC allows (server limit)
        toast.error("পাশ করতে পারেননি — আবার চেষ্টা করুন");
      }
    } catch (err: any) {
      console.error("Error submitting quiz:", err);
      toast.error("কুইজ জমা দিতে সমস্যা হয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick UI helpers
  const answeredCount = Object.keys(answers).length;
  const total = questions.length;
  const progress = total > 0 ? (answeredCount / total) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Result view after submit
  if (result) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <CheckCircle className="w-20 h-20 text-success mb-4" />
        <h2 className="text-2xl font-bold mb-2">
          {result.passed ? "অভিনন্দন! আপনি পাশ করেছেন" : "দুঃখিত — পাশ হননি"}
        </h2>
        <p className="text-muted-foreground mb-4">আপনার স্কোর: {result.score}%</p>
        <div className="flex gap-3">
          {!result.passed && (
            <Button onClick={() => { setResult(null); setAnswers({}); startTimeRef.current = Date.now(); }}>
              আবার চেষ্টা করুন
            </Button>
          )}
          <Button onClick={() => navigate("/dashboard")}>ড্যাশবোর্ড</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/learning?moduleId=${moduleId}`)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-base md:text-lg">{module?.title ?? "মডিউল কুইজ"}</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                প্রশ্ন: {answeredCount}/{total}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">অগ্রগতি</div>
            <div className="font-bold text-sm md:text-lg">{Math.round(progress)}%</div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold">কুইজ</h3>
            </div>

            {isAllowed === false && (
              <div className="mb-4 p-3 rounded border border-yellow-200 bg-yellow-50 text-sm">
                {allowedReason ?? "আপনি কুইজ দিতে অনুমোদিত নন।"}
              </div>
            )}

            {questions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">এই মডিউলে কোনো কুইজ নেই</div>
            ) : (
              <>
                <div className="space-y-4">
                  {questions.map((q, idx) => {
                    const chosen = answers[q.id];
                    // options order
                    const options = [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean);
                    return (
                      <div key={q.id} className="p-4 border rounded">
                        <div className="mb-2 font-medium">
                          {idx + 1}. {q.question_text}
                        </div>
                        <div className="grid gap-2">
                          {options.map((opt, oi) => {
                            const isSelected = chosen === opt;
                            return (
                              <Button
                                key={oi}
                                variant={isSelected ? "default" : "outline"}
                                onClick={() => selectAnswer(q.id, opt)}
                                className="justify-start text-left"
                              >
                                {opt}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground">উত্তর দেয়া হয়েছে</div>
                    <div className="font-bold">{answeredCount}/{total}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button onClick={() => { setAnswers({}); startTimeRef.current = Date.now(); }} variant="outline">রিসেট উত্তর</Button>

                    <Button onClick={submitQuiz} disabled={isSubmitting || isAllowed === false} className="bg-success hover:bg-success/90">
                      {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "জমা দিন"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
