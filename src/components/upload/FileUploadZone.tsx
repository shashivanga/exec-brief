import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFileUpload: (file: File) => void;
  className?: string;
}

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const FileUploadZone = ({ onFileUpload, className }: FileUploadZoneProps) => {
  const [uploadError, setUploadError] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setUploadError('');
    
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      if (error.code === 'file-too-large') {
        setUploadError('File size must be less than 10MB');
      } else if (error.code === 'file-invalid-type') {
        setUploadError('Only PDF, PPTX, DOCX, and XLSX files are supported');
      } else {
        setUploadError('Invalid file. Please try again.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  return (
    <Card className={cn("bg-dashboard-card border-2 border-dashed transition-all duration-200", className)}>
      <CardContent className="p-8">
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center text-center space-y-4 cursor-pointer transition-colors duration-200 rounded-lg p-6",
            isDragActive && !isDragReject && "bg-primary/5 border-primary",
            isDragReject && "bg-destructive/5 border-destructive",
            !isDragActive && "hover:bg-muted/50"
          )}
        >
          <input {...getInputProps()} />
          
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200",
            isDragActive && !isDragReject && "bg-primary/10",
            isDragReject && "bg-destructive/10",
            !isDragActive && "bg-muted"
          )}>
            {isDragReject ? (
              <AlertCircle className={cn(
                "w-8 h-8",
                isDragReject ? "text-destructive" : "text-muted-foreground"
              )} />
            ) : (
              <FileText className={cn(
                "w-8 h-8",
                isDragActive && !isDragReject ? "text-primary" : "text-muted-foreground"
              )} />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {isDragActive
                ? isDragReject
                  ? "Invalid file type"
                  : "Drop your file here"
                : "Upload a document"
              }
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {isDragReject
                ? "Only PDF, PPTX, DOCX, and XLSX files are supported"
                : "Drag and drop your file here, or click to browse. Supports PDF, PPTX, DOCX, and XLSX files."
              }
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Upload className="w-4 h-4" />
            <span>Maximum file size: 10MB</span>
          </div>
        </div>

        {uploadError && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <p className="text-sm text-destructive font-medium">{uploadError}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};