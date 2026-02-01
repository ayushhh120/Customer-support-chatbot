import { useState, useRef, useEffect } from 'react';
import { FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import API from '../../../services/axiosInstance'

const DocumentUpload = ({ onUploadSuccess }) => {

  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      toast({
        title: 'Invalid file',
        description: 'Only PDF files are allowed',
        variant: 'destructive',
      });
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      const res = await API.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percent);
        },
      });

      onUploadSuccess(res.data);

      toast({
        title: 'Upload successful',
        description: 'Document is being indexed',
      });

      setFile(null);
      setUploadProgress(0);
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err.response?.data?.detail || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  

  return (
    <div className="bg-card rounded-xl border p-6 space-y-4">
      <h3 className="text-lg font-semibold">Upload Document</h3>

      <div
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer',
          file ? 'border-green-500 bg-green-50' : 'border-border'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={(e) => validateAndSetFile(e.target.files?.[0])}
          className="hidden"
        />

        {file ? (
          <div className="flex justify-center gap-3">
            <FileText />
            <div>
              <p>{file.name}</p>
              <p className="text-xs">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <X onClick={() => setFile(null)} />
          </div>
        ) : (
          <p>Click or drag PDF file</p>
        )}
      </div>

      {isUploading && (
        <div>
          <p>{uploadProgress}%</p>
          <div className="h-2 bg-muted rounded">
            <div
              className="h-full bg-primary"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <Button disabled={!file || isUploading} onClick={handleUpload}>
        {isUploading ? 'Uploading...' : 'Upload Document'}
      </Button>
    </div>
  );
};

export default DocumentUpload;