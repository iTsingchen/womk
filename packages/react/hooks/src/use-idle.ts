import { useEffect, useState } from 'react';

const DEFAULT_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'wheel',
  'resize',
];

const SEPARATOR = '__@.@__';
const MAX_TIMEOUT = 2 ** 31 - 1; // https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#maximum_delay_value

interface UseIdleOptions {
  events?: string[];
}

export const useIdle = (ms: number, options?: UseIdleOptions): boolean => {
  const [idle, setIdle] = useState(false);
  const events = options?.events ?? DEFAULT_EVENTS;

  const eventStr = events.join(SEPARATOR);

  useEffect(() => {
    let timer: ReturnType<typeof globalThis.setTimeout> | undefined;

    const delay = (fn: () => void, timeout: number): void => {
      timer =
        timeout <= MAX_TIMEOUT
          ? setTimeout(fn, timeout)
          : setTimeout(() => {
              delay(fn, timeout - MAX_TIMEOUT);
            }, MAX_TIMEOUT);
    };

    const cancel = (): void => {
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
    };

    const handleEvent = (): void => {
      cancel();
      setIdle(false);
      delay(() => {
        setIdle(true);
      }, ms);
    };

    const handleVisibility = (): void => {
      if (!document.hidden) {
        handleEvent();
      }
    };

    const eventTypes = eventStr.split(SEPARATOR);

    eventTypes.forEach((eventType) => {
      window.addEventListener(eventType, handleEvent, { capture: true });
    });

    document.addEventListener('visibilitychange', handleVisibility);

    delay(() => {
      setIdle(true);
    }, ms);

    return () => {
      eventTypes.forEach((eventType) => {
        window.removeEventListener(eventType, handleEvent, { capture: true });
      });

      document.removeEventListener('visibilitychange', handleVisibility);

      cancel();
    };
  }, [ms, eventStr]);

  return idle;
};
