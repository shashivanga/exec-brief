import { TrendingUp, TrendingDown, Users, DollarSign, Heart, Target } from 'lucide-react';
import { MobileCard } from '../MobileCard';

export const CompanyCard = () => {
  return (
    <MobileCard title="Company Health" category="company">
      <div className="space-y-8">
        {/* Main Metrics */}
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">$1.2M</div>
            <div className="text-sm text-muted-foreground">Monthly Revenue</div>
            <div className="text-xs text-green-600 font-medium">+5.4% growth</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Users className="w-5 h-5 text-red-500" />
              <TrendingUp className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-red-600 mb-1">4.2%</div>
            <div className="text-sm text-muted-foreground">Customer Churn</div>
            <div className="text-xs text-red-600 font-medium">+0.8% this month</div>
          </div>
        </div>

        {/* Health Indicators */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Health Metrics</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-3">
                <Heart className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Employee Satisfaction</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-green-600">87%</div>
                <div className="text-xs text-green-600">+3% improvement</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-3">
                <Target className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Customer NPS</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-green-600">72</div>
                <div className="text-xs text-green-600">Industry leading</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium">Burn Rate</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-yellow-600">$180K</div>
                <div className="text-xs text-yellow-600">18 months runway</div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Actions */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Priority Actions</h3>
          
          <div className="space-y-2">
            <div className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Urgent: Address Churn</p>
                <p className="text-xs text-muted-foreground">
                  Implement customer success program to reduce monthly churn by 2%
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Growth: Scale Revenue</p>
                <p className="text-xs text-muted-foreground">
                  Enterprise segment showing 40% conversion rate - expand sales team
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MobileCard>
  );
};