import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, BookOpen, CheckCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Practice = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get("moduleId");

  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [practiceCompleted, setPracticeCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // ---------------- FETCH MODULE + PRACTICE ----------------
  const fetchPracticeData = useCallback(async () => {
    if (!moduleId || !user) return;

    try {
      setLoading(true);

      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .select("*")
        .eq("id", moduleId)
        .single();
      if (moduleError) throw moduleError;
      setModule(moduleData);

      // Check if module completed (all chapters done)
      const { data: progressData, error: progressError } = await supabase
        .from("module_progress")
        .select("*")
        .eq("module_id", moduleId)
        .eq("user_id", user.id)
        .single();

      if (progressError && progressError.code !== "PGRST116") throw progressError;

      if (!progressData?.completed) {
        toast.error("দয়া করে আগে সব অধ্যায় সম্পন্ন করুন");
        navigate(`/learning?moduleId=${moduleId}`);
        return;
      }

      // Fetch practice questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("practice_questions")
        .select("*")
        .eq("module_id", moduleId)
        .order("order_index", { ascending: true });

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);
    } catch (error: any) {
      console.error("Error fetching practice data:", error);
      toast.error("প্র্যাকটিস লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  }, [moduleId, user, navigate]);

  useEffect(() => {
    fetchPracticeData();
  }, [fetchPracticeData]);

  // ---------------- ANSWER SELECTION ----------------
  const handleSelectAnswer = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // ---------------- SUBMIT PRACTICE ----------------
  const handleSubmitPractice = async () => {
    if (!user || !moduleId) return;

    const totalQuestions = questions.length;
    const correctCount = questions.filter(
      (q) => selectedAnswers[q.id] === q.correct_answer
    ).length;

    const calculatedScore = Math.round((correctCount / totalQuestions) * 100);

    try {
      setIsSubmitting(true);

      const { error } = await supabase.from("practice_attempts").insert({
        user_id: user.id,
        module_id: moduleId,
        total_questions: totalQuestions,
        correct_answers: correctCount,
        score: calculatedScore,
        completed_at: new Date().toISOString(),
      });

      if (error) throw error;

      setScore(calculatedScore);
      setPracticeCompleted(true);
      toast.success("প্র্যাকটিস সম্পন্ন হয়েছে!");
    } catch (error: any) {
      console.error("Error submitting practice:", error);
      toast.error("প্র্যাকটিস জমা দিতে সমস্যা হয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPractice = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setPracticeCompleted(false);
    setScore(null);
  };

  // ---------------- LOADING STATE ----------------
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (practiceCompleted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6">
        <CheckCircle className="w-16 h-16 text-success mb-4" />
        <h1 className="text-2xl font-bold mb-2">অভিনন্দন!</h1>
        <p className="text-muted-foreground mb-4">
          আপনি প্র্যাকটিস সম্পন্ন করেছেন।
        </p>
        <div className="text-3xl font-bold mb-6 text-success">
          স্কোর: {score}%
        </div>
        <div className="flex gap-3">
          <Button onClick={resetPractice} variant="outline">
            আবার চেষ্টা করুন
          </Button>
          <Button onClick={() => navigate(`/quiz?moduleId=${moduleId}`)}>
            কুইজে যান
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = selectedAnswers[currentQuestion?.id];
  const progress =
    questions.length > 0
      ? ((currentQuestionIndex + 1) / questions.length) * 100
      : 0;

  // ---------------- UI RENDER ----------------
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/learning`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-base md:text-lg">
                {module?.title} - প্র্যাকটিস
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                প্রশ্ন {currentQuestionIndex + 1}/{questions.length}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">অগ্রগতি</div>
            <div className="font-bold text-sm md:text-lg">
              {Math.round(progress)}%
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="p-6 md:p-8 space-y-6">
            {currentQuestion ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">
                    প্রশ্ন {currentQuestionIndex + 1}
                  </h3>
                </div>

                <p className="text-lg font-medium mb-4">
                  {currentQuestion.question_text}
                </p>

                <div className="space-y-3">
                  {[currentQuestion.option_a, currentQuestion.option_b, currentQuestion.option_c, currentQuestion.option_d].map(
                    (option, i) => (
                      <Button
                        key={i}
                        variant={
                          selectedAnswer === option ? "default" : "outline"
                        }
                        className={`w-full justify-start text-left ${
                          selectedAnswer === option
                            ? "bg-primary text-white"
                            : "hover:bg-primary/10"
                        }`}
                        onClick={() =>
                          handleSelectAnswer(currentQuestion.id, option)
                        }
                      >
                        {option}
                      </Button>
                    )
                  )}
                </div>

                <Progress value={progress} className="h-2 my-4" />

                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentQuestionIndex((i) => Math.max(0, i - 1))
                    }
                    disabled={currentQuestionIndex === 0}
                  >
                    পূর্ববর্তী
                  </Button>

                  {currentQuestionIndex === questions.length - 1 ? (
                    <Button
                      className="bg-success hover:bg-success/90"
                      onClick={handleSubmitPractice}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        "জমা দিন"
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() =>
                        setCurrentQuestionIndex((i) =>
                          Math.min(questions.length - 1, i + 1)
                        )
                      }
                    >
                      পরবর্তী
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                এই মডিউলে এখনো কোনো প্র্যাকটিস প্রশ্ন নেই
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Practice;
