import { CalcButton } from './CalcButton';
import { useCalculator } from '../state/CalculatorContext';
import type { UserAction } from '../state/actions';
import { actionId } from '../hooks/useKeyboard';
import styles from './Calculator.module.css';
const keys: [string, string, UserAction][] = [
  ['%', '백분율', { type: 'PERCENT' }],
  ['CE', '현재 입력 지우기', { type: 'CLEAR_ENTRY' }],
  ['C', '모두 지우기', { type: 'CLEAR_ALL' }],
  ['⌫', '지우기', { type: 'BACKSPACE' }],
  ['¹⁄ₓ', '역수', { type: 'UNARY_OP', operator: 'reciprocal' }],
  ['x²', '제곱', { type: 'UNARY_OP', operator: 'square' }],
  ['²√x', '제곱근', { type: 'UNARY_OP', operator: 'sqrt' }],
  ['÷', '나누기', { type: 'BINARY_OP', operator: 'divide' }],
  ...['7', '8', '9'].map(
    (d) => [d, d, { type: 'DIGIT', digit: d }] as [string, string, UserAction],
  ),
  ['×', '곱하기', { type: 'BINARY_OP', operator: 'multiply' }],
  ...['4', '5', '6'].map(
    (d) => [d, d, { type: 'DIGIT', digit: d }] as [string, string, UserAction],
  ),
  ['−', '빼기', { type: 'BINARY_OP', operator: 'subtract' }],
  ...['1', '2', '3'].map(
    (d) => [d, d, { type: 'DIGIT', digit: d }] as [string, string, UserAction],
  ),
  ['+', '더하기', { type: 'BINARY_OP', operator: 'add' }],
  ['⁺⁄₋', '부호 바꾸기', { type: 'TOGGLE_SIGN' }],
  ['0', '0', { type: 'DIGIT', digit: '0' }],
  ['.', '소수점', { type: 'DECIMAL' }],
  ['=', '계산 결과', { type: 'EQUALS' }],
];
export function Keypad({ pressed }: { pressed: string }) {
  const { state, dispatch } = useCalculator();
  return (
    <div className={styles.keypad}>
      {keys.map(([label, ariaLabel, action]) => (
        <CalcButton
          key={label}
          label={label}
          ariaLabel={ariaLabel}
          keyId={actionId(action)}
          variant={
            action.type === 'EQUALS'
              ? 'equals'
              : ['DIGIT', 'DECIMAL', 'TOGGLE_SIGN'].includes(action.type)
                ? 'number'
                : 'function'
          }
          disabled={
            !!state.error &&
            !['DIGIT', 'CLEAR_ENTRY', 'CLEAR_ALL'].includes(action.type)
          }
          pressed={pressed === actionId(action)}
          onPress={() => dispatch(action)}
        />
      ))}
    </div>
  );
}
