import { renderHook } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import { readPersistedState, usePersistence } from './usePersistence';
it('handles broken JSON and storage denial', () => {
  localStorage.setItem('calc:v1:history', '{broken');
  localStorage.setItem('calc:v1:memory', '{broken');
  expect(readPersistedState().history).toEqual([]);
  const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  expect(readPersistedState().memory).toBeNull();
  get.mockRestore();
  const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('full');
  });
  expect(() =>
    renderHook(() => usePersistence(readPersistedState())),
  ).not.toThrow();
  set.mockRestore();
});
