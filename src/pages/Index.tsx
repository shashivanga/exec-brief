import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

const Index = () => {
  const dashboardData = [
    {
      title: "Competitor Performance",
      category: "competitor" as const,
      metrics: [
        { label: "Market Share", value: "23.4%", trend: "down" as const, change: "-2.1%" },
        { label: "Revenue Growth", value: "-15.2%", trend: "down" as const, change: "Q3" }
      ],
      timestamp: "2 hours ago",
      sourceUrl: "#"
    },
    {
      title: "Industry Trends",
      category: "industry" as const,
      metrics: [
        { label: "AI Adoption Rate", value: "68%", trend: "up" as const, change: "+12%" },
        { label: "Market Growth", value: "$2.4B", trend: "up" as const, change: "+8.3%" }
      ],
      timestamp: "4 hours ago",
      sourceUrl: "#"
    },
    {
      title: "Company Health",
      category: "company" as const,
      metrics: [
        { label: "Customer Churn", value: "4.2%", trend: "up" as const, change: "+0.8%" },
        { label: "Monthly Revenue", value: "$1.2M", trend: "up" as const, change: "+5.4%" }
      ],
      timestamp: "1 hour ago",
      sourceUrl: "#"
    },
    {
      title: "Macro Economy",
      category: "macro" as const,
      metrics: [
        { label: "Interest Rates", value: "5.25%", trend: "down" as const, change: "-0.25%" },
        { label: "Tech Index", value: "4,287", trend: "up" as const, change: "+1.8%" }
      ],
      timestamp: "6 hours ago",
      sourceUrl: "#"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Executive Dashboard</h1>
          <p className="text-muted-foreground">
            Your daily briefing • Updated every few hours with AI-powered insights
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dashboardData.map((card, index) => (
            <DashboardCard
              key={index}
              title={card.title}
              category={card.category}
              metrics={card.metrics}
              timestamp={card.timestamp}
              sourceUrl={card.sourceUrl}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
