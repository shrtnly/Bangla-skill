import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Eye, FileText, FileImage, File, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun, Menu, LogOut, Languages, BookOpen, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface Resource {
  id: string;
  module_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
}

interface Module {
  id: string;
  title: string;
  resources: Resource[];
}

const Resources = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const courseId = searchParams.get("courseId");
  const [loading, setLoading] = useState(true);
  const [courseTitle, setCourseTitle] = useState("");
  const [modulesWithResources, setModulesWithResources] = useState<Module[]>([]);

  useEffect(() => {
    if (!courseId) {
      toast.error("Course ID is missing.");
      navigate("/dashboard");
      return;
    }

    const fetchCourseAndResources = async () => {
      setLoading(true);
      try {
        // Fetch course title
        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select("title")
          .eq("id", courseId)
          .single();

        if (courseError) throw courseError;
        setCourseTitle(courseData.title);

        // Fetch modules for the course
        const { data: modulesData, error: modulesError } = await supabase
          .from("modules")
          .select("id, title")
          .eq("course_id", courseId)
          .order("order_index");

        if (modulesError) throw modulesError;

        const modulesWithFetchedResources: Module[] = [];
        for (const module of modulesData || []) {
          // Fetch resources for each module
          const { data: resourcesData, error: resourcesError } = await supabase
            .from("module_resources")
            .select("id, file_name, file_url, file_type")
            .eq("module_id", module.id);

          if (resourcesError) throw resourcesError;

          if (resourcesData && resourcesData.length > 0) {
            modulesWithFetchedResources.push({
              id: module.id,
              title: module.title,
              resources: resourcesData,
            });
          }
        }
        setModulesWithResources(modulesWithFetchedResources);
      } catch (error: any) {
        console.error("Error fetching course resources:", error.message);
        toast.error("কোর্সের রিসোর্স লোড করতে সমস্যা হয়েছে।");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndResources();
  }, [courseId, navigate]);

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return <FileText className="w-5 h-5" />;
    if (fileType.includes("image")) return <FileImage className="w-5 h-5" />;
    // Add more file type checks as needed
    return <File className="w-5 h-5" />;
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    window.open(fileUrl, "_blank"); // Opens in new tab, browser usually handles download/preview
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

  const translations = {
    myCourses: "আমার কোর্স",
    learning: "শিখন",
    myProfile: "আমার প্রোফাইল",
    logout: "লগআউট",
  };
  const t = translations; // Using placeholder translations for now

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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hover:text-[#7b4dc4] hover:bg-[#895cd6]/10"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-[#895cd6] hover:scale-110" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#f5812e] hover:scale-110" />
            </Button>
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
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          ফিরে যান
        </Button>

        <h1 className="text-3xl font-bold text-[#895cd6] mb-8">
          {courseTitle ? `${courseTitle} এর রিসোর্স` : "কোর্স রিসোর্স"}
        </h1>

        {modulesWithResources.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">এই কোর্সের জন্য কোনো রিসোর্স পাওয়া যায়নি।</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {modulesWithResources.map((module) => (
              <Card key={module.id} className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl text-[#895cd6]">মডিউল: {module.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {module.resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center justify-between p-4 border rounded-md shadow-sm dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(resource.file_type)}
                        <span className="font-medium">{resource.file_name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(resource.file_url, resource.file_name)}
                          className="text-[#895cd6] border-[#895cd6] hover:bg-[#895cd6] hover:text-white"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          ডাউনলোড
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Resources;
