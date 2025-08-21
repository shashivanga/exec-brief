import { useState } from 'react';
import { FileUploadZone } from './FileUploadZone';
import { FileCard, UploadedFile } from './FileCard';
import { toast } from '@/hooks/use-toast';

// Mock AI summaries for different file types
const generateMockSummaries = (fileName: string, fileType: string): string[] => {
  const summaryTemplates = {
    pdf: [
      'Key financial metrics show 15% revenue growth YoY with improved profit margins',
      'Customer acquisition costs decreased by 8% while retention rates increased to 94%',
      'Market expansion into European territories planned for Q2 with $2.5M budget allocation'
    ],
    presentation: [
      'Product roadmap highlights 3 major feature releases scheduled for next quarter',
      'User engagement metrics improved by 22% following recent UX updates',
      'Competitive analysis reveals market opportunity in enterprise segment worth $180M'
    ],
    document: [
      'Strategic initiatives focus on AI integration and automation workflows',
      'Risk assessment identifies supply chain vulnerabilities requiring mitigation',
      'Executive recommendations include expanding R&D team by 40% to accelerate innovation'
    ],
    spreadsheet: [
      'Revenue projections indicate 25% growth potential with current market trends',
      'Cost optimization strategies could reduce operational expenses by $1.2M annually', 
      'Customer segmentation analysis reveals high-value prospects in healthcare sector'
    ]
  };

  if (fileType.includes('pdf')) return summaryTemplates.pdf;
  if (fileType.includes('presentation')) return summaryTemplates.presentation;
  if (fileType.includes('word')) return summaryTemplates.document;
  if (fileType.includes('sheet')) return summaryTemplates.spreadsheet;
  
  return summaryTemplates.document; // default
};

export const FileUploadSection = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleFileUpload = async (file: File) => {
    const newFile: UploadedFile = {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadDate: new Date(),
      summaries: [],
      isProcessing: true,
    };

    setUploadedFiles(prev => [newFile, ...prev]);

    toast({
      title: "File uploaded successfully",
      description: `${file.name} is being processed by AI...`,
    });

    // Simulate AI processing delay
    setTimeout(() => {
      const summaries = generateMockSummaries(file.name, file.type);
      
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === newFile.id 
            ? { ...f, summaries, isProcessing: false }
            : f
        )
      );

      toast({
        title: "AI analysis complete",
        description: `Key insights extracted from ${file.name}`,
      });
    }, 2000 + Math.random() * 2000); // 2-4 second delay
  };

  const handleFileDelete = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    toast({
      title: "File removed",
      description: "Document and its analysis have been deleted.",
    });
  };

  const handleViewSource = (fileId: string) => {
    toast({
      title: "Feature coming soon",
      description: "Document viewer will be available in the next update.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Document Upload
        </h2>
        <p className="text-muted-foreground">
          Upload your reports, presentations, and spreadsheets to get AI-powered insights.
        </p>
      </div>

      <FileUploadZone onFileUpload={handleFileUpload} />

      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-foreground">
              Uploaded Documents ({uploadedFiles.length})
            </h3>
          </div>
          
          <div className="grid gap-4">
            {uploadedFiles.map(file => (
              <FileCard
                key={file.id}
                file={file}
                onDelete={handleFileDelete}
                onViewSource={handleViewSource}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};