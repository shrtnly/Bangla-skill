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
  const [refreshing, setRefreshing] = useState(false);

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
    if (!progress) return 0;

    let completed = 0;
    let total = 3;

    if (progress.learning_completed) completed++;
    if (progress.practice_completed) completed++;
    if (progress.quiz_passed) completed++;

    return Math.round((completed / total) * 100);
  };

  const handleStartModule = async (module: any, moduleIndex: number) => {
    if (!isModuleUnlocked(moduleIndex)) {
      toast.error("পূর্ববর্তী মডিউল সম্পন্ন করুন");
      return;
    }

    try {
      const existingProgress = moduleProgress.find(p => p.module_id === module.id);

      if (!existingProgress) {
        const { error } = await supabase
          .from("module_progress")
          .insert({
            user_id: user?.id,
            module_id: module.id,
            status: "in_progress",
            started_at: new Date().toISOString()
          });

        if (error) throw error;

        await fetchModules(selectedCourseId!);
      }

      const progress = existingProgress || { learning_completed: false, practice_completed: false, quiz_passed: false };

      if (!progress.learning_completed) {
        navigate(`/chapter?moduleId=${module.id}`);
      } else if (!progress.practice_completed) {
        toast.info("শিক্ষা সম্পন্ন! এখন প্র্যাকটিস করুন");
        navigate(`/practice?moduleId=${module.id}`);
      } else if (!progress.quiz_passed) {
        toast.info("প্র্যাকটিস সম্পন্ন! এখন চূড়ান্ত কুইজ দিন");
        navigate(`/quiz?moduleId=${module.id}`);
      } else {
        toast.success("এই মডিউল ইতিমধ্যে সম্পন্ন হয়েছে");
      }
    } catch (error: any) {
      console.error("Error starting module:", error);
      toast.error("মডিউল শুরু করতে সমস্যা হয়েছে");
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

  const handlePractice = (moduleId: string) => {
    navigate(`/practice?moduleId=${moduleId}`);
  };

  const handleQuiz = (moduleId: string) => {
    navigate(`/quiz?moduleId=${moduleId}`);
  };

  const isChapterCompleted = (chapterId: string) => {
    return chapterProgress.some(p => p.chapter_id === chapterId && p.completed);
  };

  const getChapterStatus = (chapterIndex: number) => {
    if (chapterIndex === 0) return "unlocked";
    const previousChapter = chapters[chapterIndex - 1];
    return isChapterCompleted(previousChapter?.id) ? "unlocked" : "locked";
  };

  // Function to mark a chapter as completed
  const markChapterAsCompleted = async (chapterId: string) => {
    if (!user) return;
    
    try {
      setRefreshing(true);
      
      // Check if progress already exists
      const existingProgress = chapterProgress.find(p => p.chapter_id === chapterId);
      
      if (!existingProgress) {
        // Create new progress record
        const { error } = await supabase
          .from("chapter_progress")
          .insert({
            user_id: user.id,
            chapter_id: chapterId,
            completed: true,
            completed_at: new Date().toISOString()
          });
          
        if (error) throw error;
      } else {
        // Update existing progress record
        const { error } = await supabase
          .from("chapter_progress")
          .update({
            completed: true,
            completed_at: new Date().toISOString()
          })
          .eq("user_id", user.id)
          .eq("chapter_id", chapterId);
          
        if (error) throw error;
      }
      
      // Refresh chapter progress
      if (selectedModuleId) {
        await fetchChapters(selectedModuleId);
      }
      
      // Check if all chapters in the module are completed
      const allChaptersCompleted = chapters.every(c => 
        c.id === chapterId || isChapterCompleted(c.id)
      );
      
      if (allChaptersCompleted && selectedModuleId) {
        // Update module progress to mark learning as completed
        const { error } = await supabase
          .from("module_progress")
          .update({
            learning_completed: true,
            status: "practice_ready"
          })
          .eq("user_id", user.id)
          .eq("module_id", selectedModuleId);
          
        if (error) throw error;
        
        // Refresh module progress
        await fetchModules(selectedCourseId!);
        
        toast.success("সব অধ্যায় সম্পন্ন হয়েছে! এখন প্র্যাকটিস করুন।");
      } else {
        toast.success("অধ্যায় সম্পন্ন হয়েছে!");
      }
    } catch (error: any) {
      console.error("Error marking chapter as completed:", error);
      toast.error("অধ্যায় সম্পন্ন করতে সমস্যা হয়েছে");
    } finally {
      setRefreshing(false);
    }
  };

  // Function to manually mark learning as completed (for debugging)
  const markLearningAsCompleted = async () => {
    if (!user || !selectedModuleId) return;
    
    try {
      setRefreshing(true);
      
      // Update module progress to mark learning as completed
      const { error } = await supabase
        .from("module_progress")
        .update({
          learning_completed: true,
          status: "practice_ready"
        })
        .eq("user_id", user.id)
        .eq("module_id", selectedModuleId);
        
      if (error) throw error;
      
      // Refresh module progress
      await fetchModules(selectedCourseId!);
      
      toast.success("লার্নিং সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে!");
    } catch (error: any) {
      console.error("Error marking learning as completed:", error);
      toast.error("লার্নিং সম্পন্ন করতে সমস্যা হয়েছে");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">আপনি এখনও কোনো কোর্সে ভর্তি হননি</p>
          <Button onClick={() => navigate("/")}>কোর্স দেখুন</Button>
        </div>
      </div>
    );
  }

  const selectedEnrollment = enrollments.find(e => e.course_id === selectedCourseId);
  const course = selectedEnrollment?.courses;

  const completedModules = modules.filter(m => {
    const progress = moduleProgress.find(p => p.module_id === m.id);
    return progress?.status === "completed";
  }).length;

  const overallProgress = modules.length > 0
    ? Math.round((completedModules / modules.length) * 100)
    : 0;

  const selectedModule = modules.find(m => m.id === selectedModuleId);
  const selectedModuleProgress = moduleProgress.find(p => p.module_id === selectedModuleId);

  const completedChapters = chapters.filter(c => isChapterCompleted(c.id)).length;
  const moduleProgressPercentage = chapters.length > 0
    ? Math.round((completedChapters / chapters.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-base md:text-lg">{course?.title || "কোর্স"}</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                {selectedModule ? `মডিউল ${modules.findIndex(m => m.id === selectedModuleId) + 1} - ${selectedModule.title}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">মোট অগ্রগতি</div>
              <div className="font-bold text-sm md:text-lg">{overallProgress}%</div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[320px,1fr] gap-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold">সব মডিউল</h2>

            <div className="space-y-3">
              {modules.map((module, index) => {
                const progress = getProgressPercentage(module);
                const status = getModuleStatus(module);
                const unlocked = isModuleUnlocked(index);
                const isSelected = module.id === selectedModuleId;

                return (
                  <Card
                    key={module.id}
                    className={`p-4 transition-all ${
                      isSelected
                        ? "border-primary border-2"
                        : unlocked
                        ? status === "completed"
                          ? "bg-success/5 border-success/30 cursor-pointer hover:shadow-md"
                          : "cursor-pointer hover:shadow-md"
                        : "opacity-60 bg-muted/30"
                    }`}
                    onClick={() => {
                      if (unlocked) {
                        setSelectedModuleId(module.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-sm leading-tight flex-1">
                        মডিউল {index + 1}. {module.title}
                      </h3>
                      {!unlocked ? (
                        <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      ) : status === "completed" ? (
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                      ) : status === "in_progress" || status === "practice_ready" ? (
                        <Play className="w-5 h-5 text-primary flex-shrink-0" />
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Clock className="w-3 h-3" />
                      <span>{module.duration_minutes || 30} মিনিট</span>
                      <span>•</span>
                      <Award className="w-3 h-3" />
                      <span>{module.points || 100}</span>
                    </div>

                    {unlocked && (
                      <Progress value={progress} className="h-1.5" />
                    )}
                  </Card>
                );
              })}
            </div>

            <Card className="p-5 bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/20 dark:to-pink-950/20 border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">সামগ্রিক অগ্রগতি</h3>
                  <div className="text-2xl font-bold mb-2">{completedModules}/{modules.length} মডিউল</div>
                  <Progress value={overallProgress} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">পরবর্তী মডিউল আনলক করতে এগিয়ে যান এবং শিখুন!</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {selectedModule && (
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
                <Badge className="mb-3 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {selectedModuleProgress?.status === "completed" ? "সম্পন্ন" : 
                   selectedModuleProgress?.status === "practice_ready" ? "প্র্যাকটিসের জন্য প্রস্তুত" : 
                   selectedModuleProgress ? "চলমান" : "নতুন"}
                </Badge>
                <h2 className="text-2xl font-bold mb-2">{selectedModule.title}</h2>
                <p className="text-muted-foreground mb-4">{selectedModule.description || "এই মডিউলে শিখুন"}</p>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <BookOpen className="w-6 h-6 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
                    <div className="text-sm font-semibold">{chapters.length}</div>
                    <div className="text-xs text-muted-foreground">অধ্যায়</div>
                  </div>
                  <div className="text-center">
                    <Award className="w-6 h-6 mx-auto mb-1 text-green-600 dark:text-green-400" />
                    <div className="text-sm font-semibold">{completedChapters}</div>
                    <div className="text-xs text-muted-foreground">সম্পন্ন</div>
                  </div>
                  <div className="text-center">
                    <Trophy className="w-6 h-6 mx-auto mb-1 text-orange-600 dark:text-orange-400" />
                    <div className="text-sm font-semibold">{selectedModule.points || 100}</div>
                    <div className="text-xs text-muted-foreground">পয়েন্ট</div>
                  </div>
                </div>

                <Progress value={moduleProgressPercentage} className="h-3" />
                
                {/* Debug button - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={markLearningAsCompleted}
                      disabled={refreshing || selectedModuleProgress?.learning_completed}
                    >
                      {refreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Debug: Mark Learning Complete
                    </Button>
                  </div>
                )}
              </Card>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-bold">অধ্যায়সমূহ</h3>

              {chapters.length === 0 ? (
                <Card className="p-8 text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">এই মডিউলে কোনো অধ্যায় নেই</p>
                </Card>
              ) : (
                chapters.map((chapter, idx) => {
                  const completed = isChapterCompleted(chapter.id);
                  const status = getChapterStatus(idx);
                  const locked = status === "locked";

                  return (
                    <Card
                      key={chapter.id}
                      className={`p-5 transition-all ${
                        completed
                          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                          : locked
                          ? "opacity-60"
                          : "hover:shadow-md cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          completed
                            ? "bg-green-100 dark:bg-green-900/30"
                            : locked
                            ? "bg-muted"
                            : "bg-blue-100 dark:bg-blue-900/30"
                        }`}>
                          {completed ? (
                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                          ) : (
                            <span className={`font-bold ${locked ? "text-muted-foreground" : "text-blue-600 dark:text-blue-400"}`}>
                              {idx + 1}
                            </span>
                          )}
                        </div>

                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{chapter.title}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {chapter.duration_minutes || 30} মিনিট
                          </p>
                        </div>

                        {completed ? (
                          <Button variant="ghost" className="text-green-600 dark:text-green-400">
                            সম্পন্ন হয়েছে
                          </Button>
                        ) : locked ? (
                          <Button variant="ghost" disabled>
                            <Lock className="w-4 h-4 mr-1" />
                            লক করা
                          </Button>
                        ) : (
                          <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => {
                              // Navigate to chapter page
                              navigate(`/chapter?moduleId=${selectedModuleId}&chapterId=${chapter.id}`);
                            }}
                          >
                            শুরু করুন
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            {selectedModule && selectedModuleId && (
              <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">প্র্যাকটিস ও কুইজ</h3>
                    <p className="text-sm text-muted-foreground">সব অধ্যায় শেষ করুন, তারপর অনুশীলন করুন এবং পরীক্ষা দিন</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handlePractice(selectedModuleId)}
                    disabled={!selectedModuleProgress?.learning_completed}
                  >
                    {selectedModuleProgress?.learning_completed ? (
                      "প্র্যাকটিস শুরু করুন"
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        প্র্যাকটিস লক করা
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleQuiz(selectedModuleId)}
                    disabled={!selectedModuleProgress?.practice_completed}
                  >
                    {selectedModuleProgress?.practice_completed ? (
                      "চূড়ান্ত কুইজ"
                    ) : (
                      <>
                        চূড়ান্ত কুইজ
                        <Lock className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                    <p>Module Progress Status: {selectedModuleProgress?.status || 'None'}</p>
                    <p>Learning Completed: {selectedModuleProgress?.learning_completed ? 'Yes' : 'No'}</p>
                    <p>Practice Completed: {selectedModuleProgress?.practice_completed ? 'Yes' : 'No'}</p>
                    <p>Quiz Passed: {selectedModuleProgress?.quiz_passed ? 'Yes' : 'No'}</p>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learning;