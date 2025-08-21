import { TrendingDown, TrendingUp, Percent, BarChart3, AlertTriangle } from 'lucide-react';
import { MobileCard } from '../MobileCard';

export const MacroCard = () => {
  return (
    <MobileCard title="Macro Economy" category="macro">
      <div className="space-y-8">
        {/* Main Metrics */}
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Percent className="w-5 h-5 text-purple-500" />
              <TrendingDown className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-1">5.25%</div>
            <div className="text-sm text-muted-foreground">Interest Rates</div>
            <div className="text-xs text-green-600 font-medium">-0.25% this month</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-1">4,287</div>
            <div className="text-sm text-muted-foreground">Tech Index</div>
            <div className="text-xs text-green-600 font-medium">+1.8% today</div>
          </div>
        </div>

        {/* Economic Indicators */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Key Indicators</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">GDP Growth</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-green-600">+2.4%</div>
                <div className="text-xs text-muted-foreground">Q4 annualized</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-3">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">Inflation Rate</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-red-600">3.2%</div>
                <div className="text-xs text-muted-foreground">-0.4% MoM</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Employment</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-green-600">3.7%</div>
                <div className="text-xs text-muted-foreground">Unemployment rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Market Outlook */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Market Outlook</h3>
          
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Positive Momentum</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Fed rate cuts supporting business investment, tech sector showing resilience with strong earnings forecasts
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Monitor Closely</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Geopolitical tensions and supply chain volatility remain key risk factors for Q1 planning
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MobileCard>
  );
};