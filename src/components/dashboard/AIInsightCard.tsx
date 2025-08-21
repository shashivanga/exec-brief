import { Sparkles, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AIInsight {
  type: 'risk' | 'opportunity' | 'neutral';
  text: string;
}

interface AIInsightCardProps {
  insights?: AIInsight[];
  sources?: Array<{
    title: string;
    url: string;
  }>;
  timestamp?: string;
}

const defaultInsights: AIInsight[] = [
  {
    type: 'risk',
    text: 'Customer churn trending upward (+8% MoM) - immediate retention strategy needed'
  },
  {
    type: 'opportunity', 
    text: 'Competitor product delays create 6-month market window for aggressive positioning'
  },
  {
    type: 'neutral',
    text: 'AI adoption rates accelerating 40% faster than projected across enterprise segment'
  }
];

const defaultSources = [
  { title: 'Q4 Customer Analytics Report', url: '#' },
  { title: 'TechCorp Earnings Call Transcript', url: '#' },
  { title: 'Gartner AI Enterprise Survey 2024', url: '#' }
];

const getInsightIcon = (type: string) => {
  switch (type) {
    case 'risk':
      return '🚩';
    case 'opportunity':
      return '⭐';
    default:
      return '📊';
  }
};

const getInsightColor = (type: string) => {
  switch (type) {
    case 'risk':
      return 'text-red-600';
    case 'opportunity':
      return 'text-yellow-600';
    default:
      return 'text-blue-600';
  }
};

export const AIInsightCard = ({ 
  insights = defaultInsights,
  sources = defaultSources,
  timestamp = "5 minutes ago"
}: AIInsightCardProps) => {
  const handleSourceClick = (url: string, title: string) => {
    if (url === '#') {
      // Mock behavior for demo
      window.open('https://example.com', '_blank');
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <Card className="bg-dashboard-card hover:shadow-lg transition-all duration-200 border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg font-semibold text-foreground leading-tight flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>AI Summary</span>
            </CardTitle>
            <Badge variant="outline" className="text-xs bg-primary/10 border-primary/20 text-primary">
              AI-Generated Insights
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Top 3 Takeaways */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Key Takeaways</h3>
            <div className="space-y-3">
              {insights.slice(0, 3).map((insight, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="text-base">{getInsightIcon(insight.type)}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${getInsightColor(insight.type)}`}>
                    {insight.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Source Links */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Source Links
              </h4>
              <span className="text-xs text-muted-foreground">
                {sources.length} sources
              </span>
            </div>
            
            <div className="space-y-2">
              {sources.map((source, index) => (
                <button
                  key={index}
                  onClick={() => handleSourceClick(source.url, source.title)}
                  className="flex items-center justify-between w-full p-2 rounded-md hover:bg-muted/50 transition-colors group text-left"
                >
                  <span className="text-xs text-foreground group-hover:text-primary transition-colors truncate">
                    {source.title}
                  </span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

          {/* Timestamp */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Generated {timestamp}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};