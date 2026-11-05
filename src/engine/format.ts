import Decimal from 'decimal.js';
import { ERROR_MESSAGES, MAX_DIGITS } from './constants';
import type { CalcError } from './types';
export function formatResult(value: Decimal): string {
  const rounded = value.toSignificantDigits(MAX_DIGITS);
  if (rounded.isZero()) return '0';
  return rounded.e >= MAX_DIGITS || rounded.e < -7
    ? rounded.toExponential()
    : rounded.toFixed();
}
export function formatDisplay(raw: string): string {
  if (raw === '-0') return '0';
  if (/e/i.test(raw)) return raw;
  const [integer, fraction] = raw.split('.');
  return (
    integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',') +
    (fraction === undefined ? '' : '.' + fraction)
  );
}
export const formatExpression = (tokens: string[]) => tokens.join(' ');
export const errorMessage = (error: CalcError) => ERROR_MESSAGES[error];
