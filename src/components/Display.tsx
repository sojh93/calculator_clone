import {
  errorMessage,
  formatDisplay,
  formatExpression,
} from '../engine/format';
import type { CalcState } from '../engine/types';
import styles from './Calculator.module.css';
export function Display({ state }: { state: CalcState }) {
  const value = state.error
    ? errorMessage(state.error)
    : formatDisplay(state.display);
  return (
    <section className={styles.display} aria-label="계산 결과">
      <div
        className={styles.expression}
        data-testid="expression"
        title={formatExpression(state.expression)}
      >
        {formatExpression(state.expression) || '\u00a0'}
      </div>
      <output
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={styles.result}
        style={{
          fontSize: state.error
            ? '20px'
            : `${Math.max(23, Math.min(52, 490 / value.length))}px`,
        }}
      >
        {value}
      </output>
      <span
        className={styles.indicator}
        aria-label={state.memory !== null ? '메모리 저장됨' : undefined}
      >
        {state.memory !== null ? 'M' : '\u00a0'}
      </span>
    </section>
  );
}
