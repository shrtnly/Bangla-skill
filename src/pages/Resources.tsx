import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ChevronRight, ArrowLeft, Loader2, Moon, Sun, User, Menu, LogOut, FileText, Image, Film, FileInput, LinkIcon, FileArchive, FileSpreadsheet, FileAudio, Download } from "lucide-react"; // Added Download icon
import { useNavigate, useParams } from "react-router-dom";
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
  const { courseId } = useParams<{ courseId: string }>();

  const [loading, setLoading] = useState(true);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Used to re-fetch data

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails(courseId);
      fetchModules(courseId);
    }
  }, [courseId, refreshTrigger]); // Add refreshTrigger to dependencies

  useEffect(() => {
    if (selectedModuleId) {
      fetchResourcesForModule(selectedModuleId);
    }
  }, [selectedModuleId, refreshTrigger]); // Add refreshTrigger to dependencies

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

      if (modulesData && modulesData.length > 0 && !selectedModuleId) {
        setSelectedModuleId(modulesData[0].id); // Select the first module by default if none selected
      }

    } catch (error: any) {
      console.error("Error fetching modules:", error.message);
      toast.error("মডিউল লোড করতে সমস্যা হয়েছে");
    } finally {
        setLoading(false);
    }
  };

  const fetchResourcesForModule = async (moduleId: string) => {
    try {
        setLoading(true);
        const { data, error } = await supabase
            .from("resources")
            .select("id, title, description, url, file_type, mime_type") // Select all relevant columns
            .eq("module_id", moduleId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        setResources(data || []);
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
                onClick={() => navigate("/Dashboard")}
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
                onClick={() => navigate("/Resources")}
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
                    <h2 className="text-2xl font-bold">{selectedCourse?.title}</h2>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <label className="font-medium">{t.modules}:</label>
                <Select onValueChange={setSelectedModuleId} value={selectedModuleId || undefined}>
                    <SelectTrigger className="w-[240px]">
                        <SelectValue placeholder="মডিউল নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                        {modules.map((module) => (
                            <SelectItem key={module.id} value={module.id}>
                                {module.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-4">
                {resources.length === 0 ? (
                    <Card className="p-12 text-center">
                        <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">{t.noResources}</p>
                    </Card>
                ) : (
                    resources.map((resource) => {
                        return (
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
                        );
                    })
                )}
            </div>

            {/* Integrate the ResourceUploader component here */}
            {selectedModuleId && user && (
                <>
                    <Separator className="my-6" />
                    <ResourceUploader moduleId={selectedModuleId} onResourceUploaded={handleResourceUploaded} />
                </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;
