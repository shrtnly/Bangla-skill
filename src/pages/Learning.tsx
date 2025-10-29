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
  Award,
  Menu,
  Bell,
  Globe
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Learning = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));

  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [moduleProgress, setModuleProgress] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [chapterProgress, setChapterProgress] = useState<any[]>([]);
  const [courseProgress, setCourseProgress] = useState<Record<string, any>>({});
  const [courseModules, setCourseModules] = useState<Record<string, any[]>>({});
  const [viewMode, setViewMode] = useState<'list' | 'modules'>('list');

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

  useEffect(() => {
    const courseIdFromUrl = searchParams.get('courseId');
    if (courseIdFromUrl) {
      setSelectedCourseId(courseIdFromUrl);
      setViewMode('modules');
    }
  }, [searchParams]);

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

        const progressData: Record<string, any> = {};
        const modulesData: Record<string, any[]> = {};

        for (const enrollment of data) {
          const course = enrollment.courses;
          const { data: modules } = await supabase
            .from("modules")
            .select("*")
            .eq("course_id", course.id)
            .order("order_index");

          if (modules) {
            modulesData[course.id] = modules;

            const { data: modProgress } = await supabase
              .from("module_progress")
              .select("*")
              .eq("user_id", user?.id)
              .in("module_id", modules.map(m => m.id));

            if (modProgress) {
              const completedModules = modProgress.filter(p => p.quiz_passed).length;
              const totalModules = modules.length;
              const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
              const hasStarted = modProgress.length > 0;

              progressData[course.id] = {
                completed: completedModules,
                total: totalModules,
                percent: progressPercent,
                hasStarted
              };
            }
          }
        }

        setCourseProgress(progressData);
        setCourseModules(modulesData);
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

  const handleViewCourseModules = (courseId: string) => {
    setSelectedCourseId(courseId);
    setViewMode('modules');
    navigate(`/learning?courseId=${courseId}`);
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
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      {/* Header */}
      <header className="border-b bg-white dark:bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center">
                <span className="text-2xl">😊</span>
              </div>
              <span className="text-xl font-bold">Ostad</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">EN</span>
            </Button>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="p-4 space-y-2">
              <Button variant="ghost" className="w-full justify-start gap-3 text-base" onClick={() => navigate("/")}>
                <BookOpen className="w-5 h-5" />
                ক্লাস জয়েনিং
              </Button>
              <Button variant="default" className="w-full justify-start gap-3 text-base bg-yellow-400 hover:bg-yellow-500 text-black">
                <BookOpen className="w-5 h-5" />
                আমার কোর্স
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 text-base">
                <Play className="w-5 h-5" />
                রেকর্ডিং
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 text-base">
                <Award className="w-5 h-5" />
                রিসোর্স
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 text-base" onClick={() => navigate("/profile")}>
                <Trophy className="w-5 h-5" />
                তব রেজুমে
                <Badge variant="secondary" className="ml-auto bg-orange-500 text-white">নতুন</Badge>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 text-base">
                <Star className="w-5 h-5" />
                Build My CV
                <Badge variant="secondary" className="ml-auto bg-orange-500 text-white">নতুন</Badge>
              </Button>
            </Card>
          </div>

          {/* Main Content - Course Selection */}
          <div className="lg:col-span-3 space-y-6">
            {/* Banner */}
            <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <div className="p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg mb-1">ইন্টারভিউ এর প্রাক্টিস করুন Mocku-র সাথে</h2>
                    <p className="text-sm text-white/90">এখনই সাইন আপ করে ইন্টারভিউয়ের প্র্যাক্টিস শুরু করুন</p>
                  </div>
                </div>
                <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
                  বিস্তারিত দেখি →
                </Button>
              </div>
            </Card>

            {/* Course Tabs */}
            {viewMode === 'list' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">আমার কোর্সসমূহ</h2>
                  <div className="flex gap-2">
                    <Button variant="default" className="bg-gray-900 hover:bg-gray-800 text-white">
                      সব কোর্সসমূহ
                    </Button>
                    <Button variant="outline">
                      অনুবাহী কোর্সসমূহ
                    </Button>
                  </div>
                </div>

                {/* Course Cards Grid */}
                <div className="grid md:grid-cols-2 gap-4">
              {enrollments.map((enrollment) => {
                const course = enrollment.courses;
                const progress = courseProgress[course.id];
                const hasStarted = progress?.hasStarted || false;
                const progressPercent = progress?.percent || 0;
                const courseModulesArray = courseModules[course.id] || [];

                return (
                  <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img
                        src={course.thumbnail_url || course.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80"}
                        alt={course.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        {!hasStarted ? (
                          <Badge className="bg-teal-500 hover:bg-teal-600 text-white">
                            আগামীকাল
                          </Badge>
                        ) : progressPercent === 100 ? (
                          <Badge className="bg-green-500 hover:bg-green-600 text-white">
                            ফিনিশড
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
                            আনফিনিশড
                          </Badge>
                        )}
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-white/90 text-black">
                          ব্যাচ ১ · সম্পন্ন হয়েছে
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <h3 className="font-bold text-lg">{course.title}</h3>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {courseModulesArray.length} টি মডিউল
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {Math.round(courseModulesArray.reduce((sum, m) => sum + (m.duration_minutes || 0), 0) / 60)} ঘন্টা
                        </span>
                      </div>

                      {hasStarted && progressPercent > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{progress?.completed || 0}/{progress?.total || 0} মডিউল</span>
                            <span className={progressPercent === 100 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                              {progressPercent === 100 ? "সম্পন্ন" : "আনফিনিশড"}
                            </span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
                          onClick={() => handleViewCourseModules(course.id)}
                        >
                          STUDY PLAN
                        </Button>
                        <Button variant="outline" className="flex-1">
                          রিসোর্স
                          <Star className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
                </div>
              </>
            )}

            {/* Modules View */}
            {viewMode === 'modules' && selectedCourse && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setViewMode('list');
                        navigate('/learning');
                      }}
                      className="mb-2"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      কোর্স তালিকায় ফিরে যান
                    </Button>
                    <h2 className="text-2xl font-bold">{selectedCourse.title}</h2>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">
                    {modules.length} মডিউল
                  </Badge>
                </div>

                {/* Modules List */}
                <div className="space-y-3">
                  {modules.length === 0 ? (
                    <Card className="p-12 text-center">
                      <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">এই কোর্সে এখনো কোনো মডিউল নেই</p>
                    </Card>
                  ) : (
                    modules.map((module, index) => {
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
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learning;
