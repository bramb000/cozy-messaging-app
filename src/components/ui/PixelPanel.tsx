import React from 'react';
import styles from './PixelPanel.module.css';

interface PixelPanelProps {
  children: React.ReactNode;
  variant?: 'standard' | 'warm' | 'wood-v' | 'wood-h' |
    'blue' | 'brown' | 'green' | 'purple' | 'red' | 'silver' | 'yellow' |
    'dotted-primary' | 'dotted-secondary' | 'dotted-tertiary' |
    'fancy-primary' | 'fancy-secondary' | 'fancy-tertiary' |
    'solid-primary' | 'solid-secondary' | 'solid-silver-0' | 'solid-silver-1' | 'solid-tertiary';
  className?: string;
  style?: React.CSSProperties;
}

const PixelPanel: React.FC<PixelPanelProps> = ({ 
  children, 
  variant = 'standard', 
  className = '', 
  style 
}) => {
  return (
    <div 
      className={`${styles.panel} ${styles[`variant-${variant}`]} ${className}`}
      style={style}
    >
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};

export default PixelPanel;
