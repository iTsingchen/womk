import { test, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBusiness } from './use-business';

test('测试绑定事件', () => {
  const emitter = {
    on: vi.fn<[string, () => void]>(),
    off: vi.fn<[string, () => void]>(),
  };

  const hook = renderHook(
    ({ b, events }) => useBusiness(b, events, () => null),
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

    getState: vi.fn<[], { value: string }>(),
  };

  const hook = renderHook(
    ({ b, events }) => useBusiness(b, events, (m) => m.getState()),
    { initialProps: { b: emitter, events: ['add'] } },
  );

  emitter.getState.mockReturnValue({ value: '1' });
  act(() => {
    emitter.on.mock.calls[0]?.[1]();
  });
  expect(hook.result.current).toEqual({ value: '1' });
});

test('测试多参数', () => {
  const emitter = {
    on: vi.fn<[string, () => void]>(),
    off: vi.fn(),

    getState: vi.fn<[], string>(),
  };

  const hook = renderHook(
    ({ b, events, args }) =>
      useBusiness(
        b,
        events,
        (m, [s1, s2]) => `${m.getState()}${s1}${s2}`,
        args,
      ),
    { initialProps: { b: emitter, events: ['add'], args: ['_', '0'] } },
  );

  act(() => {
    emitter.getState.mockReturnValue('a');
    emitter.on.mock.calls[0]?.[1]();
  });
  expect(hook.result.current).toEqual('a_0');

  act(() => {
    emitter.getState.mockReturnValue('b');
    emitter.on.mock.calls[0]?.[1]();
  });
  expect(hook.result.current).toEqual('b_0');

  hook.rerender({ b: emitter, events: ['remove'], args: ['~', '1'] });
  act(() => {
    emitter.getState.mockReturnValue('c');
    emitter.on.mock.calls[0]?.[1]();
  });
  expect(hook.result.current).toEqual('c~1');
});

test('测试 TODO 应用', () => {
  class TodoBusiness {
    private listeners = new Map<string, () => void>();

    private task = new Set<string>();

    on(type: string, listener: () => void): void {
      this.listeners.set(type, listener);
    }
    off(type: string, _listeners: () => void): void {
      this.listeners.delete(type);
    }
    getState(): string[] {
      return [...this.task];
    }
    add(task: string): void {
      this.task.add(task);
      this.notify('add');
    }
    delete(task: string): void {
      this.task.delete(task);
      this.notify('delete');
    }

    private notify(type: string): void {
      this.listeners.get(type)?.();
    }
  }

  const business = new TodoBusiness();

  const hook = renderHook(
    ({ b, events }) => useBusiness(b, events, (m) => m.getState()),
    { initialProps: { b: business, events: ['add', 'delete'] } },
  );

  expect(hook.result.current.length).toBe(0);

  act(() => {
    business.add('task1');
  });
  expect(hook.result.current.length).toBe(1);
  expect(hook.result.current[0]).toBe('task1');

  act(() => {
    business.add('task2');
  });
  expect(hook.result.current.length).toBe(2);
  expect(hook.result.current[0]).toBe('task1');
  expect(hook.result.current[1]).toBe('task2');

  act(() => {
    business.delete('task1');
  });
  expect(hook.result.current.length).toBe(1);
  expect(hook.result.current[0]).toBe('task2');

  act(() => {
    business.delete('task2');
  });
  expect(hook.result.current.length).toBe(0);
});
