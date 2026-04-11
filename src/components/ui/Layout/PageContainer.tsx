import React from 'react'
import { Stack } from './Stack'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <Stack direction="column" className={className} h="100%" style={{ overflow: 'hidden' }}>
      {children}
    </Stack>
  )
}
