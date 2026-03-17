import { AuthProvider } from '@/context/AuthContext'
import Sidebar from '@/components/layout/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}
