'use client';

import React from 'react';
import styles from './PhysicalCard.module.css';
import { motion, HTMLMotionProps } from 'framer-motion';

interface PhysicalCardProps extends HTMLMotionProps<'div'> {
  variant?: 'parchment' | 'dark' | 'none';
  children: React.ReactNode;
  className?: string;
  animateEntrance?: boolean;
}

export const PhysicalCard: React.FC<PhysicalCardProps> = ({ 
  variant = 'parchment', 
  children, 
  className = '',
  animateEntrance = false,
  ...props 
}) => {
  const containerClasses = `${styles.card} ${styles[variant]} ${className}`;
  
  const animations = animateEntrance ? {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: 'spring' as const, stiffness: 400, damping: 20 }
  } : {};

  return (
    <motion.div 
      className={containerClasses}
      {...animations}
      {...props}
    >
      <div className={styles.inner}>
        {children}
      </div>
    </motion.div>
  );
};
