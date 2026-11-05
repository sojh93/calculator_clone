import Decimal from 'decimal.js';
import { formatResult } from './format';
import type { BinaryOperator, UnaryOperator, CalculationResult } from './types';
const D = Decimal.clone({ precision: 32, rounding: Decimal.ROUND_HALF_UP });
function result(value: Decimal): CalculationResult {
  return value.isFinite()
    ? { ok: true, value: formatResult(value) }
    : { ok: false, error: 'INVALID_INPUT' };
}
export function applyBinary(
  a: string,
  op: BinaryOperator,
  b: string,
): CalculationResult {
  try {
    const x = new D(a),
      y = new D(b);
    if (op === 'divide' && y.isZero())
      return {
        ok: false,
        error: x.isZero() ? 'UNDEFINED_RESULT' : 'DIVIDE_BY_ZERO',
      };
    return result(
      op === 'add'
        ? x.plus(y)
        : op === 'subtract'
          ? x.minus(y)
          : op === 'multiply'
            ? x.times(y)
            : x.div(y),
    );
  } catch {
    return { ok: false, error: 'INVALID_INPUT' };
  }
}
export function applyUnary(x: string, op: UnaryOperator): CalculationResult {
  try {
    const n = new D(x);
    if (op === 'reciprocal' && n.isZero())
      return { ok: false, error: 'DIVIDE_BY_ZERO' };
    if (op === 'sqrt' && n.isNegative() && !n.isZero())
      return { ok: false, error: 'INVALID_INPUT' };
    return result(
      op === 'reciprocal'
        ? new D(1).div(n)
        : op === 'square'
          ? n.times(n)
          : n.sqrt(),
    );
  } catch {
    return { ok: false, error: 'INVALID_INPUT' };
  }
}
export function percentOf(base: string, x: string): string {
  return formatResult(new D(base).times(x).div(100));
}
