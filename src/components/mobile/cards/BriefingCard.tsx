import { Calendar, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { MobileCard } from '../MobileCard';
import { Badge } from '@/components/ui/badge';

interface BriefingItem {
  icon: string;
  type: 'risk' | 'opportunity' | 'update';
  title: string;
  description: string;
}

const briefingItems: BriefingItem[] = [
  {
    icon: '🚨',
    type: 'risk',
    title: 'Customer Churn Alert',
    description: 'Churn rate increased 8% MoM - review retention strategies'
  },
  {
    icon: '💡',
    type: 'opportunity', 
    title: 'Competitor Weakness',
    description: 'TechCorp revenue down 15% for 3rd consecutive quarter'
  },
  {
    icon: '📈',
    type: 'update',
    title: 'Market Growth',
    description: 'AI adoption rates surged 40% across industry verticals'
  }
];

const getTypeColor = (type: string) => {
  switch (type) {
    case 'risk':
      return 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400';
    case 'opportunity':
      return 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-800 dark:text-green-400';
    case 'update':
      return 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-400';
    default:
      return 'bg-muted border-border text-muted-foreground';
  }
};

export const BriefingCard = () => {
  return (
    <MobileCard title="Daily Briefing" category="briefing">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            3 insights
          </Badge>
        </div>

        <div className="space-y-4">
          {briefingItems.map((item, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-foreground text-sm leading-tight">
                      {item.title}
                    </h3>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getTypeColor(item.type)}`}
                    >
                      {item.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
              {index < briefingItems.length - 1 && (
                <div className="border-b border-border/50 ml-13" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Swipe to explore detailed insights →
            </span>
          </div>
        </div>
      </div>
    </MobileCard>
  );
};