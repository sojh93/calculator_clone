import { useEffect, useState } from 'react';
import type { UserAction } from '../state/actions';
const keyMap: Record<string, UserAction> = {
  '.': { type: 'DECIMAL' },
  ',': { type: 'DECIMAL' },
  '+': { type: 'BINARY_OP', operator: 'add' },
  '-': { type: 'BINARY_OP', operator: 'subtract' },
  '*': { type: 'BINARY_OP', operator: 'multiply' },
  '/': { type: 'BINARY_OP', operator: 'divide' },
  Enter: { type: 'EQUALS' },
  '=': { type: 'EQUALS' },
  Backspace: { type: 'BACKSPACE' },
  Delete: { type: 'CLEAR_ENTRY' },
  Escape: { type: 'CLEAR_ALL' },
  '%': { type: 'PERCENT' },
  F9: { type: 'TOGGLE_SIGN' },
  r: { type: 'UNARY_OP', operator: 'reciprocal' },
  '@': { type: 'UNARY_OP', operator: 'sqrt' },
};
const memoryMap: Record<string, UserAction> = {
  l: { type: 'MEMORY_CLEAR' },
  r: { type: 'MEMORY_RECALL' },
  p: { type: 'MEMORY_ADD' },
  q: { type: 'MEMORY_SUBTRACT' },
  m: { type: 'MEMORY_STORE' },
};
export function actionId(action: UserAction) {
  return (
    action.type +
    ('digit' in action
      ? ':' + action.digit
      : 'operator' in action
        ? ':' + action.operator
        : '')
  );
}
export function useKeyboard(
  dispatch: (action: UserAction) => void,
  display: string,
  error: boolean,
) {
  const [pressed, setPressed] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setPressed(''), 130);
    return () => clearTimeout(timer);
  }, [pressed, display]);
  useEffect(() => {
    let active = true;
    const handler = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest(
          'dialog, input, textarea, select, [contenteditable="true"], [role="dialog"]',
        )
      )
        return;
      if (event.altKey) return;
      if (
        event.key === 'Enter' &&
        target instanceof HTMLButtonElement &&
        target.dataset.calcKey === undefined
      )
        return;
      const ctrl = event.ctrlKey || event.metaKey,
        key = event.key.toLowerCase();
      if (ctrl && (key === 'c' || key === 'v')) {
        if (error) return;
        event.preventDefault();
        if (key === 'c') {
          void navigator.clipboard?.writeText(display).catch(() => {});
        } else {
          void navigator.clipboard
            ?.readText()
            .then((value) => {
              if (active) dispatch({ type: 'PASTE', value });
            })
            .catch(() => {});
        }
        return;
      }
      const action = ctrl
        ? memoryMap[key]
        : /^\d$/.test(event.key)
          ? { type: 'DIGIT' as const, digit: event.key }
          : keyMap[event.key];
      if (!action) return;
      event.preventDefault();
      dispatch(action);
      setPressed(actionId(action));
    };
    window.addEventListener('keydown', handler);
    return () => {
      active = false;
      window.removeEventListener('keydown', handler);
    };
  }, [dispatch, display, error]);
  return pressed;
}
