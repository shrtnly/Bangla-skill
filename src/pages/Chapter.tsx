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
  BookOpen
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

  useEffect(() => {
    if (moduleId) {
      fetchModuleData();
    }
  }, [moduleId]);

  useEffect(() => {
    if (chapters.length > 0 && chapters[selectedChapterIndex]) {
      fetchLearningPoints(chapters[selectedChapterIndex].id);
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
          .eq("user_id", user.id);

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

  const markPointCompleted = (pointId: string) => {
    if (!completedPoints.includes(pointId)) {
      setCompletedPoints([...completedPoints, pointId]);
    }
  };

  const markChapterComplete = async () => {
    if (!user) return;

    const currentChapter = chapters[selectedChapterIndex];
    if (!currentChapter) return;

    const allPointsCompleted = learningPoints.every(point => completedPoints.includes(point.id));

    if (!allPointsCompleted) {
      toast.error("সব শেখার পয়েন্ট সম্পন্ন করুন");
      return;
    }

    try {
      const { error } = await supabase
        .from("chapter_progress")
        .upsert({
          user_id: user.id,
          chapter_id: currentChapter.id,
          completed: true,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success("অধ্যায় সম্পন্ন হয়েছে!");

      const allChaptersComplete = selectedChapterIndex === chapters.length - 1;

      if (allChaptersComplete) {
        const { error: moduleError } = await supabase
          .from("module_progress")
          .update({
            learning_completed: true
          })
          .eq("user_id", user.id)
          .eq("module_id", moduleId);

        if (moduleError) throw moduleError;

        toast.success("সব অধ্যায় সম্পন্ন! এখন প্র্যাকটিস করুন");
        navigate(`/practice?moduleId=${moduleId}`);
      } else {
        setSelectedChapterIndex(selectedChapterIndex + 1);
        setCompletedPoints([]);
      }

      await fetchModuleData();
    } catch (error: any) {
      console.error("Error marking chapter complete:", error);
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

  const currentChapter = chapters[selectedChapterIndex];
  const completedChapters = chapters.filter(c => isChapterCompleted(c.id)).length;
  const progress = chapters.length > 0 ? (completedChapters / chapters.length) * 100 : 0;

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
            <div className="text-xs text-muted-foreground">অগ্রগতি</div>
            <div className="font-bold text-sm md:text-lg">{Math.round(progress)}%</div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                  অধ্যায় {selectedChapterIndex + 1}
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold">{currentChapter?.title}</h2>
              </div>
              {isChapterCompleted(currentChapter?.id) && (
                <CheckCircle className="w-8 h-8 text-success flex-shrink-0" />
              )}
            </div>

            <Progress value={progress} className="h-2" />

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div>
                {completedChapters}/{chapters.length} অধ্যায় সম্পন্ন
              </div>
            </div>
          </Card>

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
                          ? "border-success bg-success/5"
                          : "border-primary bg-primary/5"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted
                              ? "bg-success text-white"
                              : "bg-primary text-white"
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

                          {!isCompleted && (
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
              onClick={() => setSelectedChapterIndex(Math.max(0, selectedChapterIndex - 1))}
              disabled={selectedChapterIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              পূর্ববর্তী অধ্যায়
            </Button>

            {selectedChapterIndex < chapters.length - 1 ? (
              <Button
                onClick={() => setSelectedChapterIndex(selectedChapterIndex + 1)}
                className="bg-violet-500 hover:bg-violet-600"
              >
                পরবর্তী অধ্যায়
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={markChapterComplete}
                className="bg-success hover:bg-success/90"
              >
                অধ্যায় সম্পন্ন করুন
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold mb-2">অধ্যায় নেভিগেশন</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {chapters.map((chapter, index) => (
                <Button
                  key={chapter.id}
                  variant={selectedChapterIndex === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedChapterIndex(index)}
                  className={`${
                    isChapterCompleted(chapter.id)
                      ? "border-success text-success"
                      : ""
                  }`}
                >
                  {isChapterCompleted(chapter.id) && (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  )}
                  অধ্যায় {index + 1}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chapter;
