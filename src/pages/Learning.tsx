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
  const [modules, setModules] = useState<any[]>([]);
  const [moduleProgress, setModuleProgress] = useState<any[]>([]);

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

  const handlePractice = (moduleId: string) => {
    navigate(`/practice?moduleId=${moduleId}`);
  };

  const handleQuiz = (moduleId: string) => {
    navigate(`/quiz?moduleId=${moduleId}`);
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
              <p className="text-xs md:text-sm text-muted-foreground">মডিউল ২ - সোশ্যাল মিডিয়া মার্কেটিং</p>
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

                return (
                  <Card
                    key={module.id}
                    className={`p-4 transition-all ${
                      unlocked
                        ? status === "completed"
                          ? "bg-success/5 border-success/30 cursor-pointer hover:shadow-md"
                          : "cursor-pointer hover:shadow-md"
                        : "opacity-60 bg-muted/30"
                    }`}
                    onClick={() => unlocked && handleStartModule(module, index)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-sm leading-tight flex-1">
                        মডিউল {index + 1}. {module.title}
                      </h3>
                      {!unlocked ? (
                        <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      ) : status === "completed" ? (
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                      ) : status === "in_progress" ? (
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
            <Card className="p-6 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200 dark:border-violet-800">
              <Badge className="mb-3 bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                চলমান
              </Badge>
              <h2 className="text-2xl font-bold mb-2">সোশ্যাল মিডিয়া মার্কেটিং</h2>
              <p className="text-muted-foreground mb-4">বিভিন্ন সোশ্যাল মিডিয়া প্ল্যাটফর্মে মার্কেটিং এর বিস্তারিত শিখুন</p>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <BookOpen className="w-6 h-6 mx-auto mb-1 text-violet-600 dark:text-violet-400" />
                  <div className="text-sm text-muted-foreground">পাঠ্যসূচি</div>
                </div>
                <div className="text-center">
                  <Award className="w-6 h-6 mx-auto mb-1 text-green-600 dark:text-green-400" />
                  <div className="text-sm text-muted-foreground">সম্পন্ন</div>
                </div>
                <div className="text-center">
                  <Trophy className="w-6 h-6 mx-auto mb-1 text-orange-600 dark:text-orange-400" />
                  <div className="text-sm text-muted-foreground">পয়েন্ট</div>
                </div>
              </div>

              <Progress value={45} className="h-3" />
            </Card>

            <div className="space-y-4">
              <h3 className="text-lg font-bold">অধ্যায়সমূহ</h3>

              {[
                { id: 1, title: "সোশ্যাল মিডিয়া কী এবং কেন?", videos: "৭২ মিনিট", status: "completed" },
                { id: 2, title: "কেমন করে মার্কেটিং কৌশল", videos: "১০ মিনিট", status: "completed" },
                { id: 3, title: "ইনস্টাগ্রাম মার্কেটিং কৌশল", videos: "২৬ মিনিট", status: "completed" },
                { id: 4, title: "ফেসবুক ক্যালেন্ডার তৈরি", videos: "৩০ মিনিট", status: "locked" },
                { id: 5, title: "অডিয়েন্স এনগেজমেন্ট", videos: "২০ মিনিট", status: "locked" },
                { id: 6, title: "পারফরম্যান্স ট্র্যাকিং", videos: "২৫ মিনিট", status: "locked" }
              ].map((chapter, idx) => (
                <Card
                  key={chapter.id}
                  className={`p-5 transition-all ${
                    chapter.status === "completed"
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                      : chapter.status === "locked"
                      ? "opacity-60"
                      : "hover:shadow-md cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      chapter.status === "completed"
                        ? "bg-green-100 dark:bg-green-900/30"
                        : chapter.status === "locked"
                        ? "bg-muted"
                        : "bg-violet-100 dark:bg-violet-900/30"
                    }`}>
                      {chapter.status === "completed" ? (
                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      ) : chapter.status === "locked" ? (
                        <span className="font-bold text-muted-foreground">{idx + 1}</span>
                      ) : (
                        <span className="font-bold text-violet-600 dark:text-violet-400">{idx + 1}</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{chapter.title}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {chapter.videos}
                      </p>
                    </div>

                    {chapter.status === "completed" ? (
                      <Button variant="ghost" className="text-green-600 dark:text-green-400">
                        সম্পন্ন হয়েছে
                      </Button>
                    ) : chapter.status === "locked" ? (
                      <Button variant="ghost" disabled className="bg-violet-500 text-white hover:bg-violet-600">
                        শুরু করুন
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    ) : (
                      <Button className="bg-violet-500 text-white hover:bg-violet-600">
                        শুরু করুন
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

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
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  প্র্যাকটিস শুরু করুন
                </Button>
                <Button variant="outline" className="flex-1" disabled>
                  চূড়ান্ত কুইজ
                  <Lock className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learning;
