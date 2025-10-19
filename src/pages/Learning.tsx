import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CheckCircle,
  Lock,
  ChevronRight,
  Play,
  ArrowLeft,
  Trophy,
  Star,
  Loader2,
  Clock,
  Award
} from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Learning = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [moduleProgress, setModuleProgress] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [chapterProgress, setChapterProgress] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // ========== Fetch Enrollment ==========
  useEffect(() => {
    if (user) fetchEnrollments();
  }, [user]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("enrollments")
        .select("*, courses(*)")
        .eq("user_id", user?.id);

      if (error) throw error;
      setEnrollments(data || []);
      if (data?.length) setSelectedCourseId(data[0].course_id);
    } catch (err) {
      toast.error("তথ্য লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  // ========== Fetch Modules ==========
  useEffect(() => {
    if (selectedCourseId) fetchModules(selectedCourseId);
  }, [selectedCourseId]);

  const fetchModules = async (courseId: string) => {
    try {
      const { data: modulesData, error } = await supabase
        .from("modules")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index");

      if (error) throw error;
      setModules(modulesData || []);

      if (user && modulesData?.length) {
        const { data: progressData } = await supabase
          .from("module_progress")
          .select("*")
          .eq("user_id", user.id)
          .in("module_id", modulesData.map(m => m.id));

        setModuleProgress(progressData || []);

        // Pick first in-progress or first module
        const inProgress = modulesData.find(m =>
          progressData?.some(p => p.module_id === m.id && !p.quiz_passed)
        );
        setSelectedModuleId(inProgress?.id || modulesData[0].id);
      }
    } catch {
      toast.error("মডিউল লোড করতে সমস্যা হয়েছে");
    }
  };

  // ========== Fetch Chapters ==========
  useEffect(() => {
    if (selectedModuleId) fetchChapters(selectedModuleId);
  }, [selectedModuleId]);

  const fetchChapters = async (moduleId: string) => {
    try {
      const { data: chaptersData, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("module_id", moduleId)
        .order("order_index");

      if (error) throw error;
      setChapters(chaptersData || []);

      if (user && chaptersData?.length) {
        const { data: progressData } = await supabase
          .from("chapter_progress")
          .select("*")
          .eq("user_id", user.id)
          .in("chapter_id", chaptersData.map(c => c.id));

        setChapterProgress(progressData || []);
      }
    } catch {
      toast.error("অধ্যায় লোড করতে সমস্যা হয়েছে");
    }
  };

  // ========== Helpers ==========
  const isChapterCompleted = (id: string) =>
    chapterProgress.some(p => p.chapter_id === id && p.completed);

  const getChapterStatus = (idx: number) => {
    if (idx === 0) return "unlocked";
    const prev = chapters[idx - 1];
    return isChapterCompleted(prev.id) ? "unlocked" : "locked";
  };

  const markChapterAsCompleted = async (id: string) => {
    if (!user) return;
    setRefreshing(true);
    try {
      const exists = chapterProgress.find(p => p.chapter_id === id);
      if (exists) {
        await supabase
          .from("chapter_progress")
          .update({ completed: true, completed_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("chapter_id", id);
      } else {
        await supabase
          .from("chapter_progress")
          .insert({
            user_id: user.id,
            chapter_id: id,
            completed: true,
            completed_at: new Date().toISOString()
          });
      }
      await fetchChapters(selectedModuleId!);
      toast.success("অধ্যায় সম্পন্ন হয়েছে!");
    } catch {
      toast.error("অধ্যায় সম্পন্ন করতে সমস্যা হয়েছে");
    } finally {
      setRefreshing(false);
    }
  };

  // ========== UI Rendering ==========
  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );

  if (!enrollments.length)
    return (
      <div className="min-h-screen flex items-center justify-center text-center space-y-4 flex-col">
        <BookOpen className="w-16 h-16 text-muted-foreground" />
        <p className="text-muted-foreground">আপনি এখনও কোনো কোর্সে ভর্তি হননি</p>
        <Button onClick={() => navigate("/")}>কোর্স দেখুন</Button>
      </div>
    );

  const selectedModule = modules.find(m => m.id === selectedModuleId);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50 p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-semibold text-base">
          {selectedModule?.title || "লার্নিং মডিউল"}
        </h1>
      </header>

      <main className="container mx-auto p-4 space-y-6">
        {/* Module Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">মডিউল নির্বাচন করুন</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module, idx) => {
              const progress = moduleProgress.find(p => p.module_id === module.id);
              const isSelected = selectedModuleId === module.id;
              const unlocked = idx === 0 || moduleProgress[idx - 1]?.quiz_passed;

              return (
                <Card
                  key={module.id}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected ? "border-primary border-2" : "hover:shadow-md"
                  } ${!unlocked ? "opacity-50" : ""}`}
                  onClick={() => unlocked && setSelectedModuleId(module.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">{module.title}</h3>
                    {progress?.quiz_passed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : !unlocked ? (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Play className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <Progress value={progress?.learning_completed ? 100 : 40} />
                </Card>
              );
            })}
          </div>
        </div>

        {/* Chapter Accordion */}
        {selectedModule && (
          <Card className="p-5">
            <h3 className="font-semibold mb-3">অধ্যায়সমূহ</h3>
            {chapters.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">
                এই মডিউলে কোনো অধ্যায় নেই
              </p>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {chapters.map((chapter, idx) => {
                  const completed = isChapterCompleted(chapter.id);
                  const locked = getChapterStatus(idx) === "locked";

                  return (
                    <AccordionItem key={chapter.id} value={chapter.id}>
                      <AccordionTrigger
                        disabled={locked}
                        className={`flex justify-between p-3 rounded-lg ${
                          completed
                            ? "bg-green-50 dark:bg-green-950/20"
                            : locked
                            ? "opacity-60"
                            : "hover:bg-accent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {completed ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : locked ? (
                            <Lock className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <BookOpen className="w-5 h-5 text-blue-500" />
                          )}
                          <span>{chapter.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {chapter.duration_minutes || 30} মিনিট
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="p-3 border-t">
                        <p className="text-sm mb-3">{chapter.description}</p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() =>
                              navigate(`/chapter?moduleId=${selectedModuleId}&chapterId=${chapter.id}`)
                            }
                            disabled={locked}
                          >
                            {completed ? "পুনরায় দেখুন" : "শুরু করুন"}
                          </Button>
                          {!completed && (
                            <Button
                              variant="outline"
                              onClick={() => markChapterAsCompleted(chapter.id)}
                              disabled={refreshing}
                            >
                              সম্পন্ন করুন
                            </Button>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </Card>
        )}
      </main>
    </div>
  );
};

export default Learning;
