import { TrendingDown, TrendingUp, Users, DollarSign } from 'lucide-react';
import { MobileCard } from '../MobileCard';

interface CompetitorCardProps {
  competitorName?: string;
}

export const CompetitorCard = ({ competitorName = "TechCorp" }: CompetitorCardProps) => {
  return (
    <MobileCard title={`${competitorName} Performance`} category="competitor">
      <div className="space-y-8">
        {/* Main Metrics */}
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <DollarSign className="w-5 h-5 text-red-500" />
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-red-600 mb-1">-15.2%</div>
            <div className="text-sm text-muted-foreground">Revenue Growth</div>
            <div className="text-xs text-red-600 font-medium">3rd consecutive decline</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-red-500" />
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-red-600 mb-1">23.4%</div>
            <div className="text-sm text-muted-foreground">Market Share</div>
            <div className="text-xs text-red-600 font-medium">-2.1% this quarter</div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Key Insights</h3>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">
                <span className="font-medium">Product delays:</span> Major feature release pushed to Q2, causing customer dissatisfaction
              </p>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">
                <span className="font-medium">Leadership change:</span> CTO departure amid strategic disagreements
              </p>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">
                <span className="font-medium">Opportunity:</span> Market window opening for aggressive competitive positioning
              </p>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Recommended Action</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Accelerate product roadmap and increase marketing spend to capture displaced customers
          </p>
        </div>
      </div>
    </MobileCard>
  );
};