// /src/pages/Learning.tsx
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle, Lock, ChevronRight, Play, ArrowLeft, Loader2, Clock, Award } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useLearningProgress } from "@/hooks/useLearningProgress";

const Learning = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");

  const { progress, fetchFullProgress, isChapterCompleted, markChapterComplete } = useLearningProgress();

  const [loading, setLoading] = useState(true);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<any | null>(null);

  // fetch modules + progress
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (user) {
          await fetchFullProgress(courseId || undefined);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user, courseId, fetchFullProgress]);

  // set default selected module when modules are loaded
  useEffect(() => {
    if (progress.modules.length > 0) {
      const firstModule = progress.modules[0];
      setSelectedModuleId(firstModule.id);
    }
  }, [progress.modules]);

  // load chapters for selected module
  useEffect(() => {
    const loadChapters = async () => {
      if (!selectedModuleId) return;
      try {
        setLoading(true);
        const { data: chaptersData } = await supabase
          .from("chapters")
          .select("*")
          .eq("module_id", selectedModuleId)
          .order("order_index");
        setChapters(chaptersData || []);
        setSelectedModule(progress.modules.find((m:any) => m.id === selectedModuleId) || null);
      } catch (err) {
        console.error("fetch chapters", err);
        toast.error("অধ্যায় লোড করতে ব্যর্থ হয়েছে");
      } finally {
        setLoading(false);
      }
    };
    loadChapters();
  }, [selectedModuleId, progress.modules]);

  const getModuleProgress = (moduleId: string) => {
    const entry = progress.moduleProgress.find((p:any) => p.module_id === moduleId);
    return entry || null;
  };

  const isChapterLocked = (index: number) => {
    if (index === 0) return false;
    const prevChapter = chapters[index - 1];
    return !isChapterCompleted(prevChapter.id);
  };

  const handleStartChapter = (chapter: any) => {
    // navigate to chapter page — do not auto-mark complete here
    navigate(`/chapter?moduleId=${selectedModuleId}&chapterId=${chapter.id}`);
  };

  const handleMarkChapterComplete = async (chapter: any) => {
    if (!user) return;
    try {
      const res = await markChapterComplete(chapter.id, selectedModuleId || undefined);
      if (res.success) {
        toast.success("অধ্যায় সম্পন্ন হয়েছে");
        await fetchFullProgress(courseId || undefined);
      } else {
        toast.error("অপস! চেষ্টা করুন আবার");
      }
    } catch (err) {
      console.error(err);
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

  if (!progress.modules || progress.modules.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-4">কোর্স বা মডিউল পাওয়া যায়নি</p>
          <Button onClick={() => navigate("/dashboard")}>ড্যাশবোর্ড</Button>
        </Card>
      </div>
    );
  }

  const selectedModuleProgress = getModuleProgress(selectedModuleId || "");

  // compute module-level progress by chapters
  const completedChaptersCount = chapters.filter((c) => isChapterCompleted(c.id)).length;
  const moduleProgressPct = chapters.length > 0 ? Math.round((completedChaptersCount / chapters.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-base md:text-lg">{selectedModule?.title || "মডিউল"}</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                অধ্যায় সমূহ: {chapters.length}
              </p>
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">মডিউল অগ্রগতি</div>
            <div className="font-bold text-sm md:text-lg">{moduleProgressPct}%</div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[320px,1fr] gap-6">
          <div>
            <h2 className="text-lg font-bold mb-3">মডিউলসমূহ</h2>
            <div className="space-y-3">
              {progress.modules.map((m:any, idx:number) => {
                const isSelected = m.id === selectedModuleId;
                const unlocked = idx === 0 || getModuleProgress(progress.modules[idx - 1]?.id)?.quiz_passed;
                return (
                  <Card key={m.id} className={`p-3 ${isSelected ? "border-primary border-2" : "hover:shadow-md cursor-pointer"}`} onClick={() => setSelectedModuleId(m.id)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">{m.title}</div>
                        <div className="text-xs text-muted-foreground">{m.points || 0} পয়েন্ট • {m.duration_minutes || 30} মিনিট</div>
                      </div>
                      <div className="text-sm">{unlocked ? <Play className="w-5 h-5 text-primary" /> : <Lock className="w-5 h-5 text-muted-foreground" />}</div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <div>
            <Card className="p-6 mb-4">
              <Badge className="mb-2">{selectedModuleProgress?.status === "completed" ? "সম্পন্ন" : selectedModuleProgress ? "চলমান" : "নতুন"}</Badge>
              <h3 className="text-xl font-semibold mb-2">{selectedModule?.title}</h3>
              <p className="text-muted-foreground mb-3">{selectedModule?.description}</p>
              <Progress value={moduleProgressPct} className="h-3" />
              <div className="mt-3 text-sm">{completedChaptersCount}/{chapters.length} অধ্যায় সম্পন্ন</div>
            </Card>

            <div className="space-y-3">
              {chapters.map((chapter:any, idx:number) => {
                const completed = isChapterCompleted(chapter.id);
                const locked = isChapterLocked(idx);
                return (
                  <Card key={chapter.id} className={`p-4 flex items-center justify-between ${completed ? "bg-success/5" : locked ? "opacity-60" : ""}`}>
                    <div>
                      <div className="font-semibold">{chapter.title}</div>
                      <div className="text-xs text-muted-foreground">{chapter.duration_minutes || 10} মিনিট</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!completed && !locked && (
                        <>
                          <Button variant="outline" onClick={() => handleStartChapter(chapter)}>
                            শুরু করুন
                          </Button>
                          <Button onClick={() => handleMarkChapterComplete(chapter)}>
                            সম্পন্ন করুন
                          </Button>
                        </>
                      )}

                      {completed && (
                        <Button variant="ghost" className="text-success">
                          সম্পন্ন হয়েছে
                        </Button>
                      )}

                      {locked && (
                        <Button variant="ghost" disabled>
                          লক করা
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {selectedModule && (
              <Card className="p-4 mt-6">
                <h4 className="font-semibold mb-2">প্র্যাকটিস ও কুইজ</h4>
                <div className="flex gap-3">
                  <Button className="flex-1" onClick={() => navigate(`/practice?moduleId=${selectedModuleId}`)} disabled={!selectedModuleProgress?.learning_completed}>
                    প্র্যাকটিস
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => navigate(`/quiz?moduleId=${selectedModuleId}`)} disabled={!selectedModuleProgress?.practice_completed}>
                    চূড়ান্ত কুইজ
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learning;
