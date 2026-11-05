# plan.md — 윈도우 계산기 구현 계획

> 상위 문서: [intent.md](./intent.md), [spec.md](./spec.md)
> 원칙: **엔진 → 상태 → UI** 순으로 안쪽부터 바깥으로 구현하고, 각 단계는 spec의 시나리오(S##)로 검증한다.

---

## 1. 진행 방식

- 각 Task는 **작게(1~2시간 이내)** 쪼개고, 완료 시 커밋한다.
- 엔진·리듀서는 **테스트 먼저(TDD)**: spec의 시나리오 표를 테스트로 옮긴 뒤 구현한다.
- 각 Phase 끝에 **완료 조건(DoD)** 을 확인하고 다음 Phase로 넘어간다.
- 구현 중 spec과 다른 판단이 필요하면 **코드보다 spec.md를 먼저 수정**하고 "결정 사항"에 기록한다.
- 커밋 메시지 규칙: `feat|fix|test|docs|refactor|chore: 내용 (FR-xx)`

## 2. 마일스톤 개요

| Phase | 내용 | 범위 |
|---|---|---|
| 0 | 프로젝트 세팅 | MVP |
| 1 | 계산 엔진 (순수 함수) | MVP |
| 2 | 상태 관리 (reducer) | MVP |
| 3 | UI 컴포넌트 | MVP |
| 4 | 키보드 입력 | MVP |
| 5 | 메모리 · 기록 · 영속화 | 기능 완성 |
| 6 | 폴리싱 (접근성, 스타일, 반응형) | 기능 완성 |
| 7 | 마무리 (문서, 배포) | 완료 |

> **MVP 기준**: Phase 0~4 완료 시 사칙연산 + 단항 연산 + 키보드 입력이 되는 계산기.

---

## 3. 작업 계획

### Phase 0. 프로젝트 세팅

| Task | 내용 | 산출물 |
|---|---|---|
| 0-1 | Vite + React + TS 프로젝트 생성 | `package.json`, `vite.config.ts` |
| 0-2 | 의존성 설치: `decimal.js`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom` | |
| 0-3 | ESLint / Prettier 설정, `tsconfig` strict 확인 | |
| 0-4 | Vitest 설정 (`environment: jsdom`, setup 파일) 및 `npm test` 스크립트 | |
| 0-5 | 폴더 구조 생성 (spec 7장), `intent/spec/plan.md` 를 `docs/` 로 이동 | |
| 0-6 | 스모크 테스트 1개로 CI 환경 확인 | |

**DoD**: `npm run dev`, `npm test`, `npm run lint`, `npm run build` 모두 에러 없이 동작.

---

### Phase 1. 계산 엔진 (`src/engine`)

> React 의존 금지(C1). 모두 순수 함수. **테스트 먼저 작성.**

| Task | 내용 | 관련 FR/시나리오 |
|---|---|---|
| 1-1 | `types.ts` — spec 6-1 타입 정의 | – |
| 1-2 | `input.ts` — `appendDigit`, `appendDecimal`, `backspace`, `toggleSign` | FR-01~06, S20~S27 |
| 1-3 | `arithmetic.ts` — `applyBinary` (+ − × ÷, 0 나누기 에러 포함) | FR-10, FR-30, S02, S40, S41 |
| 1-4 | `arithmetic.ts` — `applyUnary` (1/x, x², √x, 에러 포함) | FR-20, FR-31, FR-32, S30~S32, S42, S43 |
| 1-5 | `arithmetic.ts` — `percentOf` | FR-22, S35 |
| 1-6 | `format.ts` — `formatDisplay` (천 단위 구분, 끝 소수점 보존) | FR-60, FR-61, S28 |
| 1-7 | `format.ts` — `formatResult` (0 제거, 과학적 표기, -0 처리) | FR-62~64 |
| 1-8 | `format.ts` — `formatExpression`, `errorMessage` | FR-20, FR-30 |

**테스트 포인트 (엔진)**
- `0.1 + 0.2 === '0.3'`, `1 / 3` 이 16 유효숫자로 정리되는지
- 매우 큰 수·매우 작은 수의 과학적 표기 전환 경계
- `appendDigit('0', '0')` → `'0'`, `appendDigit('0', '7')` → `'7'`
- 16자리 제한 (소수점·부호는 자릿수에 미포함)
- `toggleSign('0')` → `'0'`, `toggleSign('0.')` 처리

**DoD**: 엔진 테스트 전부 통과, 엔진 폴더에 `react` import 0건 (`grep` 확인), 커버리지 90% 이상.

---

### Phase 2. 상태 관리 (`src/state`)

| Task | 내용 | 관련 FR/시나리오 |
|---|---|---|
| 2-1 | `actions.ts`, `initialState` 정의 | spec 6-2, 6-3 |
| 2-2 | `calcReducer` — `DIGIT`, `DECIMAL`, `TOGGLE_SIGN`, `BACKSPACE` | FR-01~06, S20~S28 |
| 2-3 | `CLEAR_ENTRY`, `CLEAR_ALL` | FR-07, FR-08 |
| 2-4 | `BINARY_OP` — 대기 연산, 즉시 실행, 연산자 교체 | FR-10~12, S03~S05 |
| 2-5 | `EQUALS` — 실행, `=` 반복, 연산자 없이 `=`, `5 + =` | FR-13~17, S01, S06~S10 |
| 2-6 | `UNARY_OP`, `PERCENT` | FR-20~23, S30~S37 |
| 2-7 | 에러 상태 전이 및 복구 (허용 액션 제한) | FR-30~33, S40~S45 |
| 2-8 | `MEMORY_*` 액션 | FR-40~44, S50~S54 |
| 2-9 | 기록 추가/불러오기/삭제 (100개 제한) | FR-50~53 |
| 2-10 | `CalculatorContext` — Provider와 `useCalculator()` 훅 | – |

**진행 방식**: spec 5장의 시나리오 표를 **테스트 헬퍼**로 옮긴다.

```ts
// 테스트 헬퍼 예시
const press = (keys: Action[]) => keys.reduce(calcReducer, initialState);
```

**DoD**: S01~S54 전 시나리오 통과, reducer가 순수 함수임을 확인 (같은 입력 → 같은 출력, 외부 접근 없음).

---

### Phase 3. UI 컴포넌트

| Task | 내용 | 비고 |
|---|---|---|
| 3-1 | `styles/tokens.css` — 색상/폰트/간격 CSS 변수, 라이트·다크 | |
| 3-2 | `CalcButton` — variant(숫자/연산/등호/기능), disabled, aria-label | FR-33, C6 |
| 3-3 | `Keypad` — 4×6 그리드, 버튼 → dispatch 연결 | |
| 3-4 | `Display` — expression/display 표시, 포맷 적용, 에러 메시지 | FR-60~64 |
| 3-5 | `Display` — 자릿수에 따른 폰트 자동 축소 | spec 3장 |
| 3-6 | `Calculator` — Provider와 레이아웃 조립, `App` 연결 | |
| 3-7 | 컴포넌트 테스트: 클릭 시나리오 (S01, S04, S40) | |

**DoD**: 마우스 클릭만으로 사칙연산·단항 연산·에러 복구가 가능하고, 컴포넌트 테스트 통과.

---

### Phase 4. 키보드 입력

| Task | 내용 | 관련 |
|---|---|---|
| 4-1 | `useKeyboard` — key → action 매핑 테이블 (spec 4-7) | |
| 4-2 | `/`, `*` 등의 `preventDefault` 처리, `Ctrl` 조합 처리 | |
| 4-3 | 키 입력 시 대응 버튼 눌림 효과 (`pressed` 상태) | |
| 4-4 | `Ctrl+C` 복사 / `Ctrl+V` 붙여넣기 (유효 숫자 검증) | |
| 4-5 | 테스트: `userEvent.keyboard('12+3{Enter}')` → `15` | S01 |

**DoD**: 키보드만으로 spec 5장의 기본 시나리오를 모두 재현 가능. **← MVP 완료 시점**

---

### Phase 5. 메모리 · 기록 · 영속화

| Task | 내용 | 관련 FR |
|---|---|---|
| 5-1 | `MemoryBar` 컴포넌트, MC/MR 비활성 조건, `M` 인디케이터 | FR-40~45 |
| 5-2 | 메모리 패널(`M▾`) | FR-46 |
| 5-3 | `HistoryPanel` — 목록, 항목 클릭 시 결과 로드, 전체 삭제 | FR-50~52 |
| 5-4 | 헤더에 기록 토글 버튼, 좁은 화면 오버레이 처리 | spec 3장 |
| 5-5 | `usePersistence` — 마운트 시 `HYDRATE`, 변경 시 저장 | FR-54, D5 |
| 5-6 | 잘못된 JSON·스키마 불일치 시 안전하게 초기값 사용 | spec 6-6 |
| 5-7 | 테스트: 새로고침 시뮬레이션(언마운트 → 재마운트)으로 복원 확인 | |

**DoD**: 메모리/기록이 동작하고 새로고침 후에도 유지된다.

---

### Phase 6. 폴리싱

| Task | 내용 |
|---|---|
| 6-1 | 접근성: `aria-live`, `aria-label` 전수 점검, 키보드 포커스 이동 확인 |
| 6-2 | 색 대비 점검 (AA), 다크/라이트 테마 확인 |
| 6-3 | 반응형: 320px ~ 데스크톱 확인 |
| 6-4 | Windows 계산기와 나란히 비교하며 **동작 차이 점검 리스트** 작성 → 차이는 spec 결정 사항에 반영 |
| 6-5 | 리팩터링: 중복 제거, 네이밍 정리, 불필요한 리렌더 확인 (`React.memo` 필요 시만 적용) |

**DoD**: Lighthouse Accessibility 90+ , 수동 점검 체크리스트 통과.

---

### Phase 7. 마무리

| Task | 내용 |
|---|---|
| 7-1 | `README.md` — 실행 방법, 스크린샷, 문서 링크 |
| 7-2 | 문서 최종 동기화 (intent의 성공 기준 체크박스 갱신, spec ↔ 구현 불일치 제거) |
| 7-3 | (선택) GitHub Pages / Vercel 배포 |
| 7-4 | 회고 메모 — 문서 주도 개발에서 배운 점 |

---

## 4. 테스트 계획

### 4-1. 테스트 계층

| 계층 | 도구 | 대상 | 목표 커버리지 |
|---|---|---|---|
| 단위 (엔진) | Vitest | `engine/*` | 90%+ |
| 단위 (리듀서) | Vitest | `calcReducer` | 90%+ (분기 전수) |
| 훅 | Vitest + RTL `renderHook` | `useKeyboard`, `usePersistence` | 80%+ |
| 컴포넌트 | RTL + user-event | `Display`, `Keypad`, `MemoryBar`, `HistoryPanel` | 주요 상호작용 |
| 통합 | RTL | `Calculator` 전체 클릭·키보드 시나리오 | spec 5장 대표 시나리오 |
| 수동 | 브라우저 | 실제 Windows 계산기와 비교, 반응형, 접근성 | 체크리스트 |

### 4-2. 시나리오 → 테스트 매핑

- spec 5장 표의 각 행(S01~S54)을 `it.each` 테스트로 변환한다.
- 테스트 이름에 시나리오 번호를 포함한다. 예: `it('S06: 2 + 3 = = = → 11')`
- 새 버그가 발견되면 **먼저 재현 테스트를 추가**한 뒤 수정한다.

### 4-3. 추가 엣지 케이스 (spec에 없는 것 포함)

- [ ] 16자리 입력 후 `⌫` 로 줄인 뒤 재입력
- [ ] `1 ÷ 3 =` 의 결과 정밀도 및 이후 `×3` 결과 (`0.9999999999999999` vs `1`)
- [ ] 결과 상태에서 `±` 적용 후 연산자 입력
- [ ] 결과 상태에서 `⌫` 무시 확인 (FR-06)
- [ ] `CE` 후 이어서 숫자 입력 → 수식 유지 확인 (FR-07)
- [ ] 에러 상태에서 `MR`, 연산자 클릭 시 상태 불변 (FR-33)
- [ ] 기록 100개 초과 시 가장 오래된 항목 제거 (FR-53)
- [ ] `localStorage` 값이 깨져 있을 때 앱이 정상 기동 (spec 6-6)
- [ ] 입력창이 아닌 곳에 포커스가 있을 때도 키보드 입력 동작

### 4-4. 수동 테스트 체크리스트 (Phase 6)

- [ ] 마우스로 spec 5-1~5-5 시나리오를 모두 눌러본다.
- [ ] 키보드만으로 동일 시나리오를 수행한다.
- [ ] Windows 계산기에서 같은 입력을 하고 결과를 비교한다.
- [ ] 320px, 768px, 1280px 폭에서 레이아웃 확인.
- [ ] 스크린 리더(VoiceOver/NVDA) 에서 결과가 읽히는지 확인.
- [ ] 새로고침 후 메모리·기록 유지 확인.

---

## 5. 품질 기준 (전 Phase 공통)

- 모든 PR/커밋 전: `npm run lint && npm test` 통과
- TypeScript `any` 사용 금지 (불가피한 경우 주석으로 사유 명시)
- 엔진 폴더에서 `react`, `dom` 관련 import 금지
- 매직 넘버·문자열(16자리, 100개, 에러 메시지)은 `constants.ts` 로 분리

## 6. 리스크와 대응

| 리스크 | 가능성 | 대응 |
|---|---|---|
| Windows 계산기의 세부 동작과 spec 불일치 | 중 | Phase 6-4에서 실제 앱과 비교, spec 갱신 |
| `Decimal` 설정(precision, rounding)에 따른 표시 오차 | 중 | Phase 1-7에서 경계값 테스트 집중 |
| reducer 분기 증가로 가독성 저하 | 중 | 액션별 핸들러 함수로 분리, 상태 전이 표 주석화 |
| 키보드 단축키가 브라우저 기본 동작과 충돌 | 하 | `preventDefault` 적용 및 테스트 |
| 범위 확장 욕심 | 중 | MVP(Phase 4) 달성 전에는 Phase 5 이후 착수 금지 |

## 7. 진행 현황 체크리스트

- [ ] Phase 0 — 프로젝트 세팅
- [ ] Phase 1 — 계산 엔진
- [ ] Phase 2 — 상태 관리
- [ ] Phase 3 — UI 컴포넌트
- [ ] Phase 4 — 키보드 입력 **(MVP)**
- [ ] Phase 5 — 메모리 · 기록 · 영속화
- [ ] Phase 6 — 폴리싱
- [ ] Phase 7 — 마무리

## 8. 다음 단계

문서 3종을 확정한 뒤 **Phase 0 → Phase 1** 부터 순서대로 진행한다.
구현 요청 시 "plan.md Phase N, Task N-N 구현해줘" 형식으로 범위를 지정하면 문서와 1:1로 대응된다.
