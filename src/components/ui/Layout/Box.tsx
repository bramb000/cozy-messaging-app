import React from 'react'
import type { CSSProperties, ReactNode } from 'react'

export type SpacingValue = 'space-1' | 'space-2' | 'space-3' | 'space-4' | 'space-5' | 'space-6' | 'space-8' | 'space-10' | 'space-12' | '0' | 'auto'

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
  p?: SpacingValue
  px?: SpacingValue
  py?: SpacingValue
  pt?: SpacingValue
  pb?: SpacingValue
  pl?: SpacingValue
  pr?: SpacingValue
  m?: SpacingValue
  mx?: SpacingValue
  my?: SpacingValue
  mt?: SpacingValue
  mb?: SpacingValue
  ml?: SpacingValue
  mr?: SpacingValue
  w?: string
  h?: string
  bg?: string
  color?: string
  position?: CSSProperties['position']
}

export function Box({
  children,
  p, px, py, pt, pb, pl, pr,
  m, mx, my, mt, mb, ml, mr,
  w, h, bg, color, position,
  style,
  className,
  ...rest
}: BoxProps) {
  const getSpace = (val?: SpacingValue) => {
    if (!val) return undefined
    if (val === '0' || val === 'auto') return val
    return `var(--${val})`
  }

  const mergedStyle: CSSProperties = {
    padding: getSpace(p),
    paddingTop: getSpace(pt || py),
    paddingBottom: getSpace(pb || py),
    paddingLeft: getSpace(pl || px),
    paddingRight: getSpace(pr || px),
    marginTop: getSpace(mt || my || m),
    marginBottom: getSpace(mb || my || m),
    marginLeft: getSpace(ml || mx || m),
    marginRight: getSpace(mr || mx || m),
    width: w,
    height: h,
    backgroundColor: bg,
    color: color,
    position: position,
    ...style,
  }

  return (
    <div style={mergedStyle} className={className} {...rest}>
      {children}
    </div>
  )
}
