import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/useTheme";
import { motion } from "framer-motion";
import {
  BookOpen,
  Award,
  Users,
  TrendingUp,
  Star,
  CheckCircle,
  Zap,
  Trophy,
  ArrowRight,
  Loader2,
  Sun,
  Moon,
  LayoutDashboard // Changed from UserCircle2 to LayoutDashboard
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .limit(4);

      if (error) throw error;

      setCourses(data || []);
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      setCourses([
        {
          id: "temp-1",
          title: "ডিজিটাল মার্কেটিং মাস্টারক্লাস",
          category: "জনপ্রিয়",
          badge: "trending",
          total_students: 2847,
          rating: 4.8,
          image_url:
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"
        },
        {
          id: "temp-2",
          title: "ওয়েব ডেভেলপমেন্ট সম্পূর্ণ গাইড",
          category: "নতুন",
          badge: "new",
          total_students: 1523,
          rating: 4.9,
          image_url:
            "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80"
        },
        {
          id: "temp-3",
          title: "গ্রাফিক্স ডিজাইন প্রফেশনাল",
          category: "সেরা",
          badge: "best",
          total_students: 3421,
          rating: 4.7,
          image_url:
            "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80"
        },
        {
          id: "temp-4",
          title: "ডেটা সায়েন্স ফান্ডামেন্টাল",
          category: "জনপ্রিয়",
          badge: "trending",
          total_students: 1876,
          rating: 4.6,
          image_url:
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: BookOpen,
      title: "বাংলায় শিখুন",
      description: "সম্পূর্ণ বাংলা ভাষায় মানসম্পন্ন শিক্ষা উপকরণ"
    },
    {
      icon: Award,
      title: "সার্টিফিকেট পান",
      description: "শিখন সম্পন্ন করে পেশাদার সার্টিফিকেট অর্জন করুন"
    },
    {
      icon: Zap,
      title: "ইন্টারেক্টিভ কুইজ",
      description: "বাস্তব সময়ে পরীক্ষা দিয়ে দক্ষতা যাচাই করুন"
    },
    {
      icon: Trophy,
      title: "রিওয়ার্ড সিস্টেম",
      description: "পয়েন্ট ও অর্জন দিয়ে শিক্ষার যাত্রা উপভোগ করুন"
    }
  ];

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      toast({
        title: "লগইন প্রয়োজন",
        description: "কোর্সে ভর্তি হতে প্রথমে লগইন করুন",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    try {
      const { data: existing, error: checkError } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        toast({
          title: "ইতিমধ্যে ভর্তি",
          description: "আপনি ইতিমধ্যে এই কোর্সে ভর্তি হয়েছেন"
        });
        navigate("/learning");
        return;
      }

      const { error } = await supabase.from("enrollments").insert({
        user_id: user.id,
        course_id: courseId
      });

      if (error) throw error;

      toast({
        title: "ভর্তি সফল!",
        description: "আপনি সফলভাবে কোর্সে ভর্তি হয়েছেন"
      });

      navigate("/learning");
    } catch (error: any) {
      toast({
        title: "ত্রুটি",
        description: error.message || "ভর্তি করতে সমস্যা হয়েছে",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">প্ল্যাটফর্ম</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-[#895cd6]" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            {user ? (
              <Button
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-[#e4792d] dark:hover:bg-[#e4792d] rounded-md"
              >
                <LayoutDashboard className="h-5 w-5" />
                ড্যাশবোর্ড
              </Button>
            ) : (
              <Button onClick={() => navigate("/auth")}
               className="btn-hero">
                লগইন করুন
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}

      <section className="container mx-auto px-4 py-10 lg:py-32 text-center overflow-x-hidden relative bg-hero-image bg-cover bg-center">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <motion.div
        animate={{
          y: [0, -0, 0, 0, 0], // up and down movement
          rotate: [-9, 0, -9],    // subtle rotation
        }}
        transition={{
          duration: 5,             // full cycle duration
          repeat: Infinity,        // loop forever
          ease: "easeInOut",
        }}
      >
        <Badge className="bg-accent/10 text-accent border-accent/20 hover:bg-accent/20 relative z-10">
          সময় কম, আগ্রহ বেশি?
        </Badge>
      </motion.div>

        <h1 className="text-4xl md:text-6xl font-bold leading-snug mt-4 relative z-10 text-white">
  সহজে ও বিনা মূল্যে{" "}
  <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-normal">
    দক্ষ হওয়ার আকর্ষণীয় পদ্ধতি!
  </span>
</h1>

        <p className="text-lg md:text-xl text-white opacity-90 max-w-2xl mx-auto mt-4 relative z-10">
        শিখতে থাকুন যখন খুশি, যেখানে খুশি — সহজ, মজার এবং কার্যকর উপায়ে।
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 relative z-10">
          <Button
            size="lg"
            className="btn-hero text-lg"
            onClick={() => navigate("/auth")}
          >
            শিখতে শুরু করুন
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
         
         {/*
          <Button size="lg" variant="outline" className="text-lg">
            কোর্স দেখুন
          </Button>
       */}


</div>
</section>

      {/* Featured Courses */}
      <section className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
          পছন্দের বিষয় যুক্ত করুন
          </h2>
          <p className="text-muted-foreground text-lg">
          নিজের শেখার তালিকায় পছন্দের প্রোগ্রাম যোগ করুন এবং শেখা শুরু করুন।
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course, index) => (
              <Card
                key={course.id}
                className="overflow-hidden card-hover cursor-pointer animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate("/dashboard")}
              >
                <div className="relative h-48">
                  <img
                    src={
                      course.image_url ||
                      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"
                    }
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge
                    className={`absolute top-3 right-3 ${
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
                <div className="p-5 space-y-3">
                  <h3 className="font-semibold text-lg line-clamp-2">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.total_students || 0}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-accent text-accent" />
                      {course.rating || 0}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnroll(course.id);
                    }}
                    className="w-full bg-primary text-white hover:bg-primary/90 font-medium"
                  >
                    যুক্ত করুন
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="bg-secondary/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              কেন আমাদের বেছে নিবেন?
            </h2>
            <p className="text-muted-foreground text-lg">
              আপনার শিক্ষার যাত্রা সহজ ও কার্যকর করতে
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 text-center space-y-4 card-hover animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="relative overflow-hidden bg-gradient-to-r from-primary to-primary-glow p-12 md:p-16 text-center text-white">
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              আজই শুরু করুন আপনার শিক্ষার যাত্রা
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              বিনামূল্যে রেজিস্ট্রেশন করুন এবং অ্যাক্সেস পান হাজারো মানসম্পন্ন কোর্সে
            </p>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 text-lg font-semibold"
              onClick={() => navigate("/auth")}
            >
              <CheckCircle className="mr-2 w-5 h-5" />
              বিনামূল্যে শুরু করুন
            </Button>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold">শিক্ষা প্ল্যাটফর্ম</span>
              </div>
              <p className="text-sm text-muted-foreground">
                বাংলায় সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">সম্পর্কে</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>আমাদের সম্পর্কে</li>
                <li>যোগাযোগ</li>
                <li>ক্যারিয়ার</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">সহায়তা</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>হেল্প সেন্টার</li>
                <li>শর্তাবলী</li>
                <li>গোপনীয়তা</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">সোশ্যাল</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>ফেসবুক</li>
                <li>ইউটিউব</li>
                <li>লিংকডইন</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© ২০২৫ শিক্ষা প্ল্যাটফর্ম। সর্বস্বত্ব সংরক্ষিত।</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;