import React from 'react'
import { Box } from './Box'

interface PageContentProps {
  children: React.ReactNode
  className?: string
  centered?: boolean
}

export function PageContent({ children, className = '', centered = false }: PageContentProps) {
  return (
    <Box
      p="space-6"
      className={className}
      style={{
        flex: 1,
        overflowY: 'auto',
        display: centered ? 'flex' : 'block',
        flexDirection: centered ? 'column' : undefined,
        alignItems: centered ? 'center' : undefined,
        justifyContent: centered ? 'center' : undefined,
      }}
    >
      {children}
    </Box>
  )
}
