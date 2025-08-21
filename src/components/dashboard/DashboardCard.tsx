import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Metric {
  label: string;
  value: string;
  trend?: 'up' | 'down';
  change?: string;
}

interface DashboardCardProps {
  title: string;
  metrics: Metric[];
  timestamp: string;
  sourceUrl?: string;
  category?: 'competitor' | 'industry' | 'company' | 'macro';
}

const getCategoryColor = (category?: string) => {
  switch (category) {
    case 'competitor':
      return 'bg-red-50 border-red-200 text-red-700';
    case 'industry':
      return 'bg-blue-50 border-blue-200 text-blue-700';
    case 'company':
      return 'bg-green-50 border-green-200 text-green-700';
    case 'macro':
      return 'bg-purple-50 border-purple-200 text-purple-700';
    default:
      return 'bg-muted border-border text-muted-foreground';
  }
};

export const DashboardCard = ({ 
  title, 
  metrics, 
  timestamp, 
  sourceUrl, 
  category 
}: DashboardCardProps) => {
  return (
    <Card className="bg-dashboard-card hover:shadow-lg transition-all duration-200 border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg font-semibold text-foreground leading-tight">
              {title}
            </CardTitle>
            {category && (
              <Badge 
                variant="outline" 
                className={`text-xs capitalize ${getCategoryColor(category)}`}
              >
                {category}
              </Badge>
            )}
          </div>
          {sourceUrl && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground p-1"
              onClick={() => window.open(sourceUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  {metric.label}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {metric.value}
                </p>
              </div>
              {metric.trend && metric.change && (
                <div className={`flex items-center space-x-1 ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">{metric.change}</span>
                </div>
              )}
            </div>
          ))}
          
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Updated {timestamp}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};