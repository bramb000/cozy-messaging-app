import React, { ElementType } from 'react'
import type { CSSProperties, ReactNode } from 'react'

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'subtitle' | 'caption' | 'label'
  color?: 'primary' | 'secondary' | 'muted' | 'on-dark' | 'on-dark-muted' | 'gold' | 'red' | string
  align?: CSSProperties['textAlign']
  as?: ElementType
  htmlFor?: string
  children: ReactNode
}

export function Text({
  variant = 'body',
  color,
  align,
  style,
  className,
  as,
  children,
  ...rest
}: TextProps) {
  // Map variant to HTML element tag if `as` is not provided
  let Component: ElementType = 'span'
  if (as) {
    Component = as
  } else {
    if (variant === 'h1') Component = 'h1'
    if (variant === 'h2') Component = 'h2'
    if (variant === 'h3') Component = 'h3'
    if (variant === 'body' || variant === 'subtitle') Component = 'p'
    if (variant === 'label') Component = 'label'
  }

  // Determine base styles from variant
  let fontFamily = 'var(--font-vt323)'
  let fontSize = '1rem'
  let lineHeight = 1.5
  let textShadow = 'none'
  let textTransform: CSSProperties['textTransform'] = 'none'

  switch (variant) {
    case 'h1':
      fontFamily = 'var(--font-press-start)'
      fontSize = '1rem'
      lineHeight = 1.6
      textShadow = '2px 2px 0 var(--brown-dark)'
      break
    case 'h2':
      fontFamily = 'var(--font-press-start)'
      fontSize = '0.8rem'
      lineHeight = 1.6
      textShadow = '2px 2px 0 var(--brown-dark)'
      break
    case 'h3':
      fontFamily = 'var(--font-press-start)'
      fontSize = '0.65rem'
      lineHeight = 1.6
      textShadow = '2px 2px 0 var(--brown-dark)'
      break
    case 'subtitle':
      fontSize = '1.1rem'
      lineHeight = 1.6
      break
    case 'caption':
      fontFamily = 'var(--font-press-start)'
      fontSize = '0.55rem'
      break
    case 'label':
      fontFamily = 'var(--font-press-start)'
      fontSize = '0.55rem'
      textShadow = '1px 1px 0 var(--brown-dark)'
      break
    case 'body':
    default:
      fontSize = '1rem'
      break
  }

  // Determine actual css var color
  let cssColor = color
  switch (color) {
    case 'primary': cssColor = 'var(--text-primary)'; break
    case 'secondary': cssColor = 'var(--text-secondary)'; break
    case 'muted': cssColor = 'var(--text-muted)'; break
    case 'on-dark': cssColor = 'var(--text-on-dark)'; break
    case 'on-dark-muted': cssColor = 'var(--text-on-dark-muted)'; break
    case 'gold': cssColor = 'var(--gold-light)'; break
    case 'red': cssColor = 'var(--red)'; break
  }

  // Only apply default preset colors if it wasn't specified
  if (!cssColor) {
    if (variant === 'h1' || variant === 'h2' || variant === 'h3') cssColor = 'var(--gold-light)'
  }

  const mergedStyle: CSSProperties = {
    fontFamily,
    fontSize,
    lineHeight,
    color: cssColor,
    textShadow,
    textTransform,
    textAlign: align,
    margin: 0,
    ...style,
  }

  return (
    <Component style={mergedStyle} className={className} {...rest}>
      {children}
    </Component>
  )
}
