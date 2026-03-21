import React from 'react'
import { Box, type BoxProps } from './Box'

export interface ContainerProps extends BoxProps {
  maxWidth?: string
}

export function Container({ maxWidth = '800px', style, ...rest }: ContainerProps) {
  return (
    <Box
      mx="auto"
      w="100%"
      style={{
        maxWidth,
        ...style,
      }}
      {...rest}
    />
  )
}
