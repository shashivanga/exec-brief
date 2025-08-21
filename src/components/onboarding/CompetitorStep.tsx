import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface CompetitorStepProps {
  selectedCompetitors: string[];
  onCompetitorsChange: (competitors: string[]) => void;
  industry: string;
}

const getIndustrySuggestions = (industry: string): string[] => {
  const suggestions: Record<string, string[]> = {
    technology: ["Microsoft", "Google", "Apple", "Amazon", "Meta", "Netflix", "Salesforce", "Adobe"],
    healthcare: ["Johnson & Johnson", "Pfizer", "Roche", "Novartis", "Merck", "Bristol Myers"],
    financial: ["JPMorgan Chase", "Bank of America", "Wells Fargo", "Goldman Sachs", "Morgan Stanley"],
    manufacturing: ["General Electric", "Siemens", "3M", "Caterpillar", "Boeing", "Lockheed Martin"],
    retail: ["Walmart", "Amazon", "Target", "Home Depot", "Costco", "Best Buy"],
    energy: ["ExxonMobil", "Chevron", "Shell", "BP", "Total", "ConocoPhillips"],
    automotive: ["Tesla", "Ford", "General Motors", "Toyota", "Volkswagen", "BMW"],
    default: ["Company A", "Company B", "Company C", "Industry Leader", "Market Competitor"]
  };

  return suggestions[industry] || suggestions.default;
};

export const CompetitorStep = ({ selectedCompetitors, onCompetitorsChange, industry }: CompetitorStepProps) => {
  const [inputValue, setInputValue] = useState("");
  const suggestions = getIndustrySuggestions(industry);
  
  const addCompetitor = (competitor: string) => {
    if (competitor && !selectedCompetitors.includes(competitor)) {
      onCompetitorsChange([...selectedCompetitors, competitor]);
    }
    setInputValue("");
  };

  const removeCompetitor = (competitor: string) => {
    onCompetitorsChange(selectedCompetitors.filter(c => c !== competitor));
  };

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addCompetitor(inputValue.trim());
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">
          Who are your main competitors?
        </h2>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          We'll track these companies to provide you with competitive intelligence and market positioning insights.
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <div className="space-y-4">
          <Label htmlFor="competitor-input" className="text-base font-medium">
            Add competitors
          </Label>
          <div className="flex space-x-2">
            <Input
              id="competitor-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleInputKeyPress}
              placeholder="Type competitor name..."
              className="flex-1"
            />
            <Button
              onClick={() => addCompetitor(inputValue.trim())}
              disabled={!inputValue.trim()}
              size="sm"
              className="px-3"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Selected Competitors */}
        {selectedCompetitors.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Selected Competitors ({selectedCompetitors.length})
            </Label>
            <div className="flex flex-wrap gap-2">
              {selectedCompetitors.map((competitor) => (
                <Badge
                  key={competitor}
                  variant="secondary"
                  className="flex items-center space-x-2 px-3 py-1"
                >
                  <span>{competitor}</span>
                  <button
                    onClick={() => removeCompetitor(competitor)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground">
            Suggested for {industry}
          </Label>
          <div className="flex flex-wrap gap-2">
            {suggestions
              .filter(s => !selectedCompetitors.includes(s))
              .slice(0, 6)
              .map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => addCompetitor(suggestion)}
                  className="text-sm"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {suggestion}
                </Button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};