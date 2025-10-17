import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLearningProgress } from "@/hooks/useLearningProgress";
import { toast } from "sonner";
import type { Tables } from "@/types/supabase";

type Chapter = Tables<"chapters">;
type Module = Tables<"modules">;

const Learning = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");

  const { progress, fetchFullProgress, isChapterCompleted, markChapterComplete, getModuleProgress } = useLearningProgress();

  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    (async () => {
      if (user && courseId) {
        await fetchFullProgress(courseId);
        setLoading(false);
      }
    })();
  }, [user, courseId, fetchFullProgress]);

  useEffect(() => {
    if (progress.modules.length > 0) {
      const first = progress.modules[0];
      setSelectedModule(first);
      const related = progress.chapters.filter((c) => c.module_id === first.id);
      setChapters(related);
    }
  }, [progress]);

  const handleStartChapter = (chapter: Chapter) => {
    navigate(`/chapter?moduleId=${chapter.module_id}&chapterId=${chapter.id}`);
  };

  const handleComplete = async (chapter: Chapter) => {
    await markChapterComplete(chapter.id);
    toast.success("অধ্যায় সম্পন্ন হয়েছে");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!selectedModule) {
    return <div className="p-6">No module found.</div>;
  }

  const moduleProgress = getModuleProgress(selectedModule.id);

  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 border-b flex justify-between items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-bold text-lg">{selectedModule.title}</h1>
          <p className="text-xs text-muted-foreground">অগ্রগতি: {moduleProgress}%</p>
        </div>
      </header>

      <div className="p-6 space-y-4">
        {chapters.map((c, idx) => {
          const completed = isChapterCompleted(c.id);
          const locked = idx > 0 && !isChapterCompleted(chapters[idx - 1].id);
          return (
            <Card key={c.id} className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{c.title}</h3>
                <p className="text-sm text-muted-foreground">{c.duration} মিনিট</p>
              </div>

              <div>
                {completed ? (
                  <Button variant="ghost" className="text-green-600">
                    সম্পন্ন
                    <CheckCircle className="ml-2 w-4 h-4" />
                  </Button>
                ) : locked ? (
                  <Button variant="outline" disabled>
                    <Lock className="mr-2 w-4 h-4" /> লক করা
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => handleStartChapter(c)}>শুরু করুন</Button>
                    <Button variant="outline" onClick={() => handleComplete(c)}>
                      সম্পন্ন
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Learning;
