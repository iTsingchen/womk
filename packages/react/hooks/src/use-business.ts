import { useMemo, useSyncExternalStore, useCallback, useRef } from 'react';
import { deepEqual } from 'fast-equals';
import { usePreviousDistinct } from './use-previous-distinct';

interface EventEmitter {
  on: (type: string, listener: () => void) => void;
  off: (type: string, listener: () => void) => void;
}

const SEPARATOR = '__@.@__';

export function useBusiness<E extends EventEmitter, R>(
  emitter: E,
  events: string[],
  evalFn: (emitter: E) => R,
): R;
export function useBusiness<E extends EventEmitter, A, R>(
  emitter: E,
  events: string[],
  evalFn: (emitter: E, args: A) => R,
  args: A,
): R;

export function useBusiness<E extends EventEmitter, A, R>(
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

  const previousArgs = usePreviousDistinct(args, deepEqual);
  const currentArgs = useMemo(
    () => (previousArgs && deepEqual(args, previousArgs) ? previousArgs : args),
    [args, previousArgs],
  );

  const evalFnRef = useRef(evalFn);
  evalFnRef.current = evalFn;

  const currentValueRef = useRef<R>();
  const getSnapshot = useCallback(() => {
    const nextValue = evalFnRef.current(emitter, currentArgs);
    const currentValue = currentValueRef.current;

    currentValueRef.current = deepEqual(nextValue, currentValue)
      ? currentValue
      : nextValue;

    return currentValueRef.current as R;
  }, [emitter, currentArgs]);

  return useSyncExternalStore(subscribe, getSnapshot);
}
