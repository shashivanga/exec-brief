import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-dashboard-bg">
      <DashboardHeader />
      <div className="flex">
        <main className="flex-1 p-6">
          {children}
        </main>
        <DashboardSidebar />
      </div>
    </div>
  );
};