export const MAX_DIGITS = 16;
export const MAX_HISTORY = 100;
export const ERROR_MESSAGES = {
  DIVIDE_BY_ZERO: '0으로 나눌 수 없습니다',
  UNDEFINED_RESULT: '정의되지 않은 결과입니다',
  INVALID_INPUT: '잘못된 입력입니다',
} as const;
export const OPERATOR_SYMBOLS = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
} as const;
