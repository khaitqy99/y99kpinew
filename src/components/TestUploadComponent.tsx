'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { uploadFile } from '@/ai/flows/upload-file';
import { toast } from '@/hooks/use-toast';

export default function TestUploadComponent() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get just the base64 content
          const base64Content = result.split(',')[1];
          resolve(base64Content);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload file
      const result = await uploadFile({
        fileName: file.name,
        fileContent: base64,
        mimeType: file.type,
      });

      setUploadedUrl(result.fileUrl);
      toast({
        title: "Upload thành công!",
        description: "File đã được upload lên Google Drive.",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload thất bại",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi upload file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Test Upload File</h2>
      
      <div className="space-y-4">
        <div>
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        
        {isUploading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Đang upload...</p>
          </div>
        )}
        
        {uploadedUrl && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Upload thành công!</h3>
            <a
              href={uploadedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline break-all"
            >
              {uploadedUrl}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
