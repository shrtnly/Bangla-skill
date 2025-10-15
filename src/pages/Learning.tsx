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
  Loader2
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Learning = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");
  
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<any[]>([]);


  useEffect(() => {
    if (!courseId) {
      toast.error("কোর্স নির্বাচন করুন");
      navigate("/dashboard");
      return;
    }
    fetchCourseData();
  }, [courseId]);

  useEffect(() => {
    if (selectedModule) {
      fetchChapters(selectedModule);
    }
  }, [selectedModule]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);

      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index");

      if (modulesError) throw modulesError;
      setModules(modulesData);

      // Select first module by default
      if (modulesData && modulesData.length > 0) {
        setSelectedModule(modulesData[0].id);
      }

      // Fetch user progress
      if (user) {
        const { data: progressData, error: progressError } = await supabase
          .from("user_progress")
          .select("*")
          .eq("user_id", user.id);

        if (progressError) throw progressError;
        setUserProgress(progressData || []);
      }
    } catch (error: any) {
      console.error("Error fetching course data:", error);
      toast.error("ডেটা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async (moduleId: string) => {
    try {
      const { data, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("module_id", moduleId)
        .order("order_index");

      if (error) throw error;
      setChapters(data || []);
    } catch (error: any) {
      console.error("Error fetching chapters:", error);
      toast.error("অধ্যায় লোড করতে সমস্যা হয়েছে");
    }
  };

  const markChapterComplete = async (chapterId: string) => {
    if (!user) {
      toast.error("অনুগ্রহ করে লগইন করুন");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_progress")
        .upsert({
          user_id: user.id,
          chapter_id: chapterId,
          is_completed: true,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success("অধ্যায় সম্পন্ন হয়েছে!");
      fetchCourseData();
    } catch (error: any) {
      console.error("Error marking chapter complete:", error);
      toast.error("সমস্যা হয়েছে");
    }
  };

  const isChapterCompleted = (chapterId: string) => {
    return userProgress.some(
      (p) => p.chapter_id === chapterId && p.is_completed
    );
  };

  const getModuleProgress = (moduleId: string) => {
    const moduleChapters = chapters.filter((c) => c.module_id === moduleId);
    if (moduleChapters.length === 0) return 0;

    const completedCount = moduleChapters.filter((c) =>
      isChapterCompleted(c.id)
    ).length;

    return Math.round((completedCount / moduleChapters.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">কোর্স পাওয়া যায়নি</p>
          <Button onClick={() => navigate("/dashboard")}>ড্যাশবোর্ডে ফিরে যান</Button>
        </div>
      </div>
    );
  }

  const selectedModuleData = modules.find((m) => m.id === selectedModule);
  const moduleProgress = selectedModuleData ? getModuleProgress(selectedModuleData.id) : 0;
  const completedChapters = chapters.filter((c) => isChapterCompleted(c.id)).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-lg">{course.title}</h1>
              <p className="text-sm text-muted-foreground">
                {selectedModuleData?.title || "মডিউল নির্বাচন করুন"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">মডিউল অগ্রগতি</div>
              <div className="font-bold text-lg">{moduleProgress}%</div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Module List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-bold">সব মডিউল</h2>
            <div className="space-y-3">
              {modules.map((module) => (
                <Card
                  key={module.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedModule === module.id
                      ? "border-primary shadow-md"
                      : module.locked
                      ? "opacity-60"
                      : "card-hover"
                  }`}
                  onClick={() => !module.locked && setSelectedModule(module.id)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-tight">{module.title}</h3>
                      {module.is_locked ? (
                        <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      ) : getModuleProgress(module.id) === 100 ? (
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                      ) : (
                        <Play className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {chapters.filter(c => c.module_id === module.id && isChapterCompleted(c.id)).length}/
                        {chapters.filter(c => c.module_id === module.id).length} অধ্যায়
                      </span>
                    </div>

                    {!module.is_locked && (
                      <Progress value={getModuleProgress(module.id)} className="h-1.5" />
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Overall Progress Card */}
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Star className="w-5 h-5 text-accent" />
                কোর্স অগ্রগতি
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>সম্পন্ন মডিউল: {modules.filter(m => getModuleProgress(m.id) === 100).length}/{modules.length}</span>
                </div>
                <Progress 
                  value={modules.length > 0 ? (modules.filter(m => getModuleProgress(m.id) === 100).length / modules.length) * 100 : 0} 
                  className="h-2" 
                />
              </div>
            </Card>
          </div>

          {/* Chapter Content */}
          <div className="lg:col-span-2 space-y-6">
            {selectedModuleData && (
              <>
                <Card className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <Badge className="bg-primary/10 text-primary">
                        {moduleProgress === 100 ? "সম্পন্ন" : "চলমান"}
                      </Badge>
                      <h2 className="text-2xl font-bold">{selectedModuleData.title}</h2>
                      <p className="text-muted-foreground">
                        {selectedModuleData.description || "মডিউলের বিবরণ নেই"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{chapters.length}</div>
                      <div className="text-sm text-muted-foreground">অধ্যায়</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">{completedChapters}</div>
                      <div className="text-sm text-muted-foreground">সম্পন্ন</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">{moduleProgress}%</div>
                      <div className="text-sm text-muted-foreground">অগ্রগতি</div>
                    </div>
                  </div>

                  <Progress value={moduleProgress} className="h-3" />
                </Card>

            {/* Chapters List */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold">অধ্যায়সমূহ</h3>
              {chapters.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">এই মডিউলে কোন অধ্যায় নেই</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {chapters.map((chapter, index) => {
                    const completed = isChapterCompleted(chapter.id);
                    return (
                      <Card
                        key={chapter.id}
                        className={`p-5 card-hover cursor-pointer ${
                          completed ? "bg-success/5 border-success/20" : ""
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                              completed
                                ? "bg-success/20 text-success"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {completed ? (
                              <CheckCircle className="w-6 h-6" />
                            ) : (
                              <span className="font-bold">{index + 1}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{chapter.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {chapter.duration ? `${chapter.duration} মিনিট` : "সময়সীমা নেই"}
                            </p>
                          </div>
                          <Button
                            variant={completed ? "outline" : "default"}
                            className={!completed ? "btn-hero" : ""}
                            onClick={() => !completed && markChapterComplete(chapter.id)}
                          >
                            {completed ? "পুনরায় দেখুন" : "সম্পন্ন করুন"}
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
              </>
            )}

            {/* Practice & Quiz Section */}
            <Card className="p-6 space-y-4 bg-gradient-to-br from-accent/10 to-primary/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">প্র্যাকটিস ও কুইজ</h3>
                  <p className="text-sm text-muted-foreground">
                    সব অধ্যায় সম্পন্ন করুন, তারপর কুইজে অংশ নিন
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1 btn-success" disabled>
                  প্র্যাকটিস শুরু করুন
                  <Lock className="w-4 h-4 ml-2" />
                </Button>
                <Button className="flex-1" variant="outline" disabled>
                  চূড়ান্ত কুইজ
                  <Lock className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                সব অধ্যায় সম্পন্ন করার পর এই বিভাগ আনলক হবে
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learning;
