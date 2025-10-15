import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Mail, Phone, Chrome } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("সঠিক ইমেইল লিখুন"),
  fullName: z.string().min(2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে"),
});

const phoneSchema = z.object({
  phone: z.string().regex(/^01[0-9]{9}$/, "সঠিক ফোন নম্বর লিখুন (০১ দিয়ে শুরু, ১১ ডিজিট)"),
  fullName: z.string().min(2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে"),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const fullName = formData.get("name") as string;
    const password = formData.get("password") as string;

    try {
      // Validate input only for signup with fullName, signin only needs email
      if (authMode === "signup") {
        emailSchema.parse({ email, fullName });
      } else {
        z.object({ email: z.string().email("সঠিক ইমেইল লিখুন") }).parse({ email });
      }

      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;
        toast.success("রেজিস্ট্রেশন সফল! ড্যাশবোর্ডে যাচ্ছেন...");
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("লগইন সফল হয়েছে!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
      } else if (error.message?.includes("Invalid login credentials")) {
        toast.error("ভুল ইমেইল বা পাসওয়ার্ড");
      } else if (error.message?.includes("already registered")) {
        toast.error("এই ইমেইল দিয়ে ইতিমধ্যে একাউন্ট আছে");
      } else {
        toast.error(error.message || "একটি সমস্যা হয়েছে");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const phone = formData.get("phone") as string;
    const fullName = formData.get("name-phone") as string;

    try {
      // Validate input
      phoneSchema.parse({ phone, fullName });

      // Convert to international format
      const formattedPhone = `+88${phone}`;

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      toast.success("OTP পাঠানো হয়েছে! আপনার ফোনে চেক করুন");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
      } else {
        toast.error(error.message || "OTP পাঠাতে সমস্যা হয়েছে");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Google লগইনে সমস্যা হয়েছে");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 animate-scale-in">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">শিক্ষা প্ল্যাটফর্মে স্বাগতম</h1>
          <p className="text-muted-foreground">লগইন করুন এবং শিখতে শুরু করুন</p>
        </div>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">ইমেইল</TabsTrigger>
            <TabsTrigger value="phone">ফোন</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4 mt-6">
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant={authMode === "signup" ? "default" : "outline"}
                onClick={() => setAuthMode("signup")}
                className="flex-1"
              >
                সাইন আপ
              </Button>
              <Button
                type="button"
                variant={authMode === "signin" ? "default" : "outline"}
                onClick={() => setAuthMode("signin")}
                className="flex-1"
              >
                লগইন
              </Button>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">ইমেইল</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              {authMode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">আপনার নাম</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="আপনার পূর্ণ নাম"
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">পাসওয়ার্ড</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full btn-hero" disabled={isLoading}>
                {isLoading
                  ? "অপেক্ষা করুন..."
                  : authMode === "signup"
                  ? "সাইন আপ করুন"
                  : "লগইন করুন"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="phone" className="space-y-4 mt-6">
            <form onSubmit={handlePhoneAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">ফোন নম্বর</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="০১৭১২৩৪৫৬৭৮"
                    className="pl-10"
                    maxLength={11}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  ০১ দিয়ে শুরু করুন, ১১ ডিজিট
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name-phone">আপনার নাম</Label>
                <Input
                  id="name-phone"
                  name="name-phone"
                  placeholder="আপনার পূর্ণ নাম"
                  required
                />
              </div>
              <Button type="submit" className="w-full btn-hero" disabled={isLoading}>
                {isLoading ? "পাঠানো হচ্ছে..." : "OTP পাঠান"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">অথবা</span>
          </div>
        </div>

        {/* Social Login */}
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleGoogleLogin}
        >
          <Chrome className="mr-2 h-4 w-4" />
          Google দিয়ে লগইন করুন
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          লগইন করে আপনার শিক্ষার যাত্রা শুরু করুন
        </p>

        <Button 
          variant="ghost" 
          className="w-full" 
          onClick={() => navigate("/")}
        >
          হোম পেজে ফিরে যান
        </Button>
      </Card>
    </div>
  );
};

export default Auth;
