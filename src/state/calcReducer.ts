import type { CalcState } from '../engine/types';
import type { CalcAction } from './actions';
import { applyBinary, applyUnary, percentOf } from '../engine/arithmetic';
import {
  appendDigit,
  appendDecimal,
  backspace,
  toggleSign,
  parsePastedNumber,
} from '../engine/input';
import { MAX_HISTORY, OPERATOR_SYMBOLS } from '../engine/constants';
export const initialState: CalcState = {
  display: '0',
  expression: [],
  accumulator: null,
  pendingOperator: null,
  overwrite: true,
  justEvaluated: false,
  lastOperation: null,
  error: null,
  memory: null,
  history: [],
  operandExpression: null,
};
const reset = (s: CalcState): CalcState => ({
  ...initialState,
  memory: s.memory,
  history: s.history,
});
export function calcReducer(state: CalcState, action: CalcAction): CalcState {
  let s = state;
  if (
    s.error &&
    ![
      'CLEAR_ALL',
      'CLEAR_ENTRY',
      'DIGIT',
      'HYDRATE',
      'HISTORY_CLEAR',
      'HISTORY_RECALL',
    ].includes(action.type)
  )
    return s;
  switch (action.type) {
    case 'CLEAR_ALL':
      return reset(s);
    case 'CLEAR_ENTRY':
      return s.error
        ? reset(s)
        : {
            ...s,
            display: '0',
            overwrite: true,
            operandExpression: null,
            lastOperation: null,
          };
    case 'DIGIT':
    case 'DECIMAL': {
      if (s.error || s.justEvaluated) s = reset(s);
      return {
        ...s,
        display:
          action.type === 'DIGIT'
            ? appendDigit(
                s.display,
                action.digit,
                s.overwrite || s.operandExpression !== null,
              )
            : appendDecimal(
                s.display,
                s.overwrite || s.operandExpression !== null,
              ),
        overwrite: false,
        justEvaluated: false,
        operandExpression: null,
        expression: s.pendingOperator ? s.expression : [],
      };
    }
    case 'BACKSPACE':
      return s.overwrite || s.justEvaluated
        ? s
        : { ...s, display: backspace(s.display), operandExpression: null };
    case 'TOGGLE_SIGN':
      return { ...s, display: toggleSign(s.display), operandExpression: null };
    case 'BINARY_OP': {
      let value = s.display;
      let expression = [value, OPERATOR_SYMBOLS[action.operator]];
      if (s.pendingOperator && s.accumulator !== null && !s.overwrite) {
        const r = applyBinary(s.accumulator, s.pendingOperator, s.display);
        if (!r.ok) return { ...s, error: r.error };
        value = r.value;
        expression = [
          s.accumulator,
          OPERATOR_SYMBOLS[s.pendingOperator],
          s.operandExpression ?? s.display,
          OPERATOR_SYMBOLS[action.operator],
        ];
      }
      return {
        ...s,
        display: value,
        accumulator: value,
        pendingOperator: action.operator,
        expression,
        overwrite: true,
        justEvaluated: false,
        lastOperation: null,
        operandExpression: null,
      };
    }
    case 'EQUALS': {
      const op = s.pendingOperator ?? s.lastOperation?.operator;
      const left = s.pendingOperator ? (s.accumulator ?? s.display) : s.display;
      const right = s.pendingOperator
        ? s.display
        : (s.lastOperation?.operand ?? s.display);
      const expression = op
        ? [
            left,
            OPERATOR_SYMBOLS[op],
            s.pendingOperator ? (s.operandExpression ?? right) : right,
            '=',
          ]
        : [s.operandExpression ?? s.display, '='];
      const r = op
        ? applyBinary(left, op, right)
        : { ok: true as const, value: s.display };
      if (!r.ok) return { ...s, error: r.error, expression };
      return {
        ...s,
        display: r.value,
        expression,
        accumulator: null,
        pendingOperator: null,
        overwrite: true,
        justEvaluated: true,
        operandExpression: null,
        lastOperation: op ? { operator: op, operand: right } : null,
        history: [
          {
            id: action.id,
            createdAt: action.createdAt,
            expression: expression.join(' '),
            result: r.value,
          },
          ...s.history,
        ].slice(0, MAX_HISTORY),
      };
    }
    case 'UNARY_OP':
    case 'PERCENT': {
      const r =
        action.type === 'PERCENT'
          ? {
              ok: true as const,
              value: s.pendingOperator
                ? percentOf(s.accumulator ?? '0', s.display)
                : '0',
            }
          : applyUnary(s.display, action.operator);
      if (!r.ok) return { ...s, error: r.error };
      const label = s.operandExpression ?? s.display;
      const operand =
        action.type === 'PERCENT'
          ? r.value
          : action.operator === 'square'
            ? `sqr(${label})`
            : action.operator === 'sqrt'
              ? `√(${label})`
              : `1/(${label})`;
      return {
        ...s,
        display: r.value,
        operandExpression: operand,
        expression: s.pendingOperator
          ? [s.accumulator ?? '0', OPERATOR_SYMBOLS[s.pendingOperator], operand]
          : [operand],
        overwrite: false,
        justEvaluated: false,
        lastOperation: null,
      };
    }
    case 'MEMORY_STORE':
      return { ...s, memory: s.display, overwrite: true };
    case 'MEMORY_CLEAR':
      return { ...s, memory: null };
    case 'MEMORY_RECALL':
      return s.memory === null
        ? s
        : {
            ...(s.justEvaluated ? reset(s) : s),
            display: s.memory,
            overwrite: false,
            justEvaluated: false,
            operandExpression: null,
          };
    case 'MEMORY_ADD':
    case 'MEMORY_SUBTRACT': {
      const r = applyBinary(
        s.memory ?? '0',
        action.type === 'MEMORY_ADD' ? 'add' : 'subtract',
        s.display,
      );
      return r.ok ? { ...s, memory: r.value, overwrite: true } : s;
    }
    case 'HISTORY_CLEAR':
      return { ...s, history: [] };
    case 'HISTORY_RECALL': {
      const item = s.history.find((h) => h.id === action.id);
      return item
        ? {
            ...reset(s),
            display: item.result,
            expression: [item.expression],
            overwrite: true,
            justEvaluated: true,
          }
        : s;
    }
    case 'HYDRATE':
      return { ...s, memory: action.memory, history: action.history };
    case 'PASTE': {
      const value = parsePastedNumber(action.value);
      return value === null
        ? s
        : {
            ...(s.justEvaluated ? reset(s) : s),
            display: value,
            overwrite: false,
            justEvaluated: false,
            operandExpression: null,
          };
    }
  }
}
