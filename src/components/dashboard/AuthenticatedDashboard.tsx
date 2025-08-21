import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from './DashboardLayout';
import { DashboardCard } from './DashboardCard';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Organization {
  id: string;
  name: string;
  plan: string;
  branding: any;
}

interface Dashboard {
  id: string;
  name: string;
  org_id: string;
  owner_id: string;
  is_default: boolean;
}

interface Card {
  id: string;
  title: string;
  data: any;
  sources: any[];
  template_key: string;
  position: number;
  pinned: boolean;
  hidden: boolean;
  refreshed_at: string;
  card_templates?: {
    title: string;
    description: string;
    type: string;
  };
}

interface DashboardData {
  organization: Organization;
  dashboard: Dashboard;
  cards: Card[];
}

const LoadingSpinner = () => (
  <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading your dashboard...</p>
    </div>
  </div>
);

export const AuthenticatedDashboard = () => {
  const { user, session } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !session) return;

  const loadDashboard = async () => {
      try {
        console.log('Loading dashboard for user:', user.id);
        
        // Try edge function first, fallback to direct DB queries
        try {
          const { data, error } = await supabase.functions.invoke('me-dashboard', {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (error) {
            console.log('Edge function not available, using fallback...');
            throw error;
          }

          if (data?.needsOnboarding) {
            console.log('User needs onboarding');
            setNeedsOnboarding(true);
            return;
          }

          if (data?.success) {
            console.log('Dashboard loaded successfully:', data);
            setDashboardData(data);
            return;
          }
        } catch (funcError) {
          console.log('Using direct database fallback...');
          
          // Fallback: Direct database queries
          // Check if user has org membership
          const { data: orgMemberships, error: memberError } = await supabase
            .from('org_members')
            .select(`
              org_id,
              organizations (
                id,
                name,
                plan,
                branding
              )
            `)
            .eq('user_id', user.id);

          if (memberError || !orgMemberships || orgMemberships.length === 0) {
            console.log('No organization found, needs onboarding');
            setNeedsOnboarding(true);
            return;
          }

          const orgId = orgMemberships[0].org_id;

          // Get user's default dashboard
          const { data: dashboard, error: dashboardError } = await supabase
            .from('dashboards')
            .select('*')
            .eq('org_id', orgId)
            .eq('owner_id', user.id)
            .eq('is_default', true)
            .maybeSingle();

          if (dashboardError) {
            console.error('Dashboard query error:', dashboardError);
            throw new Error('Failed to get user dashboard');
          }

          if (!dashboard) {
            console.log('No dashboard found, needs onboarding');
            setNeedsOnboarding(true);
            return;
          }

          // Get cards for the dashboard
          const { data: cards, error: cardsError } = await supabase
            .from('cards')
            .select('*')
            .eq('dashboard_id', dashboard.id)
            .eq('hidden', false)
            .order('pinned', { ascending: false })
            .order('position', { ascending: true });

          if (cardsError) {
            console.error('Cards query error:', cardsError);
            throw new Error('Failed to get dashboard cards');
          }

          console.log(`Loaded ${cards?.length || 0} cards via fallback`);
          
          setDashboardData({
            organization: orgMemberships[0].organizations,
            dashboard,
            cards: (cards || []).map(card => ({
              ...card,
              sources: Array.isArray(card.sources) ? card.sources : []
            }))
          });
        }
      } catch (err: any) {
        console.error('Dashboard load error:', err);
        toast({
          title: "Error",
          description: err.message || 'Failed to load dashboard',
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user, session, toast]);

  const handleStartOnboarding = () => {
    navigate('/onboarding');
  };

  const handleCardAction = async (cardId: string, action: 'pin' | 'hide') => {
    if (!session) return;

    try {
      const { data, error } = await supabase.functions.invoke('card-actions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { action, cardId }
      });

      if (error) throw error;

      if (data?.success) {
        // Update local state
        setDashboardData(prev => {
          if (!prev) return prev;
          
          const updatedCards = prev.cards.map(card => {
            if (card.id === cardId) {
              return {
                ...card,
                pinned: action === 'pin' ? data.pinned : card.pinned,
                hidden: action === 'hide' ? data.hidden : card.hidden
              };
            }
            return card;
          });

          return {
            ...prev,
            cards: updatedCards
          };
        });

        toast({
          title: "Success",
          description: data.message,
        });
      }
    } catch (err: any) {
      console.error('Card action error:', err);
      toast({
        title: "Error", 
        description: err.message || 'Failed to update card',
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (needsOnboarding) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">D</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">Decks</h1>
          </div>
          <h2 className="text-2xl font-bold mb-4">Welcome to Decks!</h2>
          <p className="text-muted-foreground mb-6">
            Let's set up your executive dashboard. This will only take a few minutes.
          </p>
          <Button onClick={handleStartOnboarding} size="lg">
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Dashboard Not Available</h2>
          <p className="text-muted-foreground mb-4">
            We couldn't load your dashboard. Please try again.
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Transform cards for DashboardCard component
  const transformedCards = dashboardData.cards
    .filter(card => !card.hidden)
    .sort((a, b) => {
      // Pinned cards first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      // Then by position
      return a.position - b.position;
    })
    .map(card => ({
      title: card.title || card.card_templates?.title || 'Untitled Card',
      metrics: extractMetrics(card.data),
      timestamp: card.refreshed_at ? new Date(card.refreshed_at).toLocaleString() : 'Not updated',
      sourceUrl: card.sources?.[0]?.url,
      category: mapTemplateKeyToCategory(card.template_key),
      cardId: card.id,
      pinned: card.pinned
    }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {dashboardData.dashboard.name}
            </h1>
            <p className="text-muted-foreground">
              {dashboardData.organization.name} • {transformedCards.length} cards
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transformedCards.map((card, index) => (
            <div key={`${card.cardId}-${index}`} className="relative group">
              <DashboardCard
                title={card.title}
                metrics={card.metrics}
                timestamp={card.timestamp}
                sourceUrl={card.sourceUrl}
                category={card.category}
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCardAction(card.cardId, 'pin')}
                    className="h-8 w-8 p-0"
                  >
                    {card.pinned ? '📍' : '📌'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCardAction(card.cardId, 'hide')}
                    className="h-8 w-8 p-0"
                  >
                    👁️
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {transformedCards.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No cards available</h3>
            <p className="text-muted-foreground">
              Add competitors and industry topics to see your dashboard come alive.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

// Helper functions
function extractMetrics(data: any): Array<{ label: string; value: string; trend?: 'up' | 'down'; change?: string }> {
  if (!data) return [];
  
  const metrics: Array<{ label: string; value: string; trend?: 'up' | 'down'; change?: string }> = [];
  
  if (data.headlines && Array.isArray(data.headlines)) {
    metrics.push({
      label: 'Latest Updates',
      value: `${data.headlines.length} items`
    });
  }
  
  if (data.bullets && Array.isArray(data.bullets)) {
    metrics.push({
      label: 'Key Insights',
      value: `${data.bullets.length} points`
    });
  }

  if (data.kpis && Array.isArray(data.kpis)) {
    data.kpis.slice(0, 2).forEach((kpi: any) => {
      metrics.push({
        label: kpi.name || 'KPI',
        value: kpi.value || '—',
        change: kpi.delta
      });
    });
  }
  
  return metrics.slice(0, 3); // Limit to 3 metrics per card
}

function mapTemplateKeyToCategory(templateKey: string): 'competitor' | 'industry' | 'company' | 'macro' | undefined {
  const mapping: Record<string, 'competitor' | 'industry' | 'company' | 'macro'> = {
    competitor_overview: 'competitor',
    industry_news: 'industry',
    company_health: 'company',
    product_metrics: 'company',
    macro_snapshot: 'macro'
  };
  
  return mapping[templateKey];
}