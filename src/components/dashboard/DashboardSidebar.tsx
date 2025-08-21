import { Calendar, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExportModal } from "@/components/export/ExportModal";
import { useState } from "react";

interface BriefingItem {
  title: string;
  description: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  type: 'risk' | 'opportunity' | 'update';
}

const briefingItems: BriefingItem[] = [
  {
    title: "Competitor Analysis Alert",
    description: "TechCorp revenue declined 15% for 3rd consecutive quarter",
    timestamp: "2 hours ago",
    priority: "high",
    type: "opportunity"
  },
  {
    title: "Market Trend Shift",
    description: "AI adoption rates increased 40% across industry verticals",
    timestamp: "4 hours ago", 
    priority: "medium",
    type: "update"
  },
  {
    title: "Company Health Warning",
    description: "Customer churn rate trending upward (+8% MoM)",
    timestamp: "6 hours ago",
    priority: "high", 
    type: "risk"
  }
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-50 border-red-200 text-red-700';
    case 'medium':
      return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    case 'low':
      return 'bg-green-50 border-green-200 text-green-700';
    default:
      return 'bg-muted border-border text-muted-foreground';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'risk':
      return '🚨';
    case 'opportunity':
      return '💡';
    case 'update':
      return '📊';
    default:
      return '📌';
  }
};

export const DashboardSidebar = () => {
  const [showExportModal, setShowExportModal] = useState(false);

  // Mock dashboard data for export
  const dashboardData = [
    {
      title: "Competitor Performance",
      category: "competitor",
      metrics: [
        { label: "Market Share", value: "23.4%", trend: "down" as const, change: "-2.1%" },
        { label: "Revenue Growth", value: "-15.2%", trend: "down" as const, change: "Q3" }
      ],
      timestamp: "2 hours ago"
    },
    {
      title: "Industry Trends", 
      category: "industry",
      metrics: [
        { label: "AI Adoption Rate", value: "68%", trend: "up" as const, change: "+12%" },
        { label: "Market Growth", value: "$2.4B", trend: "up" as const, change: "+8.3%" }
      ],
      timestamp: "4 hours ago"
    },
    {
      title: "Company Health",
      category: "company", 
      metrics: [
        { label: "Customer Churn", value: "4.2%", trend: "up" as const, change: "+0.8%" },
        { label: "Monthly Revenue", value: "$1.2M", trend: "up" as const, change: "+5.4%" }
      ],
      timestamp: "1 hour ago"
    },
    {
      title: "Macro Economy",
      category: "macro",
      metrics: [
        { label: "Interest Rates", value: "5.25%", trend: "down" as const, change: "-0.25%" },
        { label: "Tech Index", value: "4,287", trend: "up" as const, change: "+1.8%" }
      ],
      timestamp: "6 hours ago"
    }
  ];
  return (
    <aside className="w-80 bg-dashboard-sidebar border-l border-border p-6 overflow-y-auto">
      <div className="space-y-6">
        {/* Daily Briefing Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Daily Briefing</span>
          </h2>
          <Badge variant="outline" className="text-xs">
            Today
          </Badge>
        </div>

        {/* Briefing Items */}
        <div className="space-y-4">
          {briefingItems.map((item, index) => (
            <Card key={index} className="bg-card border-border hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2">
                      <span className="text-lg">{getTypeIcon(item.type)}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-foreground leading-tight">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(item.priority)}`}
                    >
                      {item.priority}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{item.timestamp}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Export CTA */}
        <Card className="bg-primary text-primary-foreground border-0">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <h3 className="font-semibold text-sm">Export Dashboard</h3>
              </div>
              <p className="text-xs opacity-90 leading-relaxed">
                Generate a branded PDF report of your daily insights for meetings and stakeholder updates.
              </p>
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full mt-3 bg-white/10 hover:bg-white/20 border-white/20 text-white"
                onClick={() => setShowExportModal(true)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Export as PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Modal */}
      <ExportModal 
        open={showExportModal}
        onOpenChange={setShowExportModal}
        dashboardData={dashboardData}
      />
    </aside>
  );
};