import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";

interface Metric {
  name: string;
  value: string;
}

interface CompanyFinancialsCardProps {
  company?: string;
  ticker?: string;
  metrics?: Metric[];
  as_of?: string;
  notes?: string;
}

export const CompanyFinancialsCard = ({ 
  company = "Company", 
  ticker = "", 
  metrics = [], 
  as_of, 
  notes 
}: CompanyFinancialsCardProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Loading...";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {company} Financials
            </CardTitle>
            <CardDescription>Key financial metrics and performance</CardDescription>
          </div>
          {ticker && (
            <Badge variant="outline" className="font-mono">
              {ticker}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-1">
              <p className="text-sm text-muted-foreground">{metric.name}</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold">{metric.value}</p>
                {metric.value.includes('+') && <TrendingUp className="w-4 h-4 text-green-600" />}
                {metric.value.includes('-') && <TrendingDown className="w-4 h-4 text-red-600" />}
                {metric.value.includes('%') && <Percent className="w-4 h-4 text-blue-600" />}
              </div>
            </div>
          ))}
        </div>
        
        {notes && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">{notes}</p>
          </div>
        )}
        
        <div className="mt-4 text-xs text-muted-foreground">
          Last updated: {formatDate(as_of)}
        </div>
      </CardContent>
    </Card>
  );
};