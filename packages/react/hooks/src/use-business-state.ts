import { useSyncExternalStore, useCallback, useRef } from 'react';
import { deepEqual } from 'fast-equals';

interface EventEmitter {
  on: (type: string, listener: () => void) => void;
  off: (type: string, listener: () => void) => void;
}

const SEPARATOR = '__@.@__';

export function useBusinessState<E extends EventEmitter, R>(
  emitter: E,
  events: string[],
  evalFn: (emitter: E) => R,
): R;
export function useBusinessState<
  E extends EventEmitter,
  A extends unknown[],
  R,
>(
  emitter: E,
  events: string[],
  evalFn: (emitter: E, args: [...A]) => R,
  args: [...A],
): R;

export function useBusinessState<
  E extends EventEmitter,
  A extends unknown[],
  R,
>(
  emitter: E,
  events: string[],
  evalFn: (emitter: E, args?: A) => R,
  args?: A,
): R {
  const eventStr = events.join(SEPARATOR);

  const subscribe = useCallback(
    (listener: () => void) => {
      const types = eventStr.split(SEPARATOR);

      types.forEach((type) => {
        emitter.on(type, listener);
      });

      return () => {
        types.forEach((type) => {
          emitter.off(type, listener);
        });
      };
    },
    [emitter, eventStr],
  );

  const evalFnRef = useRef(evalFn);
  evalFnRef.current = evalFn;

  const argsRef = useRef(args);
  argsRef.current = args;

  const currentValueRef = useRef<R>();
  const getSnapshot = useCallback(() => {
    const nextValue = evalFnRef.current(emitter, argsRef.current);
    const currentValue = currentValueRef.current;

    currentValueRef.current = deepEqual(nextValue, currentValue)
      ? currentValue
      : nextValue;

    return currentValueRef.current as R;
  }, [emitter]);

  return useSyncExternalStore(subscribe, getSnapshot);
}
