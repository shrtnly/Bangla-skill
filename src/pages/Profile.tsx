import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Camera, User, GraduationCap, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProfileData {
  full_name: string;
  phone: string;
  bio: string;
  date_of_birth: string;
  gender: string;
  location: string;
  education_level: string;
  institution: string;
  field_of_study: string;
  graduation_year: number | null;
  employment_status: string;
  job_title: string;
  company: string;
  experience_years: number | null;
  avatar_url: string;
}

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    phone: "",
    bio: "",
    date_of_birth: "",
    gender: "",
    location: "",
    education_level: "",
    institution: "",
    field_of_study: "",
    graduation_year: null,
    employment_status: "",
    job_title: "",
    company: "",
    experience_years: null,
    avatar_url: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          phone: data.phone || "",
          bio: data.bio || "",
          date_of_birth: data.date_of_birth || "",
          gender: data.gender || "",
          location: data.location || "",
          education_level: data.education_level || "",
          institution: data.institution || "",
          field_of_study: data.field_of_study || "",
          graduation_year: data.graduation_year || null,
          employment_status: data.employment_status || "",
          job_title: data.job_title || "",
          company: data.company || "",
          experience_years: data.experience_years || null,
          avatar_url: data.avatar_url || "",
        });
      }
    } catch (error: any) {
      toast.error("প্রোফাইল লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("ছবির সাইজ ২ MB এর কম হতে হবে");
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success("ছবি আপলোড সফল হয়েছে!");
    } catch (error: any) {
      toast.error("ছবি আপলোড করতে সমস্যা হয়েছে");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          bio: profile.bio,
          date_of_birth: profile.date_of_birth || null,
          gender: profile.gender || null,
          location: profile.location || null,
          education_level: profile.education_level || null,
          institution: profile.institution || null,
          field_of_study: profile.field_of_study || null,
          graduation_year: profile.graduation_year || null,
          employment_status: profile.employment_status || null,
          job_title: profile.job_title || null,
          company: profile.company || null,
          experience_years: profile.experience_years || null,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("প্রোফাইল আপডেট সফল হয়েছে!");
    } catch (error: any) {
      toast.error("প্রোফাইল আপডেট করতে সমস্যা হয়েছে");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">আমার প্রোফাইল</h1>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            ড্যাশবোর্ডে ফিরে যান
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                প্রোফাইল ছবি
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback>
                  <User className="h-16 w-16" />
                </AvatarFallback>
              </Avatar>
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="hidden"
                  id="avatar-upload"
                />
                <Label htmlFor="avatar-upload">
                  <Button type="button" disabled={uploadingAvatar} asChild>
                    <span className="cursor-pointer">
                      {uploadingAvatar ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          আপলোড হচ্ছে...
                        </>
                      ) : (
                        <>
                          <Camera className="mr-2 h-4 w-4" />
                          ছবি আপলোড করুন
                        </>
                      )}
                    </span>
                  </Button>
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                ব্যক্তিগত তথ্য
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">পূর্ণ নাম *</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">ফোন নম্বর</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">সংক্ষিপ্ত পরিচয়</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="নিজের সম্পর্কে কিছু লিখুন..."
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">জন্ম তারিখ</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={profile.date_of_birth}
                    onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">লিঙ্গ</Label>
                  <Select
                    value={profile.gender}
                    onValueChange={(value) => setProfile({ ...profile, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">পুরুষ</SelectItem>
                      <SelectItem value="female">মহিলা</SelectItem>
                      <SelectItem value="other">অন্যান্য</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">অবস্থান</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="শহর, দেশ"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Educational Background */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                শিক্ষাগত যোগ্যতা
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="education_level">শিক্ষাগত স্তর</Label>
                  <Select
                    value={profile.education_level}
                    onValueChange={(value) => setProfile({ ...profile, education_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="নির্বাচন করুন" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="secondary">মাধ্যমিক</SelectItem>
                      <SelectItem value="higher_secondary">উচ্চ মাধ্যমিক</SelectItem>
                      <SelectItem value="bachelor">স্নাতক</SelectItem>
                      <SelectItem value="master">স্নাতকোত্তর</SelectItem>
                      <SelectItem value="phd">পিএইচডি</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution">শিক্ষা প্রতিষ্ঠান</Label>
                  <Input
                    id="institution"
                    value={profile.institution}
                    onChange={(e) => setProfile({ ...profile, institution: e.target.value })}
                    placeholder="বিশ্ববিদ্যালয় / কলেজের নাম"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="field_of_study">বিষয়</Label>
                  <Input
                    id="field_of_study"
                    value={profile.field_of_study}
                    onChange={(e) => setProfile({ ...profile, field_of_study: e.target.value })}
                    placeholder="যেমন: কম্পিউটার সায়েন্স"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="graduation_year">পাশের বছর</Label>
                  <Input
                    id="graduation_year"
                    type="number"
                    value={profile.graduation_year || ""}
                    onChange={(e) => setProfile({ ...profile, graduation_year: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="২০২৪"
                    min="1950"
                    max="2050"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                পেশাগত তথ্য
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employment_status">চাকরির অবস্থা</Label>
                <Select
                  value={profile.employment_status}
                  onValueChange={(value) => setProfile({ ...profile, employment_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">চাকরিরত</SelectItem>
                    <SelectItem value="self_employed">স্ব-নিযুক্ত</SelectItem>
                    <SelectItem value="student">শিক্ষার্থী</SelectItem>
                    <SelectItem value="unemployed">বেকার</SelectItem>
                    <SelectItem value="retired">অবসরপ্রাপ্ত</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job_title">পদবি</Label>
                  <Input
                    id="job_title"
                    value={profile.job_title}
                    onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                    placeholder="যেমন: সফটওয়্যার ইঞ্জিনিয়ার"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">প্রতিষ্ঠান</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    placeholder="কোম্পানির নাম"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience_years">অভিজ্ঞতা (বছর)</Label>
                <Input
                  id="experience_years"
                  type="number"
                  value={profile.experience_years || ""}
                  onChange={(e) => setProfile({ ...profile, experience_years: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="0"
                  min="0"
                  max="50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button type="submit" className="w-full btn-hero" disabled={updating}>
            {updating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                আপডেট হচ্ছে...
              </>
            ) : (
              "প্রোফাইল সংরক্ষণ করুন"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
