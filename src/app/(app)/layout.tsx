import { AuthProvider } from '@/context/AuthContext'
import Sidebar from '@/components/layout/Sidebar'
import { InventoryNavBar } from '@/components/ui/InventoryNavBar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
        <InventoryNavBar />
      </div>
    </AuthProvider>
  )
}
