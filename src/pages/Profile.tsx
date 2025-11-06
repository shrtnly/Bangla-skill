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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Camera, User, GraduationCap, Briefcase, MapPin, Phone, Calendar, Check, Edit, Eye, Save, X, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CertificatesTab } from "@/components/CertificatesTab";

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
  total_certificates: number;
}

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
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
    total_certificates: 0,
  });
  
  const [originalProfile, setOriginalProfile] = useState<ProfileData>(profile);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, total_certificates:certificates(count)")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      if (data) {
        const profileData = {
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
          total_certificates: data.total_certificates?.[0]?.count || 0,
        };
        setProfile(profileData);
        setOriginalProfile(profileData);
      }
    } catch (error: any) {
      toast.error("প্রোফাইল লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = () => {
    const fields = [
      'full_name', 'phone', 'bio', 'date_of_birth', 'gender', 'location',
      'education_level', 'institution', 'field_of_study', 'graduation_year',
      'employment_status', 'job_title', 'company', 'experience_years', 'avatar_url'
    ];
    
    const filledFields = fields.filter(field => {
      const value = profile[field as keyof ProfileData];
      return value !== null && value !== undefined && value !== "";
    });
    
    return Math.round((filledFields.length / fields.length) * 100);
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
      setHasChanges(true);
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
      
      setOriginalProfile(profile);
      setHasChanges(false);
      toast.success("প্রোফাইল আপডেট সফল হয়েছে!");
    } catch (error: any) {
      toast.error("প্রোফাইল আপডেট করতে সমস্যা হয়েছে");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setHasChanges(false);
  };

  const handleFieldChange = (field: keyof ProfileData, value: any) => {
    setProfile({ ...profile, [field]: value });
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const profileCompletion = calculateProfileCompletion();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">আমার প্রোফাইল</h1>
            <p className="text-muted-foreground mt-1">আপনার ব্যক্তিগত তথ্য পরিচালনা করুন</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="flex items-center gap-2"
            >
              {isPreviewMode ? <Edit className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {isPreviewMode ? "সম্পাদনা করুন" : "প্রিভিউ মোড"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              ড্যাশবোর্ডে ফিরে যান
            </Button>
          </div>
        </div>

        {/* Profile Completion Progress */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">প্রোফাইল সম্পূর্ণতা</span>
              <span className="text-sm font-medium">{profileCompletion}%</span>
            </div>
            <Progress value={profileCompletion} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {profileCompletion < 50 
                ? "আপনার প্রোফাইল সম্পূর্ণ করতে আরও তথ্য যোগ করুন" 
                : profileCompletion < 80 
                  ? "আপনার প্রোফাইল ভালোভাবে সম্পূর্ণ হয়েছে" 
                  : "আপনার প্রোফাইল সম্পূর্ণ হয়েছে!"}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card and Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback>
                        <User className="h-16 w-16" />
                      </AvatarFallback>
                    </Avatar>
                    {!isPreviewMode && (
                      <div className="absolute bottom-0 right-0">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          disabled={uploadingAvatar}
                          className="hidden"
                          id="avatar-upload"
                        />
                        <Label htmlFor="avatar-upload">
                          <Button type="button" size="icon" className="rounded-full h-10 w-10" asChild>
                            <span className="cursor-pointer">
                              {uploadingAvatar ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Camera className="h-4 w-4" />
                              )}
                            </span>
                          </Button>
                        </Label>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-semibold">{profile.full_name || "আপনার নাম"}</h2>
                    {profile.job_title && <p className="text-sm text-muted-foreground">{profile.job_title}</p>}
                    {profile.company && <p className="text-sm text-muted-foreground">{profile.company}</p>}
                    {profile.location && (
                      <div className="flex items-center justify-center gap-1 mt-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {profile.location}
                      </div>
                    )}
                  </div>
                  <div className="w-full">
                    <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
                      <TabsList className="grid w-full grid-cols-1 h-auto p-0 bg-transparent">
                        <TabsTrigger value="personal" className="justify-start gap-2 data-[state=active]:bg-primary/10">
                          <User className="h-4 w-4" />
                          ব্যক্তিগত তথ্য
                        </TabsTrigger>
                        <TabsTrigger value="education" className="justify-start gap-2 data-[state=active]:bg-primary/10">
                          <GraduationCap className="h-4 w-4" />
                          শিক্ষাগত যোগ্যতা
                        </TabsTrigger>
                        <TabsTrigger value="professional" className="justify-start gap-2 data-[state=active]:bg-primary/10">
                          <Briefcase className="h-4 w-4" />
                          পেশাগত তথ্য
                        </TabsTrigger>
                        <TabsTrigger value="certificates" className="justify-start gap-2 data-[state=active]:bg-primary/10">
                          <Award className="h-4 w-4" />
                          সার্টিফিকেট
                          {profile.total_certificates > 0 && (
                            <Badge className="ml-auto bg-primary text-white">
                              {profile.total_certificates}
                            </Badge>
                          )}
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Form Content */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsContent value="personal" className="space-y-6 mt-0">
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
                            onChange={(e) => handleFieldChange("full_name", e.target.value)}
                            disabled={isPreviewMode}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">ফোন নম্বর</Label>
                          <Input
                            id="phone"
                            value={profile.phone}
                            onChange={(e) => handleFieldChange("phone", e.target.value)}
                            disabled={isPreviewMode}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">সংক্ষিপ্ত পরিচয়</Label>
                        <Textarea
                          id="bio"
                          value={profile.bio}
                          onChange={(e) => handleFieldChange("bio", e.target.value)}
                          placeholder="নিজের সম্পর্কে কিছু লিখুন..."
                          rows={3}
                          disabled={isPreviewMode}
                        />
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date_of_birth">জন্ম তারিখ</Label>
                          <Input
                            id="date_of_birth"
                            type="date"
                            value={profile.date_of_birth}
                            onChange={(e) => handleFieldChange("date_of_birth", e.target.value)}
                            disabled={isPreviewMode}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gender">লিঙ্গ</Label>
                          <Select
                            value={profile.gender}
                            onValueChange={(value) => handleFieldChange("gender", value)}
                            disabled={isPreviewMode}
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
                            onChange={(e) => handleFieldChange("location", e.target.value)}
                            placeholder="শহর, দেশ"
                            disabled={isPreviewMode}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="education" className="space-y-6 mt-0">
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
                            onValueChange={(value) => handleFieldChange("education_level", value)}
                            disabled={isPreviewMode}
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
                            onChange={(e) => handleFieldChange("institution", e.target.value)}
                            placeholder="বিশ্ববিদ্যালয় / কলেজের নাম"
                            disabled={isPreviewMode}
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="field_of_study">বিষয়</Label>
                          <Input
                            id="field_of_study"
                            value={profile.field_of_study}
                            onChange={(e) => handleFieldChange("field_of_study", e.target.value)}
                            placeholder="যেমন: কম্পিউটার সায়েন্স"
                            disabled={isPreviewMode}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="graduation_year">পাশের বছর</Label>
                          <Input
                            id="graduation_year"
                            type="number"
                            value={profile.graduation_year || ""}
                            onChange={(e) => handleFieldChange("graduation_year", e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="২০২৪"
                            min="1950"
                            max="2050"
                            disabled={isPreviewMode}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="professional" className="space-y-6 mt-0">
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
                          onValueChange={(value) => handleFieldChange("employment_status", value)}
                          disabled={isPreviewMode}
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
                            onChange={(e) => handleFieldChange("job_title", e.target.value)}
                            placeholder="যেমন: সফটওয়্যার ইঞ্জিনিয়ার"
                            disabled={isPreviewMode}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company">প্রতিষ্ঠান</Label>
                          <Input
                            id="company"
                            value={profile.company}
                            onChange={(e) => handleFieldChange("company", e.target.value)}
                            placeholder="কোম্পানির নাম"
                            disabled={isPreviewMode}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="experience_years">অভিজ্ঞতা (বছর)</Label>
                        <Input
                          id="experience_years"
                          type="number"
                          value={profile.experience_years || ""}
                          onChange={(e) => handleFieldChange("experience_years", e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="0"
                          min="0"
                          max="50"
                          disabled={isPreviewMode}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="certificates" className="space-y-6 mt-0">
                  <CertificatesTab />
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              {!isPreviewMode && activeTab !== "certificates" && (
                <div className="flex justify-end gap-2 mt-6">
                  {hasChanges && (
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      <X className="mr-2 h-4 w-4" />
                      বাতিল করুন
                    </Button>
                  )}
                  <Button type="submit" disabled={updating || !hasChanges}>
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        আপডেট হচ্ছে...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        প্রোফাইল সংরক্ষণ করুন
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;