import { useBusinessState } from './use-business-state';

const deprecated = <A extends never[], R, Fn extends (...args: [...A]) => R>(
  fn: Fn,
  message: string,
): Fn => {
  let warned = false;
  const wrapped = (...args: [...A]): R => {
    if (!warned) {
      console.warn(message);
      warned = true;
    }

    return fn(...args);
  };

  return wrapped as Fn;
};

/**
 * @deprecated useBusiness is deprecated and will be removed in the next major version，please use use useBusinessState instead.
 */
export const useBusiness = deprecated(
  useBusinessState,
  'useBusiness is deprecated and will be removed in the next major version, please use useBusinessState instead.',
);
