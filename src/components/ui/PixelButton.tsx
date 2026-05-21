import React from 'react';
import styles from './PixelButton.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
export type ButtonSize    = 'sm' | 'md' | 'lg';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  /** Small caption text rendered below the button */
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

    const cls = [
      styles.button,
      styles[`variant-${variant}`],
      styles[`size-${size}`],
      fullWidth ? styles.fullWidth : '',
      disabled  ? styles.disabled  : '',
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''}`}>
        <button
          ref={ref}
          className={cls}
          disabled={disabled}
          aria-disabled={disabled}
          {...props}
        >
          {iconLeft  && <span className={styles.icon}>{iconLeft}</span>}
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
