import { AuthProvider } from '@/context/AuthContext'
import { SpriteUrlProvider } from '@/context/SpriteUrlContext'
import Sidebar from '@/components/layout/Sidebar'
import UserRosterSidebar from '@/components/layout/UserRosterSidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* SpriteUrlProvider fires ONE fetch on mount to get signed CDN URLs for
          all ~130 sprites. CharacterSprite uses these URLs directly — no per-image
          server roundtrip. Cached in sessionStorage for 100 minutes. */}
      <SpriteUrlProvider>
        <div className="app-shell">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
          <UserRosterSidebar />
        </div>
      </SpriteUrlProvider>
    </AuthProvider>
  )
}
