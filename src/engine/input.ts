import Decimal from 'decimal.js';
import { MAX_DIGITS } from './constants';
import { formatResult } from './format';
export function appendDigit(
  current: string,
  digit: string,
  overwrite: boolean,
): string {
  if (!/^\d$/.test(digit)) return current;
  if (overwrite || current === '0') return digit;
  if (current.replace(/\D/g, '').length >= MAX_DIGITS) return current;
  return current + digit;
}
export function appendDecimal(current: string, overwrite: boolean): string {
  return overwrite ? '0.' : current.includes('.') ? current : current + '.';
}
export function backspace(current: string): string {
  const next = current.slice(0, -1);
  return next === '' || next === '-' ? '0' : next;
}
export function toggleSign(current: string): string {
  if (new Decimal(current).isZero()) return current.replace('-', '');
  return current.startsWith('-') ? current.slice(1) : '-' + current;
}
export function parsePastedNumber(text: string): string | null {
  const s = text.trim();
  if (
    s.length > 256 ||
    !/^[-+]?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d*)?|\.\d+)(?:e[-+]?\d{1,6})?$/i.test(
      s,
    )
  )
    return null;
  try {
    const n = new Decimal(s.replaceAll(',', ''));
    return n.isFinite() ? formatResult(n) : null;
  } catch {
    return null;
  }
}
