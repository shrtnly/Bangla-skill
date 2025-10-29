import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Trophy,
  Star,
  Award,
  Target,
  Clock,
  CheckCircle,
  LogOut,
  User,
  Settings,
  Info,
  Crown,
  Phone,
  MessageCircle,
  Moon,
  Sun,
} from "lucide-react";
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

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      setProfile(profileData);

      const { data: enrollmentsData } = await supabase
        .from("enrollments")
        .select(`*, courses (*)`)
        .eq("user_id", user.id);

      const enrolledCourses =
        enrollmentsData?.map((enrollment: any) => enrollment.courses) || [];
      setCourses(enrolledCourses);

      const progressData: Record<string, any> = {};
      const modulesData: Record<string, any[]> = {};

      for (const course of enrolledCourses) {
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
            .eq("user_id", user.id)
            .in(
              "module_id",
              modules.map((m) => m.id)
            );

          if (modProgress) {
            const completedModules = modProgress.filter((p) => p.quiz_passed).length;
            const totalModules = modules.length;
            const progressPercent =
              totalModules > 0
                ? Math.round((completedModules / totalModules) * 100)
                : 0;

            progressData[course.id] = {
              completed: completedModules,
              total: totalModules,
              percent: progressPercent,
              hasStarted: modProgress.length > 0,
            };
          }
        }
      }

      setCourseProgress(progressData);
      setCourseModules(modulesData);

      const { data: allModProgress } = await supabase
        .from("module_progress")
        .select("*")
        .eq("user_id", user.id);

      const completedModulesCount =
        allModProgress?.filter((p) => p.quiz_passed).length || 0;
      const totalModulesCount = Object.values(modulesData).flat().length || 0;

      setRealStats({
        completedModules: completedModulesCount,
        totalModules: totalModulesCount,
      });
    };

    fetchData();
  }, [user]);

  const userStats = {
    name: profile?.full_name || user?.user_metadata?.full_name || "ব্যবহারকারী",
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background transition-colors duration-300">
      {/* Header */}
      <header className="border-b bg-white dark:bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Brand */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-10 h-10 rounded-full bg-[#895cd6] flex items-center justify-center text-white font-bold text-lg">
              O
            </div>
            <span className="text-xl font-bold text-[#895cd6]">Ostad</span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-[#895cd6]" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#f5812e]" />
            </Button>

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-[#895cd6] text-white">
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4 space-y-2">
              <Button
                variant="default"
                className="w-full justify-start gap-3 text-base bg-[#895cd6] hover:bg-[#7b4dc4] text-white"
              >
                <BookOpen className="w-5 h-5" />
                আমার কোর্স
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-base hover:text-[#895cd6]"
                onClick={() => navigate("/profile")}
              >
                <User className="w-5 h-5" />
                আমার প্রোফাইল
              </Button>
            </Card>
          </div>

          {/* Courses Section */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-[#895cd6]">
              আমার কোর্সসমূহ
            </h2>
            <div className="space-y-4">
              {courses.filter((c) => {
                const progress = courseProgress[c.id];
                return progress && progress.percent < 100;
              }).length === 0 ? (
                <Card className="p-8 text-center space-y-4">
                  <p className="text-muted-foreground">
                    কোনো আনফিনিশড কোর্স নেই 🎉
                  </p>
                </Card>
              ) : (
                courses
                  .filter((c) => {
                    const progress = courseProgress[c.id];
                    return progress && progress.percent < 100;
                  })
                  .map((course) => {
                    const progress = courseProgress[course.id];
                    const modules = courseModules[course.id] || [];
                    const totalDuration = modules.reduce(
                      (sum, m) => sum + (m.duration_minutes || 0),
                      0
                    );

                    return (
                      <Card
                        key={course.id}
                        className="overflow-hidden hover:shadow-md transition-shadow border-[#895cd6]/30"
                      >
                        <div className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <Badge
                                className="bg-[#f5812e] text-white border-0 mb-2"
                              >
                                {progress.percent}% আনফিনিশড
                              </Badge>
                              <h3 className="font-bold text-base">
                                {course.title}
                              </h3>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleShowDetails(course)}
                            >
                              <Info className="w-4 h-4 text-[#895cd6]" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4 text-[#895cd6]" />
                              {modules.length} মডিউল
                            </span>
                            {totalDuration > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-[#f5812e]" />
                                {Math.round(totalDuration / 60)} ঘন্টা
                              </span>
                            )}
                          </div>

                          <Progress
                            value={progress.percent}
                            className="h-2 bg-gray-200 dark:bg-gray-700"
                          />

                          <div className="flex gap-2 pt-2">
                            <Button
                              className="flex-1 bg-[#895cd6] hover:bg-[#7b4dc4] text-white"
                              onClick={() =>
                                navigate(`/learning?courseId=${course.id}`)
                              }
                            >
                              STUDY PLAN
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 border-[#f5812e] text-[#f5812e]"
                            >
                              রিসোর্স
                              <Star className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-[#895cd6] to-[#f5812e] text-white">
              <div className="flex items-start gap-3">
                <Crown className="w-8 h-8 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">
                    প্রোফেশনাল কোর্সে যোগ দিন!
                  </h3>
                  <Button className="w-full bg-white text-[#895cd6] hover:bg-gray-100">
                    JOIN NOW →
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-[#f5812e]" />
                </div>
                <h3 className="font-bold">Job Placement Team</h3>
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Phone className="w-4 h-4" />
                  CALL
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-green-600 border-green-600"
                >
                  <MessageCircle className="w-4 h-4" />
                  WHATSAPP
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <CourseDetailsModal
        course={selectedCourse}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        modules={selectedCourse ? courseModules[selectedCourse.id] : []}
        onStartCourse={() =>
          navigate(`/learning?courseId=${selectedCourse?.id}`)
        }
      />
    </div>
  );
};

export default Dashboard;
