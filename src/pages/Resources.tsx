import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ChevronRight, ArrowLeft, Loader2, Moon, Sun, User, Menu, LogOut, FileText, Image, Film, FileInput, LinkIcon, FileArchive, FileSpreadsheet, FileAudio, Download } from "lucide-react"; // Added Download icon
import { useNavigate, useSearchParams } from "react-router-dom"; // Use setSearchParams to update URL
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import ResourceUploader from "@/components/ResourceUploader"; // Import the new uploader component
import { Separator } from "@/components/ui/separator"; // For visual separation

const Resources = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams(); // Use setSearchParams to update URL
  const courseId = searchParams.get("courseId"); // Get courseId from query params

  const [loading, setLoading] = useState(true);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>("all"); // Default to "all"
  const [modules, setModules] = useState<any[]>([]);
  const [groupedResources, setGroupedResources] = useState<Record<string, any[]>>({});
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]); // State for enrolled courses
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Used to re-fetch data

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setEnrolledCourses([]);
        return;
      }

      try {
        // Fetch enrolled courses
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
            .from("enrollments")
            .select(`*, courses (*)`)
            .eq("user_id", user.id);
        
        if (enrollmentsError) throw enrollmentsError;
        const courses = enrollmentsData?.map(enrollment => enrollment.courses) || [];
        setEnrolledCourses(courses);

        // Set default courseId if none is in URL and courses are available
        if (!courseId && courses.length > 0) {
            setSearchParams({ courseId: courses[0].id }, { replace: true }); // Use replace to avoid extra history entries
            return; // Exit to let the URL change trigger next effects
        }

        if (courseId) {
          fetchCourseDetails(courseId);
          fetchModules(courseId);
        }

      } catch (error: any) {
          console.error("Error in initial data fetch:", error.message);
          toast.error("ডেটা লোড করতে সমস্যা হয়েছে");
      }
    };

    fetchData();
  }, [user, courseId, refreshTrigger, setSearchParams]); // Dependencies for this combined effect

  useEffect(() => {
    if (courseId) {
      fetchResources(courseId, selectedModuleId); // Pass courseId and selectedModuleId
    } else {
      setGroupedResources({}); // Clear resources if no course is selected
      setLoading(false);
    }
  }, [selectedModuleId, refreshTrigger, courseId]);

  const fetchCourseDetails = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title") // Only select necessary fields
        .eq("id", courseId)
        .single();

      if (error) throw error;
      setSelectedCourse(data);
    } catch (error: any) {
      console.error("Error fetching course details:", error.message);
      toast.error("কোর্স বিস্তারিত লোড করতে সমস্যা হয়েছে");
    }
  };

  const fetchModules = async (courseId: string) => {
    try {
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("id, title, order_index") // Only select necessary fields
        .eq("course_id", courseId)
        .order("order_index");

      if (modulesError) throw modulesError;
      setModules(modulesData || []);

    } catch (error: any) {
      console.error("Error fetching modules:", error.message);
      toast.error("মডিউল লোড করতে সমস্যা হয়েছে");
    }
  };

  const fetchResources = async (currentCourseId: string, currentModuleId: string | null) => {
    try {
        setLoading(true);
        let resourcesQuery = supabase
            .from("resources")
            .select("id, title, description, url, file_type, mime_type, module_id");

        let targetModuleIds: string[] = [];

        if (currentModuleId === "all") {
            const { data: modulesInCourse, error: modulesError } = await supabase
                .from("modules")
                .select("id")
                .eq("course_id", currentCourseId);

            if (modulesError) throw modulesError;
            targetModuleIds = modulesInCourse?.map(module => module.id) || [];

            if (targetModuleIds.length > 0) {
                resourcesQuery = resourcesQuery.in("module_id", targetModuleIds);
            } else {
                setGroupedResources({});
                setLoading(false);
                return;
            }
        } else if (currentModuleId) {
            resourcesQuery = resourcesQuery.eq("module_id", currentModuleId);
        } else {
            setGroupedResources({});
            setLoading(false);
            return;
        }

        const { data: fetchedResources, error: resourcesError } = await resourcesQuery.order("created_at", { ascending: false });

        if (resourcesError) throw resourcesError;

        const grouped: Record<string, any[]> = {};
        if (fetchedResources) {
          fetchedResources.forEach(resource => {
            if (!grouped[resource.module_id]) {
              grouped[resource.module_id] = [];
            }
            grouped[resource.module_id].push(resource);
          });
        }
        setGroupedResources(grouped);

    } catch (error: any) {
        console.error("Error fetching resources:", error.message);
        toast.error("রিসোর্স লোড করতে সমস্যা হয়েছে");
    } finally {
        setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("সাইন আউট করতে সমস্যা হয়েছে");
    }
  };

  // Callback function for when a resource is successfully uploaded
  const handleResourceUploaded = () => {
    setRefreshTrigger(prev => prev + 1); // Increment to trigger re-fetch in useEffects
  };

  // Helper to get an icon based on file_type
  const getFileIcon = (fileType: string) => {
    const lowerCaseFileType = fileType.toLowerCase(); // Convert to lowercase
    switch (lowerCaseFileType) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />;
      case 'image': return <Image className="w-5 h-5 text-blue-500 flex-shrink-0" />;
      case 'link': return <LinkIcon className="w-5 h-5 text-green-500 flex-shrink-0" />;
      case 'docx': return <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />; 
      case 'xlsx': return <FileSpreadsheet className="w-5 h-5 text-green-700 flex-shrink-0" />;
      case 'video': return <Film className="w-5 h-5 text-purple-500 flex-shrink-0" />;
      case 'audio': return <FileAudio className="w-5 h-5 text-yellow-500 flex-shrink-0" />;
      default: return <FileInput className="w-5 h-5 text-gray-500 flex-shrink-0" />; 
    }
  };

  // Determine if a resource type is downloadable
  const isDownloadable = (fileType: string) => {
    return ['pdf', 'docx', 'xlsx', 'image', 'video', 'audio', 'text', 'other'].includes(fileType.toLowerCase()); // Convert to lowercase
  };

  // Placeholder for translation object (t)
  const t = {
    myCourses: "আমার কোর্স",
    learning: "শিখন",
    myProfile: "আমার প্রোফাইল",
    logout: "লগআউট",
    modules: "মডিউলসমূহ",
    resources: "রিসোর্স",
    noResources: "এই মডিউলে কোনো রিসোর্স নেই",
    view: "দেখুন",
    download: "ডাউনলোড করুন",
    allModules: "সব মডিউল", // New translation key
    courses: "কোর্সসমূহ", // New translation key
  };

  // Prepare modules for rendering, ensuring "All Modules" is handled correctly
  const modulesToRender = selectedModuleId === "all" ? modules : modules.filter(m => m.id === selectedModuleId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <header className="border-b bg-white dark:bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-10 h-10 rounded-full bg-[#895cd6] flex items-center justify-center text-white font-bold text-lg">
              O
            </div>
            <span className="text-xl font-bold text-[#895cd6]">Learn</span>
          </div>
          <div className="flex items-center gap-0">
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
            {/* Mobile menu trigger */}
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

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 hidden lg:block"> 
            <Card className="p-4 space-y-2">
            <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-gray-800 hover:text-[#7b4dc4] hover:bg-[#895cd6]/10 dark:text-white"
                onClick={() => navigate("/learning")} 
              >
                <BookOpen className="w-5 h-5" />
                আমার কোর্স
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-gray-800 hover:text-[#7b4dc4] hover:bg-[#895cd6]/10 dark:text-white"
                onClick={() => navigate("/dashboard")}
              >
                <User className="w-5 h-5" />
                ড্যাশবোর্ড
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-gray-800 hover:text-[#7b4dc4] hover:bg-[#895cd6]/10 dark:text-white"
                onClick={() => navigate("/profile")}
              >
                <User className="w-5 h-5" />
                আমার প্রোফাইল
              </Button>
              <Button
                variant="default"
                className="w-full justify-start gap-2 text-gray-800 hover:text-[#7b4dc4] hover:bg-[#895cd6]/10 dark:text-white"
                onClick={() => navigate(`/resources?courseId=${courseId}`)} 
              >
                <User className="w-5 h-5" />
                রিসোর্স
              </Button>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Button
                    variant="ghost"
                    onClick={() => navigate('/learning')} 
                    className="mb-2"
                    >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    কোর্স তালিকায় ফিরে যান
                    </Button>
                    <h2 className="2xl font-bold">{selectedCourse?.title}</h2>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <label className="font-medium">{t.courses}:</label>
                <Select 
                    onValueChange={(newCourseId) => setSearchParams({ courseId: newCourseId })}
                    value={courseId || undefined}
                >
                    <SelectTrigger className="w-[240px]">
                        <SelectValue placeholder="কোর্স নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                        {enrolledCourses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                                {course.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <label className="font-medium">{t.modules}:</label>
                <Select onValueChange={setSelectedModuleId} value={selectedModuleId || undefined}>
                    <SelectTrigger className="w-[240px]">
                        <SelectValue placeholder="মডিউল নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem key="all" value="all">
                            {t.allModules}
                        </SelectItem>
                        {modules.map((module) => (
                            <SelectItem key={module.id} value={module.id}>
                                {module.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-4">
                {Object.keys(groupedResources).length === 0 && selectedModuleId !== "all" && !loading ? (
                    <Card className="p-12 text-center">
                        <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">{t.noResources}</p>
                    </Card>
                ) : ( 
                    modulesToRender.map((module) => {
                        const moduleResources = groupedResources[module.id] || [];
                        // Only render module cards if they have resources or if "All Modules" is selected
                        if (moduleResources.length === 0 && selectedModuleId !== "all") return null;
                        
                        return (
                            <Card key={module.id} className="p-4 space-y-4">
                                <h3 className="text-lg font-bold">{module.title} (Module {module.order_index})</h3>
                                {moduleResources.length === 0 ? (
                                  <p className="text-muted-foreground">{t.noResources} for this module.</p>
                                ) : (
                                  moduleResources.map((resource) => (
                                      <Card key={resource.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                          <div className="flex items-center gap-3 flex-1">
                                              {getFileIcon(resource.file_type)}
                                              <div className="flex-1">
                                                  <h3 className="font-semibold text-lg leading-tight">{resource.title}</h3>
                                                  {resource.description && <p className="text-muted-foreground text-sm">{resource.description}</p>}
                                              </div>
                                          </div>
                                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                              <Button 
                                                onClick={() => window.open(resource.url, '_blank')}
                                                className="flex-1 sm:flex-none bg-[#895cd6] hover:bg-[#7b4dc4] text-white"
                                              >
                                                  {t.view}
                                                  <ChevronRight className="w-4 h-4 ml-2" />
                                              </Button>
                                              {isDownloadable(resource.file_type) && (
                                                  <a 
                                                    href={`${resource.url}?download=`}
                                                    download={resource.title || 'resource'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 sm:flex-none"
                                                  >
                                                      <Button variant="outline" className="w-full border-[#f5812e] text-[#f5812e] hover:bg-[#f5812e] hover:text-white">
                                                          {t.download}
                                                          <Download className="w-4 h-4 ml-2" />
                                                      </Button>
                                                  </a>
                                              )}
                                          </div>
                                      </Card>
                                  ))
                                )}
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Integrate the ResourceUploader component here */}
            {selectedModuleId && user && (
                <>
                    <Separator className="my-6" />
                    <ResourceUploader moduleId={selectedModuleId !== "all" ? selectedModuleId : null} onResourceUploaded={handleResourceUploaded} />
                </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;
