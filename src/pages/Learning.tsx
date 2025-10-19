import { useState } from "react";
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
  Star
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Learning = () => {
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState<number | null>(null);

  const modules = [
    {
      id: 1,
      title: "মডিউল ১: ডিজিটাল মার্কেটিং পরিচিতি",
      status: "completed",
      progress: 100,
      chapters: 5,
      completedChapters: 5,
      locked: false,
      points: 100
    },
    {
      id: 2,
      title: "মডিউল ২: সোশ্যাল মিডিয়া মার্কেটিং",
      status: "in-progress",
      progress: 60,
      chapters: 6,
      completedChapters: 3,
      locked: false,
      points: 120
    },
    {
      id: 3,
      title: "মডিউল ৩: কন্টেন্ট মার্কেটিং স্ট্র্যাটেজি",
      status: "locked",
      progress: 0,
      chapters: 7,
      completedChapters: 0,
      locked: true,
      points: 150
    },
    {
      id: 4,
      title: "মডিউল ৪: SEO এবং SEM",
      status: "locked",
      progress: 0,
      chapters: 8,
      completedChapters: 0,
      locked: true,
      points: 180
    },
  ];

  const chapters = [
    { id: 1, title: "সোশ্যাল মিডিয়া কী এবং কেন?", completed: true, duration: "১৫ মিনিট" },
    { id: 2, title: "ফেসবুক মার্কেটিং বেসিক", completed: true, duration: "২০ মিনিট" },
    { id: 3, title: "ইনস্টাগ্রাম মার্কেটিং কৌশল", completed: true, duration: "২৫ মিনিট" },
    { id: 4, title: "কন্টেন্ট ক্যালেন্ডার তৈরি", completed: false, duration: "৩০ মিনিট" },
    { id: 5, title: "অডিয়েন্স এনগেজমেন্ট", completed: false, duration: "২০ মিনিট" },
    { id: 6, title: "পার্ফরম্যান্স ট্র্যাকিং", completed: false, duration: "২৫ মিনিট" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-lg">ডিজিটাল মার্কেটিং মাস্টারক্লাস</h1>
              <p className="text-sm text-muted-foreground">মডিউল ২ - সোশ্যাল মিডিয়া মার্কেটিং</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">মোট অগ্রগতি</div>
              <div className="font-bold text-lg">৬৫%</div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Module List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-bold">সব মডিউল</h2>
            <div className="space-y-3">
              {modules.map((module) => (
                <Card
                  key={module.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedModule === module.id
                      ? "border-primary shadow-md"
                      : module.locked
                      ? "opacity-60"
                      : "card-hover"
                  }`}
                  onClick={() => !module.locked && setSelectedModule(module.id)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-tight">{module.title}</h3>
                      {module.status === "completed" ? (
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                      ) : module.locked ? (
                        <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <Play className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{module.completedChapters}/{module.chapters} অধ্যায়</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {module.points}
                      </span>
                    </div>

                    {!module.locked && (
                      <Progress value={module.progress} className="h-1.5" />
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Overall Progress Card */}
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Star className="w-5 h-5 text-accent" />
                সামগ্রিক অগ্রগতি
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>সম্পন্ন: ৮/১২ মডিউল</span>
                  <span className="font-semibold">৬৫%</span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground">
                আরও ৪টি মডিউল সম্পন্ন করলে সার্টিফিকেট পাবেন!
              </p>
            </Card>
          </div>

          {/* Chapter Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Badge className="bg-primary/10 text-primary">চলমান</Badge>
                  <h2 className="text-2xl font-bold">সোশ্যাল মিডিয়া মার্কেটিং</h2>
                  <p className="text-muted-foreground">
                    বিভিন্ন সোশ্যাল মিডিয়া প্ল্যাটফর্মে মার্কেটিং কৌশল শিখুন
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">৬</div>
                  <div className="text-sm text-muted-foreground">অধ্যায়</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">৩</div>
                  <div className="text-sm text-muted-foreground">সম্পন্ন</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">১২০</div>
                  <div className="text-sm text-muted-foreground">পয়েন্ট</div>
                </div>
              </div>

              <Progress value={60} className="h-3" />
            </Card>

            {/* Chapters List */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold">অধ্যায়সমূহ</h3>
              <div className="space-y-3">
                {chapters.map((chapter, index) => (
                  <Card
                    key={chapter.id}
                    className={`p-5 card-hover cursor-pointer ${
                      chapter.completed ? "bg-success/5 border-success/20" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          chapter.completed
                            ? "bg-success/20 text-success"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {chapter.completed ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <span className="font-bold">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{chapter.title}</h4>
                        <p className="text-sm text-muted-foreground">{chapter.duration}</p>
                      </div>
                      <Button
                        variant={chapter.completed ? "outline" : "default"}
                        className={!chapter.completed ? "btn-hero" : ""}
                      >
                        {chapter.completed ? "পুনরায় দেখুন" : "শুরু করুন"}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Practice & Quiz Section */}
            <Card className="p-6 space-y-4 bg-gradient-to-br from-accent/10 to-primary/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">প্র্যাকটিস ও কুইজ</h3>
                  <p className="text-sm text-muted-foreground">
                    সব অধ্যায় সম্পন্ন করুন, তারপর কুইজে অংশ নিন
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1 btn-success" disabled>
                  প্র্যাকটিস শুরু করুন
                  <Lock className="w-4 h-4 ml-2" />
                </Button>
                <Button className="flex-1" variant="outline" disabled>
                  চূড়ান্ত কুইজ
                  <Lock className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                সব অধ্যায় সম্পন্ন করার পর এই বিভাগ আনলক হবে
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learning;
