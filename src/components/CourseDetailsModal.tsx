import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  BookOpen,
  Users,
  Star,
  Clock,
  Award,
  Play,
  CheckCircle,
  Info,
  ListChecks,
  GraduationCap,
  Target,
} from "lucide-react";
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
  onStartCourse,
}: CourseDetailsModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  if (!course) return null;

  const totalDuration = modules.reduce(
    (sum, mod) => sum + (mod.duration_minutes || 0),
    0
  );
  const totalChapters = modules.reduce(
    (sum, mod) => sum + (mod.total_chapters || 0),
    0
  );

  const handleStart = () => {
    if (onStartCourse) onStartCourse();
    else navigate(`/learning?courseId=${course.id}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-6 border-b bg-background sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl sm:text-2xl font-bold mb-2 leading-tight">
                {course.title}
              </DialogTitle>
              {course.description && (
                <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                  {course.description}
                </DialogDescription>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{course.total_students || 0} শিক্ষার্থী</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                  <span>{course.rating || 0} রেটিং</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {Math.round(
                      (totalDuration || course.duration_minutes || 0) / 60
                    )}{" "}
                    ঘণ্টা
                  </span>
                </div>
              </div>
            </div>

            <Badge
              className={`self-start sm:self-center px-3 py-1 text-sm ${
                course.badge === "trending"
                  ? "bg-accent text-white"
                  : course.badge === "new"
                  ? "bg-primary text-white"
                  : "bg-success text-white"
              }`}
            >
              {course.category || "কোর্স"}
            </Badge>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-24">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col"
          >
            <TabsList className="w-full grid grid-cols-3 mb-4 sticky top-0 bg-background z-10 border-b">
              <TabsTrigger value="overview" className="flex items-center gap-2 text-sm sm:text-base">
                <Info className="w-4 h-4" />
                <span>সারসংক্ষেপ</span>
              </TabsTrigger>
              <TabsTrigger value="curriculum" className="flex items-center gap-2 text-sm sm:text-base">
                <ListChecks className="w-4 h-4" />
                <span>কারিকুলাম</span>
              </TabsTrigger>
              <TabsTrigger value="outcomes" className="flex items-center gap-2 text-sm sm:text-base">
                <Target className="w-4 h-4" />
                <span>ফলাফল</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-5 mt-0">
              {/* Thumbnail */}
              <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden">
                <img
                  src={
                    course.thumbnail_url ||
                    course.image_url ||
                    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"
                  }
                  alt={course.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="p-3 sm:p-4 text-center">
                  <BookOpen className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-lg sm:text-2xl font-bold text-primary">
                    {course.total_modules || modules.length || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">মডিউল</div>
                </Card>
                <Card className="p-3 sm:p-4 text-center">
                  <GraduationCap className="w-6 h-6 mx-auto mb-2 text-accent" />
                  <div className="text-lg sm:text-2xl font-bold text-accent">
                    {totalChapters || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">অধ্যায়</div>
                </Card>
                <Card className="p-3 sm:p-4 text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-success" />
                  <div className="text-lg sm:text-2xl font-bold text-success">
                    {Math.round((totalDuration || 0) / 60)}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">ঘণ্টা</div>
                </Card>
                <Card className="p-3 sm:p-4 text-center">
                  <Award className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-lg sm:text-2xl font-bold text-primary">✓</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    সার্টিফিকেট
                  </div>
                </Card>
              </div>

              {/* About Course */}
              <Card className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  কোর্স সম্পর্কে
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {course.description ||
                    "এই কোর্সটি আপনাকে বিস্তারিত জ্ঞান প্রদান করবে এবং আপনার দক্ষতা বৃদ্ধিতে সহায়তা করবে।"}
                </p>
              </Card>

              {/* Difficulty */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4 sm:p-6">
                  <h4 className="font-semibold mb-3 text-sm sm:text-base">
                    কোর্সের স্তর
                  </h4>
                  <Badge variant="outline" className="text-sm">
                    {course.difficulty_level || "সব স্তরের জন্য"}
                  </Badge>
                </Card>
                <Card className="p-4 sm:p-6">
                  <h4 className="font-semibold mb-3 text-sm sm:text-base">
                    প্রয়োজনীয়তা
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    কোনো পূর্ব অভিজ্ঞতার প্রয়োজন নেই
                  </p>
                </Card>
              </div>
            </TabsContent>

            {/* Curriculum */}
            <TabsContent value="curriculum" className="space-y-4 mt-0">
              <Card className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-primary" />
                  কোর্স কারিকুলাম
                  <Badge variant="outline" className="ml-auto">
                    {modules.length} মডিউল
                  </Badge>
                </h3>

                {modules.length > 0 ? (
                  <div className="space-y-3">
                    {modules.map((module, index) => (
                      <div
                        key={module.id}
                        className="border rounded-lg p-4 hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold mb-1">{module.title}</h4>
                            {module.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {module.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
                              {module.points && (
                                <span className="flex items-center gap-1">
                                  <Award className="w-3 h-3" />
                                  {module.points} পয়েন্ট
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>কারিকুলাম শীঘ্রই যুক্ত হবে</p>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Outcomes */}
            <TabsContent value="outcomes" className="space-y-4 mt-0">
              <Card className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  আপনি কী শিখবেন
                </h3>
                {(course.learning_outcomes?.length ?? 0) > 0 ? (
                  <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                    {course.learning_outcomes!.map((outcome, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20"
                      >
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{outcome}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      "কোর্সের মূল বিষয়বস্তু সম্পর্কে গভীর ধারণা অর্জন করবেন",
                      "বাস্তব প্রজেক্ট তৈরি করার দক্ষতা অর্জন করবেন",
                      "ইন্ডাস্ট্রি স্ট্যান্ডার্ড টুলস ব্যবহার করতে শিখবেন",
                      "প্রফেশনাল সার্টিফিকেট অর্জন করবেন",
                    ].map((outcome, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20"
                      >
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{outcome}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Bottom Buttons */}
        <div className="flex gap-3 border-t bg-background p-4 sm:p-6 sticky bottom-0 z-10">
          <Button
            onClick={handleStart}
            className="flex-1 bg-success hover:bg-success/90 h-12 text-base"
          >
            <Play className="w-5 h-5 mr-2" />
            কোর্স শুরু করুন
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-12 text-base"
          >
            বন্ধ করুন
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
