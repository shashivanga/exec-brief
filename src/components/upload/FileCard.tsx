import { FileText, Calendar, Sparkles, ExternalLink, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  summaries: string[];
  isProcessing?: boolean;
}

interface FileCardProps {
  file: UploadedFile;
  onDelete: (fileId: string) => void;
  onViewSource?: (fileId: string) => void;
}

const getFileIcon = (type: string) => {
  if (type.includes('pdf')) return '📄';
  if (type.includes('presentation')) return '📊';
  if (type.includes('word')) return '📝';
  if (type.includes('sheet')) return '📋';
  return '📄';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const FileCard = ({ file, onDelete, onViewSource }: FileCardProps) => {
  return (
    <Card className="bg-dashboard-card hover:shadow-lg transition-all duration-200 border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-lg">{getFileIcon(file.type)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold text-foreground leading-tight truncate">
                {file.name}
              </CardTitle>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDistanceToNow(file.uploadDate, { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {onViewSource && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground p-1"
                onClick={() => onViewSource(file.id)}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-destructive p-1"
              onClick={() => onDelete(file.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {file.isProcessing ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm text-muted-foreground">AI is analyzing your document...</span>
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 bg-muted animate-pulse rounded" />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <Badge variant="outline" className="text-xs bg-primary/10 border-primary/20 text-primary">
                  AI Summary
                </Badge>
              </div>
              <div className="space-y-2">
                {file.summaries.map((summary, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm text-foreground leading-relaxed">{summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};