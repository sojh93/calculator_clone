import { useCalculator } from '../state/CalculatorContext';
import { formatDisplay } from '../engine/format';
import styles from './Calculator.module.css';
export function HistoryPanel() {
  const { state, dispatch } = useCalculator();
  return (
    <>
      <div className={styles.panelContent}>
        {state.history.length ? (
          state.history.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.historyItem}
              aria-label={`${item.expression} ${formatDisplay(item.result)} 불러오기`}
              onClick={() => dispatch({ type: 'HISTORY_RECALL', id: item.id })}
            >
              <span>{item.expression}</span>
              <strong>{formatDisplay(item.result)}</strong>
            </button>
          ))
        ) : (
          <div className={styles.empty}>
            <span aria-hidden="true">↶</span>
            <strong>아직 기록이 없어요</strong>
            <p>계산한 결과가 여기에 표시됩니다.</p>
          </div>
        )}
      </div>
      <div className={styles.panelFooter}>
        <span>{state.history.length}개의 계산</span>
        <button
          type="button"
          aria-label="기록 전체 삭제"
          disabled={!state.history.length}
          onClick={() => dispatch({ type: 'HISTORY_CLEAR' })}
        >
          전체 삭제
        </button>
      </div>
    </>
  );
}
