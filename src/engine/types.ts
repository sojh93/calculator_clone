export type BinaryOperator = 'add' | 'subtract' | 'multiply' | 'divide';
export type UnaryOperator = 'reciprocal' | 'square' | 'sqrt';
export type CalcError = 'DIVIDE_BY_ZERO' | 'UNDEFINED_RESULT' | 'INVALID_INPUT';
export type CalculationResult =
  { ok: true; value: string } | { ok: false; error: CalcError };
export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  createdAt: number;
}
export interface LastOperation {
  operator: BinaryOperator;
  operand: string;
}
export interface CalcState {
  display: string;
  expression: string[];
  accumulator: string | null;
  pendingOperator: BinaryOperator | null;
  overwrite: boolean;
  justEvaluated: boolean;
  lastOperation: LastOperation | null;
  error: CalcError | null;
  memory: string | null;
  history: HistoryItem[];
  /** The transformed right operand's label is separate from the running expression. */
  operandExpression: string | null;
}
