import { AuthProvider } from '@/context/AuthContext'
import Sidebar from '@/components/layout/Sidebar'
import UserRosterSidebar from '@/components/layout/UserRosterSidebar'
import { InventoryNavBar } from '@/components/ui/InventoryNavBar'
import { Stack } from '@/components/ui/Layout/Stack'
import { Box } from '@/components/ui/Layout/Box'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-full w-full overflow-hidden">
        <Sidebar aria-label="Main Navigation" />
        <main className="flex-1 overflow-hidden flex flex-col grid-paper">
          {children}
        </main>
        <UserRosterSidebar aria-label="Member List" />
      </div>
      <InventoryNavBar />
    </AuthProvider>
  )
}
