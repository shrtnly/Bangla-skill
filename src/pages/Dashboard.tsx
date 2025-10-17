// /src/pages/Dashboard.tsx
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Trophy, Star, TrendingUp, Award, Target, Clock, CheckCircle, LogOut, User, Settings, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import { useLearningProgress } from "@/hooks/useLearningProgress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const {
    progress,
    fetchFullProgress,
  } = useLearningProgress();

  useEffect(() => {
    if (user) {
      fetchFullProgress();
    }
  }, [user, fetchFullProgress]);

  const profile = (user as any)?.profile || {}; // if you store profile in context, use that; fallback below
  const name = profile?.full_name || (user as any)?.user_metadata?.full_name || "ব্যবহারকারী";

  // compute some aggregate stats from the centralized progress
  const totalModules = progress.modules.length;
  const completedModules = progress.moduleProgress.filter((m: any) => m.learning_completed && m.practice_completed && m.quiz_passed).length; // or adapt to your status logic
  const moduleLearningCompleted = progress.moduleProgress.filter((m: any) => m.learning_completed).length;
  const points = (profile && profile.points) || 0;
  const certificates = (profile && profile.total_certificates) || 0;
  const currentStreak = (profile && profile.current_streak) || 0;
  const overallProgress = totalModules > 0 ? Math.round((moduleLearningCompleted / totalModules) * 100) : 0;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("লগ আউট সফল হয়েছে");
    } catch (err) {
      toast.error("লগ আউট করতে সমস্যা হয়েছে");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">শিক্ষা প্ল্যাটফর্ম</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Sun className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback>{name.charAt(0)}</AvatarFallback>
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

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">স্বাগতম, {name}! 👋</h1>
          <p className="text-muted-foreground">আপনার শিক্ষার যাত্রা চালিয়ে যান</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="w-5 h-5 text-accent" />
              <span className="text-sm">মোট পয়েন্ট</span>
            </div>
            <div className="text-3xl font-bold text-accent">{points}</div>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-sm">সম্পন্ন মডিউল</span>
            </div>
            <div className="text-3xl font-bold text-success">{completedModules}/{totalModules}</div>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Award className="w-5 h-5 text-primary" />
              <span className="text-sm">সার্টিফিকেট</span>
            </div>
            <div className="text-3xl font-bold text-primary">{certificates}</div>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm">স্ট্রিক</span>
            </div>
            <div className="text-3xl font-bold">{currentStreak} দিন 🔥</div>
          </Card>
        </div>

        <div className="mt-8 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">আমার কোর্সসমূহ</h2>
              <Button variant="ghost" onClick={() => navigate("/")}>সব দেখুন →</Button>
            </div>

            <div className="space-y-4">
              {progress.modules.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">কোর্স পাওয়া যায়নি</p>
                  <Button onClick={() => navigate("/")}>কোর্স দেখুন</Button>
                </Card>
              ) : (
                progress.modules.map((courseOrModule: any) => (
                  // If your modules are nested under courses you'll adapt this to show courses
                  <Card key={courseOrModule.id}>
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{courseOrModule.title}</h3>
                        <p className="text-sm text-muted-foreground">{courseOrModule.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button onClick={() => navigate(`/learning?courseId=${courseOrModule.course_id || courseOrModule.id}`)}>
                          শুরু করুন
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold">সামগ্রিক অগ্রগতি</h3>
              <div className="text-2xl font-bold mt-2 mb-4">{overallProgress}%</div>
              <Progress value={overallProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">মডিউলগুলির শিক্ষার অগ্রগতি</p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold">আজকের লক্ষ্য</h3>
              <p className="text-sm text-muted-foreground mt-2">১টি মডিউল শেষ করুন</p>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;