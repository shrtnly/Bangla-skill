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
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Learning = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [moduleProgress, setModuleProgress] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [chapterProgress, setChapterProgress] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchModules(selectedCourseId);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedModuleId) {
      fetchChapters(selectedModuleId);
    }
  }, [selectedModuleId]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          *,
          courses (*)
        `)
        .eq("user_id", user?.id);

      if (error) throw error;

      setEnrollments(data || []);

      if (data && data.length > 0) {
        setSelectedCourseId(data[0].course_id);
      }
    } catch (error: any) {
      console.error("Error fetching enrollments:", error);
      toast.error("তথ্য লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async (courseId: string) => {
    try {
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index");

      if (modulesError) throw modulesError;
      setModules(modulesData || []);

      if (user) {
        const { data: progressData, error: progressError } = await supabase
          .from("module_progress")
          .select("*")
          .eq("user_id", user.id)
          .in("module_id", modulesData?.map(m => m.id) || []);

        if (progressError) throw progressError;
        setModuleProgress(progressData || []);

        const inProgressModule = modulesData?.find(m => {
          const progress = progressData?.find(p => p.module_id === m.id);
          return progress && !progress.quiz_passed;
        });

        if (inProgressModule) {
          setSelectedModuleId(inProgressModule.id);
        } else if (modulesData && modulesData.length > 0) {
          setSelectedModuleId(modulesData[0].id);
        }
      }
    } catch (error: any) {
      console.error("Error fetching modules:", error);
      toast.error("মডিউল লোড করতে সমস্যা হয়েছে");
    }
  };

  const fetchChapters = async (moduleId: string) => {
    try {
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
          .in("chapter_id", chaptersData?.map(c => c.id) || []);

        if (progressError) throw progressError;
        setChapterProgress(progressData || []);
      }
    } catch (error: any) {
      console.error("Error fetching chapters:", error);
    }
  };

  const getModuleStatus = (module: any) => {
    const progress = moduleProgress.find(p => p.module_id === module.id);
    if (!progress) return "locked";
    return progress.status;
  };

  const isModuleUnlocked = (moduleIndex: number) => {
    if (moduleIndex === 0) return true;

    const previousModule = modules[moduleIndex - 1];
    const previousProgress = moduleProgress.find(p => p.module_id === previousModule?.id);

    return previousProgress?.quiz_passed === true;
  };

  const getProgressPercentage = (module: any) => {
    const progress = moduleProgress.find(p => p.module_id === module.id);
    const moduleChapters = chapters.filter(c => c.module_id === module.id);

    if (!progress || moduleChapters.length === 0) return 0;

    const completedChapters = chapterProgress.filter(
      cp => moduleChapters.some(mc => mc.id === cp.chapter_id) && cp.completed
    ).length;

    return Math.round((completedChapters / moduleChapters.length) * 100);
  };

  const handleStartModule = async (module: any, moduleIndex: number) => {
    if (!isModuleUnlocked(moduleIndex)) {
      toast.error("আগের মডিউল সম্পন্ন করুন");
      return;
    }

    try {
      const { error } = await supabase
        .from("module_progress")
        .upsert({
          user_id: user?.id,
          module_id: module.id,
          status: "in_progress"
        }, {
          onConflict: "user_id,module_id"
        });

      if (error) throw error;

      navigate(`/chapter?moduleId=${module.id}`);
    } catch (error: any) {
      console.error("Error starting module:", error);
      toast.error("মডিউল শুরু করতে সমস্যা হয়েছে");
    }
  };

  const selectedCourse = enrollments.find(e => e.course_id === selectedCourseId)?.courses;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            ড্যাশবোর্ডে ফিরে যান
          </Button>

          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">কোনো কোর্সে এনরোল করা নেই</h2>
            <p className="text-muted-foreground mb-6">শেখা শুরু করতে একটি কোর্সে এনরোল করুন</p>
            <Button onClick={() => navigate("/dashboard")}>
              কোর্স ব্রাউজ করুন
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            ড্যাশবোর্ডে ফিরে যান
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar - Course Selection */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <h2 className="text-lg font-bold mb-4">আমার কোর্স</h2>
              <div className="space-y-3">
                {enrollments.map((enrollment) => (
                  <Button
                    key={enrollment.course_id}
                    variant={selectedCourseId === enrollment.course_id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCourseId(enrollment.course_id)}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    {enrollment.courses.title}
                  </Button>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Content - Module List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            {selectedCourse && (
              <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">{selectedCourse.title}</h1>
                    <p className="text-muted-foreground">{selectedCourse.description}</p>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">
                    {modules.length} মডিউল
                  </Badge>
                </div>
              </Card>
            )}

            {/* Modules List */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">মডিউল সমূহ</h2>

              {modules.length === 0 ? (
                <Card className="p-12 text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">এই কোর্সে এখনো কোনো মডিউল নেই</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {modules.map((module, index) => {
                    const isUnlocked = isModuleUnlocked(index);
                    const progress = getProgressPercentage(module);
                    const moduleProgressData = moduleProgress.find(p => p.module_id === module.id);
                    const isCompleted = moduleProgressData?.quiz_passed;
                    const isInProgress = moduleProgressData && !isCompleted;
                    const moduleChapters = chapters.filter(c => c.module_id === module.id);
                    const completedChapters = chapterProgress.filter(
                      cp => moduleChapters.some(mc => mc.id === cp.chapter_id) && cp.completed
                    ).length;

                    return (
                      <Card
                        key={module.id}
                        className={`p-5 transition-all hover:shadow-md ${
                          !isUnlocked ? "opacity-60" : "cursor-pointer"
                        } ${selectedModuleId === module.id ? "ring-2 ring-primary" : ""}`}
                        onClick={() => isUnlocked && setSelectedModuleId(module.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted
                              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                              : isInProgress
                              ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                              : isUnlocked
                              ? "bg-primary/10 text-primary"
                              : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="w-6 h-6" />
                            ) : !isUnlocked ? (
                              <Lock className="w-6 h-6" />
                            ) : (
                              <span className="font-bold">{index + 1}</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h3 className="font-semibold text-base md:text-lg">{module.title}</h3>
                                {isCompleted && (
                                  <Badge variant="outline" className="text-green-600 border-green-600 mt-1">
                                    <Trophy className="w-3 h-3 mr-1" />
                                    সম্পন্ন
                                  </Badge>
                                )}
                              </div>
                              {isUnlocked && (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartModule(module, index);
                                  }}
                                  size="default"
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  {isInProgress ? (
                                    <>
                                      <Play className="w-4 h-4 mr-2" />
                                      চালিয়ে যান
                                    </>
                                  ) : isCompleted ? (
                                    <>
                                      <Award className="w-4 h-4 mr-2" />
                                      পুনরায় দেখুন
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-4 h-4 mr-2" />
                                      শুরু করুন
                                    </>
                                  )}
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                              )}
                            </div>

                            {isUnlocked && moduleChapters.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <BookOpen className="w-4 h-4" />
                                    {moduleChapters.length} অধ্যায়
                                  </div>
                                  {completedChapters > 0 && (
                                    <div className="flex items-center gap-1">
                                      <CheckCircle className="w-4 h-4" />
                                      {completedChapters}/{moduleChapters.length} সম্পন্ন
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {module.duration_minutes || 120} মিনিট
                                  </div>
                                </div>

                                {moduleProgressData && (
                                  <div className="space-y-1">
                                    <Progress value={progress} className="h-2" />
                                    <p className="text-xs text-muted-foreground">{progress}% সম্পন্ন</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {!isUnlocked && (
                              <p className="text-sm text-muted-foreground mt-2">
                                <Lock className="w-3 h-3 inline mr-1" />
                                আগের মডিউল সম্পন্ন করুন
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learning;
