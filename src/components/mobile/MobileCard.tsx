import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  category?: string;
}

const getCategoryColor = (category?: string) => {
  switch (category) {
    case 'briefing':
      return 'bg-gradient-to-br from-primary/20 to-primary/5';
    case 'competitor':
      return 'bg-gradient-to-br from-red-50 to-red-25 dark:from-red-950/20 dark:to-red-950/5';
    case 'industry':
      return 'bg-gradient-to-br from-blue-50 to-blue-25 dark:from-blue-950/20 dark:to-blue-950/5';
    case 'company':
      return 'bg-gradient-to-br from-green-50 to-green-25 dark:from-green-950/20 dark:to-green-950/5';
    case 'macro':
      return 'bg-gradient-to-br from-purple-50 to-purple-25 dark:from-purple-950/20 dark:to-purple-950/5';
    default:
      return 'bg-dashboard-card';
  }
};

export const MobileCard = ({ children, className, title, category }: MobileCardProps) => {
  return (
    <Card className={cn(
      "h-full w-full flex flex-col border-0 shadow-none",
      getCategoryColor(category),
      className
    )}>
      <div className="flex-1 flex flex-col p-6">
        {title && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-1">{title}</h2>
            {category && category !== 'briefing' && (
              <div className="text-sm text-muted-foreground capitalize">
                {category} insights
              </div>
            )}
          </div>
        )}
        <div className="flex-1 flex flex-col justify-center">
          {children}
        </div>
      </div>
    </Card>
  );
};