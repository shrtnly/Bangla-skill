import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, UploadCloud, LinkIcon } from 'lucide-react';
import { Card } from '@/components/ui/card'; // Assuming Card is imported for styling

interface ResourceUploaderProps {
  moduleId: string;
  onResourceUploaded: () => void; // Callback to refresh the resources list in parent
}

const ResourceUploader: React.FC<ResourceUploaderProps> = ({ moduleId, onResourceUploaded }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState(''); // For external links
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'file' | 'link'>('file'); // Toggle between file upload and link

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    } else {
      setFile(null);
    }
  };

  // Helper to determine file_type and mime_type for database
  const getFileTypeAndMimeType = (file: File) => {
    const mime = file.type;
    let type = 'other'; // Default if not recognized

    if (mime.startsWith('image/')) type = 'image';
    else if (mime === 'application/pdf') type = 'pdf';
    else if (mime === 'text/plain') type = 'text';
    else if (mime.startsWith('video/')) type = 'video';
    else if (mime === 'application/msword' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') type = 'docx';
    else if (mime === 'application/vnd.ms-excel' || mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') type = 'xlsx';
    else if (mime === 'application/vnd.ms-powerpoint' || mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') type = 'pptx';


    return { fileType: type, mimeType: mime };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      toast.error('You must be logged in to upload resources.');
      return;
    }
    if (!title.trim()) {
      toast.error('Resource title cannot be empty.');
      return;
    }
    if (uploadType === 'file' && !file) {
      toast.error('Please select a file to upload.');
      return;
    }
    if (uploadType === 'link' && !url.trim()) {
        toast.error('Please enter a URL for the link resource.');
        return;
    }

    setIsUploading(true);
    let publicUrl = url.trim(); // For links, use the provided URL directly
    let fileType: string = 'link';
    let mimeType: string = 'text/uri-list';

    try {
      if (uploadType === 'file' && file) {
        // Generate a unique path for the file in storage
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const filePath = `modules/${moduleId}/${fileName}`;

        const { data, error: uploadError } = await supabase.storage
          .from('course-resources') // Use your actual bucket name
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false, // Set to true if you want to overwrite existing files with the same path
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase
          .storage
          .from('course-resources') // Use your actual bucket name
          .getPublicUrl(filePath);

        publicUrl = publicUrlData.publicUrl;
        const { fileType: fType, mimeType: mType } = getFileTypeAndMimeType(file);
        fileType = fType;
        mimeType = mType;
      }

      // Insert resource metadata into the database
      const { error: insertError } = await supabase
        .from('resources')
        .insert({
          module_id: moduleId,
          title: title.trim(),
          description: description.trim(),
          url: publicUrl,
          file_type: fileType,
          mime_type: mimeType,
          // You might also want to store user_id here for RLS on resources table
        });

      if (insertError) throw insertError;

      toast.success('Resource uploaded successfully!');
      setTitle('');
      setDescription('');
      setFile(null);
      setUrl('');
      onResourceUploaded(); // Trigger parent to re-fetch resources
    } catch (error: any) {
      console.error('Error uploading resource:', error.message);
      toast.error(`Failed to add resource: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-xl font-bold">Upload New Resource</h3>
      <div className="flex gap-2">
        <Button
          variant={uploadType === 'file' ? 'default' : 'outline'}
          onClick={() => setUploadType('file')}
          className={uploadType === 'file' ? "bg-[#895cd6] hover:bg-[#7b4dc4] text-white" : "border-[#895cd6] text-[#895cd6] hover:bg-[#895cd6]/10"}
          disabled={isUploading}
        >
          <UploadCloud className="w-4 h-4 mr-2" /> Upload File
        </Button>
        <Button
          variant={uploadType === 'link' ? 'default' : 'outline'}
          onClick={() => setUploadType('link')}
          className={uploadType === 'link' ? "bg-[#895cd6] hover:bg-[#7b4dc4] text-white" : "border-[#895cd6] text-[#895cd6] hover:bg-[#895cd6]/10"}
          disabled={isUploading}
        >
          <LinkIcon className="w-4 h-4 mr-2" /> Add Link
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Resource Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isUploading}
        />
        <Textarea
          placeholder="Resource Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isUploading}
        />

        {uploadType === 'file' ? (
          <Input
            type="file"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        ) : (
          <Input
            placeholder="External Link URL (e.g., https://example.com/document)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            disabled={isUploading}
          />
        )}

        <Button type="submit" className="w-full bg-[#895cd6] hover:bg-[#7b4dc4] text-white" disabled={isUploading}>
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : uploadType === 'file' ? (
            <UploadCloud className="w-4 h-4 mr-2" />
          ) : (
            <LinkIcon className="w-4 h-4 mr-2" />
          )}
          {isUploading ? 'Uploading...' : 'Add Resource'}
        </Button>
      </form>
    </Card>
  );
};

export default ResourceUploader;
