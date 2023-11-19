import { test, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBusinessEvent } from './use-business-event';

test('测试绑定事件', () => {
  const emitter = {
    on: vi.fn<[string, () => void]>(),
    off: vi.fn<[string, () => void]>(),
  };

  const hook = renderHook(
    ({ b, events }) => {
      useBusinessEvent(b, events, () => undefined);
    },
    { initialProps: { b: emitter, events: ['add'] } },
  );

  expect(emitter.on.mock.calls.length).toBe(1);
  expect(emitter.on.mock.calls[0]?.[0]).toBe('add');

  hook.rerender({ b: emitter, events: ['add'] });
  expect(emitter.on.mock.calls.length).toBe(1);

  hook.rerender({ b: emitter, events: ['remove'] });
  expect(emitter.on.mock.calls.length).toBe(2);
  expect(emitter.off.mock.calls.length).toBe(1);
  expect(emitter.off.mock.calls[0]?.[0]).toBe('add');
  expect(emitter.on.mock.calls[1]?.[0]).toBe('remove');

  hook.rerender({ b: emitter, events: ['add', 'remove'] });
  expect(emitter.on.mock.calls.length).toBe(4);
  expect(emitter.off.mock.calls.length).toBe(2);

  hook.unmount();
  expect(emitter.off.mock.calls.length).toBe(4);
});

test('测试事件触发', () => {
  const emitter = {
    on: vi.fn<[string, () => void]>(),
    off: vi.fn(),
  };

  const listener = vi.fn();

  const hook = renderHook(
    ({ b, events }) => {
      useBusinessEvent(b, events, listener);
    },
    { initialProps: { b: emitter, events: ['add'] } },
  );

  act(() => {
    emitter.on.mock.calls[0]?.[1]();
  });
  expect(listener.mock.calls.length).toBe(1);

  hook.rerender({ b: emitter, events: ['remove'] });
  expect(listener.mock.calls.length).toBe(1);
  act(() => {
    emitter.on.mock.calls[0]?.[1]();
  });
  expect(listener.mock.calls.length).toBe(2);
});

test('测试多参数', () => {
  const emitter = {
    on: vi.fn<[string, () => void]>(),
    off: vi.fn(),
  };

  const listener = vi.fn<[unknown, string[]]>();

  const hook = renderHook(
    ({ b, events, args }) => {
      useBusinessEvent(b, events, listener, args);
    },
    { initialProps: { b: emitter, events: ['add'], args: ['_', '0'] } },
  );

  act(() => {
    emitter.on.mock.calls[0]?.[1]();
  });
  expect(listener.mock.calls.length).toBe(1);
  expect(listener.mock.calls[0]?.[1]).toEqual(['_', '0']);

  act(() => {
    emitter.on.mock.calls[0]?.[1]();
  });
  expect(listener.mock.calls.length).toBe(2);
  expect(listener.mock.calls[1]?.[1]).toEqual(['_', '0']);

  hook.rerender({ b: emitter, events: ['remove'], args: ['~', '1'] });
  act(() => {
    emitter.on.mock.calls[1]?.[1]();
  });
  expect(listener.mock.calls.length).toBe(3);
  expect(listener.mock.calls[2]?.[1]).toEqual(['~', '1']);

  hook.rerender({ b: emitter, events: ['remove'], args: ['^', '2'] });
  expect(listener.mock.calls.length).toBe(3);
});
