import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [hasOrg, setHasOrg] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if user has completed onboarding
    const orgData = localStorage.getItem('current_org')
    if (!orgData) {
      // No org in localStorage, redirect to onboarding
      navigate('/auth-onboarding')
      return
    }
    
    setHasOrg(true)
  }, [navigate])

  if (hasOrg === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
          <h3 className="text-lg font-medium mb-2">Dashboard Cards Coming Soon</h3>
          <p className="text-muted-foreground mb-4">
            Your personalized cards will appear here once we implement the dashboard logic.
          </p>
          <p className="text-sm text-muted-foreground">
            Next: We'll add card fetching and display functionality.
          </p>
        </div>
      </div>
    </div>
  )
}