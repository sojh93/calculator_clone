import type { ReactNode } from 'react';
import styles from './Calculator.module.css';
export function CalcButton({
  label,
  ariaLabel,
  variant = 'function',
  disabled = false,
  onPress,
  pressed = false,
  keyId,
}: {
  label: ReactNode;
  ariaLabel: string;
  variant?: 'number' | 'function' | 'equals' | 'memory';
  disabled?: boolean;
  onPress: () => void;
  pressed?: boolean;
  keyId?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      data-calc-key={keyId}
      disabled={disabled}
      onClick={onPress}
      className={`${styles.button} ${styles[variant]} ${pressed ? styles.pressed : ''}`}
    >
      {label}
    </button>
  );
}
