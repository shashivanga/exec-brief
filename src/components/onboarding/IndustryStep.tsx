import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface IndustryStepProps {
  selectedIndustry: string;
  onIndustryChange: (industry: string) => void;
}

const industries = [
  { value: "technology", label: "Technology & Software" },
  { value: "healthcare", label: "Healthcare & Pharmaceuticals" },
  { value: "financial", label: "Financial Services" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail & E-commerce" },
  { value: "energy", label: "Energy & Utilities" },
  { value: "real-estate", label: "Real Estate" },
  { value: "automotive", label: "Automotive" },
  { value: "consulting", label: "Consulting" },
  { value: "other", label: "Other" }
];

export const IndustryStep = ({ selectedIndustry, onIndustryChange }: IndustryStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">
          What industry is your company in?
        </h2>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          This helps us curate relevant competitor insights and industry trends for your dashboard.
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <Label htmlFor="industry-select" className="text-base font-medium">
          Select your industry
        </Label>
        <Select value={selectedIndustry} onValueChange={onIndustryChange}>
          <SelectTrigger className="w-full h-12 text-left">
            <SelectValue placeholder="Choose an industry..." />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border shadow-lg z-50">
            {industries.map((industry) => (
              <SelectItem 
                key={industry.value} 
                value={industry.value}
                className="cursor-pointer hover:bg-muted"
              >
                {industry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};