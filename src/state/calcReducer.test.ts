import { describe, expect, it } from 'vitest';
import { calcReducer, initialState } from './calcReducer';
import type { CalcAction } from './actions';
import { errorMessage, formatDisplay } from '../engine/format';
const keys: Record<string, CalcAction> = {
  '+': { type: 'BINARY_OP', operator: 'add' },
  '−': { type: 'BINARY_OP', operator: 'subtract' },
  '×': { type: 'BINARY_OP', operator: 'multiply' },
  '÷': { type: 'BINARY_OP', operator: 'divide' },
  '=': { type: 'EQUALS', id: 'test', createdAt: 0 },
  '.': { type: 'DECIMAL' },
  '±': { type: 'TOGGLE_SIGN' },
  '⌫': { type: 'BACKSPACE' },
  C: { type: 'CLEAR_ALL' },
  CE: { type: 'CLEAR_ENTRY' },
  'x²': { type: 'UNARY_OP', operator: 'square' },
  '√x': { type: 'UNARY_OP', operator: 'sqrt' },
  '1/x': { type: 'UNARY_OP', operator: 'reciprocal' },
  '%': { type: 'PERCENT' },
  MS: { type: 'MEMORY_STORE' },
  MR: { type: 'MEMORY_RECALL' },
  MC: { type: 'MEMORY_CLEAR' },
  'M+': { type: 'MEMORY_ADD' },
  'M−': { type: 'MEMORY_SUBTRACT' },
};
export function press(input: string) {
  return input
    .split(' ')
    .flatMap((k) =>
      keys[k]
        ? [keys[k]]
        : [...k].map(
            (d) => keys[d] ?? ({ type: 'DIGIT', digit: d } as CalcAction),
          ),
    )
    .reduce(calcReducer, initialState);
}
describe('명세 시나리오', () => {
  it('transformed operands are replaced by fresh digits', () =>
    expect(press('5 + 3 x² 4 =').display).toBe('9'));
  it('pasted operands participate in immediate execution', () => {
    const s = calcReducer(press('5 +'), { type: 'PASTE', value: '3' });
    expect(
      calcReducer(s, { type: 'BINARY_OP', operator: 'multiply' }).display,
    ).toBe('8');
  });
  it('error decimal is blocked and CE recovers', () => {
    const s = press('0 1/x');
    expect(calcReducer(s, { type: 'DECIMAL' })).toBe(s);
    expect(calcReducer(s, { type: 'CLEAR_ENTRY' }).error).toBeNull();
  });
  it('empty recalls and invalid clipboard preserve state', () => {
    expect(calcReducer(initialState, { type: 'MEMORY_RECALL' })).toBe(
      initialState,
    );
    expect(
      calcReducer(initialState, { type: 'HISTORY_RECALL', id: 'missing' }),
    ).toBe(initialState);
    expect(calcReducer(initialState, { type: 'PASTE', value: 'invalid' })).toBe(
      initialState,
    );
  });
  it('recall after result starts fresh and hydration is pure', () => {
    expect(press('5 MS 2 + 3 = MR + 1 =').display).toBe('6');
    const s = calcReducer(initialState, {
      type: 'HYDRATE',
      memory: '7',
      history: [],
    });
    expect(s.memory).toBe('7');
    expect(press('1 ÷ 3 = × 3 =').display).toBe('0.9999999999999999');
  });
  it.each([
    ['S01', '12 + 3 =', '15', '12 + 3 ='],
    ['S02', '0.1 + 0.2 =', '0.3', '0.1 + 0.2 ='],
    ['S03', '5 + 3 ×', '8', '5 + 3 ×'],
    ['S04', '5 + 3 × 2 =', '16', '8 × 2 ='],
    ['S05', '5 + × 3 =', '15', '5 × 3 ='],
    ['S06', '2 + 3 = = =', '11', '8 + 3 ='],
    ['S07', '5 + =', '10', '5 + 5 ='],
    ['S08', '9 =', '9', '9 ='],
    ['S09', '2 × 3 = 4', '4', ''],
    ['S10', '2 × 3 = + 1 =', '7', '6 + 1 ='],
    ['S20', '0 0 7', '7'],
    ['S21', '. 5', '0.5'],
    ['S22', '1 . 2 . 3', '1.23'],
    ['S23', '123 ⌫', '12'],
    ['S24', '5 ⌫', '0'],
    ['S25', '5 ±', '-5'],
    ['S26', '0 ±', '0'],
    ['S27', '1111111111111111 7', '1,111,111,111,111,111'],
    ['S28', '1234567', '1,234,567'],
    ['S30', '4 x²', '16', 'sqr(4)'],
    ['S31', '9 √x', '3', '√(9)'],
    ['S32', '4 1/x', '0.25', '1/(4)'],
    ['S33', '5 + 3 x² =', '14', '5 + sqr(3) ='],
    ['S34', '2 x² x²', '16', 'sqr(sqr(2))'],
    ['S35', '200 + 10 %', '20', '200 + 20'],
    ['S36', '200 + 10 % =', '220', '200 + 20 ='],
    ['S37', '5 %', '0', '0'],
    ['S40', '5 ÷ 0 =', '0으로 나눌 수 없습니다'],
    ['S41', '0 ÷ 0 =', '정의되지 않은 결과입니다'],
    ['S42', '5 ± √x', '잘못된 입력입니다'],
    ['S43', '0 1/x', '0으로 나눌 수 없습니다'],
    ['S44', '5 ÷ 0 = C', '0'],
    ['S45', '5 ÷ 0 = 7', '7'],
    ['S50', '5 MS C MR', '5', undefined, '5'],
    ['S51', '5 MS 3 M+ MR', '8', undefined, '8'],
    ['S52', '5 MS 3 M− MR', '2', undefined, '2'],
    ['S53', '5 MS MC', '5', undefined, null],
    ['S54', '3 M+ MR', '3', undefined, '3'],
  ])(
    '%s: %s',
    (id, input, display, expression?: string, memory?: string | null) => {
      const s = press(input!);
      expect(s.error ? errorMessage(s.error) : formatDisplay(s.display)).toBe(
        display,
      );
      if (expression !== undefined)
        expect(s.expression.join(' ')).toBe(expression);
      if (memory !== undefined) expect(s.memory).toBe(memory);
    },
  );
  it('CE retains the pending calculation', () =>
    expect(press('5 + 12 CE 3 =').display).toBe('8'));
  it('backspace ignores a result', () =>
    expect(press('12 + 3 = ⌫').display).toBe('15'));
  it('errors block memory and operations', () => {
    const s = press('5 ÷ 0 =');
    expect(calcReducer(s, { type: 'MEMORY_RECALL' })).toBe(s);
    expect(calcReducer(s, { type: 'BINARY_OP', operator: 'add' })).toBe(s);
  });
  it('history is deterministic and capped, recall clears pending operations', () => {
    let s = press('1 + 1');
    for (let i = 0; i < 105; i++)
      s = calcReducer(s, { type: 'EQUALS', id: String(i), createdAt: i });
    expect(s.history).toHaveLength(100);
    expect(s.history[0].id).toBe('104');
    const a = { type: 'EQUALS', id: 'next', createdAt: 106 } as const;
    expect(calcReducer(s, a)).toEqual(calcReducer(s, a));
    s = calcReducer(s, { type: 'HISTORY_RECALL', id: '104' });
    expect(s.display).toBe('106');
    expect(s.pendingOperator).toBeNull();
    expect(calcReducer(s, { type: 'HISTORY_CLEAR' }).history).toEqual([]);
  });
});
