import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Star,
  Clock,
  CheckCircle,
  LogOut,
  User,
  Settings,
  Info,
  Moon,
  Sun,
  Play,
  Languages,
  Menu,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const translations = {
  bn: {
    myCourses: "আমার কোর্স",
    myProfile: "আমার প্রোফাইল",
    learning: "শিখুন",
    coursesTitle: "আমার কোর্সসমূহ",
    allCourses: "সব কোর্সসমূহ",
    unfinished: "আনফিনিশড",
    newCourse: "নতুন কোর্স",
    completed: "সম্পন্ন",
    modules: "মডিউল",
    hours: "ঘন্টা",
    start: "শুরু করুন",
    continue: "চালিয়ে যান",
    resources: "রিসোর্স",
    noCoursesEnrolled: "আপনি এখনো কোনো কোর্সে ভর্তি হননি",
    browseCourses: "কোর্স দেখুন",
    noUnfinished: "কোনো আনফিনিশড কোর্স নেই",
    profile: "প্রোফাইল",
    settings: "সেটিংস",
    logout: "লগ আউট",
    logoutSuccess: "লগ আউট সফল হয়েছে",
    logoutError: "লগ আউট করতে সমস্যা হয়েছে",
  },
  en: {
    myCourses: "My Courses",
    myProfile: "My Profile",
    learning: "Learning",
    coursesTitle: "My Courses",
    allCourses: "All Courses",
    unfinished: "Unfinished",
    newCourse: "New Course",
    completed: "Completed",
    modules: "Modules",
    hours: "Hours",
    start: "Start",
    continue: "Continue",
    resources: "Resources",
    noCoursesEnrolled: "You haven\'t enrolled in any courses yet",
    browseCourses: "Browse Courses",
    noUnfinished: "No unfinished courses",
    profile: "Profile",
    settings: "Settings",
    logout: "Logout",
    logoutSuccess: "Logout successful",
    logoutError: "Failed to logout",
  },
};

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
  const [language, setLanguage] = useState<"bn" | "en">("bn");

  const t = translations[language];

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
            const hasStarted = modProgress.length > 0;

            progressData[course.id] = {
              completed: completedModules,
              total: totalModules,
              percent: progressPercent,
              hasStarted,
            };
          }
        }
      }

      setCourseProgress(progressData);
      setCourseModules(modulesData);
    };

    fetchData();
  }, [user]);

  const userStats = {
    name: profile?.full_name || user?.user_metadata?.full_name || (language === "bn" ? "ব্যবহারকারী" : "User"),
  };

  const handleShowDetails = async (course: any) => {
    setSelectedCourse(course);
    setDetailsModalOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(t.logoutSuccess);
    } catch (error) {
      toast.error(t.logoutError);
    }
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "bn" ? "en" : "bn"));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      {/* Header */}
      <header className="border-b bg-white dark:bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-10 h-10 rounded-full bg-[#895cd6] flex items-center justify-center text-white font-bold text-lg">
              O
            </div>
            <span className="text-xl font-bold text-[#895cd6]">Learn</span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-0">
            
            {/* Language toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="gap-2 text-[#895cd6] hover:text-[#7b4dc4] hover:bg-[#895cd6]/10"
            >
              <Languages className="h-4 w-4" />
              <span className="font-medium">{language === "bn" ? "EN" : "বাং"}</span>
            </Button>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hover:text-[#7b4dc4] hover:bg-[#895cd6]/10"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-[#895cd6] hover:scale-110" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#f5812e] hover:scale-110" />
            </Button>

            {/* Mobile Menu Trigger */}
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:text-[#7b4dc4] hover:bg-[#895cd6]/10">
                    <Menu className="h-5 w-5 text-[#895cd6]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    {t.myCourses}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/learning")}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    {t.learning}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="w-4 h-4 mr-2" />
                    {t.myProfile}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    {t.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

          </div>

        </div>
      </header>



      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Hidden on mobile, visible on large screens */}
          <div className="lg:col-span-1 hidden lg:block">
            <Card className="p-4 space-y-2">
              <Button
                variant="default"
                className="w-full justify-start gap-3 text-base bg-[#895cd6] hover:bg-[#7b4dc4] text-white"
              >
                <BookOpen className="w-5 h-5" />
                {t.myCourses}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-base hover:text-[#7b4dc4] hover:bg-[#895cd6]/10"
                onClick={() => navigate("/learning")}
              >
                <BookOpen className="w-5 h-5" />
                {t.learning}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-base hover:text-[#7b4dc4] hover:bg-[#895cd6]/10"
                onClick={() => navigate("/profile")}
              >
                <User className="w-5 h-5" />
                {t.myProfile}
              </Button>
            </Card>
          </div>

          {/* Courses Section */}
          <div className="lg:col-span-3 space-y-6 lg:col-span-3 md:col-span-4 ">
            <Tabs defaultValue="all" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[#895cd6]">
                  {t.coursesTitle}
                </h2>
                <TabsList className="bg-white dark:bg-card border border-[#895cd6]/20">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#895cd6] data-[state=active]:to-[#7b4dc4] data-[state=active]:text-white"
                  >
                    {t.allCourses}
                  </TabsTrigger>
                  <TabsTrigger
                    value="ongoing"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#f5812e] data-[state=active]:to-[#e36e1f] data-[state=active]:text-white"
                  >
                    {t.unfinished}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="mt-0">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.length === 0 ? (
                    <Card className="p-8 text-center col-span-full">
                      <p className="text-muted-foreground">
                        {t.noCoursesEnrolled}
                      </p>
                      <Button onClick={() => navigate("/")} className="mt-4">
                        {t.browseCourses}
                      </Button>
                    </Card>
                  ) : (
                    courses.map((course) => {
                      const progress = courseProgress[course.id];
                      const hasStarted = progress?.hasStarted || false;
                      const progressPercent = progress?.percent || 0;
                      const modules = courseModules[course.id] || [];
                      const totalDuration = modules.reduce(
                        (sum, m) => sum + (m.duration_minutes || 0),
                        0
                      );

                      return (
                        <Card
                          key={course.id}
                          className="overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          <div className="p-4 space-y-3">
                            <div className="flex gap-4">
                              <Badge variant="outline" className="self-start px-3 py-1">
                                {t.modules} {modules.length}
                              </Badge>
                              <div className="flex-1">
                                {!hasStarted ? (
                                  <Badge className="bg-gradient-to-r from-[#895cd6] to-[#7b4dc4] hover:opacity-90 text-white border-0 mb-2">
                                    {t.newCourse}
                                  </Badge>
                                ) : progressPercent === 100 ? (
                                  <Badge className="bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90 text-white border-0 mb-2">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    {t.completed}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-gradient-to-r from-[#f5812e] to-[#e36e1f] hover:opacity-90 text-white border-0 mb-2">
                                    {progressPercent}% {t.unfinished}
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleShowDetails(course)}
                              >
                                <Info className="w-4 h-4" />
                              </Button>
                            </div>

                            <h3 className="font-bold text-base">{course.title}</h3>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                {modules.length} {language === "bn" ? "টি মডিউল" : "Modules"}
                              </span>
                              {totalDuration > 0 && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {Math.round(totalDuration / 60)} {t.hours}
                                </span>
                              )}
                            </div>

                            <div className="flex gap-2 pt-2">
                              <Button
                                className="flex-1 bg-gradient-to-r from-[#895cd6] to-[#7b4dc4] hover:opacity-90 text-white"
                                onClick={() => navigate(`/learning?courseId=${course.id}`)}
                              >
                                <Play className="w-4 h-4 mr-2" />
                                {t.start}
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 border-[#f5812e] text-[#f5812e] hover:bg-[#f5812e] hover:text-white"
                                onClick={() => navigate(`/resources?courseId=${course.id}`)} // Navigate to resources page
                              >
                                {t.resources}
                                <Star className="w-4 h-4 ml-1" />
                              </Button>
                            </div>

                            {hasStarted && progressPercent > 0 && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>
                                    {progress.completed}/{progress.total} {language === "bn" ? "মডিউল" : "modules"}
                                  </span>
                                  <span
                                    className={
                                      progressPercent === 100
                                        ? "text-green-600 font-medium"
                                        : "text-[#f5812e] font-medium"
                                    }
                                  >
                                    {progressPercent === 100 ? t.completed : t.unfinished}
                                  </span>
                                </div>
                                <Progress value={progressPercent} className="h-2" />
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              <TabsContent value="ongoing">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.filter((c) => {
                    const progress = courseProgress[c.id];
                    return progress && progress.hasStarted && progress.percent < 100;
                  }).length === 0 ? (
                    <Card className="p-8 text-center col-span-full">
                      <p className="text-muted-foreground">{t.noUnfinished}</p>
                    </Card>
                  ) : (
                    courses
                      .filter((c) => {
                        const progress = courseProgress[c.id];
                        return progress && progress.hasStarted && progress.percent < 100;
                      })
                      .map((course) => {
                        const progress = courseProgress[course.id];
                        const progressPercent = progress?.percent || 0;
                        const modules = courseModules[course.id] || [];
                        const totalDuration = modules.reduce(
                          (sum, m) => sum + (m.duration_minutes || 0),
                          0
                        );

                        return (
                          <Card
                            key={course.id}
                            className="overflow-hidden hover:shadow-lg transition-shadow"
                          >
                            <div className="p-4 space-y-3">
                              <div className="flex gap-4">
                                <Badge variant="outline" className="self-start px-3 py-1">
                                  {t.modules} {modules.length}
                                </Badge>
                                <div className="flex-1">
                                  <Badge className="bg-gradient-to-r from-[#f5812e] to-[#e36e1f] hover:opacity-90 text-white border-0 mb-2">
                                    {progressPercent}% {t.unfinished}
                                  </Badge>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleShowDetails(course)}
                                >
                                  <Info className="w-4 h-4" />
                                </Button>
                              </div>

                              <h3 className="font-bold text-base">{course.title}</h3>

                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-4 h-4" />
                                  {modules.length} {language === "bn" ? "টি মডিউল" : "Modules"}
                                </span>
                                {totalDuration > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {Math.round(totalDuration / 60)} {t.hours}
                                  </span>
                                )}
                              </div>

                              <div className="flex gap-2 pt-2">
                                <Button
                                  className="flex-1 bg-gradient-to-r from-[#895cd6] to-[#7b4dc4] hover:opacity-90 text-white"
                                  onClick={() => navigate(`/learning?courseId=${course.id}`)}
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  {t.continue}
                                </Button>
                                <Button
                                  variant="outline"
                                  className="flex-1 border-[#f5812e] text-[#f5812e] hover:bg-[#f5812e] hover:text-white"
                                  onClick={() => navigate(`/resources?courseId=${course.id}`)} // Navigate to resources page
                                >
                                  {t.resources}
                                  <Star className="w-4 h-4 ml-1" />
                                </Button>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>
                                    {progress.completed}/{progress.total} {language === "bn" ? "মডিউল" : "modules"}
                                  </span>
                                  <span className="text-[#f5812e] font-medium">
                                    {t.unfinished}
                                  </span>
                                </div>
                                <Progress value={progressPercent} className="h-2" />
                              </div>
                            </div>
                          </Card>
                        );
                      })
                  )}
                </div>
              </TabsContent>
            </Tabs>
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
