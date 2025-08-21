import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { signOut, user } = useAuth()

  const handleSignOut = async () => {
    localStorage.removeItem('current_org')
    await signOut()
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Global header */}
        <header className="fixed top-0 left-0 right-0 h-12 flex items-center justify-between border-b bg-background z-50 px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="font-semibold">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="flex w-full pt-12">
          <AppSidebar />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}