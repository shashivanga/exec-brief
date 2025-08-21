import { Sparkles, ExternalLink } from 'lucide-react';
import { MobileCard } from '../MobileCard';
import { Badge } from '@/components/ui/badge';

interface AIInsight {
  type: 'risk' | 'opportunity' | 'neutral';
  text: string;
}

const insights: AIInsight[] = [
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

const sources = [
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

export const AIInsightMobileCard = () => {
  const handleSourceClick = (url: string) => {
    window.open('https://example.com', '_blank');
  };

  return (
    <MobileCard title="AI Summary" category="briefing">
      <div className="space-y-6">
        {/* AI Badge */}
        <div className="flex items-center justify-center">
          <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Generated Insights
          </Badge>
        </div>

        {/* Key Takeaways */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground text-center">Key Takeaways</h3>
          
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-card/50 rounded-lg border border-border/50">
                <div className="flex-shrink-0 mt-1">
                  <span className="text-xl">{getInsightIcon(insight.type)}</span>
                </div>
                <p className={`text-sm leading-relaxed ${getInsightColor(insight.type)} font-medium`}>
                  {insight.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Source Links */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide text-center">
            Source Links ({sources.length})
          </h4>
          
          <div className="space-y-2">
            {sources.map((source, index) => (
              <button
                key={index}
                onClick={() => handleSourceClick(source.url)}
                className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-muted/50 transition-colors group text-left bg-card/30 border border-border/30"
              >
                <span className="text-sm text-foreground group-hover:text-primary transition-colors truncate">
                  {source.title}
                </span>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>

        {/* Generation Info */}
        <div className="text-center pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Generated 5 minutes ago
          </p>
        </div>
      </div>
    </MobileCard>
  );
};