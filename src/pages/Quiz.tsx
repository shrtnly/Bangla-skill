import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CircleCheck as CheckCircle, Circle as XCircle, Loader as Loader2, TriangleAlert as AlertTriangle, Trophy, Clock } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Quiz = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get("moduleId");

  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [hasPremium, setHasPremium] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  useEffect(() => {
    if (moduleId && user) {
      fetchQuizData();
    }
  }, [moduleId, user]);

  useEffect(() => {
    if (hasStarted) {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          toast.error("ট্যাব পরিবর্তন করা যাবে না!");
        }
      };

      const handleBlur = () => {
        toast.error("উইন্ডো পরিবর্তন সনাক্ত করা হয়েছে");
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("blur", handleBlur);

      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("blur", handleBlur);
      };
    }
  }, [hasStarted]);

  const fetchQuizData = async () => {
    try {
      setLoading(true);

      const { data: premiumCheck } = await supabase
        .rpc("has_active_premium_subscription", { user_id_input: user?.id });

      setHasPremium(premiumCheck || false);

      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .select("*")
        .eq("id", moduleId)
        .single();

      if (moduleError) throw moduleError;
      setModule(moduleData);

      const { data: moduleProgressData, error: progressError } = await supabase
        .from("module_progress")
        .select("*")
        .eq("user_id", user?.id)
        .eq("module_id", moduleId)
        .maybeSingle();

      if (progressError) throw progressError;

      if (!moduleProgressData?.practice_completed) {
        toast.error("প্রথমে কমপক্ষে 1 বার প্র্যাকটিস করুন");
        navigate(`/practice?moduleId=${moduleId}`);
        return;
      }

      const { data: practiceQuestions, error: questionsError } = await supabase
        .from("practice_questions")
        .select("*")
        .eq("module_id", moduleId);

      if (questionsError) throw questionsError;

      const shuffled = practiceQuestions?.sort(() => Math.random() - 0.5).slice(0, 10) || [];
      setQuestions(shuffled);

      const { data: attemptsData, error: attemptsError } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("user_id", user?.id)
        .eq("module_id", moduleId)
        .order("attempt_number", { ascending: false });

      if (attemptsError) throw attemptsError;
      setQuizAttempts(attemptsData || []);
    } catch (error: any) {
      console.error("Error fetching quiz data:", error);
      toast.error("ডেটা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const canTakeQuiz = () => {
    if (hasPremium) {
      return { allowed: true, reason: "", isPremium: true };
    }

    if (quizAttempts.length === 0) return { allowed: true, reason: "", isPremium: false };

    const passedAttempt = quizAttempts.find(a => a.passed);
    if (passedAttempt) {
      return { allowed: false, reason: "আপনি ইতিমধ্যে এই কুইজ পাস করেছেন", isPremium: false };
    }

    const freeAttempts = module?.max_free_attempts || 2;
    if (quizAttempts.length < freeAttempts) {
      return { allowed: true, reason: "", isPremium: false };
    }

    const lastAttempt = quizAttempts[0];
    const canRetakeAt = new Date(lastAttempt.can_retake_at);
    const now = new Date();

    if (now < canRetakeAt) {
      const hoursLeft = Math.ceil((canRetakeAt.getTime() - now.getTime()) / (1000 * 60 * 60));
      return {
        allowed: false,
        reason: `আবার চেষ্টা করতে আরও ${hoursLeft} ঘন্টা অপেক্ষা করুন`,
        isPremium: false,
        canUpgrade: true,
        hoursLeft
      };
    }

    return { allowed: true, reason: "", isPremium: false };
  };

  const startQuiz = () => {
    const check = canTakeQuiz();
    if (!check.allowed) {
      toast.error(check.reason);
      return;
    }

    setHasStarted(true);
    toast.success("কুইজ শুরু হয়েছে। সাবধানে উত্তর দিন!");
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: answer
    });
  };

  const submitQuiz = async () => {
    if (!user) return;

    let correctCount = 0;
    questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correct_answer) {
        correctCount++;
      }
    });

    const percentage = (correctCount / questions.length) * 100;
    const passingScore = module?.passing_score || 70;
    const passed = percentage >= passingScore;

    try {
      const attemptNumber = quizAttempts.length + 1;
      const retakeWaitHours = module?.retake_wait_hours || 24;
      const canRetakeAt = new Date();
      canRetakeAt.setHours(canRetakeAt.getHours() + retakeWaitHours);

      const { error } = await supabase
        .from("quiz_attempts")
        .insert({
          user_id: user.id,
          module_id: moduleId,
          attempt_number: attemptNumber,
          score: correctCount,
          total_questions: questions.length,
          passed: passed,
          completed_at: new Date().toISOString(),
          can_retake_at: passed ? null : canRetakeAt.toISOString()
        });

      if (error) throw error;

      if (passed) {
        const { error: progressError } = await supabase
          .from("module_progress")
          .update({
            quiz_passed: true,
            status: "completed",
            completed_at: new Date().toISOString()
          })
          .eq("user_id", user.id)
          .eq("module_id", moduleId);

        if (progressError) throw progressError;

        // Check if all modules in the course are completed and generate certificate
        if (module && user) {
          try {
            const { data: courseData } = await supabase
              .from("modules")
              .select("course_id")
              .eq("id", moduleId)
              .single();

            if (courseData) {
              const { data: certResult, error: certError } = await supabase
                .rpc("check_and_generate_certificate", {
                  p_user_id: user.id,
                  p_course_id: courseData.course_id
                });

              if (!certError && certResult?.success) {
                toast.success("🎉 অভিনন্দন! আপনি সার্টিফিকেট অর্জন করেছেন!", {
                  duration: 5000
                });
              }
            }
          } catch (certError: any) {
            console.log("Certificate check:", certError);
          }
        }
      }

      setFinalScore(correctCount);
      setIsComplete(true);

      if (passed) {
        toast.success("অভিনন্দন! আপনি পাস করেছেন! 🎉");
      } else {
        toast.error("দুঃখিত, আপনি পাস করতে পারেননি");
      }
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      toast.error("সমস্যা হয়েছে");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isComplete) {
    const percentage = Math.round((finalScore / questions.length) * 100);
    const passingScore = module?.passing_score || 70;
    const passed = percentage >= passingScore;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 text-center space-y-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
            passed ? "bg-success/10" : "bg-destructive/10"
          }`}>
            {passed ? (
              <Trophy className="w-10 h-10 text-success" />
            ) : (
              <XCircle className="w-10 h-10 text-destructive" />
            )}
          </div>

          <h2 className="text-3xl font-bold">
            {passed ? "অভিনন্দন! পাস করেছেন!" : "দুঃখিত, পাস করতে পারেননি"}
          </h2>

          <div className="grid grid-cols-3 gap-4 py-6">
            <div>
              <div className="text-3xl font-bold text-primary">{finalScore}</div>
              <div className="text-sm text-muted-foreground">সঠিক উত্তর</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{questions.length}</div>
              <div className="text-sm text-muted-foreground">মোট প্রশ্ন</div>
            </div>
            <div>
              <div className={`text-3xl font-bold ${passed ? "text-success" : "text-destructive"}`}>
                {percentage}%
              </div>
              <div className="text-sm text-muted-foreground">স্কোর</div>
            </div>
          </div>

          {passed ? (
            <div className="bg-success/5 border border-success/20 rounded-lg p-4">
              <p className="text-success font-semibold">
                পাসিং স্কোর: {passingScore}% - আপনি অর্জন করেছেন: {percentage}%
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                পরবর্তী মডিউল এখন আনলক হয়েছে
              </p>
            </div>
          ) : (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <p className="text-destructive font-semibold">
                পাসিং স্কোর: {passingScore}% - আপনি অর্জন করেছেন: {percentage}%
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {quizAttempts.length + 1 >= (module?.max_free_attempts || 2)
                  ? `${module?.retake_wait_hours || 24} ঘন্টা পরে আবার চেষ্টা করুন`
                  : "আবার চেষ্টা করতে পারবেন"}
              </p>
            </div>
          )}

          <Button onClick={() => navigate("/learning")} className="w-full">
            শেখার পাতায় ফিরে যান
          </Button>
        </Card>
      </div>
    );
  }

  if (!hasStarted) {
    const check = canTakeQuiz();

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">চূড়ান্ত কুইজ</h2>
            <p className="text-muted-foreground">{module?.title}</p>
          </div>

          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="space-y-2">
              <p className="font-semibold">কুইজের নিয়মাবলী:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>মোট প্রশ্ন: {questions.length} টি</li>
                <li>পাসিং স্কোর: {module?.passing_score || 70}%</li>
                {hasPremium ? (
                  <li className="text-green-600 font-semibold">
                    ✓ প্রিমিয়াম: সীমাহীন প্রচেষ্টা - কোনো অপেক্ষার সময় নেই
                  </li>
                ) : (
                  <>
                    <li>ফ্রি প্রচেষ্টা: {module?.max_free_attempts || 2} বার</li>
                    <li>ব্যর্থ হলে অপেক্ষা: {module?.retake_wait_hours || 24} ঘন্টা</li>
                  </>
                )}
                <li>কুইজ চলাকালীন অন্য ট্যাব খোলা যাবে না</li>
                <li>একবার শুরু করলে মাঝপথে ছাড়া যাবে না</li>
              </ul>
            </AlertDescription>
          </Alert>

          {quizAttempts.length > 0 && (
            <Card className="p-4 bg-muted/50">
              <h3 className="font-semibold mb-2">পূর্ববর্তী প্রচেষ্টা:</h3>
              <div className="space-y-2">
                {quizAttempts.slice(0, 3).map((attempt, index) => (
                  <div key={attempt.id} className="flex items-center justify-between text-sm">
                    <span>প্রচেষ্টা {attempt.attempt_number}</span>
                    <div className="flex items-center gap-2">
                      <span>
                        {attempt.score}/{attempt.total_questions}
                      </span>
                      {attempt.passed ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {!check.allowed ? (
            <>
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{check.reason}</AlertDescription>
              </Alert>

              {check.canUpgrade && (
                <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-300 dark:border-amber-700">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">অপেক্ষা এড়িয়ে যান!</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        প্রিমিয়াম সাবস্ক্রিপশন নিয়ে সীমাহীন কুইজ প্রচেষ্টা পান - কোনো অপেক্ষার সময় ছাড়াই!
                      </p>
                      <ul className="text-sm space-y-1 mb-4">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>সীমাহীন কুইজ প্রচেষ্টা</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>কোনো অপেক্ষার সময় নেই</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>সব কোর্সে অ্যাক্সেস</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>অগ্রাধিকার সহায়তা</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                      onClick={() => {
                        toast.info("প্রিমিয়াম আপগ্রেড ফিচার শীঘ্রই আসছে");
                      }}
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      প্রিমিয়াম নিন
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/learning")}
                    >
                      পরে করব
                    </Button>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <div className="space-y-3">
              {hasPremium && (
                <Badge className="w-full justify-center py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  <Trophy className="w-4 h-4 mr-2" />
                  প্রিমিয়াম সদস্য - সীমাহীন প্রচেষ্টা
                </Badge>
              )}
              <Button onClick={startQuiz} className="w-full" size="lg">
                <Trophy className="w-5 h-5 mr-2" />
                কুইজ শুরু করুন
              </Button>
              <Button onClick={() => navigate("/learning")} variant="outline" className="w-full">
                বাতিল করুন
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const options = [
    { key: "A", text: currentQuestion.option_a },
    { key: "B", text: currentQuestion.option_b },
    { key: "C", text: currentQuestion.option_c },
    { key: "D", text: currentQuestion.option_d }
  ];

  const answeredQuestions = Object.keys(selectedAnswers).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-bold text-base md:text-lg">চূড়ান্ত কুইজ</h1>
              <p className="text-xs md:text-sm text-muted-foreground">{module?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              প্রশ্ন {currentQuestionIndex + 1}/{questions.length}
            </Badge>
            <Badge>
              <Clock className="w-3 h-3 mr-1" />
              {answeredQuestions}/{questions.length}
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              সাবধান: অন্য ট্যাব খোলা বা উইন্ডো পরিবর্তন করা যাবে না
            </AlertDescription>
          </Alert>

          <Card className="p-6 md:p-8 space-y-6">
            <div>
              <Badge className="mb-4" variant="destructive">চূড়ান্ত পরীক্ষা</Badge>
              <h2 className="text-xl md:text-2xl font-semibold leading-relaxed">
                {currentQuestion.question_text}
              </h2>
            </div>

            <div className="space-y-3">
              {options.map((option) => {
                const isSelected = selectedAnswers[currentQuestionIndex] === option.key;

                return (
                  <button
                    key={option.key}
                    onClick={() => handleAnswerSelect(option.key)}
                    className={`w-full p-4 rounded-lg text-left transition-all border-2 ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                        isSelected ? "bg-primary text-white" : "bg-muted"
                      }`}>
                        {option.key}
                      </div>
                      <span className="flex-1">{option.text}</span>
                      {isSelected && <CheckCircle className="w-5 h-5 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
              >
                পূর্ববর্তী
              </Button>

              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  disabled={!selectedAnswers[currentQuestionIndex]}
                >
                  পরবর্তী
                </Button>
              ) : (
                <Button
                  onClick={submitQuiz}
                  disabled={answeredQuestions !== questions.length}
                  className="bg-success hover:bg-success/90"
                >
                  জমা দিন
                </Button>
              )}
            </div>
          </Card>

          <div className="flex justify-center gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full transition-all text-xs font-semibold ${
                  selectedAnswers[index]
                    ? "bg-primary text-white"
                    : index === currentQuestionIndex
                    ? "bg-primary/20 border-2 border-primary"
                    : "bg-muted"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
