import { useState, useEffect } from "react";
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
  Star,
  Clock,
  Award,
  Loader2,
  Menu,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Mock API function - replace with actual API calls
const fetchCourseData = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    course: {
      id: 1,
      title: "ডিজিটাল মার্কেটিং মাস্টারক্লাস",
      description: "ডিজিটাল মার্কেটিং এর সকল দিক নিয়ে বিস্তারিত আলোচনা",
      totalModules: 4,
      totalPoints: 550
    },
    modules: [
      {
        id: 1,
        title: "মডিউল ১: ডিজিটাল মার্কেটিং পরিচিতি",
        description: "ডিজিটাল মার্কেটিং এর মৌলিক ধারণা এবং গুরুত্ব",
        status: "completed",
        progress: 100,
        chapters: 5,
        completedChapters: 5,
        locked: false,
        points: 100,
        duration: "২ ঘণ্টা ৩০ মিনিট"
      },
      {
        id: 2,
        title: "মডিউল ২: সোশ্যাল মিডিয়া মার্কেটিং",
        description: "বিভিন্ন সোশ্যাল মিডিয়া প্ল্যাটফর্মে মার্কেটিং কৌশল",
        status: "in-progress",
        progress: 60,
        chapters: 6,
        completedChapters: 3,
        locked: false,
        points: 120,
        duration: "৩ ঘণ্টা"
      },
      {
        id: 3,
        title: "মডিউল ৩: কন্টেন্ট মার্কেটিং স্ট্র্যাটেজি",
        description: "কার্যকর কন্টেন্ট তৈরি এবং মার্কেটিং কৌশল",
        status: "locked",
        progress: 0,
        chapters: 7,
        completedChapters: 0,
        locked: true,
        points: 150,
        duration: "৩ ঘণ্টা ৩০ মিনিট"
      },
      {
        id: 4,
        title: "মডিউল ৪: SEO এবং SEM",
        description: "সার্চ ইঞ্জিন অপ্টিমাইজেশন এবং মার্কেটিং",
        status: "locked",
        progress: 0,
        chapters: 8,
        completedChapters: 0,
        locked: true,
        points: 180,
        duration: "৪ ঘণ্টা"
      },
    ]
  };
};

// Mock API function to fetch chapters for a module
const fetchModuleChapters = async (moduleId: number) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (moduleId === 1) {
    return [
      { id: 1, title: "ডিজিটাল মার্কেটিং পরিচিতি", completed: true, duration: "২০ মিনিট" },
      { id: 2, title: "ডিজিটাল মার্কেটিং এর গুরুত্ব", completed: true, duration: "১৫ মিনিট" },
      { id: 3, title: "ডিজিটাল মার্কেটিং চ্যানেল", completed: true, duration: "২৫ মিনিট" },
      { id: 4, title: "টার্গেট অডিয়েন্স নির্ধারণ", completed: true, duration: "৩০ মিনিট" },
      { id: 5, title: "ডিজিটাল মার্কেটিং প্ল্যান", completed: true, duration: "৪০ মিনিট" },
    ];
  } else if (moduleId === 2) {
    return [
      { id: 1, title: "সোশ্যাল মিডিয়া কী এবং কেন?", completed: true, duration: "১৫ মিনিট" },
      { id: 2, title: "ফেসবুক মার্কেটিং বেসিক", completed: true, duration: "২০ মিনিট" },
      { id: 3, title: "ইনস্টাগ্রাম মার্কেটিং কৌশল", completed: true, duration: "২৫ মিনিট" },
      { id: 4, title: "কন্টেন্ট ক্যালেন্ডার তৈরি", completed: false, duration: "৩০ মিনিট" },
      { id: 5, title: "অডিয়েন্স এনগেজমেন্ট", completed: false, duration: "২০ মিনিট" },
      { id: 6, title: "পার্ফরম্যান্স ট্র্যাকিং", completed: false, duration: "২৫ মিনিট" },
    ];
  } else {
    // Return empty array for locked modules
    return [];
  }
};

const Learning = () => {
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [courseData, setCourseData] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'modules' | 'chapters'>('modules');

  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (!courseData || !courseData.modules) return 0;
    
    const totalProgress = courseData.modules.reduce((sum: number, module: any) => sum + module.progress, 0);
    return Math.round(totalProgress / courseData.modules.length);
  };

  // Calculate completed modules
  const calculateCompletedModules = () => {
    if (!courseData || !courseData.modules) return { completed: 0, total: 0 };
    
    const completed = courseData.modules.filter((module: any) => module.status === 'completed').length;
    return { completed, total: courseData.modules.length };
  };

  // Fetch course data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchCourseData();
        setCourseData(data);
        
        // Auto-select the first unlocked module
        const firstUnlockedModule = data.modules.find((module: any) => !module.locked);
        if (firstUnlockedModule) {
          setSelectedModule(firstUnlockedModule.id);
        }
      } catch (error) {
        console.error("Error loading course data:", error);
        toast.error("কোর্স ডেটা লোড করতে সমস্যা হয়েছে");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Fetch chapters when selected module changes
  useEffect(() => {
    if (selectedModule) {
      const loadChapters = async () => {
        try {
          setChaptersLoading(true);
          const chaptersData = await fetchModuleChapters(selectedModule);
          setChapters(chaptersData);
        } catch (error) {
          console.error("Error loading chapters:", error);
          toast.error("অধ্যায় লোড করতে সমস্যা হয়েছে");
        } finally {
          setChaptersLoading(false);
        }
      };
      
      loadChapters();
    }
  }, [selectedModule]);

  // Handle module selection
  const handleModuleSelect = (moduleId: number) => {
    const module = courseData.modules.find((m: any) => m.id === moduleId);
    if (module && !module.locked) {
      setSelectedModule(moduleId);
      setActiveTab('chapters');
      if (window.innerWidth < 1024) {
        setMobileMenuOpen(false);
      }
    } else {
      toast.error("এই মডিউলটি এখনও আনলক করা হয়নি");
    }
  };

  // Handle chapter navigation
  const handleChapterClick = (chapterId: number) => {
    navigate(`/chapter/${chapterId}`);
  };

  // Handle practice button click
  const handlePracticeClick = () => {
    const module = courseData.modules.find((m: any) => m.id === selectedModule);
    if (module && module.status === 'completed') {
      navigate(`/practice/${selectedModule}`);
    } else {
      toast.error("প্র্যাকটিস করার জন্য প্রথমে সব অধ্যায় সম্পন্ন করুন");
    }
  };

  // Handle quiz button click
  const handleQuizClick = () => {
    const module = courseData.modules.find((m: any) => m.id === selectedModule);
    if (module && module.status === 'completed') {
      navigate(`/quiz/${selectedModule}`);
    } else {
      toast.error("কুইজ দেওয়ার জন্য প্রথমে সব অধ্যায় সম্পন্ন করুন");
    }
  };

  // Get current module data
  const currentModule = selectedModule 
    ? courseData?.modules.find((m: any) => m.id === selectedModule)
    : null;

  // Calculate overall progress and completed modules
  const overallProgress = calculateOverallProgress();
  const { completed: completedModules, total: totalModules } = calculateCompletedModules();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">কোর্স ডেটা লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="font-bold text-lg">{courseData?.course.title}</h1>
              <p className="text-sm text-muted-foreground">
                {currentModule ? `মডিউল ${courseData.modules.findIndex((m: any) => m.id === selectedModule) + 1} - ${currentModule.title}` : "একটি মডিউল নির্বাচন করুন"}
              </p>
            </div>
          </div>
          
          {/* Mobile menu toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          
          {/* Overall progress - Desktop */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">মোট অগ্রগতি</div>
              <div className="font-bold text-lg">{overallProgress}%</div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Mobile Tab Navigation */}
        <div className="flex gap-2 mb-6 lg:hidden">
          <Button
            variant={activeTab === 'modules' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setActiveTab('modules')}
          >
            মডিউল
          </Button>
          <Button
            variant={activeTab === 'chapters' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setActiveTab('chapters')}
            disabled={!selectedModule}
          >
            অধ্যায়
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Module List - Desktop: Always visible, Mobile: Visible when modules tab is active */}
          <div className={`lg:col-span-1 space-y-4 ${activeTab === 'chapters' ? 'hidden lg:block' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">সব মডিউল</h2>
              {/* Overall progress - Mobile */}
              <div className="lg:hidden text-right">
                <div className="text-sm text-muted-foreground">মোট অগ্রগতি</div>
                <div className="font-bold text-lg">{overallProgress}%</div>
              </div>
            </div>
            
            <div className="space-y-3">
              {courseData?.modules.map((module: any) => (
                <Card
                  key={module.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedModule === module.id
                      ? "border-primary shadow-md"
                      : module.locked
                      ? "opacity-60"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => handleModuleSelect(module.id)}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-tight">{module.title}</h3>
                      {module.status === "completed" ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : module.locked ? (
                        <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <Play className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2">{module.description}</p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{module.duration}</span>
                      <span>•</span>
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
            <Card className="p-5 bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950/20 dark:to-pink-950/20 border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">সামগ্রিক অগ্রগতি</h3>
                  <div className="text-2xl font-bold mb-2">{completedModules}/{totalModules} মডিউল</div>
                  <Progress value={overallProgress} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    আরও {totalModules - completedModules}টি মডিউল সম্পন্ন করলে সার্টিফিকেট পাবেন!
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Chapter Content - Desktop: Always visible, Mobile: Visible when chapters tab is active */}
          <div className={`lg:col-span-2 space-y-6 ${activeTab === 'modules' ? 'hidden lg:block' : ''}`}>
            {currentModule ? (
              <>
                <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
                  <Badge className="mb-3 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    {currentModule.status === "completed" ? "সম্পন্ন" : 
                     currentModule.status === "in-progress" ? "চলমান" : "নতুন"}
                  </Badge>
                  <h2 className="text-2xl font-bold mb-2">{currentModule.title}</h2>
                  <p className="text-muted-foreground mb-4">{currentModule.description}</p>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <BookOpen className="w-6 h-6 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
                      <div className="text-sm font-semibold">{currentModule.chapters}</div>
                      <div className="text-xs text-muted-foreground">অধ্যায়</div>
                    </div>
                    <div className="text-center">
                      <Award className="w-6 h-6 mx-auto mb-1 text-green-600 dark:text-green-400" />
                      <div className="text-sm font-semibold">{currentModule.completedChapters}</div>
                      <div className="text-xs text-muted-foreground">সম্পন্ন</div>
                    </div>
                    <div className="text-center">
                      <Trophy className="w-6 h-6 mx-auto mb-1 text-orange-600 dark:text-orange-400" />
                      <div className="text-sm font-semibold">{currentModule.points}</div>
                      <div className="text-xs text-muted-foreground">পয়েন্ট</div>
                    </div>
                  </div>

                  <Progress value={currentModule.progress} className="h-3" />
                </Card>

                {/* Chapters List */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">অধ্যায়সমূহ</h3>
                  
                  {chaptersLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : chapters.length > 0 ? (
                    <div className="space-y-3">
                      {chapters.map((chapter, index) => (
                        <Card
                          key={chapter.id}
                          className={`p-5 transition-all ${
                            chapter.completed 
                              ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
                              : "hover:shadow-md cursor-pointer"
                          }`}
                          onClick={() => handleChapterClick(chapter.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                              chapter.completed
                                ? "bg-green-100 dark:bg-green-900/30"
                                : "bg-blue-100 dark:bg-blue-900/30"
                            }`}>
                              {chapter.completed ? (
                                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                              ) : (
                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                  {index + 1}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1">{chapter.title}</h4>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {chapter.duration}
                              </p>
                            </div>
                            <Button
                              variant={chapter.completed ? "outline" : "default"}
                              className={chapter.completed ? "text-green-600 dark:text-green-400" : "bg-blue-600 hover:bg-blue-700 text-white"}
                            >
                              {chapter.completed ? "পুনরায় দেখুন" : "শুরু করুন"}
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-8 text-center">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">এই মডিউলে কোনো অধ্যায় নেই</p>
                    </Card>
                  )}
                </div>

                {/* Practice & Quiz Section */}
                <Card className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">প্র্যাকটিস ও কুইজ</h3>
                      <p className="text-sm text-muted-foreground">
                        সব অধ্যায় শেষ করুন, তারপর অনুশীলন করুন এবং পরীক্ষা দিন
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={handlePracticeClick}
                      disabled={currentModule.status !== "completed"}
                    >
                      {currentModule.status === "completed" ? (
                        "প্র্যাকটিস শুরু করুন"
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          প্র্যাকটিস লক করা
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleQuizClick}
                      disabled={currentModule.status !== "completed"}
                    >
                      {currentModule.status === "completed" ? (
                        "চূড়ান্ত কুইজ"
                      ) : (
                        <>
                          চূড়ান্ত কুইজ
                          <Lock className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {currentModule.status !== "completed" && (
                    <p className="text-xs text-center text-muted-foreground mt-3">
                      সব অধ্যায় সম্পন্ন করার পর এই বিভাগ আনলক হবে
                    </p>
                  )}
                </Card>
              </>
            ) : (
              <Card className="p-8 text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">একটি মডিউল নির্বাচন করুন</h3>
                <p className="text-muted-foreground mb-4">
                  বাম দিকের মডিউল তালিকা থেকে একটি মডিউল নির্বাচন করুন
                </p>
                <Button onClick={() => setActiveTab('modules')} className="lg:hidden">
                  মডিউল দেখুন
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Learning;