'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import styles from './TactileButton.module.css';

interface TactileButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const TactileButton: React.FC<TactileButtonProps> = ({ 
  variant = 'primary', 
  children, 
  fullWidth = false,
  className = '',
  onMouseEnter,
  ...props 
}) => {
  const buttonClasses = `
    ${styles.button} 
    ${styles[variant]} 
    ${fullWidth ? styles.fullWidth : ''} 
    ${className}
  `.trim();

  // Sound placeholders (to be replaced with actual audio context if assets are provided)
  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    // playHoverSound(); 
    if (onMouseEnter) onMouseEnter(e);
  };

  return (
    <motion.button
      className={buttonClasses}
      whileHover={{ 
        scale: 1.05, 
        filter: "brightness(1.1)",
        transition: { type: 'spring' as const, stiffness: 400, damping: 10 }
      }}
      whileTap={{ 
        scale: 0.95, 
        y: 2,
        transition: { type: 'spring' as const, stiffness: 400, damping: 10 }
      }}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </motion.button>
  );
};
