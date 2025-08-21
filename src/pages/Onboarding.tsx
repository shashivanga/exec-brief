import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { IndustryStep } from "@/components/onboarding/IndustryStep";
import { CompetitorStep } from "@/components/onboarding/CompetitorStep";
import { KPIStep } from "@/components/onboarding/KPIStep";
import { toast } from "@/hooks/use-toast";

interface OnboardingData {
  industry: string;
  competitors: string[];
  kpis: string[];
}

export const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    industry: "",
    competitors: [],
    kpis: []
  });

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return onboardingData.industry !== "";
      case 2:
        return onboardingData.competitors.length > 0;
      case 3:
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

  const handleComplete = () => {
    // Save onboarding data to localStorage for persistence
    localStorage.setItem('decks-onboarding', JSON.stringify(onboardingData));
    localStorage.setItem('decks-onboarding-completed', 'true');
    
    toast({
      title: "Welcome to Decks!",
      description: "Your dashboard is being generated with your preferences.",
    });
    
    // Navigate to dashboard
    navigate('/');
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
          <IndustryStep
            selectedIndustry={onboardingData.industry}
            onIndustryChange={updateIndustry}
          />
        );
      case 2:
        return (
          <CompetitorStep
            selectedCompetitors={onboardingData.competitors}
            onCompetitorsChange={updateCompetitors}
            industry={onboardingData.industry}
          />
        );
      case 3:
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