import { useState } from 'react';
import { FileText, Download, Building, Palette, Calendar, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { generatePDF } from './pdfGenerator';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboardData?: any[];
}

export const ExportModal = ({ open, onOpenChange, dashboardData = [] }: ExportModalProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [includeCompanyBranding, setIncludeCompanyBranding] = useState(true);
  const [companyName, setCompanyName] = useState('Decks Analytics');
  const [reportTitle, setReportTitle] = useState('Executive Dashboard Report');

  const handleExport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    
    try {
      await generatePDF({
        dashboardData,
        companyName: includeCompanyBranding ? companyName : '',
        reportTitle,
        includeBranding: includeCompanyBranding,
      });
      
      toast({
        title: "Export successful",
        description: "Your dashboard report has been generated and downloaded.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return {
      date: now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZoneName: 'short'
      })
    };
  };

  const { date, time } = getCurrentDateTime();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Export Dashboard</span>
          </DialogTitle>
          <DialogDescription>
            Generate a professional PDF report of your dashboard insights.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Report Details */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="report-title">Report Title</Label>
              <Input
                id="report-title"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Enter report title..."
              />
            </div>

            {/* Export Info - Compact */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Date:</span>
                </div>
                <span className="font-medium text-xs">{date}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Time:</span>
                </div>
                <span className="font-medium text-xs">{time}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cards:</span>
                <Badge variant="outline" className="text-xs">{dashboardData.length + 1} cards</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Company Branding Options - Compact */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4" />
                  <Label className="text-sm font-medium">Company Branding</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add your company name to the report
                </p>
              </div>
              <Switch
                checked={includeCompanyBranding}
                onCheckedChange={setIncludeCompanyBranding}
              />
            </div>

            {includeCompanyBranding && (
              <div className="ml-6 space-y-2">
                <div className="space-y-2">
                  <Label htmlFor="company-name" className="text-sm">Company Name</Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter your company name..."
                    className="text-sm"
                  />
                </div>
                
                <div className="p-2 bg-primary/5 rounded border border-primary/10">
                  <div className="flex items-center space-x-2 mb-1">
                    <Palette className="w-3 h-3 text-primary" />
                    <span className="text-xs font-medium text-primary">Brand Colors</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Report uses Decks' professional blue theme.
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Export Format - Compact */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="p-3 border rounded bg-card">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-red-100 dark:bg-red-950/50 rounded flex items-center justify-center">
                  <FileText className="w-3 h-3 text-red-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">PDF Report</div>
                  <div className="text-xs text-muted-foreground">
                    Professional layout • 3-4 cards per page
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                  Recommended
                </Badge>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="pt-2">
            <Button
              onClick={handleExport}
              disabled={isExporting || !reportTitle.trim()}
              className="w-full"
              size="lg"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export as PDF
                </>
              )}
            </Button>

            {isExporting && (
              <div className="text-xs text-center text-muted-foreground mt-2">
                This may take a few moments...
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};