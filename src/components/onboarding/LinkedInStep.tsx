import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ExternalLink, CheckCircle, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface LinkedInStepProps {
  linkedinUrl: string;
  onLinkedInChange: (url: string) => void;
  onContextAnalyzed: (context: any) => void;
}

export const LinkedInStep = ({ linkedinUrl, onLinkedInChange, onContextAnalyzed }: LinkedInStepProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCompany, setManualCompany] = useState("");
  const [manualIndustry, setManualIndustry] = useState("");

  const handleAnalyze = async () => {
    if (!linkedinUrl.trim()) {
      toast({
        title: "LinkedIn URL Required",
        description: "Please enter your LinkedIn profile URL",
        variant: "destructive"
      });
      return;
    }

    if (!linkedinUrl.includes('linkedin.com/in/')) {
      toast({
        title: "Invalid LinkedIn URL",
        description: "Please enter a valid LinkedIn profile URL (e.g., linkedin.com/in/username)",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('onboarding-linkedin', {
        body: { linkedinUrl }
      });

      if (error) throw error;

      setAnalysisResult(data);
      setAnalysisComplete(true);
      onContextAnalyzed(data.context);
      
      toast({
        title: "Profile Analyzed!",
        description: `Found ${data.context.employer.name} + ${data.peers.length} competitors`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      setShowManualEntry(true);
      toast({
        title: "Let's try a different approach",
        description: "Please enter your company details manually",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualCompany.trim()) {
      toast({
        title: "Company Required",
        description: "Please enter your company name",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('onboarding-linkedin', {
        body: { 
          linkedinUrl: linkedinUrl || null,
          manualCompany: manualCompany.trim(),
          manualIndustry: manualIndustry.trim() || 'Business'
        }
      });

      if (error) throw error;

      setAnalysisResult(data);
      setAnalysisComplete(true);
      onContextAnalyzed(data.context);
      
      toast({
        title: "Setup Complete!",
        description: `Dashboard configured for ${data.context.employer.name}`,
      });
    } catch (error) {
      console.error('Manual setup error:', error);
      toast({
        title: "Setup Failed",
        description: "Please try again or contact support",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Let's Get Started</h2>
        <p className="text-muted-foreground text-lg">
          Enter your LinkedIn profile to automatically set up your personalized dashboard
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            LinkedIn Profile Analysis
          </CardTitle>
          <CardDescription>
            We'll analyze your profile to identify your company, industry, and key competitors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="linkedin" className="text-sm font-medium">
              LinkedIn Profile URL
            </label>
            <Input
              id="linkedin"
              placeholder="https://linkedin.com/in/your-profile"
              value={linkedinUrl}
              onChange={(e) => onLinkedInChange(e.target.value)}
              disabled={isAnalyzing || analysisComplete}
            />
          </div>

          {!analysisComplete && (
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !linkedinUrl.trim()}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Profile...
                </>
              ) : (
                "Analyze LinkedIn Profile"
              )}
            </Button>
          )}

          {analysisComplete && analysisResult && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-800">Analysis Complete!</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <p><strong>Company:</strong> {analysisResult.context.employer.name}</p>
                      <p><strong>Industry:</strong> {analysisResult.context.industry}</p>
                      <p><strong>Competitors Found:</strong> {analysisResult.peers.map((p: any) => p.name).join(', ')}</p>
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      Your dashboard will be automatically configured with these insights
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {showManualEntry && !analysisComplete && (
            <div className="space-y-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Let's set up your dashboard manually instead
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <label htmlFor="company" className="text-sm font-medium">
                    Your Company *
                  </label>
                  <Input
                    id="company"
                    placeholder="e.g., Apple, Microsoft, Tesla"
                    value={manualCompany}
                    onChange={(e) => setManualCompany(e.target.value)}
                    disabled={isAnalyzing}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="industry" className="text-sm font-medium">
                    Industry (Optional)
                  </label>
                  <Input
                    id="industry"
                    placeholder="e.g., Technology, Automotive, Healthcare"
                    value={manualIndustry}
                    onChange={(e) => setManualIndustry(e.target.value)}
                    disabled={isAnalyzing}
                  />
                </div>
                
                <Button 
                  onClick={handleManualSubmit}
                  disabled={isAnalyzing || !manualCompany.trim()}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Setting up Dashboard...
                    </>
                  ) : (
                    <>
                      <Building className="w-4 h-4 mr-2" />
                      Continue with Manual Setup
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!analysisComplete && !showManualEntry && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              <strong>Privacy Note:</strong> We only use publicly available LinkedIn information to identify your business context. 
              No personal data is stored beyond what's needed for your dashboard.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};