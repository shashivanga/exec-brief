import { TrendingUp, Zap, Target, Globe } from 'lucide-react';
import { MobileCard } from '../MobileCard';

interface IndustryCardProps {
  industryName?: string;
}

export const IndustryCard = ({ industryName = "Technology" }: IndustryCardProps) => {
  return (
    <MobileCard title={`${industryName} Trends`} category="industry">
      <div className="space-y-8">
        {/* Main Metrics */}
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-blue-500" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-1">68%</div>
            <div className="text-sm text-muted-foreground">AI Adoption Rate</div>
            <div className="text-xs text-green-600 font-medium">+12% this quarter</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Globe className="w-5 h-5 text-blue-500" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-1">$2.4B</div>
            <div className="text-sm text-muted-foreground">Market Growth</div>
            <div className="text-xs text-green-600 font-medium">+8.3% YoY</div>
          </div>
        </div>

        {/* Trend Analysis */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Market Drivers</h3>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-blue-600">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Enterprise AI Integration Surge
                </p>
                <p className="text-xs text-muted-foreground">
                  Fortune 500 companies accelerating automation initiatives, driving $180B in new contracts
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-blue-600">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Regulatory Framework Clarity
                </p>
                <p className="text-xs text-muted-foreground">
                  New compliance standards reducing uncertainty, boosting enterprise confidence
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-blue-600">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Talent Acquisition Shift
                </p>
                <p className="text-xs text-muted-foreground">
                  Remote-first policies expanding talent pools, reducing hiring costs by 25%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Strategic Insight */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Market Opportunity</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Mid-market segment underserved - 40% growth potential with tailored solutions
          </p>
        </div>
      </div>
    </MobileCard>
  );
};