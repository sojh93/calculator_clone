import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type ReactNode,
} from 'react';
import { calcReducer } from './calcReducer';
import type { CalcState } from '../engine/types';
import type { UserAction } from './actions';
import { readPersistedState, usePersistence } from '../hooks/usePersistence';
const Context = createContext<{
  state: CalcState;
  dispatch: (action: UserAction) => void;
} | null>(null);
export function CalculatorProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(
    calcReducer,
    undefined,
    readPersistedState,
  );
  usePersistence(state);
  const dispatch = useCallback(
    (action: UserAction) =>
      rawDispatch(
        action.type === 'EQUALS'
          ? { ...action, id: crypto.randomUUID(), createdAt: Date.now() }
          : action,
      ),
    [],
  );
  return (
    <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>
  );
}
export function useCalculator() {
  const value = useContext(Context);
  if (!value) throw new Error('CalculatorProvider is required');
  return value;
}
