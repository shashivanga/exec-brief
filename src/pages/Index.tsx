import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { FileUploadSection } from "@/components/upload/FileUploadSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if onboarding is completed
    const onboardingCompleted = localStorage.getItem('decks-onboarding-completed');
    if (!onboardingCompleted) {
      navigate('/onboarding');
    }
  }, [navigate]);

  // Get onboarding data for personalization
  const getOnboardingData = () => {
    try {
      const data = localStorage.getItem('decks-onboarding');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  };

  const onboardingData = getOnboardingData();

  const getDashboardData = () => {
    // Base dashboard data that gets personalized based on onboarding
    const baseData = [
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

    // Personalize based on onboarding data
    if (onboardingData?.competitors?.length > 0) {
      baseData[0].title = `${onboardingData.competitors[0]} Performance`;
    }
    
    if (onboardingData?.industry) {
      const industryLabels: Record<string, string> = {
        technology: "Technology Sector",
        healthcare: "Healthcare Industry", 
        financial: "Financial Services",
        manufacturing: "Manufacturing Sector",
        retail: "Retail Market",
        energy: "Energy Sector",
        automotive: "Automotive Industry"
      };
      baseData[1].title = `${industryLabels[onboardingData.industry] || "Industry"} Trends`;
    }

    return baseData;
  };

  const dashboardData = getDashboardData();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Executive Dashboard
            {onboardingData?.industry && (
              <span className="text-lg text-muted-foreground ml-2 font-normal">
                • {onboardingData.industry.charAt(0).toUpperCase() + onboardingData.industry.slice(1)}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">
            Your daily briefing • Updated every few hours with AI-powered insights
            {onboardingData?.competitors?.length > 0 && (
              <span className="ml-2">
                • Tracking {onboardingData.competitors.length} competitor{onboardingData.competitors.length > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-6">
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
          </TabsContent>
          
          <TabsContent value="upload" className="mt-6">
            <FileUploadSection />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Index;
