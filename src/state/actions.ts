import type {
  BinaryOperator,
  UnaryOperator,
  HistoryItem,
} from '../engine/types';
export type CalcAction =
  | { type: 'DIGIT'; digit: string }
  | { type: 'DECIMAL' }
  | { type: 'TOGGLE_SIGN' }
  | { type: 'BACKSPACE' }
  | { type: 'CLEAR_ENTRY' }
  | { type: 'CLEAR_ALL' }
  | { type: 'BINARY_OP'; operator: BinaryOperator }
  | { type: 'UNARY_OP'; operator: UnaryOperator }
  | { type: 'PERCENT' }
  | { type: 'EQUALS'; id: string; createdAt: number }
  | { type: 'MEMORY_CLEAR' }
  | { type: 'MEMORY_RECALL' }
  | { type: 'MEMORY_ADD' }
  | { type: 'MEMORY_SUBTRACT' }
  | { type: 'MEMORY_STORE' }
  | { type: 'HISTORY_RECALL'; id: string }
  | { type: 'HISTORY_CLEAR' }
  | { type: 'HYDRATE'; memory: string | null; history: HistoryItem[] }
  | { type: 'PASTE'; value: string };
export type UserAction =
  Exclude<CalcAction, { type: 'EQUALS' }> | { type: 'EQUALS' };
