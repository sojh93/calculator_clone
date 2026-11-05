# spec.md — 윈도우 계산기 명세

> 상위 문서: [intent.md](./intent.md) · 하위 문서: [plan.md](./plan.md)
> 이 문서는 구현과 테스트의 **기준**이다. 동작이 문서와 다르면 코드가 틀린 것이다.

---

## 1. 범위

**1차 범위: 표준(Standard) 모드** — 사칙연산, 단항 연산, 메모리, 기록, 키보드 입력.
공학용 등 다른 모드는 [10. 확장 후보](#10-확장-후보-범위-밖) 참고.

## 2. 기술 스택 및 제약조건

| 항목 | 결정 |
|---|---|
| UI | React 18, 함수형 컴포넌트 + Hooks |
| 빌드 | Vite |
| 언어 | TypeScript (strict) |
| 상태 관리 | `useReducer` + Context (외부 상태 라이브러리 사용 안 함) |
| 정밀 연산 | `decimal.js` (precision 32) |
| 스타일 | CSS Modules (CSS 변수로 테마 토큰 관리) |
| 테스트 | Vitest, React Testing Library, @testing-library/user-event |
| 린트/포맷 | ESLint, Prettier |

### 2-1. 비기능 제약

- **C1.** 계산 엔진(`src/engine`)은 React를 import 하지 않는다.
- **C2.** reducer는 순수 함수이며 부수효과(localStorage, 타이머 등)를 갖지 않는다.
- **C3.** 입력 가능한 최대 자릿수는 **16자리**(소수점, 부호 제외).
- **C4.** 결과 표시는 최대 **16 유효숫자**, 초과 시 과학적 표기(`1.234e+20`)로 전환한다.
- **C5.** 최소 지원 해상도는 가로 320px. 계산기 본체는 가로 최대 360px 기준으로 설계한다.
- **C6.** 모든 버튼은 `<button>` 요소이며 `aria-label` 을 가진다.

---

## 3. 화면 구성

```
┌──────────────────────────────┐
│ 표준                    ☰    │  ← 헤더 (모드명, 기록 토글)
│                              │
│                  5 + 3 ×     │  ← 수식 표시줄 (expression)
│                          8   │  ← 메인 디스플레이 (display)
├──────────────────────────────┤
│ MC  MR  M+  M−  MS  M▾       │  ← 메모리 줄
├──────────────────────────────┤
│  %    CE    C    ⌫           │
│ 1/x   x²    √x   ÷           │
│  7    8     9    ×           │
│  4    5     6    −           │
│  1    2     3    +           │
│  ±    0     .    =           │
└──────────────────────────────┘
```

- 기록(History) 패널은 헤더의 토글 버튼 또는 `M▾` 와 별개로 열고 닫는다. (좁은 화면에서는 오버레이)
- 디스플레이 글자는 자릿수가 늘어나면 **자동으로 축소**(최소 폰트 크기까지)한다.

---

## 4. 기능 요구사항 (FR)

### 4-1. 숫자 입력

| ID | 요구사항 |
|---|---|
| FR-01 | 0~9 입력 시 현재 숫자 끝에 이어 붙인다. |
| FR-02 | 현재 값이 `0` 일 때 다른 숫자를 입력하면 `0` 을 대체한다. (`0` → `7` → `7`, `07` 불가) |
| FR-03 | `.` 입력 시 소수점을 추가한다. 이미 소수점이 있으면 무시한다. 값이 `0` 이면 `0.` 이 된다. |
| FR-04 | 입력 자릿수가 16자리를 넘으면 추가 숫자 입력을 무시한다. |
| FR-05 | `±` 는 현재 값의 부호를 반전한다. `0` 은 부호를 바꾸지 않는다. |
| FR-06 | `⌫` 는 입력 중인 숫자의 마지막 문자를 지운다. 모두 지워지면 `0` 이 된다. 계산 결과 상태에서는 동작하지 않는다. |
| FR-07 | `CE` 는 현재 입력 값만 `0` 으로 초기화한다. (진행 중인 수식은 유지) |
| FR-08 | `C` 는 현재 값, 수식, 대기 중인 연산자, 에러를 모두 초기화한다. (메모리·기록은 유지) |

### 4-2. 이항 연산 (+, −, ×, ÷)

| ID | 요구사항 |
|---|---|
| FR-10 | 연산자를 누르면 현재 값을 피연산자로 확정하고 연산자를 대기시킨다. 수식 표시줄에 `5 +` 형태로 표시한다. |
| FR-11 | **즉시 실행 방식**: `5 + 3 ×` 를 입력하는 순간 `5 + 3 = 8` 을 계산해 디스플레이에 `8` 을 보여주고 `×` 를 대기시킨다. (연산자 우선순위 없음) |
| FR-12 | 연산자를 연달아 누르면 마지막 연산자로 **교체**한다. (`5 + ×` → `5 ×`) |
| FR-13 | `=` 를 누르면 대기 중인 연산을 실행하고 기록에 추가한다. |
| FR-14 | `=` 를 **반복해서** 누르면 마지막 연산자와 마지막 피연산자를 결과에 다시 적용한다. (`2 + 3 = = =` → `5, 8, 11`) |
| FR-15 | 연산자 없이 `=` 를 누르면 현재 값을 그대로 유지한다. |
| FR-16 | 결과가 표시된 직후 숫자를 입력하면 **새 계산을 시작**한다. 연산자를 입력하면 결과를 이어서 계산한다. |
| FR-17 | 연산자 입력 직후(두 번째 피연산자 입력 전) `=` 를 누르면 현재 표시된 값을 두 번째 피연산자로 사용한다. (`5 + =` → `10`) |

### 4-3. 단항 연산 (1/x, x², √x, %)

| ID | 요구사항 |
|---|---|
| FR-20 | `1/x`, `x²`, `√x` 는 **현재 표시 값**에 즉시 적용하고, 수식 표시줄에 `1/(5)`, `sqr(5)`, `√(5)` 형태로 표기한다. |
| FR-21 | 대기 중인 이항 연산이 있을 때 단항 연산 결과는 **두 번째 피연산자**가 된다. (`5 + 3 x²` → 표시 `9`, `=` → `14`) |
| FR-22 | `%` 는 이항 연산 대기 중일 때 `피연산자1 × 현재값 ÷ 100` 으로 변환한다. (`200 + 10 %` → `20`, `=` → `220`) |
| FR-23 | 이항 연산이 대기 중이 아닐 때 `%` 를 누르면 결과는 `0` 이 된다. (Windows 계산기 동작) |

### 4-4. 에러 처리

| ID | 요구사항 |
|---|---|
| FR-30 | 0으로 나누면 `0으로 나눌 수 없습니다` 를 표시한다. (`0 ÷ 0` 은 `정의되지 않은 결과입니다`) |
| FR-31 | 음수의 제곱근은 `잘못된 입력입니다` 를 표시한다. |
| FR-32 | `1/x` 에 `0` 을 적용하면 `0으로 나눌 수 없습니다` 를 표시한다. |
| FR-33 | 에러 상태에서는 `C`, `CE` 와 숫자 입력(새 입력 시작)을 제외한 모든 연산 버튼을 **비활성화**한다. 숫자 입력 시 에러가 해제되고 새 계산을 시작한다. |

### 4-5. 메모리

| ID | 요구사항 |
|---|---|
| FR-40 | `MS` 는 현재 값을 메모리에 저장한다. |
| FR-41 | `MR` 는 메모리 값을 디스플레이에 불러온다. 입력 중인 숫자는 대체한다. |
| FR-42 | `M+` / `M−` 는 메모리 값에 현재 값을 더하거나 뺀다. 메모리가 비어 있으면 `0` 에서 시작한다. |
| FR-43 | `MC` 는 메모리를 비운다. |
| FR-44 | 메모리가 비어 있으면 `MC`, `MR` 버튼은 비활성화한다. |
| FR-45 | 메모리에 값이 있으면 디스플레이 좌측 하단에 `M` 인디케이터를 표시한다. |
| FR-46 | `M▾` 는 메모리 패널을 열어 저장된 값을 보여준다. (1차에서는 값 1개) |

### 4-6. 기록 (History)

| ID | 요구사항 |
|---|---|
| FR-50 | `=` 로 계산이 확정될 때마다 `{수식, 결과}` 를 기록 **맨 위**에 추가한다. |
| FR-51 | 기록 항목을 클릭하면 해당 **결과**가 현재 값으로 로드된다. |
| FR-52 | 기록 패널에 `전체 삭제` 버튼을 둔다. |
| FR-53 | 기록은 최대 **100개** 까지 유지하고 초과 시 가장 오래된 항목부터 제거한다. |
| FR-54 | 기록과 메모리는 `localStorage` 에 저장해 새로고침 후에도 복원한다. (reducer 밖, 별도 훅에서 처리 — C2 준수) |

### 4-7. 키보드 입력

| 키 | 동작 |
|---|---|
| `0`–`9` | 숫자 입력 |
| `.` , `,` | 소수점 |
| `+` `-` `*` `/` | 이항 연산 (`*` → ×, `/` → ÷). 브라우저 기본 동작(검색창 열림 등) `preventDefault` |
| `Enter` , `=` | 등호 |
| `Backspace` | ⌫ |
| `Delete` | CE |
| `Escape` | C |
| `%` | % |
| `F9` | ± |
| `r` | 1/x |
| `@` | √x |
| `Ctrl+L` | MC · `Ctrl+R` MR · `Ctrl+P` M+ · `Ctrl+Q` M− · `Ctrl+M` MS |
| `Ctrl+C` / `Ctrl+V` | 현재 값 복사 / 붙여넣기(유효 숫자일 때만) |

- 키 입력 시 대응하는 화면 버튼에 **눌림 시각 효과**를 준다.
- 입력창(input 등)이 포커스일 때는 전역 키 핸들러가 동작하지 않는다. (현재 UI에는 해당 요소 없음, 확장 대비)

### 4-8. 표시 형식

| ID | 요구사항 |
|---|---|
| FR-60 | 정수부에 **천 단위 구분자(,)** 를 표시한다. (`1234567` → `1,234,567`) 입력 중인 소수부 뒤에는 구분자를 넣지 않는다. |
| FR-61 | 입력 중 `5.` , `5.0` 처럼 끝의 소수점·0 은 **그대로 보존**하여 표시한다. |
| FR-62 | 계산 결과의 불필요한 소수점 이하 0 은 제거한다. (`2.50` → `2.5`) |
| FR-63 | 결과의 정수부가 16자리를 넘거나 매우 작은 수(예: 1e-7 미만)일 경우 과학적 표기(`1e+16`, `1.5e-8`)를 사용한다. |
| FR-64 | `-0` 은 `0` 으로 표시한다. |

---

## 5. 동작 시나리오 (테스트 기준표)

> 아래 표는 그대로 테스트 케이스가 된다. 입력은 왼쪽에서 오른쪽으로 순서대로 누른 키이다.

### 5-1. 기본 연산

| # | 입력 | 최종 display | 최종 expression |
|---|---|---|---|
| S01 | `1` `2` `+` `3` `=` | `15` | `12 + 3 =` |
| S02 | `0.1` `+` `0.2` `=` | `0.3` | `0.1 + 0.2 =` |
| S03 | `5` `+` `3` `×` | `8` | `5 + 3 ×` |
| S04 | `5` `+` `3` `×` `2` `=` | `16` | `8 × 2 =` |
| S05 | `5` `+` `×` `3` `=` | `15` | `5 × 3 =` |
| S06 | `2` `+` `3` `=` `=` `=` | `11` | `8 + 3 =` |
| S07 | `5` `+` `=` | `10` | `5 + 5 =` |
| S08 | `9` `=` | `9` | `9 =` |
| S09 | `2` `×` `3` `=` `4` | `4` | `` (새 계산 시작) |
| S10 | `2` `×` `3` `=` `+` `1` `=` | `7` | `6 + 1 =` |

### 5-2. 입력 처리

| # | 입력 | 최종 display |
|---|---|---|
| S20 | `0` `0` `7` | `7` |
| S21 | `.` `5` | `0.5` |
| S22 | `1` `.` `2` `.` `3` | `1.23` |
| S23 | `1` `2` `3` `⌫` | `12` |
| S24 | `5` `⌫` | `0` |
| S25 | `5` `±` | `-5` |
| S26 | `0` `±` | `0` |
| S27 | `1`을 16번 입력 후 `7` | `1,111,111,111,111,111` 에 7이 추가되지 않음 (16자리 유지) |
| S28 | `1` `2` `3` `4` `5` `6` `7` | `1,234,567` |

### 5-3. 단항 연산

| # | 입력 | 최종 display | 최종 expression |
|---|---|---|---|
| S30 | `4` `x²` | `16` | `sqr(4)` |
| S31 | `9` `√x` | `3` | `√(9)` |
| S32 | `4` `1/x` | `0.25` | `1/(4)` |
| S33 | `5` `+` `3` `x²` `=` | `14` | `5 + sqr(3) =` |
| S34 | `2` `x²` `x²` | `16` | `sqr(sqr(2))` |
| S35 | `200` `+` `10` `%` | `20` | `200 + 20` |
| S36 | `200` `+` `10` `%` `=` | `220` | `200 + 20 =` |
| S37 | `5` `%` | `0` | `0` |

### 5-4. 에러

| # | 입력 | 최종 display | 비고 |
|---|---|---|---|
| S40 | `5` `÷` `0` `=` | `0으로 나눌 수 없습니다` | 연산 버튼 비활성 |
| S41 | `0` `÷` `0` `=` | `정의되지 않은 결과입니다` | |
| S42 | `5` `±` `√x` | `잘못된 입력입니다` | |
| S43 | `0` `1/x` | `0으로 나눌 수 없습니다` | |
| S44 | `5` `÷` `0` `=` `C` | `0` | 복구 |
| S45 | `5` `÷` `0` `=` `7` | `7` | 숫자 입력으로 복구 |

### 5-5. 메모리

| # | 입력 | 최종 display | memory |
|---|---|---|---|
| S50 | `5` `MS` `C` `MR` | `5` | `5` |
| S51 | `5` `MS` `3` `M+` `MR` | `8` | `8` |
| S52 | `5` `MS` `3` `M−` `MR` | `2` | `2` |
| S53 | `5` `MS` `MC` | `5` | `null` |
| S54 | `3` `M+` (메모리 비어 있음) `MR` | `3` | `3` |

---

## 6. 데이터 구조

### 6-1. 타입 정의 (`src/engine/types.ts`)

```ts
export type BinaryOperator = 'add' | 'subtract' | 'multiply' | 'divide';
export type UnaryOperator  = 'reciprocal' | 'square' | 'sqrt';

export type CalcError =
  | 'DIVIDE_BY_ZERO'     // 0으로 나눌 수 없습니다
  | 'UNDEFINED_RESULT'   // 정의되지 않은 결과입니다 (0 ÷ 0)
  | 'INVALID_INPUT';     // 잘못된 입력입니다

/** 이미 확정된 계산 1건 */
export interface HistoryItem {
  id: string;            // crypto.randomUUID()
  expression: string;    // "12 + 3 ="
  result: string;        // "15" (포맷 전 원본 문자열)
  createdAt: number;     // epoch ms
}

/** = 반복 입력용: 마지막으로 실행한 연산 */
export interface LastOperation {
  operator: BinaryOperator;
  operand: string;       // 두 번째 피연산자 (Decimal 문자열)
}

export interface CalcState {
  /** 현재 입력/결과 값. 항상 포맷 전 원본 문자열. 예: "0.", "12.50", "-3" */
  display: string;

  /** 수식 표시줄에 쓸 토큰 목록. 렌더 시 join(' ') */
  expression: string[];

  /** 이항 연산의 왼쪽 값 (확정된 값). 없으면 null */
  accumulator: string | null;

  /** 대기 중인 이항 연산자 */
  pendingOperator: BinaryOperator | null;

  /** true면 다음 숫자 입력이 display를 덮어쓰며 새로 시작 */
  overwrite: boolean;

  /** true면 직전 동작이 '=' 였다 (새 계산/이어 계산 판별용) */
  justEvaluated: boolean;

  /** = 반복용 */
  lastOperation: LastOperation | null;

  /** 에러 상태. null이면 정상 */
  error: CalcError | null;

  /** 메모리 값 (Decimal 문자열). 비어 있으면 null */
  memory: string | null;

  history: HistoryItem[];
}
```

### 6-2. 초기 상태

```ts
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
};
```

### 6-3. 액션 (`src/state/actions.ts`)

```ts
export type CalcAction =
  | { type: 'DIGIT'; digit: string }              // '0'..'9'
  | { type: 'DECIMAL' }
  | { type: 'TOGGLE_SIGN' }
  | { type: 'BACKSPACE' }
  | { type: 'CLEAR_ENTRY' }                       // CE
  | { type: 'CLEAR_ALL' }                         // C
  | { type: 'BINARY_OP'; operator: BinaryOperator }
  | { type: 'UNARY_OP'; operator: UnaryOperator }
  | { type: 'PERCENT' }
  | { type: 'EQUALS' }
  | { type: 'MEMORY_CLEAR' }
  | { type: 'MEMORY_RECALL' }
  | { type: 'MEMORY_ADD' }
  | { type: 'MEMORY_SUBTRACT' }
  | { type: 'MEMORY_STORE' }
  | { type: 'HISTORY_RECALL'; id: string }
  | { type: 'HISTORY_CLEAR' }
  | { type: 'HYDRATE'; memory: string | null; history: HistoryItem[] }; // localStorage 복원
```

### 6-4. 계산 엔진 API (`src/engine/*`, 순수 함수)

```ts
// arithmetic.ts
export function applyBinary(
  a: string, op: BinaryOperator, b: string
): { ok: true; value: string } | { ok: false; error: CalcError };

export function applyUnary(
  x: string, op: UnaryOperator
): { ok: true; value: string } | { ok: false; error: CalcError };

export function percentOf(base: string, x: string): string; // base * x / 100

// input.ts
export function appendDigit(current: string, digit: string, overwrite: boolean): string;
export function appendDecimal(current: string, overwrite: boolean): string;
export function backspace(current: string): string;
export function toggleSign(current: string): string;

// format.ts
export function formatDisplay(raw: string): string;      // "1234567.50" → "1,234,567.50"
export function formatResult(value: Decimal): string;    // 정규화 + 과학적 표기 전환
export function formatExpression(tokens: string[]): string;
export function errorMessage(error: CalcError): string;  // 한국어 메시지
```

- 모든 숫자는 상태/엔진 경계에서 **문자열**로 주고받고, 엔진 내부에서만 `Decimal` 로 변환한다.
- `applyBinary` 는 예외를 던지지 않고 결과 객체로 에러를 반환한다.

### 6-5. 리듀서 (`src/state/calcReducer.ts`)

```ts
export function calcReducer(state: CalcState, action: CalcAction): CalcState;
```

- 에러 상태(`state.error !== null`)에서는 허용된 액션(`CLEAR_ALL`, `CLEAR_ENTRY`, `DIGIT`, `DECIMAL`, `HYDRATE`, `HISTORY_*`) 외에는 상태를 그대로 반환한다.

### 6-6. 저장 스키마 (localStorage)

| 키 | 값 | 비고 |
|---|---|---|
| `calc:v1:memory` | `string \| null` (JSON) | |
| `calc:v1:history` | `HistoryItem[]` (JSON) | 최대 100개 |

- 파싱 실패 시 무시하고 초기값 사용. 스키마 변경 시 버전(`v1`)을 올린다.

---

## 7. 컴포넌트 구조

```
src/
├─ engine/                 # 순수 로직 (React 비의존)
│  ├─ types.ts
│  ├─ arithmetic.ts
│  ├─ input.ts
│  ├─ format.ts
│  └─ *.test.ts
├─ state/
│  ├─ actions.ts
│  ├─ calcReducer.ts
│  ├─ CalculatorContext.tsx
│  └─ calcReducer.test.ts
├─ hooks/
│  ├─ useKeyboard.ts       # 키 → 액션 매핑
│  └─ usePersistence.ts    # localStorage 동기화
├─ components/
│  ├─ Calculator.tsx       # 최상위 조립
│  ├─ Display.tsx          # expression + display + M 인디케이터
│  ├─ MemoryBar.tsx
│  ├─ Keypad.tsx
│  ├─ CalcButton.tsx
│  ├─ HistoryPanel.tsx
│  └─ *.test.tsx
├─ styles/
│  └─ tokens.css           # 색상, 폰트, 간격 CSS 변수
├─ App.tsx
└─ main.tsx
```

### 컴포넌트 책임

| 컴포넌트 | props | 책임 |
|---|---|---|
| `Calculator` | – | Provider, 키보드 훅, 레이아웃 조립 |
| `Display` | `expression`, `display`, `hasMemory`, `error` | 포맷팅된 값 표시, 폰트 자동 축소, `aria-live="polite"` |
| `MemoryBar` | `hasMemory` | MC/MR/M+/M−/MS/M▾ 버튼 |
| `Keypad` | `disabled` | 버튼 배열 렌더링 |
| `CalcButton` | `label`, `ariaLabel`, `variant`, `disabled`, `onPress`, `pressed?` | 단일 버튼 |
| `HistoryPanel` | `items`, `onSelect`, `onClear` | 기록 목록 |

---

## 8. 접근성 및 UX

- 디스플레이 영역은 `role="status"` + `aria-live="polite"` 로 결과 변화를 스크린 리더에 전달한다.
- 버튼의 `aria-label` 예: `+` → "더하기", `÷` → "나누기", `⌫` → "지우기", `1/x` → "역수".
- 포커스 링을 제거하지 않는다. `Tab` 이동이 가능해야 한다.
- 색 대비는 WCAG AA(4.5:1) 이상을 목표로 한다.
- 다크/라이트 테마는 `prefers-color-scheme` 을 따른다. (수동 토글은 확장)

## 9. 결정 사항 (모호했던 부분의 확정)

| # | 결정 | 이유 |
|---|---|---|
| D1 | 연산자 우선순위 없이 **즉시 실행** 방식 | Windows 표준 모드 동작 |
| D2 | `%` 는 이항 연산 대기 중일 때만 의미 있음 (`base × x ÷ 100`) | Windows 표준 모드 동작 |
| D3 | 상태 내부 값은 문자열, 연산 시에만 `Decimal` | 부동소수점 오차 방지 및 직렬화 용이 |
| D4 | 표시 포맷은 상태가 아닌 **렌더 시점**에 계산 | 상태 단순화, 포맷 규칙 변경 시 상태 영향 없음 |
| D5 | 기록/메모리 영속화는 reducer 밖 훅에서 처리 | reducer 순수성 유지 (C2) |
| D6 | 에러 메시지는 한국어 고정 | 1차 범위에서 i18n 제외 |

## 10. 확장 후보 (범위 밖)

- 공학용 모드 (sin, cos, log, 괄호, 우선순위 연산)
- 프로그래머 모드 (진법 변환, 비트 연산)
- 단위 변환 / 날짜 계산
- 테마 수동 전환, 항상 위에 표시
- 메모리 다중 슬롯
- i18n (영어/한국어)

## 11. 추적성 (Spec → Test)

| 영역 | FR | 시나리오 | 테스트 파일 |
|---|---|---|---|
| 숫자 입력 | FR-01~08 | S20~S28 | `input.test.ts`, `calcReducer.test.ts` |
| 이항 연산 | FR-10~17 | S01~S10 | `calcReducer.test.ts` |
| 단항 연산 | FR-20~23 | S30~S37 | `arithmetic.test.ts`, `calcReducer.test.ts` |
| 에러 | FR-30~33 | S40~S45 | `arithmetic.test.ts`, `calcReducer.test.ts` |
| 메모리 | FR-40~46 | S50~S54 | `calcReducer.test.ts`, `MemoryBar.test.tsx` |
| 기록 | FR-50~54 | – | `calcReducer.test.ts`, `HistoryPanel.test.tsx`, `usePersistence.test.ts` |
| 키보드 | 4-7 | – | `useKeyboard.test.tsx` |
| 표시 형식 | FR-60~64 | S28 | `format.test.ts`, `Display.test.tsx` |

## 12. 구현 시 확정한 세부 사항

- D7: 기록의 UUID와 시각은 Context에서 생성해 EQUALS 액션의 `id`, `createdAt`으로 전달한다. reducer의 순수성과 재현성을 유지한다.
- D8: 중첩 단항 연산의 수식 보존을 위해 `operandExpression` 상태를 추가한다. 단항 연산 후 숫자는 변환된 피연산자를 대체한다.
- D9: FR-33을 우선하여 오류 중 소수점 키도 비활성화한다. C, CE, 숫자로 복구하고 기록 열람·불러오기는 가능하다.
- D10: 붙여넣기는 PASTE 액션으로 검증한다. 천 단위 쉼표 및 지수 표기를 허용하고 16 유효숫자로 정규화한다. 붙여넣기 값은 대기 연산의 오른쪽 피연산자로 사용할 수 있다.
- D11: 각 연산 결과를 16 유효숫자로 확정하므로 `1 ÷ 3 = × 3 =` 는 `0.9999999999999999`이다. 연산 중 decimal.js 정밀도는 32이다.
- D12: 데스크톱에는 기록/메모리 패널을 상시 표시하고, 700px 이하에서는 헤더 토글 또는 M⌄로 여는 오버레이로 표시한다.
