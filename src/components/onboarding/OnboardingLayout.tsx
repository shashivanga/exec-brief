import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingLayoutProps {
  children: React.ReactNode;
  step: number;
  totalSteps: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onComplete?: () => void;
  canProceed?: boolean;
  isLastStep?: boolean;
}

export const OnboardingLayout = ({
  children,
  step,
  totalSteps,
  onNext,
  onPrevious,
  onComplete,
  canProceed = false,
  isLastStep = false
}: OnboardingLayoutProps) => {
  const progressPercent = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Header */}
      <header className="bg-dashboard-sidebar border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">D</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">Decks</h1>
          </div>
          <div className="text-sm text-muted-foreground">
            Step {step} of {totalSteps}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-dashboard-sidebar border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <Progress value={progressPercent} className="w-full" />
        </div>
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {children}
          
          {/* Navigation */}
          <div className="flex justify-between pt-8">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={step === 1}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>
            
            {isLastStep ? (
              <Button
                onClick={onComplete}
                disabled={!canProceed}
                className="flex items-center space-x-2"
              >
                <span>Complete Setup</span>
              </Button>
            ) : (
              <Button
                onClick={onNext}
                disabled={!canProceed}
                className="flex items-center space-x-2"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};