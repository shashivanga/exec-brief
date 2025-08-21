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
        console.error('Function error:', error);
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
      } else {
        throw new Error(data?.error || 'Failed to complete onboarding');
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