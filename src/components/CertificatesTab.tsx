import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Download, Eye, Calendar, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function CertificatesTab() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCertificates();
    }
  }, [user]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("certificates")
        .select(`
          *,
          courses (
            title,
            image_url,
            thumbnail_url
          )
        `)
        .eq("user_id", user?.id)
        .order("issue_date", { ascending: false });

      if (error) throw error;

      setCertificates(data || []);
    } catch (error: any) {
      console.error("Error fetching certificates:", error);
      toast.error("সার্টিফিকেট লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const handleViewCertificate = (certificate: any) => {
    toast.info("সার্টিফিকেট ভিউ ফিচার শীঘ্রই যুক্ত হবে");
  };

  const handleDownloadCertificate = (certificate: any) => {
    toast.info("সার্টিফিকেট ডাউনলোড ফিচার শীঘ্রই যুক্ত হবে");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Award className="w-10 h-10 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">এখনো কোনো সার্টিফিকেট নেই</h3>
            <p className="text-muted-foreground">
              কোর্স সম্পন্ন করুন এবং সার্টিফিকেট অর্জন করুন
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">আমার সার্টিফিকেট</h2>
          <p className="text-muted-foreground mt-1">
            মোট {certificates.length} টি সার্টিফিকেট অর্জিত
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {certificates.map((certificate) => {
          const courseData = certificate.courses;
          const certData = certificate.certificate_data;

          return (
            <Card key={certificate.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 flex items-center justify-center">
                {courseData?.thumbnail_url || courseData?.image_url ? (
                  <img
                    src={courseData.thumbnail_url || courseData.image_url}
                    alt={courseData.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                  />
                ) : null}
                <div className="relative z-10 text-center">
                  <Award className="w-16 h-16 mx-auto mb-3 text-primary" />
                  <Badge className="bg-primary text-white">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    সার্টিফাইড
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                    {courseData?.title || "কোর্স সার্টিফিকেট"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {certData?.student_name || "শিক্ষার্থী"}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>প্রদানের তারিখ: {formatDate(certificate.issue_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">সার্টিফিকেট নম্বর:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                      {certificate.certificate_number}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">যাচাইকরণ কোড:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                      {certificate.verification_code}
                    </code>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleViewCertificate(certificate)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    দেখুন
                  </Button>
                  <Button
                    className="flex-1 bg-primary"
                    onClick={() => handleDownloadCertificate(certificate)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    ডাউনলোড
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
