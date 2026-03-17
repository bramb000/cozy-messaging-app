import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cozy Corner — A Pixel Chat World',
  description: 'A cozy pixel-art community — chat, hang out, and roam a 2D world with friends.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="pixel-bg">{children}</body>
    </html>
  )
}
