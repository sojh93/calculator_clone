import { useEffect, useRef, useState } from 'react';
import { CalculatorProvider, useCalculator } from '../state/CalculatorContext';
import { useKeyboard } from '../hooks/useKeyboard';
import { Display } from './Display';
import { Keypad } from './Keypad';
import { MemoryBar } from './MemoryBar';
import { HistoryPanel } from './HistoryPanel';
import { formatDisplay } from '../engine/format';
import styles from './Calculator.module.css';
function CalculatorView() {
  const { state, dispatch } = useCalculator();
  const pressed = useKeyboard(dispatch, state.display, !!state.error);
  const [panel, setPanel] = useState<'history' | 'memory'>('history');
  const [open, setOpen] = useState(false);
  const help = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open)
      panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, [open]);
  const closePanel = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };
  return (
    <main className={styles.workspace}>
      <div className={styles.intro}>
        <span className={styles.eyebrow}>EVERYDAY ESSENTIALS</span>
        <h1>복잡한 하루, 간단한 계산.</h1>
        <p>익숙한 계산기로, 생각의 흐름을 이어가세요.</p>
      </div>
      <div className={styles.window}>
        <div className={styles.titlebar}>
          <span className={styles.appIcon} aria-hidden="true">
            ▦
          </span>
          <span>계산기</span>
          <span className={styles.titleHint}>STANDARD</span>
        </div>
        <div className={styles.body}>
          <section className={styles.calculator} aria-label="표준 계산기">
            <header className={styles.header}>
              <h2>표준</h2>
              <button
                ref={toggleRef}
                type="button"
                aria-label={open ? '기록 패널 닫기' : '기록 패널 열기'}
                aria-expanded={open}
                aria-controls="calculator-panel"
                className={styles.iconButton}
                onClick={() => {
                  setPanel('history');
                  setOpen(!open);
                }}
              >
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M3 11a9 9 0 1 1 2.6 7M3 4v7h7M12 7v5l3 2" />
                </svg>
              </button>
            </header>
            <Display state={state} />
            <MemoryBar
              pressed={pressed}
              onOpen={() => {
                setPanel('memory');
                setOpen(true);
              }}
            />
            <Keypad pressed={pressed} />
          </section>
          <aside
            ref={panelRef}
            id="calculator-panel"
            className={`${styles.panel} ${open ? styles.panelOpen : ''}`}
            aria-label="기록 및 메모리"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                closePanel();
              }
            }}
          >
            <div className={styles.tabs}>
              <button
                type="button"
                aria-label="기록 보기"
                aria-pressed={panel === 'history'}
                className={panel === 'history' ? styles.activeTab : ''}
                onClick={() => setPanel('history')}
              >
                기록
              </button>
              <button
                type="button"
                aria-label="메모리 보기"
                aria-pressed={panel === 'memory'}
                className={panel === 'memory' ? styles.activeTab : ''}
                onClick={() => setPanel('memory')}
              >
                메모리
              </button>
              <button
                type="button"
                aria-label="패널 닫기"
                className={styles.closePanel}
                onClick={closePanel}
              >
                ×
              </button>
            </div>
            {panel === 'history' ? (
              <HistoryPanel />
            ) : (
              <>
                <div className={styles.panelContent}>
                  {state.memory === null ? (
                    <div className={styles.empty}>
                      <span aria-hidden="true">M</span>
                      <strong>저장된 메모리가 없어요</strong>
                      <p>MS를 눌러 현재 값을 저장하세요.</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.historyItem}
                      aria-label="저장된 메모리 불러오기"
                      disabled={!!state.error}
                      onClick={() => dispatch({ type: 'MEMORY_RECALL' })}
                    >
                      <span>저장된 값</span>
                      <strong>{formatDisplay(state.memory)}</strong>
                    </button>
                  )}
                </div>
                <div className={styles.panelFooter}>
                  <span>메모리</span>
                  <button
                    type="button"
                    aria-label="저장된 메모리 삭제"
                    disabled={state.memory === null || !!state.error}
                    onClick={() => dispatch({ type: 'MEMORY_CLEAR' })}
                  >
                    삭제
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
        <footer className={styles.statusbar}>
          <span>
            <i /> 표준 모드
          </span>
          <button
            type="button"
            aria-label="키보드 단축키 보기"
            onClick={() => help.current?.showModal()}
          >
            ⌨ <span>키보드 단축키</span>
          </button>
        </footer>
      </div>
      <p className={styles.caption}>작은 계산부터, 큰 아이디어까지.</p>
      <dialog
        ref={help}
        className={styles.help}
        aria-labelledby="help-title"
        onClick={(e) => {
          if (e.target === help.current) help.current?.close();
        }}
      >
        <h2 id="help-title">키보드 단축키</h2>
        <dl>
          <dt>숫자 · 사칙연산</dt>
          <dd>0–9 · + − * /</dd>
          <dt>계산하기</dt>
          <dd>Enter 또는 =</dd>
          <dt>모두 / 현재 입력 지우기</dt>
          <dd>Esc / Delete</dd>
          <dt>한 자리 지우기</dt>
          <dd>Backspace</dd>
          <dt>부호 · 역수 · 제곱근</dt>
          <dd>F9 · r · @</dd>
          <dt>메모리 MC / MR / M+ / M− / MS</dt>
          <dd>Ctrl + L / R / P / Q / M</dd>
          <dt>복사 / 붙여넣기</dt>
          <dd>Ctrl + C / V</dd>
        </dl>
        <button
          type="button"
          aria-label="단축키 안내 닫기"
          onClick={() => help.current?.close()}
        >
          닫기
        </button>
      </dialog>
    </main>
  );
}
export function Calculator() {
  return (
    <CalculatorProvider>
      <CalculatorView />
    </CalculatorProvider>
  );
}
