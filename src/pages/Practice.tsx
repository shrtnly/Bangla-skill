import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CircleCheck as CheckCircle, Circle as XCircle, Loader as Loader2, CircleAlert as AlertCircle } from "lucide-react";
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
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [practiceAttempts, setPracticeAttempts] = useState<any[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (moduleId && user) {
      fetchPracticeData();
    }
  }, [moduleId, user]);

  const fetchPracticeData = async () => {
    try {
      setLoading(true);

      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .select("*")
        .eq("id", moduleId)
        .single();

      if (moduleError) throw moduleError;
      setModule(moduleData);

      const { data: chaptersData } = await supabase
        .from("chapters")
        .select("id")
        .eq("module_id", moduleId);

      const totalChapters = chaptersData?.length || 0;

      if (totalChapters === 0) {
        toast.error("এই মডিউলে কোনো অধ্যায় নেই");
        navigate(`/learning`);
        return;
      }

      const { data: chapterProgressData } = await supabase
        .from("chapter_progress")
        .select("*")
        .eq("user_id", user?.id)
        .in("chapter_id", chaptersData?.map(c => c.id) || [])
        .eq("completed", true);

      const completedChapters = chapterProgressData?.length || 0;

      if (completedChapters < totalChapters) {
        toast.error(`প্রথমে সব অধ্যায় সম্পন্ন করুন (${completedChapters}/${totalChapters} সম্পন্ন)`);
        setTimeout(() => {
          navigate(`/chapter?moduleId=${moduleId}`);
        }, 1500);
        return;
      }

      const { data: moduleProgressData, error: progressError } = await supabase
        .from("module_progress")
        .select("*")
        .eq("user_id", user?.id)
        .eq("module_id", moduleId)
        .maybeSingle();

      if (progressError) throw progressError;

      const { data: attemptsData, error: attemptsError } = await supabase
        .from("practice_attempts")
        .select("*")
        .eq("user_id", user?.id)
        .eq("module_id", moduleId)
        .order("attempt_number", { ascending: false });

      if (attemptsError) throw attemptsError;
      setPracticeAttempts(attemptsData || []);

      if (attemptsData && attemptsData.length >= 3) {
        toast.info("আপনি সর্বোচ্চ 3 বার প্র্যাকটিস করেছেন");
      }

      const { data: questionsData, error: questionsError } = await supabase
        .from("practice_questions")
        .select("*")
        .eq("module_id", moduleId);

      if (questionsError) throw questionsError;

      const shuffled = questionsData?.sort(() => Math.random() - 0.5).slice(0, 10) || [];
      setQuestions(shuffled);
    } catch (error: any) {
      console.error("Error fetching practice data:", error);
      toast.error("ডেটা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (showFeedback) return;

    setSelectedAnswer(answer);
    setShowFeedback(true);

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correct_answer;

    if (isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      completePractice();
    }
  };

  const completePractice = async () => {
    if (!user) return;

    try {
      const attemptNumber = practiceAttempts.length + 1;

      const { error } = await supabase
        .from("practice_attempts")
        .insert({
          user_id: user.id,
          module_id: moduleId,
          attempt_number: attemptNumber,
          questions_data: questions,
          score: score,
          total_questions: questions.length
        });

      if (error) throw error;

      const { error: progressError } = await supabase
        .from("module_progress")
        .update({
          practice_completed: true
        })
        .eq("user_id", user.id)
        .eq("module_id", moduleId);

      if (progressError) throw progressError;

      setIsComplete(true);

      if (attemptNumber === 1) {
        toast.success("প্র্যাকটিস সম্পন্ন! এখন চূড়ান্ত কুইজের জন্য প্রস্তুত");
      } else {
        toast.success(`প্র্যাকটিস ${attemptNumber} সম্পন্ন হয়েছে!`);
      }
    } catch (error: any) {
      console.error("Error completing practice:", error);
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
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>

          <h2 className="text-3xl font-bold">প্র্যাকটিস সম্পন্ন!</h2>

          <div className="grid grid-cols-3 gap-4 py-6">
            <div>
              <div className="text-3xl font-bold text-primary">{score}</div>
              <div className="text-sm text-muted-foreground">সঠিক উত্তর</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{questions.length}</div>
              <div className="text-sm text-muted-foreground">মোট প্রশ্ন</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-success">{percentage}%</div>
              <div className="text-sm text-muted-foreground">স্কোর</div>
            </div>
          </div>

          <p className="text-muted-foreground">
            আপনি এখন চূড়ান্ত কুইজে অংশগ্রহণ করতে পারবেন
          </p>

          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate("/learning")} variant="outline">
              শেখার পাতায় ফিরে যান
            </Button>
            <Button
              onClick={() => navigate(`/quiz?moduleId=${moduleId}`)}
              className="bg-success hover:bg-success/90"
            >
              চূড়ান্ত কুইজ শুরু করুন
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!hasStarted) {
    const canPractice = practiceAttempts.length < 3;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">প্র্যাকটিস সেশন</h2>
            <p className="text-muted-foreground">{module?.title}</p>
          </div>

          <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              প্র্যাকটিসের উদ্দেশ্য:
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>চূড়ান্ত কুইজের জন্য প্রস্তুতি নিন</li>
              <li>ভুল উত্তরের জন্য সঠিক ব্যাখ্যা দেখুন</li>
              <li>প্রতিবার অনন্য প্রশ্ন পাবেন</li>
              <li>সর্বোচ্চ 3 বার প্র্যাকটিস করতে পারবেন</li>
              <li>কমপক্ষে 1 বার প্র্যাকটিস বাধ্যতামূলক</li>
            </ul>
          </Card>

          {practiceAttempts.length > 0 && (
            <Card className="p-4 bg-muted/50">
              <h3 className="font-semibold mb-2">পূর্ববর্তী প্র্যাকটিস:</h3>
              <div className="space-y-2">
                {practiceAttempts.map((attempt, index) => (
                  <div key={attempt.id} className="flex items-center justify-between text-sm">
                    <span>প্র্যাকটিস {attempt.attempt_number}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {attempt.score}/{attempt.total_questions}
                      </span>
                      <span className="text-muted-foreground">
                        ({Math.round((attempt.score / attempt.total_questions) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="space-y-3">
            {canPractice ? (
              <>
                <Button onClick={() => setHasStarted(true)} className="w-full bg-green-600 hover:bg-green-700" size="lg">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  প্র্যাকটিস শুরু করুন ({practiceAttempts.length + 1}/3)
                </Button>
                {practiceAttempts.length > 0 && (
                  <Button
                    onClick={() => navigate(`/quiz?moduleId=${moduleId}`)}
                    className="w-full"
                    variant="outline"
                  >
                    চূড়ান্ত কুইজে যান
                  </Button>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-center">
                    আপনি সর্বোচ্চ 3 বার প্র্যাকটিস সম্পন্ন করেছেন। এখন চূড়ান্ত কুইজে অংশগ্রহণ করুন।
                  </p>
                </Card>
                <Button
                  onClick={() => navigate(`/quiz?moduleId=${moduleId}`)}
                  className="w-full"
                  size="lg"
                >
                  চূড়ান্ত কুইজ শুরু করুন
                </Button>
              </div>
            )}
            <Button onClick={() => navigate("/learning")} variant="outline" className="w-full">
              ফিরে যান
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8 text-center space-y-4">
          <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-bold">কোনো প্রশ্ন পাওয়া যায়নি</h2>
          <p className="text-muted-foreground">এই মডিউলে এখনো প্রশ্ন যোগ করা হয়নি</p>
          <Button onClick={() => navigate("/learning")}>ফিরে যান</Button>
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

  const isCorrect = selectedAnswer === currentQuestion.correct_answer;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/learning")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-base md:text-lg">প্র্যাকটিস কুইজ</h1>
              <p className="text-xs md:text-sm text-muted-foreground">{module?.title}</p>
            </div>
          </div>
          <Badge variant="outline">
            প্রশ্ন {currentQuestionIndex + 1}/{questions.length}
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="p-6 md:p-8 space-y-6">
            <div>
              <Badge className="mb-4">অনুশীলন</Badge>
              <h2 className="text-xl md:text-2xl font-semibold leading-relaxed">
                {currentQuestion.question_text}
              </h2>
            </div>

            <div className="space-y-3">
              {options.map((option) => {
                let colorClass = "border-2 hover:border-primary";

                if (showFeedback) {
                  if (option.key === currentQuestion.correct_answer) {
                    colorClass = "border-2 border-success bg-success/5";
                  } else if (option.key === selectedAnswer) {
                    colorClass = "border-2 border-destructive bg-destructive/5";
                  }
                }

                return (
                  <button
                    key={option.key}
                    onClick={() => handleAnswerSelect(option.key)}
                    disabled={showFeedback}
                    className={`w-full p-4 rounded-lg text-left transition-all ${colorClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold flex-shrink-0">
                        {option.key}
                      </div>
                      <span className="flex-1">{option.text}</span>
                      {showFeedback && option.key === currentQuestion.correct_answer && (
                        <CheckCircle className="w-5 h-5 text-success" />
                      )}
                      {showFeedback && option.key === selectedAnswer && option.key !== currentQuestion.correct_answer && (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {showFeedback && (
              <Card className={`p-4 ${isCorrect ? "bg-success/5 border-success" : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"}`}>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  {isCorrect ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-success" />
                      সঠিক উত্তর!
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      ব্যাখ্যা
                    </>
                  )}
                </h3>
                {currentQuestion.explanation && (
                  <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
                )}
              </Card>
            )}

            {showFeedback && (
              <Button onClick={handleNext} className="w-full">
                {currentQuestionIndex < questions.length - 1 ? "পরবর্তী প্রশ্ন" : "সম্পন্ন করুন"}
              </Button>
            )}
          </Card>

          <div className="flex justify-center gap-2">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all ${
                  index < currentQuestionIndex
                    ? "bg-success"
                    : index === currentQuestionIndex
                    ? "bg-primary w-8"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Practice;
