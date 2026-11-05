import { CalcButton } from './CalcButton';
import { useCalculator } from '../state/CalculatorContext';
import type { UserAction } from '../state/actions';
import { actionId } from '../hooks/useKeyboard';
import styles from './Calculator.module.css';
const keys: [string, string, UserAction][] = [
  ['MC', '메모리 지우기', { type: 'MEMORY_CLEAR' }],
  ['MR', '메모리 불러오기', { type: 'MEMORY_RECALL' }],
  ['M+', '메모리에 더하기', { type: 'MEMORY_ADD' }],
  ['M−', '메모리에서 빼기', { type: 'MEMORY_SUBTRACT' }],
  ['MS', '메모리 저장', { type: 'MEMORY_STORE' }],
];
export function MemoryBar({
  pressed,
  onOpen,
}: {
  pressed: string;
  onOpen: () => void;
}) {
  const { state, dispatch } = useCalculator();
  return (
    <div className={styles.memoryBar}>
      {keys.map(([label, ariaLabel, action]) => (
        <CalcButton
          key={label}
          label={label}
          ariaLabel={ariaLabel}
          variant="memory"
          keyId={actionId(action)}
          pressed={pressed === actionId(action)}
          disabled={
            !!state.error ||
            (state.memory === null && ['MC', 'MR'].includes(label))
          }
          onPress={() => dispatch(action)}
        />
      ))}
      <CalcButton
        label="M⌄"
        ariaLabel="메모리 패널 열기"
        variant="memory"
        onPress={onOpen}
      />
    </div>
  );
}
