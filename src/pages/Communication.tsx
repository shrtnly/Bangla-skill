// src/pages/Communication.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import MobileMenu from "@/components/MobileMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  User,
  Moon,
  Sun,
  Languages,
  Send,
  MessageSquare,
  Users,
  HelpCircle,
  Info,
} from "lucide-react";
import { motion } from "framer-motion";

const translations = {
  bn: {
    Communication: "যোগাযোগ",
    logoutSuccess: "লগ আউট সফল হয়েছে",
    logoutError: "লগ আউট করতে সমস্যা হয়েছে",
    profile: "প্রোফাইল",
    logout: "লগ আউট",
  },
  en: {
    Communication: "Communication",
    logoutSuccess: "Logout successful",
    logoutError: "Failed to logout",
    profile: "Profile",
    logout: "Logout",
  },
};

const MotionCard = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
    transition={{ duration: 0.3 }}
    viewport={{ once: true }}
    className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-2xl border border-gray-200/40 dark:border-gray-800/40 p-6 shadow-sm hover:shadow-lg transition-all"
  >
    {children}
  </motion.div>
);

const Communication = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<any>(null);
  const [language, setLanguage] = useState<"bn" | "en">("bn");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const t = translations[language];

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      setProfile(data);
    };
    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(t.logoutSuccess);
    } catch {
      toast.error(t.logoutError);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-md bg-white/70 dark:bg-gray-950/70">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-12 h-12 rounded-full bg-[#895cd6] flex items-center justify-center text-white font-bold text-xl shadow-md">
              O
            </div>
            <span className="text-2xl font-bold text-[#895cd6]">
              
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setLanguage((prev) => (prev === "bn" ? "en" : "bn"))
              }
              className="text-[#895cd6] hover:bg-[#895cd6]/10 hover:text-[#7b4dc4]"
            >
              <Languages className="h-6 w-6 mr-1" />
              {language === "bn" ? "EN" : "বাং"}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative hover:bg-[#895cd6]/10"
            >
              <Sun className="h-6 w-6 text-[#895cd6] dark:hidden" />
              <Moon className="h-6 w-6 text-[#895cd6] hidden dark:block" />
            </Button>

            <div className="hidden lg:flex">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer w-10 h-10 hover:ring-2 hover:ring-[#895cd6]/40 transition">
                    <AvatarImage src="/avatar.png" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="w-5 h-5 mr-2 text-[#895cd6]" />
                    {t.profile}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-5 h-5 mr-2 text-red-500" />
                    {t.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <MobileMenu t={t} handleSignOut={handleSignOut} />
          </div>
        </div>
      </header>

      <div className="flex">
        <Sidebar onCollapseChange={setIsSidebarCollapsed} />
        <main
          className={`flex-1 p-6 transition-all duration-300 ${
            isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          <div className="max-w-7xl mx-auto">
            <header className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                {t.Communication} Hub
              </h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                Connect, collaborate, and get help — all in one interactive
                space.
              </p>
            </header>

            <div className="grid gap-8 md:grid-cols-2">
              <MotionCard>
                <div className="flex items-center gap-3 mb-3">
                  <Send className="text-blue-600 w-6 h-6" />
                  <h2 className="text-lg font-semibold dark:text-white">
                    Ask a Question
                  </h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Have a question for the admin or instructor? Write it here and
                  we’ll forward it directly.
                </p>
                <textarea
                  rows={4}
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none mb-4"
                  placeholder="Type your question..."
                />
                <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  Send to Authority
                </Button>
              </MotionCard>

              <MotionCard>
                <div className="flex items-center gap-3 mb-3">
                  <MessageSquare className="text-green-600 w-6 h-6" />
                  <h2 className="text-lg font-semibold dark:text-white">
                    Live Chat Support
                  </h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Need quick help? Start a live chat with our support team.
                </p>
                <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                  Start Live Chat
                </Button>
                <p className="text-sm mt-3 text-gray-500 dark:text-gray-400">
                  💬 Typically responds within a few minutes.
                </p>
              </MotionCard>

              <MotionCard>
                <div className="flex items-center gap-3 mb-3">
                  <Users className="text-purple-600 w-6 h-6" />
                  <h2 className="text-lg font-semibold dark:text-white">
                    Join the Community
                  </h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Connect with peers, share insights, and grow together.
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                  Explore Forum
                </Button>
              </MotionCard>

              <MotionCard>
                <div className="flex items-center gap-3 mb-3">
                  <HelpCircle className="text-orange-500 w-6 h-6" />
                  <h2 className="text-lg font-semibold dark:text-white">
                    Help Resources
                  </h2>
                </div>
                <ul className="list-disc list-inside text-blue-700 dark:text-blue-400 space-y-1">
                  <li>
                    <a href="#" className="hover:underline">
                      FAQs & Troubleshooting
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:underline">
                      User Guides
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:underline">
                      Video Tutorials
                    </a>
                  </li>
                </ul>
              </MotionCard>
            </div>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 bg-white/70 dark:bg-gray-900/70 rounded-2xl border border-gray-200/40 dark:border-gray-800/40 p-6 shadow-sm backdrop-blur-md"
            >
              <div className="flex items-center gap-3 mb-3">
                <Info className="text-indigo-500 w-6 h-6" />
                <h2 className="text-lg font-semibold dark:text-white">
                  Announcements
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Stay updated with new features, courses, and community events.
              </p>
            </motion.section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Communication;
