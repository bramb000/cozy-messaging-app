'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItemProps {
  href: string
  icon: string
  label: string
}

export default function NavItem({ href, icon, label }: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link href={href} className={`nav-item ${isActive ? 'active' : ''}`}>
      <span className="nav-item-icon">{icon}</span>
      <span>{label}</span>
    </Link>
  )
}
