import { AuthProvider } from '@/context/AuthContext'
import Sidebar from '@/components/layout/Sidebar'
import UserRosterSidebar from '@/components/layout/UserRosterSidebar'
import { InventoryNavBar } from '@/components/ui/InventoryNavBar'
import { Stack } from '@/components/ui/Layout/Stack'
import { Box } from '@/components/ui/Layout/Box'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Stack direction="row" h="100vh" style={{ overflow: 'hidden', background: '#112615' }}>
        <Sidebar />
        <Box as="main" style={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {children}
        </Box>
        <UserRosterSidebar />
      </Stack>
      <InventoryNavBar />
    </AuthProvider>
  )
}
