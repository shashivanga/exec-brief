import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface KPIStepProps {
  selectedKPIs: string[];
  onKPIsChange: (kpis: string[]) => void;
}

const kpiCategories = [
  {
    category: "Financial Metrics",
    kpis: [
      { id: "revenue", label: "Revenue Growth", description: "Monthly/quarterly revenue trends" },
      { id: "profit-margins", label: "Profit Margins", description: "Gross and net profit margins" },
      { id: "cash-flow", label: "Cash Flow", description: "Operating cash flow metrics" },
      { id: "burn-rate", label: "Burn Rate", description: "Monthly cash burn (for startups)" }
    ]
  },
  {
    category: "Customer Metrics", 
    kpis: [
      { id: "customer-acquisition", label: "Customer Acquisition Cost", description: "Cost to acquire new customers" },
      { id: "customer-churn", label: "Customer Churn Rate", description: "Rate of customer attrition" },
      { id: "customer-ltv", label: "Customer Lifetime Value", description: "Long-term customer value" },
      { id: "nps", label: "Net Promoter Score", description: "Customer satisfaction metric" }
    ]
  },
  {
    category: "Operational Metrics",
    kpis: [
      { id: "employee-retention", label: "Employee Retention", description: "Staff turnover rates" },
      { id: "productivity", label: "Productivity Metrics", description: "Output per employee/hour" },
      { id: "market-share", label: "Market Share", description: "Competitive market position" },
      { id: "conversion-rates", label: "Conversion Rates", description: "Sales funnel conversion metrics" }
    ]
  }
];

export const KPIStep = ({ selectedKPIs, onKPIsChange }: KPIStepProps) => {
  const toggleKPI = (kpiId: string) => {
    if (selectedKPIs.includes(kpiId)) {
      onKPIsChange(selectedKPIs.filter(id => id !== kpiId));
    } else {
      onKPIsChange([...selectedKPIs, kpiId]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">
          Which KPIs matter most to you?
        </h2>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          Select the key performance indicators you want to track on your dashboard. You can always adjust these later.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {kpiCategories.map((category) => (
          <Card key={category.category} className="bg-dashboard-card border-border">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {category.category}
              </h3>
              <div className="grid gap-4">
                {category.kpis.map((kpi) => (
                  <div key={kpi.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={kpi.id}
                      checked={selectedKPIs.includes(kpi.id)}
                      onCheckedChange={() => toggleKPI(kpi.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <Label
                        htmlFor={kpi.id}
                        className="text-sm font-medium text-foreground cursor-pointer leading-tight"
                      >
                        {kpi.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {kpi.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {selectedKPIs.length > 0 && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {selectedKPIs.length} KPI{selectedKPIs.length === 1 ? '' : 's'} selected
            </p>
          </div>
        )}
      </div>
    </div>
  );
};