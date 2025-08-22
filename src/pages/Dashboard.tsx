import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DashboardCard {
  id: string
  title: string
  type: string
  data: any
  position: number
  pinned: boolean
}

export function DashboardPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [cards, setCards] = useState<DashboardCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      initializeDashboard()
    }
  }, [session])

  const initializeDashboard = async () => {
    if (!session?.access_token) return
    
    try {
      // Try to fetch existing cards first
      const response = await fetch(`https://pbfqdfipjnaqhoxhlitw.supabase.co/functions/v1/me-dashboard`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCards(data.cards || [])
      } else if (response.status === 404) {
        // No dashboard found, create one
        await createDashboard()
      }
    } catch (error) {
      console.error('Failed to initialize dashboard:', error)
      // Try to create dashboard on error
      await createDashboard()
    } finally {
      setLoading(false)
    }
  }

  const createDashboard = async () => {
    if (!session?.access_token) return
    
    try {
      const response = await fetch(`https://pbfqdfipjnaqhoxhlitw.supabase.co/functions/v1/onboarding-start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({})
      })

      if (response.ok) {
        const data = await response.json()
        setCards(data.cards || [])
        
        // Store dashboard info in localStorage for quick access
        localStorage.setItem('current_org', JSON.stringify({
          id: data.user.id,
          name: 'Personal',
          dashboard_id: data.dashboard.id
        }))
      }
    } catch (error) {
      console.error('Failed to create dashboard:', error)
    }
  }

  const getCategoryColor = (type: string) => {
    switch (type) {
      case 'competitor': return 'bg-red-100 text-red-800'
      case 'industry': return 'bg-blue-100 text-blue-800'
      case 'company_health': return 'bg-green-100 text-green-800'
      case 'metrics': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{card.title}</CardTitle>
                <Badge variant="secondary" className={getCategoryColor(card.type)}>
                  {card.type.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {card.data?.placeholder ? (
                <CardDescription>{card.data.message}</CardDescription>
              ) : card.data?.headlines && card.data.headlines.length > 0 ? (
                <div className="space-y-3">
                  {card.data.headlines
                    .filter((headline: any, index: number, array: any[]) => 
                      array.findIndex((h: any) => h.title === headline.title) === index
                    )
                    .slice(0, 3)
                    .map((headline: any, index: number) => (
                    <div key={index} className="text-sm">
                      <a 
                        href={headline.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium line-clamp-2"
                      >
                        {headline.title}
                      </a>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(headline.ts).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {card.data.last_refreshed && (
                    <div className="text-xs text-muted-foreground border-t pt-2 mt-3">
                      Last updated: {new Date(card.data.last_refreshed).toLocaleString()}
                    </div>
                  )}
                </div>
              ) : (
                <CardDescription>No data available yet</CardDescription>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {cards.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
          <h3 className="text-lg font-medium mb-2">No Cards Found</h3>
          <p className="text-muted-foreground mb-4">
            Your dashboard cards will appear here once they're created.
          </p>
        </div>
      )}
    </div>
  )
}