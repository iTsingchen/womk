import { useRef } from 'react';
import { useIsomorphicEffect } from './use-isomorphic-effect';

interface EventEmitter {
  on: (type: string, listener: () => void) => void;
  off: (type: string, listener: () => void) => void;
}

const SEPARATOR = '__@.@__';

export function useBusinessEvent<E extends EventEmitter>(
  emitter: E,
  events: string[],
  listener: (emitter: E) => void,
): void;
export function useBusinessEvent<E extends EventEmitter, A extends unknown[]>(
  emitter: E,
  events: string[],
  listener: (emitter: E, args: [...A]) => void,
  args: [...A],
): void;
export function useBusinessEvent<E extends EventEmitter, A extends unknown[]>(
  emitter: E,
  events: string[],
  listener: (emitter: E, args?: A) => void,
  args?: A,
): void {
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  const argsRef = useRef(args);
  argsRef.current = args;

  const eventStr = events.join(SEPARATOR);
  useIsomorphicEffect(() => {
    const listenerFn = (): void => {
      listenerRef.current(emitter, argsRef.current);
    };

    const types = eventStr.split(SEPARATOR);

    types.forEach((type) => {
      emitter.on(type, listenerFn);
    });

    return () => {
      types.forEach((type) => {
        emitter.off(type, listenerFn);
      });
    };
  }, [emitter, eventStr]);
}
