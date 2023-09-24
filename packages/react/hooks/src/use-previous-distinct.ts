import { useRef } from 'react';

export function usePreviousDistinct<T>(
  value: T,
  compare = (prev: T | undefined, next: T) => prev === next,
): T | undefined {
  const mountedRef = useRef(false);

  const previousRef = useRef<T>();
  const currentRef = useRef<T>(value);

  if (mountedRef.current && !compare(currentRef.current, value)) {
    previousRef.current = currentRef.current;
    currentRef.current = value;
  }

  mountedRef.current = true;

  return previousRef.current;
}
