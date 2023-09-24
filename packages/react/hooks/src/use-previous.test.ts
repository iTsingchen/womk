import { test, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePrevious } from './use-previous';

test('should return undefined on initial render', () => {
  const { result } = renderHook(({ state }) => usePrevious(state), {
    initialProps: { state: 0 },
  });

  expect(result.current).toBeUndefined();
});

test('should always return previous state after each update', () => {
  const { result, rerender } = renderHook(({ state }) => usePrevious(state), {
    initialProps: { state: 0 },
  });

  rerender({ state: 1 });
  expect(result.current).toBe(0);

  rerender({ state: 3 });
  expect(result.current).toBe(1);

  rerender({ state: 5 });
  expect(result.current).toBe(3);
});
