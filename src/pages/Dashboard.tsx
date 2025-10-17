import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLearningProgress } from "@/hooks/useLearningProgress";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { progress, fetchFullProgress, getModuleProgress } = useLearningProgress();

  useEffect(() => {
    if (user) fetchFullProgress();
  }, [user, fetchFullProgress]);

  const totalModules = progress.modules.length;
  const completedModules = progress.modules.filter(
    (m) => getModuleProgress(m.id) === 100
  ).length;

  const overallProgress =
    totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-2xl font-bold mb-4">স্বাগতম, {user?.email}</h1>

      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">সর্বমোট অগ্রগতি</h2>
            <p className="text-sm text-muted-foreground">
              {completedModules}/{totalModules} মডিউল সম্পন্ন
            </p>
          </div>
          <Trophy className="text-yellow-500 w-6 h-6" />
        </div>
        <Progress value={overallProgress} className="mt-4 h-3" />
      </Card>

      <div className="grid gap-4">
        {progress.modules.map((m) => {
          const pct = getModuleProgress(m.id);
          return (
            <Card key={m.id} className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{m.title}</h3>
                <p className="text-xs text-muted-foreground">{m.description}</p>
                <Progress value={pct} className="h-2 mt-2" />
              </div>
              <Button
                onClick={() => navigate(`/learning?courseId=${m.course_id}`)}
              >
                চালিয়ে যান
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
