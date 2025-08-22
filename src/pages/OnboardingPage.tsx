import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'

export function OnboardingPage() {
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const { session } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    try {
      const response = await fetch(`https://pbfqdfipjnaqhoxhlitw.supabase.co/functions/v1/onboarding-start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          fullName: fullName.trim() || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete onboarding')
      }

      toast({
        title: "Welcome!",
        description: "Your dashboard has been set up successfully.",
      })

      // Store dashboard info in localStorage for quick access
      localStorage.setItem('current_org', JSON.stringify({
        id: data.user.id,
        name: 'Personal',
        dashboard_id: data.dashboard.id
      }))

      navigate('/')
    } catch (error) {
      console.error('Onboarding error:', error)
      toast({
        title: "Onboarding Failed",
        description: error instanceof Error ? error.message : "Failed to set up your dashboard",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Welcome!</CardTitle>
          <CardDescription className="text-center">
            Let's set up your personal dashboard to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Your Name (optional)</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Setting up...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}