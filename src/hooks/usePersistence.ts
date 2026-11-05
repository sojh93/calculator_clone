import { useEffect } from 'react';
import type { CalcState, HistoryItem } from '../engine/types';
import { initialState } from '../state/calcReducer';
import { MAX_HISTORY } from '../engine/constants';
import { parsePastedNumber } from '../engine/input';
const MEMORY_KEY = 'calc:v1:memory',
  HISTORY_KEY = 'calc:v1:history';
const validNumber = (x: unknown): x is string =>
  typeof x === 'string' && parsePastedNumber(x) !== null;
function validItem(x: unknown): x is HistoryItem {
  if (!x || typeof x !== 'object') return false;
  const h = x as Record<string, unknown>;
  return (
    typeof h.id === 'string' &&
    typeof h.expression === 'string' &&
    h.expression.length < 2000 &&
    validNumber(h.result) &&
    typeof h.createdAt === 'number' &&
    Number.isFinite(h.createdAt)
  );
}
export function readPersistedState(): CalcState {
  let memory: null | string = null;
  let history: HistoryItem[] = [];
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(MEMORY_KEY) ?? 'null',
    );
    if (validNumber(value)) memory = value;
  } catch {
    /* Storage may be unavailable or malformed. */
  }
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(HISTORY_KEY) ?? '[]',
    );
    if (Array.isArray(value) && value.every(validItem))
      history = value.slice(0, MAX_HISTORY);
  } catch {
    /* Recover using empty history. */
  }
  return { ...initialState, memory, history };
}
export function usePersistence(state: CalcState) {
  useEffect(() => {
    try {
      localStorage.setItem(MEMORY_KEY, JSON.stringify(state.memory));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
    } catch {
      /* A full or blocked storage must not interrupt calculations. */
    }
  }, [state.memory, state.history]);
}
