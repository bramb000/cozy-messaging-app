import React from 'react';
import styles from './PixelButton.module.css';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon' |
    'generic-blue' | 'generic-brown' | 'generic-green' | 'generic-orange' | 'generic-purple' | 'generic-red' | 'generic-silver' | 'generic-yellow' |
    'color-blue' | 'color-brown' | 'color-green' | 'color-purple' | 'color-red' | 'color-silver' | 'color-yellow';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  infoBelow?: string;
}

const PixelButton = React.forwardRef<HTMLButtonElement, PixelButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md',
    fullWidth = false,
    iconLeft,
    iconRight,
    infoBelow,
    className = '',
    disabled,
    ...props 
  }, ref) => {
    
    return (
      <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''} ${className}`}>
        <button 
          ref={ref}
          className={`
            ${styles.button} 
            ${styles[`variant-${variant}`]} 
            ${styles[`size-${size}`]}
            ${fullWidth ? styles.fullWidth : ''}
            ${disabled ? styles.disabled : ''}
          `}
          disabled={disabled}
          {...props}
        >
          {iconLeft && <span className={styles.icon}>{iconLeft}</span>}
          <span className={styles.label}>{children}</span>
          {iconRight && <span className={styles.icon}>{iconRight}</span>}
        </button>
        {infoBelow && <span className={styles.infoBelow}>{infoBelow}</span>}
      </div>
    );
  }
);

PixelButton.displayName = 'PixelButton';
export default PixelButton;
