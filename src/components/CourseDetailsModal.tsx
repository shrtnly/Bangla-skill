import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Star, Clock, Award, Play, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  badge: string;
  image_url: string;
  thumbnail_url: string;
  total_students: number;
  rating: number;
  total_modules?: number;
  duration_minutes?: number;
  difficulty_level?: string;
  instructor_name?: string;
  learning_outcomes?: string[];
}

interface CourseDetailsModalProps {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modules?: any[];
  onStartCourse?: () => void;
}

export function CourseDetailsModal({
  course,
  open,
  onOpenChange,
  modules = [],
  onStartCourse
}: CourseDetailsModalProps) {
  const navigate = useNavigate();

  if (!course) return null;

  const totalDuration = modules.reduce((sum, mod) => sum + (mod.duration_minutes || 0), 0);
  const totalChapters = modules.reduce((sum, mod) => sum + (mod.total_chapters || 0), 0);

  const handleStart = () => {
    if (onStartCourse) {
      onStartCourse();
    } else {
      navigate(`/learning?courseId=${course.id}`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{course.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Image */}
          <div className="relative w-full h-64 rounded-lg overflow-hidden">
            <img
              src={course.thumbnail_url || course.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"}
              alt={course.title}
              className="w-full h-full object-cover"
            />
            <Badge
              className={`absolute top-4 right-4 ${
                course.badge === "trending"
                  ? "bg-accent"
                  : course.badge === "new"
                  ? "bg-primary"
                  : "bg-success"
              }`}
            >
              {course.category || "কোর্স"}
            </Badge>
          </div>

          {/* Course Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>{course.total_modules || modules.length || 0} মডিউল</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-accent" />
              <span>{course.total_students || 0} শিক্ষার্থী</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 fill-accent text-accent" />
              <span>{course.rating || 0} রেটিং</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{Math.round((totalDuration || course.duration_minutes || 0) / 60)} ঘণ্টা</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">কোর্স সম্পর্কে</h3>
            <p className="text-muted-foreground leading-relaxed">
              {course.description || "এই কোর্সটি আপনাকে বিস্তারিত জ্ঞান প্রদান করবে।"}
            </p>
          </div>

          {/* Course Curriculum */}
          {modules && modules.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">কোর্স কারিকুলাম</h3>
              <div className="space-y-3">
                {modules.map((module, index) => (
                  <div
                    key={module.id}
                    className="border rounded-lg p-4 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{module.title}</h4>
                          {module.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {module.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {module.total_chapters > 0 && (
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {module.total_chapters} অধ্যায়
                              </span>
                            )}
                            {module.duration_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {module.duration_minutes} মিনিট
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What You'll Learn */}
          {course.learning_outcomes && course.learning_outcomes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">আপনি কী শিখবেন</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {course.learning_outcomes.map((outcome, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{outcome}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleStart} className="flex-1 bg-success hover:bg-success/90">
              <Play className="w-4 h-4 mr-2" />
              শুরু করুন
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              বন্ধ করুন
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
