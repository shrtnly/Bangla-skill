import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Trophy, Star, TrendingUp, Award, Target, Clock, CircleCheck as CheckCircle, Lock, Play, LogOut, User, Settings, Moon, Sun, Info, Eye, Menu, Bell, Globe, Crown, Phone, MessageCircle } from "lucide-react";
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
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
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Top Banner Alert */}
        <Card className="mb-6 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950 dark:to-emerald-950 border-teal-200 dark:border-teal-800">
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">মাত্র ৫৯৯ টাকায় ৬ মাস রিয়েল টাইম কোর্স নিতে বাড়তি সাথে পাবেন ১৫% কোর্স ছাড়!</p>
                <p className="text-xs text-muted-foreground">অফারটি বৈধ থাকবে পর্যন্ত ডিসেম্বর ৩১, ২০২৫</p>
              </div>
            </div>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
              নিতে কোর্স এখনই →
            </Button>
          </div>
        </Card>

        {/* Main Content Grid */}
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
              <Button variant="ghost" className="w-full justify-start gap-3 text-base" onClick={() => navigate("/learning")}>
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
                <Settings className="w-5 h-5" />
                Build My CV
                <Badge variant="secondary" className="ml-auto bg-orange-500 text-white">নতুন</Badge>
              </Button>
            </Card>
          </div>

          {/* Courses Section */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="all" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">আমার কোর্সসমূহ</h2>
                <TabsList className="bg-white dark:bg-card">
                  <TabsTrigger value="all" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">সব কোর্সসমূহ</TabsTrigger>
                  <TabsTrigger value="ongoing">অনুবাহী কোর্সসমূহ</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="mt-0">
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
                    <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="p-4 space-y-3">
                        <div className="flex gap-4">
                          <Badge variant="outline" className="self-start px-3 py-1">
                            মডিউল {modules.length}
                          </Badge>
                          <div className="flex-1">
                            {!hasStarted ? (
                              <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0 mb-2">
                                নতুন কোর্স · অল কোর্স
                              </Badge>
                            ) : progressPercent === 100 ? (
                              <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 mb-2">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                ফিনিশড
                              </Badge>
                            ) : (
                              <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 mb-2">
                                {progressPercent}% আনফিনিশড
                              </Badge>
                            )}
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleShowDetails(course)}>
                            <Info className="w-4 h-4" />
                          </Button>
                        </div>

                        <h3 className="font-bold text-base">{course.title}</h3>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>সাফল্যের সাথে ভর্তি সম্পন্ন হয়েছে</span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {modules.length} টি মডিউল
                          </span>
                          {totalDuration > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {Math.round(totalDuration / 60)} ঘন্টা
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
                            onClick={() => navigate(`/learning?courseId=${course.id}`)}
                          >
                            STUDY PLAN
                          </Button>
                          <Button variant="outline" className="flex-1">
                            রিসোর্স
                            <Star className="w-4 h-4 ml-1" />
                          </Button>
                        </div>

                        {hasStarted && progressPercent > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{progress.completed}/{progress.total} আনবীশড</span>
                              <span className="text-red-500">{progressPercent === 100 ? "সম্পন্ন" : "আনবীশড"}</span>
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
                <div className="space-y-4">
                  {courses.filter(c => {
                    const progress = courseProgress[c.id];
                    return progress && progress.percent > 0 && progress.percent < 100;
                  }).length === 0 ? (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">কোনো চলমান কোর্স নেই</p>
                    </Card>
                  ) : (
                    courses.filter(c => {
                      const progress = courseProgress[c.id];
                      return progress && progress.percent > 0 && progress.percent < 100;
                    }).map((course) => {
                      const progress = courseProgress[course.id];
                      const progressPercent = progress?.percent || 0;
                      const modules = courseModules[course.id] || [];
                      const totalDuration = modules.reduce((sum, m) => sum + (m.duration_minutes || 0), 0);

                      return (
                        <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="p-4 space-y-3">
                            <div className="flex gap-4">
                              <Badge variant="outline" className="self-start px-3 py-1">
                                মডিউল {modules.length}
                              </Badge>
                              <div className="flex-1">
                                <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 mb-2">
                                  {progressPercent}% আনফিনিশড
                                </Badge>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => handleShowDetails(course)}>
                                <Info className="w-4 h-4" />
                              </Button>
                            </div>

                            <h3 className="font-bold text-base">{course.title}</h3>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                {modules.length} টি মডিউল
                              </span>
                              {totalDuration > 0 && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {Math.round(totalDuration / 60)} ঘন্টা
                                </span>
                              )}
                            </div>

                            <div className="flex gap-2 pt-2">
                              <Button
                                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
                                onClick={() => navigate(`/learning?courseId=${course.id}`)}
                              >
                                STUDY PLAN
                              </Button>
                              <Button variant="outline" className="flex-1">
                                রিসোর্স
                                <Star className="w-4 h-4 ml-1" />
                              </Button>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{progress.completed}/{progress.total} আনবীশড</span>
                                <span className="text-red-500">আনবীশড</span>
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

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Premium Banner */}
            <Card className="p-6 space-y-4 bg-gradient-to-br from-yellow-400 to-orange-400 text-black">
              <div className="flex items-start gap-3">
                <Crown className="w-8 h-8 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">প্রোফাইশনাল দের এখনই রুপ কোর্স!</h3>
                  <p className="text-sm mb-3">আপনি করলেন!</p>
                  <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                    JOIN GROUP →
                  </Button>
                </div>
              </div>
            </Card>

            {/* Job Placement */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold">Job Placement Team এর সাথে যোগাযোগ করুন!</h3>
                </div>
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Phone className="w-4 h-4" />
                  CALL
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 text-green-600 border-green-600">
                  <MessageCircle className="w-4 h-4" />
                  WHATSAPP
                </Button>
              </div>
            </Card>

            {/* Contest */}
            <Card className="p-6 space-y-4 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Target className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-bold text-lg">কোথা নেই রয়েছে</h3>
              <p className="text-sm text-muted-foreground">
                সকল লাইট ক্লাসে, অ্যাসাইনমেন্ট, কুইজ, টেক রিপোর্ট এ রিয়েল টাইম প্যারেন্ট প্যারেন্ট!
              </p>
              <div className="flex items-center justify-between text-sm">
                <span>সাম্প্র চাক</span>
                <span className="font-bold text-green-600">১৯.৫%</span>
              </div>
              <Progress value={19.5} className="h-2" />
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                লিভার রিভার রিজিকার
              </Button>
            </Card>

            {/* Ostad Pro */}
            <Card className="p-6 space-y-4 bg-gradient-to-br from-purple-900 to-pink-900 text-white">
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-400" />
                <h3 className="font-bold text-lg">Ostad Pro!</h3>
              </div>
              <p className="text-sm">
                কোর্স নেই স্কুল ব্যাস্ততায় ৫০% পক্ষ আবেদন তারেঙ্গ এডুল রো এক্সট্রা আবেদন পাস রো পারেন!
              </p>
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
