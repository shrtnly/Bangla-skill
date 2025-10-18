import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Loader2,
  BookOpen,
  Lock
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Chapter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get("moduleId");

  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [learningPoints, setLearningPoints] = useState<any[]>([]);
  const [completedPoints, setCompletedPoints] = useState<string[]>([]);
  const [chapterProgress, setChapterProgress] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (moduleId) {
      fetchModuleData();
    }
  }, [moduleId]);

  useEffect(() => {
    if (chapters.length > 0 && chapters[selectedChapterIndex]) {
      fetchLearningPoints(chapters[selectedChapterIndex].id);
      loadChapterProgress(chapters[selectedChapterIndex].id);
    }
  }, [selectedChapterIndex, chapters]);

  const fetchModuleData = async () => {
    try {
      setLoading(true);

      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .select("*")
        .eq("id", moduleId)
        .single();

      if (moduleError) throw moduleError;
      setModule(moduleData);

      const { data: chaptersData, error: chaptersError } = await supabase
        .from("chapters")
        .select("*")
        .eq("module_id", moduleId)
        .order("order_index");

      if (chaptersError) throw chaptersError;
      setChapters(chaptersData || []);

      if (user) {
        const { data: progressData, error: progressError } = await supabase
          .from("chapter_progress")
          .select("*")
          .eq("user_id", user.id)
          .in("chapter_id", (chaptersData || []).map(c => c.id));

        if (progressError) throw progressError;
        setChapterProgress(progressData || []);
      }
    } catch (error: any) {
      console.error("Error fetching module data:", error);
      toast.error("ডেটা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const loadChapterProgress = (chapterId: string) => {
    const progress = chapterProgress.find(p => p.chapter_id === chapterId);
    if (progress?.completed_learning_points) {
      setCompletedPoints(progress.completed_learning_points);
    } else {
      setCompletedPoints([]);
    }
  };

  const fetchLearningPoints = async (chapterId: string) => {
    try {
      const { data, error } = await supabase
        .from("learning_points")
        .select("*")
        .eq("chapter_id", chapterId)
        .order("order_index");

      if (error) throw error;
      setLearningPoints(data || []);
    } catch (error: any) {
      console.error("Error fetching learning points:", error);
      toast.error("শিক্ষা পয়েন্ট লোড করতে সমস্যা হয়েছে");
    }
  };

  const isChapterCompleted = (chapterId: string) => {
    return chapterProgress.some(p => p.chapter_id === chapterId && p.completed);
  };

  const markPointCompleted = async (pointId: string) => {
    if (!user || completedPoints.includes(pointId)) return;

    const currentChapter = chapters[selectedChapterIndex];
    const newCompletedPoints = [...completedPoints, pointId];
    setCompletedPoints(newCompletedPoints);

    try {
      await supabase
        .from("chapter_progress")
        .upsert({
          user_id: user.id,
          chapter_id: currentChapter.id,
          completed_learning_points: newCompletedPoints,
          completed: false
        }, {
          onConflict: "user_id,chapter_id"
        });

      toast.success("পয়েন্ট সম্পন্ন হয়েছে!");
    } catch (error: any) {
      console.error("Error marking point complete:", error);
    }
  };

  const markChapterComplete = async () => {
    if (!user || submitting) return;

    const currentChapter = chapters[selectedChapterIndex];
    if (!currentChapter) return;

    if (isChapterCompleted(currentChapter.id)) {
      toast.info("এই অধ্যায় ইতিমধ্যে সম্পন্ন হয়েছে");
      if (selectedChapterIndex < chapters.length - 1) {
        setSelectedChapterIndex(selectedChapterIndex + 1);
      }
      return;
    }

    const allPointsCompleted = learningPoints.every(point => completedPoints.includes(point.id));

    if (!allPointsCompleted) {
      toast.error("সব শেখার পয়েন্ট সম্পন্ন করুন");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from("chapter_progress")
        .upsert({
          user_id: user.id,
          chapter_id: currentChapter.id,
          completed: true,
          completed_learning_points: completedPoints,
          completed_at: new Date().toISOString()
        }, {
          onConflict: "user_id,chapter_id"
        });

      if (error) throw error;

      const updatedProgress = await supabase
        .from("chapter_progress")
        .select("*")
        .eq("user_id", user.id)
        .in("chapter_id", chapters.map(c => c.id));

      if (updatedProgress.data) {
        setChapterProgress(updatedProgress.data);
      }

      toast.success("অধ্যায় সম্পন্ন হয়েছে!");

      const completedChaptersCount = updatedProgress.data?.filter(p => p.completed).length || 0;
      const allChaptersComplete = completedChaptersCount === chapters.length;

      if (allChaptersComplete) {
        const { error: moduleError } = await supabase
          .from("module_progress")
          .upsert({
            user_id: user.id,
            module_id: moduleId,
            learning_completed: true,
            completed: true,
            status: "in_progress"
          }, {
            onConflict: "user_id,module_id"
          });

        if (moduleError) {
          console.error("Error updating module progress:", moduleError);
        }

        toast.success("সব অধ্যায় সম্পন্ন! প্র্যাকটিস আনলক হয়েছে 🎉", {
          duration: 4000
        });

        setTimeout(() => {
          navigate(`/practice?moduleId=${moduleId}`);
        }, 1500);
      } else {
        if (selectedChapterIndex < chapters.length - 1) {
          setSelectedChapterIndex(selectedChapterIndex + 1);
          setCompletedPoints([]);
        }
      }
    } catch (error: any) {
      console.error("Error marking chapter complete:", error);
      toast.error("সমস্যা হয়েছে");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChapterNavigation = (index: number) => {
    if (index === 0) {
      setSelectedChapterIndex(index);
      return;
    }

    const previousChapterCompleted = isChapterCompleted(chapters[index - 1]?.id);
    if (!previousChapterCompleted) {
      toast.error("আগের অধ্যায় সম্পন্ন করুন");
      return;
    }

    setSelectedChapterIndex(index);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentChapter = chapters[selectedChapterIndex];
  const completedChaptersCount = chapters.filter(c => isChapterCompleted(c.id)).length;
  const progress = chapters.length > 0 ? (completedChaptersCount / chapters.length) * 100 : 0;
  const isCurrentChapterCompleted = isChapterCompleted(currentChapter?.id);
  const allPointsCompleted = learningPoints.every(point => completedPoints.includes(point.id));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/learning`)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-base md:text-lg">{module?.title}</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                অধ্যায় {selectedChapterIndex + 1}/{chapters.length}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">মোট অগ্রগতি</div>
            <div className="font-bold text-sm md:text-lg">{Math.round(progress)}%</div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Badge className={isCurrentChapterCompleted
                  ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                }>
                  অধ্যায় {selectedChapterIndex + 1}
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold">{currentChapter?.title}</h2>
                {isCurrentChapterCompleted && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    ✓ সম্পন্ন হয়েছে
                  </Badge>
                )}
              </div>
              {isCurrentChapterCompleted && (
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
              )}
            </div>

            <Progress value={progress} className="h-2" />

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div>
                {completedChaptersCount}/{chapters.length} অধ্যায় সম্পন্ন
              </div>
              <div>
                {completedPoints.length}/{learningPoints.length} পয়েন্ট সম্পন্ন
              </div>
            </div>
          </Card>

          {isCurrentChapterCompleted && (
            <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-700 dark:text-green-400">
                  এই অধ্যায় সম্পন্ন হয়েছে। আপনি শেখার উদ্দেশ্যে পুনরায় দেখতে পারেন।
                </p>
              </div>
            </Card>
          )}

          <Card className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold">শেখার বিষয়বস্তু</h3>
            </div>

            {learningPoints.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">এই অধ্যায়ে কোনো শেখার পয়েন্ট নেই</p>
              </div>
            ) : (
              <div className="space-y-6">
                {learningPoints.map((point, index) => {
                  const isCompleted = completedPoints.includes(point.id);

                  return (
                    <div
                      key={point.id}
                      className={`border-l-4 pl-6 py-4 transition-all ${
                        isCompleted
                          ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                          : "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted
                              ? "bg-green-600 text-white"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <span className="font-bold text-sm">{index + 1}</span>
                          )}
                        </div>

                        <div className="flex-1 space-y-3">
                          <h4 className="font-semibold text-lg">{point.title}</h4>
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <p className="text-muted-foreground leading-relaxed">
                              {point.content}
                            </p>
                          </div>

                          {!isCompleted && !isCurrentChapterCompleted && (
                            <Button
                              size="sm"
                              onClick={() => markPointCompleted(point.id)}
                              className="mt-3"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              সম্পন্ন হিসেবে চিহ্নিত করুন
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => handleChapterNavigation(Math.max(0, selectedChapterIndex - 1))}
              disabled={selectedChapterIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              পূর্ববর্তী অধ্যায়
            </Button>

            {isCurrentChapterCompleted ? (
              selectedChapterIndex < chapters.length - 1 ? (
                <Button
                  onClick={() => handleChapterNavigation(selectedChapterIndex + 1)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  পরবর্তী অধ্যায়
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => navigate(`/practice?moduleId=${moduleId}`)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  প্র্যাকটিস করুন
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )
            ) : (
              <Button
                onClick={markChapterComplete}
                disabled={!allPointsCompleted || submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    সম্পন্ন করা হচ্ছে...
                  </>
                ) : (
                  <>
                    অধ্যায় সম্পন্ন করুন
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold mb-2">অধ্যায় নেভিগেশন</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {chapters.map((chapter, index) => {
                const completed = isChapterCompleted(chapter.id);
                const locked = index > 0 && !isChapterCompleted(chapters[index - 1]?.id);

                return (
                  <Button
                    key={chapter.id}
                    variant={selectedChapterIndex === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleChapterNavigation(index)}
                    disabled={locked}
                    className={`${
                      completed
                        ? "border-green-500 text-green-600 hover:text-green-700"
                        : locked
                        ? "opacity-50"
                        : ""
                    }`}
                  >
                    {completed && <CheckCircle className="w-3 h-3 mr-1" />}
                    {locked && <Lock className="w-3 h-3 mr-1" />}
                    অধ্যায় {index + 1}
                  </Button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chapter;
