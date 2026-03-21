import React from 'react'
import type { CSSProperties } from 'react'
import { Box, type BoxProps, type SpacingValue } from './Box'

export interface StackProps extends BoxProps {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  align?: CSSProperties['alignItems']
  justify?: CSSProperties['justifyContent']
  wrap?: CSSProperties['flexWrap']
  gap?: SpacingValue
  flex?: CSSProperties['flex']
}

export function Stack({
  direction = 'column',
  align,
  justify,
  wrap,
  gap,
  flex,
  style,
  ...rest
}: StackProps) {
  const getSpace = (val?: SpacingValue) => {
    if (!val) return undefined
    if (val === '0') return '0'
    return `var(--${val})`
  }

  const stackStyle: CSSProperties = {
    display: 'flex',
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
    flexWrap: wrap,
    gap: getSpace(gap),
    flex: flex,
    ...style,
  }

  return <Box style={stackStyle} {...rest} />
}
