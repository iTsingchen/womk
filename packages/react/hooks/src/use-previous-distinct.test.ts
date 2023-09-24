import { test, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { RenderHookResult } from '@testing-library/react';
import { usePreviousDistinct } from './use-previous-distinct';

type Predicate<T> = (a: T | undefined, b: T) => boolean;
interface RenderHookProps<T> {
  value?: T;
  compare?: Predicate<T>;
}

const setup = <T>(
  initialValue?: T,
  predicate?: Predicate<T>,
): RenderHookResult<T | undefined, RenderHookProps<T>> => {
  const initialProps: RenderHookProps<T> = {
    value: initialValue,
    compare: predicate,
  };
  return renderHook(
    ({ value, compare }) => usePreviousDistinct<T>(value as T, compare),
    { initialProps },
  );
};

test('should be defined', () => {
  expect(usePreviousDistinct).toBeDefined();
});

test('should return undefined on init', () => {
  expect(setup().result.current).toBeUndefined();
});

test('should not invoke predicate on first render', () => {
  const spy = vi.fn();
  setup(0, spy);

  expect(spy).not.toHaveBeenCalled();
});

test('should update previous value only after render with different value', () => {
  const hook = setup<number>();

  expect(hook.result.current).toBeUndefined();

  hook.rerender({ value: 0 });
  expect(hook.result.current).toBeUndefined();

  hook.rerender({ value: 1 });
  expect(hook.result.current).toBe(0);

  hook.rerender({ value: 2 });
  expect(hook.result.current).toBe(1);

  hook.rerender({ value: 2 });
  expect(hook.result.current).toBe(1);

  hook.rerender({ value: 3 });
  expect(hook.result.current).toBe(2);
});

test('should work fine with `undefined` values', () => {
  const hook = setup<number>();

  expect(hook.result.current).toBeUndefined();

  hook.rerender({ value: 1 });
  expect(hook.result.current).toBeUndefined();

  hook.rerender({ value: undefined });
  expect(hook.result.current).toBe(1);

  hook.rerender({ value: 2 });
  expect(hook.result.current).toBeUndefined();
});

test('should receive a predicate as a second parameter that will compare prev and current', () => {
  const obj1 = { label: 'John', value: 'john' };
  const obj2 = { label: 'Jonny', value: 'john' };
  const obj3 = { label: 'Kate', value: 'kate' };

  const predicate: Predicate<{ value: string }> = (a, b) => {
    if (!a) return false;
    return a.value === b.value;
  };

  const hook = setup(obj1, predicate);

  expect(hook.result.current).toBeUndefined();

  hook.rerender({ value: obj2, compare: predicate });

  expect(hook.result.current).toBeUndefined();

  hook.rerender({ value: obj3, compare: predicate });

  expect(hook.result.current).toBe(obj1);
});
