import { expect, it } from 'vitest';
import Decimal from 'decimal.js';
import { applyBinary, applyUnary, percentOf } from './arithmetic';
import {
  appendDigit,
  appendDecimal,
  backspace,
  toggleSign,
  parsePastedNumber,
} from './input';
import { formatResult, formatDisplay, formatExpression } from './format';
it('precise arithmetic and errors', () => {
  expect(applyBinary('0.1', 'add', '0.2')).toEqual({ ok: true, value: '0.3' });
  expect(applyBinary('1', 'divide', '3')).toEqual({
    ok: true,
    value: '0.3333333333333333',
  });
  expect(applyBinary('7', 'subtract', '3')).toEqual({ ok: true, value: '4' });
  expect(applyBinary('bad', 'add', '3').ok).toBe(false);
  expect(applyUnary('bad', 'square').ok).toBe(false);
  expect(percentOf('200', '10')).toBe('20');
});
it.each([
  ['10000000000000000', '1e+16'],
  ['0.0000001', '0.0000001'],
  ['0.00000001', '1e-8'],
  ['-0', '0'],
  ['2.500', '2.5'],
])('formats %s', (x, y) => expect(formatResult(new Decimal(x))).toBe(y));
it('preserves editing and limits digits', () => {
  expect(formatDisplay('1234.00')).toBe('1,234.00');
  expect(formatDisplay('5.')).toBe('5.');
  expect(formatDisplay('-0')).toBe('0');
  expect(formatDisplay('1e+16')).toBe('1e+16');
  expect(formatExpression(['1', '+'])).toBe('1 +');
  expect(appendDigit('0', '7', false)).toBe('7');
  expect(appendDigit('1111111111111111', '7', false)).toBe('1111111111111111');
  expect(appendDigit(backspace('1111111111111111'), '7', false)).toBe(
    '1111111111111117',
  );
  expect(appendDecimal('1.2', false)).toBe('1.2');
  expect(appendDecimal('5', true)).toBe('0.');
  expect(toggleSign('0.')).toBe('0.');
  expect(toggleSign('-5')).toBe('5');
  expect(backspace('-5')).toBe('0');
});
it('validates clipboard input', () => {
  expect(parsePastedNumber('1,234.50')).toBe('1234.5');
  for (const s of [
    'NaN',
    'Infinity',
    'hello',
    '1,2',
    '1e9999999999',
    '1+2',
    '',
  ])
    expect(parsePastedNumber(s)).toBeNull();
  expect(parsePastedNumber('-1.5e+3')).toBe('-1500');
});
