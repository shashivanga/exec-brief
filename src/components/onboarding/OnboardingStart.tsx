import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface OnboardingData {
  name: string;
  orgName: string;
}

export const OnboardingStart = () => {
  const { user, session } = useAuth();
  const [formData, setFormData] = useState<OnboardingData>({
    name: user?.user_metadata?.full_name || '',
    orgName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !user) return;

    setLoading(true);
    setError('');

    try {
      console.log('Starting onboarding with:', formData);
      
      // Try edge function first, fallback to direct DB operations
      try {
        const { data, error } = await supabase.functions.invoke('onboarding-start', {
          body: {
            name: formData.name,
            orgName: formData.orgName
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          console.log('Edge function not available, using fallback...');
          throw error;
        }

        if (data?.success) {
          console.log('Onboarding completed successfully:', data);
          
          toast({
            title: "Welcome to Decks!",
            description: "Your organization and dashboard have been created successfully.",
          });

          // Mark onboarding as completed
          localStorage.setItem('decks-onboarding-completed', 'true');
          
          // Navigate to dashboard
          navigate('/', { replace: true });
          return;
        }
      } catch (funcError) {
        console.log('Using direct database fallback for onboarding...');
        
        // Fallback: Direct database operations
        // 1. Create organization
        console.log('Creating organization:', formData.orgName);
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: formData.orgName,
            plan: 'free'
          })
          .select()
          .single();

        if (orgError) {
          console.error('Organization creation error:', orgError);
          throw new Error('Failed to create organization: ' + orgError.message);
        }

        console.log('Organization created:', org);

        // 2. Create profile if it doesn't exist
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!existingProfile) {
          console.log('Creating user profile');
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              full_name: formData.name,
              timezone: 'America/New_York'
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Don't fail onboarding for profile creation
          }
        }

        // 3. Add user to org_members
        console.log('Adding user to organization:', { org_id: org.id, user_id: user.id });
        const { error: memberError } = await supabase
          .from('org_members')
          .insert({
            org_id: org.id,
            user_id: user.id,
            role: 'admin'
          });

        if (memberError) {
          console.error('Membership creation error:', memberError);
          throw new Error('Failed to add user to organization: ' + memberError.message);
        }

        console.log('User added to organization successfully');

        // 3. Create default dashboard
        const { data: dashboard, error: dashboardError } = await supabase
          .from('dashboards')
          .insert({
            org_id: org.id,
            owner_id: user.id,
            name: 'Main Dashboard',
            is_default: true,
            is_shared: false
          })
          .select()
          .single();

        if (dashboardError) {
          console.error('Dashboard creation error:', dashboardError);
          throw new Error('Failed to create dashboard');
        }

        // 4. Seed cards with placeholder data
        const cardTemplates = [
          {
            template_key: 'competitor_overview',
            title: 'Competitor Overview',
            position: 1,
            data: {
              competitor: 'Getting started...',
              headlines: [
                { title: 'Welcome to your executive dashboard', url: '#', ts: new Date().toISOString() },
                { title: 'Add competitors to see real-time updates', url: '#', ts: new Date().toISOString() }
              ],
              last_refreshed: new Date().toISOString()
            },
            sources: [
              { title: 'Getting Started Guide', url: '#' }
            ]
          },
          {
            template_key: 'industry_news',
            title: 'Industry News',
            position: 2,
            data: {
              topic: 'Industry Trends',
              headlines: [
                { title: 'Your industry insights will appear here', url: '#', ts: new Date().toISOString() },
                { title: 'Configure industry topics to get started', url: '#', ts: new Date().toISOString() }
              ],
              last_refreshed: new Date().toISOString()
            },
            sources: [
              { title: 'Industry Setup Guide', url: '#' }
            ]
          },
          {
            template_key: 'company_health',
            title: 'Company Health',
            position: 3,
            data: {
              bullets: [
                'Upload documents to see AI-powered insights',
                'Import KPIs via Excel to track performance',
                'Monitor key metrics and trends'
              ],
              last_refreshed: new Date().toISOString()
            },
            sources: [
              { title: 'Company Health Setup', url: '#' }
            ]
          },
          {
            template_key: 'macro_snapshot',
            title: 'Market Overview',
            position: 4,
            data: {
              indicators: ['Ready to track market indicators'],
              market_data: ['Economic trends will appear here'],
              summary: 'Configure your market tracking preferences',
              last_refreshed: new Date().toISOString()
            },
            sources: [
              { title: 'Market Setup Guide', url: '#' }
            ]
          }
        ];

        const cardsToInsert = cardTemplates.map(template => ({
          org_id: org.id,
          dashboard_id: dashboard.id,
          template_key: template.template_key,
          title: template.title,
          position: template.position,
          data: template.data,
          sources: template.sources,
          size: 'm',
          pinned: false,
          hidden: false,
          refreshed_at: new Date().toISOString()
        }));

        const { data: cards, error: cardsError } = await supabase
          .from('cards')
          .insert(cardsToInsert)
          .select();

        if (cardsError) {
          console.error('Cards creation error:', cardsError);
          throw new Error('Failed to create dashboard cards');
        }

        console.log(`Created organization and ${cards.length} cards via fallback`);
        
        // Verify the organization was created and user is a member
        const { data: verifyMembership, error: verifyError } = await supabase
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

        if (verifyError || !verifyMembership || verifyMembership.length === 0) {
          console.error('Verification failed:', verifyError);
          throw new Error('Failed to verify organization setup');
        }

        console.log('Organization setup verified:', verifyMembership);
        
        toast({
          title: "Welcome to Decks!",
          description: "Your organization and dashboard have been created successfully.",
        });

        // Mark onboarding as completed with timestamp
        localStorage.setItem('decks-onboarding-completed', Date.now().toString());
        
        // Small delay to ensure database consistency, then navigate
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 100);
      }
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">D</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">Decks</h1>
          </div>
          <CardTitle>Set Up Your Dashboard</CardTitle>
          <CardDescription>
            Let's create your organization and executive dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Your Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div>
              <Input
                type="text"
                placeholder="Organization Name"
                value={formData.orgName}
                onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !formData.name.trim() || !formData.orgName.trim()}
            >
              {loading ? 'Setting up...' : 'Create Dashboard'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};