import React from 'react';
import styles from './PixelPanel.module.css';

interface PixelPanelProps {
  children: React.ReactNode;
  variant?: 'standard' | 'warm' | 'wood-v' | 'wood-h';
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
