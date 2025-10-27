import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Trophy, Star, TrendingUp, Award, Target, Clock, CircleCheck as CheckCircle, Lock, Play, LogOut, User, Settings, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CourseDetailsModal } from "@/components/CourseDetailsModal";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const { theme, setTheme } = useTheme();
  const [courses, setCourses] = useState<any[]>([]);
  const [courseProgress, setCourseProgress] = useState<Record<string, any>>({});
  const [courseModules, setCourseModules] = useState<Record<string, any[]>>({});
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [realStats, setRealStats] = useState<any>(null);


  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else {
        setProfile(profileData);
      }

      // Fetch enrolled courses
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select(`
          *,
          courses (*)
        `)
        .eq("user_id", user.id);

      if (enrollmentsError) {
        console.error("Error fetching enrollments:", enrollmentsError);
        return;
      }

      const enrolledCourses = enrollmentsData?.map((enrollment: any) => enrollment.courses) || [];
      setCourses(enrolledCourses);

      // Fetch modules and progress for each course
      const progressData: Record<string, any> = {};
      const modulesData: Record<string, any[]> = {};

      for (const course of enrolledCourses) {
        // Get modules for course
        const { data: modules } = await supabase
          .from("modules")
          .select("*")
          .eq("course_id", course.id)
          .order("order_index");

        if (modules) {
          modulesData[course.id] = modules;

          // Get chapter progress for all modules
          const { data: modProgress } = await supabase
            .from("module_progress")
            .select("*")
            .eq("user_id", user.id)
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

      // Calculate real statistics
      const { data: allModProgress } = await supabase
        .from("module_progress")
        .select("*")
        .eq("user_id", user.id);

      const completedModulesCount = allModProgress?.filter(p => p.quiz_passed).length || 0;
      const totalModulesCount = Object.values(modulesData).flat().length || 0;

      setRealStats({
        completedModules: completedModulesCount,
        totalModules: totalModulesCount
      });
    };

    fetchData();
  }, [user]);

  const userStats = {
    name: profile?.full_name || user?.user_metadata?.full_name || "ব্যবহারকারী",
    totalCourses: courses.length,
    completedModules: realStats?.completedModules || 0,
    totalModules: realStats?.totalModules || 0,
    points: profile?.points || 0,
    certificates: profile?.total_certificates || 0,
    currentStreak: profile?.current_streak || 0,
  };

  const handleShowDetails = async (course: any) => {
    setSelectedCourse(course);
    setDetailsModalOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("লগ আউট সফল হয়েছে");
    } catch (error) {
      toast.error("লগ আউট করতে সমস্যা হয়েছে");
    }
  };


  const achievements = [
    { icon: Trophy, title: "প্রথম মডিউল সম্পন্ন", earned: true },
    { icon: Target, title: "৫টি কুইজ পাস", earned: true },
    { icon: Star, title: "১০০০ পয়েন্ট অর্জন", earned: true },
    { icon: Award, title: "প্রথম সার্টিফিকেট", earned: false },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">শিক্ষা প্ল্যাটফর্ম</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback>
                      {userStats.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="w-4 h-4 mr-2" />
                  প্রোফাইল
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  সেটিংস
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  লগ আউট
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">স্বাগতম, {userStats.name}! 👋</h1>
          <p className="text-muted-foreground">আপনার শিক্ষার যাত্রা চালিয়ে যান</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-6 space-y-2 card-hover">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="w-5 h-5 text-accent" />
              <span className="text-sm">মোট পয়েন্ট</span>
            </div>
            <div className="text-3xl font-bold text-accent">{userStats.points}</div>
          </Card>

          <Card className="p-6 space-y-2 card-hover">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-sm">সম্পন্ন মডিউল</span>
            </div>
            <div className="text-3xl font-bold text-success">
              {userStats.completedModules}/{userStats.totalModules}
            </div>
          </Card>

          <Card className="p-6 space-y-2 card-hover">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Award className="w-5 h-5 text-primary" />
              <span className="text-sm">সার্টিফিকেট</span>
            </div>
            <div className="text-3xl font-bold text-primary">{userStats.certificates}</div>
          </Card>

          <Card className="p-6 space-y-2 card-hover">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm">স্ট্রিক</span>
            </div>
            <div className="text-3xl font-bold">{userStats.currentStreak} দিন 🔥</div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Courses Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">আমার কোর্সসমূহ</h2>
              <Button variant="ghost" onClick={() => navigate("/")}>
                সব দেখুন →
              </Button>
            </div>

            <div className="space-y-4">
              {courses.length === 0 ? (
                <Card className="p-8 text-center space-y-4">
                  <p className="text-muted-foreground">আপনি এখনো কোনো কোর্সে ভর্তি হননি</p>
                  <Button onClick={() => navigate("/")}>কোর্স দেখুন</Button>
                </Card>
              ) : (
                courses.map((course) => {
                  const progress = courseProgress[course.id];
                  const hasStarted = progress?.hasStarted || false;
                  const progressPercent = progress?.percent || 0;
                  const modules = courseModules[course.id] || [];
                  const totalDuration = modules.reduce((sum, m) => sum + (m.duration_minutes || 0), 0);

                  return (
                    <Card key={course.id} className="overflow-hidden card-hover">
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-48 h-48 md:h-auto relative">
                          <img
                            src={course.thumbnail_url || course.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80"}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                          {hasStarted && progressPercent < 100 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <div className="text-center text-white">
                                <div className="text-2xl font-bold">{progressPercent}%</div>
                                <div className="text-xs">সম্পন্ন</div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 p-6 space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-4">
                              <h3 className="font-semibold text-lg">{course.title}</h3>
                              {!hasStarted ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                  নতুন
                                </Badge>
                              ) : progressPercent === 100 ? (
                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  সম্পন্ন
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-50 text-amber-600 border-amber-200">
                                  {progressPercent}% চলমান
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {course.description || "কোর্সের বিবরণ নেই"}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                {modules.length || course.total_modules || 0} মডিউল
                              </span>
                              {totalDuration > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {Math.round(totalDuration / 60)} ঘণ্টা
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {hasStarted && progressPercent > 0 && progressPercent < 100 && (
                            <div className="space-y-2">
                              <Progress value={progressPercent} className="h-2" />
                              <p className="text-xs text-muted-foreground">
                                {progress.completed}/{progress.total} মডিউল সম্পন্ন
                              </p>
                            </div>
                          )}

                          <div className="flex gap-3">
                            <Button
                              className="btn-success"
                              onClick={() => navigate(`/learning?courseId=${course.id}`)}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              {hasStarted ? "চালিয়ে যান" : "শুরু করুন"}
                            </Button>
                            <Button variant="outline" onClick={() => handleShowDetails(course)}>
                              বিস্তারিত
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Achievements */}
            <Card className="p-6 space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                সাফল্য
              </h3>
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      achievement.earned
                        ? "bg-success/10 border border-success/20"
                        : "bg-muted/50 opacity-60"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        achievement.earned ? "bg-success/20" : "bg-muted"
                      }`}
                    >
                      <achievement.icon
                        className={`w-5 h-5 ${
                          achievement.earned ? "text-success" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <span className="text-sm font-medium">{achievement.title}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Daily Goal */}
            <Card className="p-6 space-y-4 bg-gradient-to-br from-accent/10 to-primary/10">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" />
                আজকের লক্ষ্য
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">১টি মডিউল সম্পন্ন করুন</span>
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <Progress value={100} className="h-2" />
                <p className="text-sm text-muted-foreground">চমৎকার! আজকের লক্ষ্য অর্জিত 🎉</p>
              </div>
            </Card>

            {/* Study Time */}
            <Card className="p-6 space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                এই সপ্তাহে পড়াশোনা
              </h3>
              <div className="text-center space-y-2">
                <div className="text-4xl font-bold text-primary">২.৫ ঘণ্টা</div>
                <p className="text-sm text-muted-foreground">গত সপ্তাহের চেয়ে ১৫% বেশি</p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Course Details Modal */}
      <CourseDetailsModal
        course={selectedCourse}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        modules={selectedCourse ? courseModules[selectedCourse.id] : []}
        onStartCourse={() => navigate(`/learning?courseId=${selectedCourse?.id}`)}
      />
    </div>
  );
};

export default Dashboard;
