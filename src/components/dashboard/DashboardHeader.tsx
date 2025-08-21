import { User, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

export const DashboardHeader = () => {
  const navigate = useNavigate();

  const handleRestartOnboarding = () => {
    try {
      localStorage.removeItem('decks-onboarding-completed');
      localStorage.removeItem('decks-onboarding');
      navigate('/onboarding', { replace: true });
    } catch (error) {
      console.error('Error restarting onboarding:', error);
    }
  };

  return (
    <header className="bg-dashboard-sidebar border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">D</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">Decks</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Bell className="w-4 h-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover border border-border shadow-lg z-50">
              <DropdownMenuItem 
                onClick={handleRestartOnboarding}
                className="cursor-pointer hover:bg-muted"
              >
                <Settings className="w-4 h-4 mr-2" />
                Update Preferences
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};