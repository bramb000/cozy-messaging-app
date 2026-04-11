import React from 'react'
import { Stack } from './Stack'
import { Box } from './Box'
import { Text } from '../Typography/Text'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  rightContent?: React.ReactNode
}

export function PageHeader({ title, subtitle, icon, rightContent }: PageHeaderProps) {
  return (
    <Stack
      as="header"
      direction="row"
      align="center"
      justify="space-between"
      p="space-4"
      style={{
        borderBottom: '4px solid #8b5e34', // unified bottom border
        background: '#a67c52',
        flexShrink: 0
      }}
    >
      <Stack direction="row" align="center" gap="space-3">
        {icon && <Box style={{ fontSize: '1.5rem' }}>{icon}</Box>}
        <Stack direction="column" gap="space-1">
          <Text variant="h2" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.5)', color: '#fff' }}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="caption" style={{ color: '#3e2723' }}>
              {subtitle}
            </Text>
          )}
        </Stack>
      </Stack>
      {rightContent && <Box>{rightContent}</Box>}
    </Stack>
  )
}
