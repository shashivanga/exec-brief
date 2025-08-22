import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { LinkedInStep } from "@/components/onboarding/LinkedInStep";
import { IndustryStep } from "@/components/onboarding/IndustryStep";
import { CompetitorStep } from "@/components/onboarding/CompetitorStep";
import { KPIStep } from "@/components/onboarding/KPIStep";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingData {
  linkedinUrl: string;
  industry: string;
  competitors: string[];
  kpis: string[];
  linkedinContext?: any;
}

export const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4; // Added LinkedIn step
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    linkedinUrl: "",
    industry: "",
    competitors: [],
    kpis: [],
    linkedinContext: null
  });

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return onboardingData.linkedinContext !== null; // LinkedIn analysis complete
      case 2:
        return onboardingData.industry !== "";
      case 3:
        return onboardingData.competitors.length > 0;
      case 4:
        return onboardingData.kpis.length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    // Save onboarding data to localStorage for persistence
    localStorage.setItem('decks-onboarding', JSON.stringify(onboardingData));
    localStorage.setItem('decks-onboarding-completed', 'true');
    
    try {
      // Seed smart cards based on LinkedIn analysis
      const { error } = await supabase.functions.invoke('bootstrap-seed-cards');
      
      if (error) throw error;
      
      toast({
        title: "Welcome to Decks!",
        description: "Your personalized dashboard has been created with smart cards.",
      });
    } catch (error) {
      console.error('Error seeding cards:', error);
      toast({
        title: "Welcome to Decks!",
        description: "Your dashboard is being generated with your preferences.",
      });
    }
    
    // Navigate to dashboard
    navigate('/');
  };

  const updateLinkedInUrl = (linkedinUrl: string) => {
    setOnboardingData(prev => ({ ...prev, linkedinUrl }));
  };

  const updateLinkedInContext = (context: any) => {
    setOnboardingData(prev => ({ 
      ...prev, 
      linkedinContext: context,
      industry: context.industry || prev.industry,
      // Auto-populate based on LinkedIn analysis
    }));
  };

  const updateIndustry = (industry: string) => {
    setOnboardingData(prev => ({ ...prev, industry }));
  };

  const updateCompetitors = (competitors: string[]) => {
    setOnboardingData(prev => ({ ...prev, competitors }));
  };

  const updateKPIs = (kpis: string[]) => {
    setOnboardingData(prev => ({ ...prev, kpis }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <LinkedInStep
            linkedinUrl={onboardingData.linkedinUrl}
            onLinkedInChange={updateLinkedInUrl}
            onContextAnalyzed={updateLinkedInContext}
          />
        );
      case 2:
        return (
          <IndustryStep
            selectedIndustry={onboardingData.industry}
            onIndustryChange={updateIndustry}
          />
        );
      case 3:
        return (
          <CompetitorStep
            selectedCompetitors={onboardingData.competitors}
            onCompetitorsChange={updateCompetitors}
            industry={onboardingData.industry}
          />
        );
      case 4:
        return (
          <KPIStep
            selectedKPIs={onboardingData.kpis}
            onKPIsChange={updateKPIs}
          />
        );
      default:
        return null;
    }
  };

  return (
    <OnboardingLayout
      step={currentStep}
      totalSteps={totalSteps}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onComplete={handleComplete}
      canProceed={canProceed()}
      isLastStep={currentStep === totalSteps}
    >
      {renderStep()}
    </OnboardingLayout>
  );
};