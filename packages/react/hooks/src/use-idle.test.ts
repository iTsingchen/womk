import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRef, useEffect } from 'react';
import { useIdle } from './use-idle';

// 模拟定时器
vi.useFakeTimers();

beforeEach(() => {
  // 重置所有模拟
  vi.clearAllMocks();
  vi.clearAllTimers();
});

afterEach(() => {
  // 清理所有定时器
  vi.runOnlyPendingTimers();
});

test('应该初始返回 false', () => {
  const { result } = renderHook(() => useIdle(1000));
  expect(result.current).toBe(false);
});

test('应该在指定时间后返回 true', () => {
  const { result } = renderHook(() => useIdle(1000));

  // 初始状态应该是 false
  expect(result.current).toBe(false);

  // 前进 1000ms
  act(() => {
    vi.advanceTimersByTime(1000);
  });

  // 现在应该是空闲状态
  expect(result.current).toBe(true);
});

test('应该在用户活动后重置为 false', () => {
  const { result } = renderHook(() => useIdle(1000));

  // 等待进入空闲状态
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(result.current).toBe(true);

  // 模拟鼠标移动事件
  act(() => {
    window.dispatchEvent(new Event('mousemove'));
  });

  // 应该立即变为非空闲状态
  expect(result.current).toBe(false);
});

test('应该在用户活动后重新开始计时', () => {
  const { result } = renderHook(() => useIdle(1000));

  // 等待进入空闲状态
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(result.current).toBe(true);

  // 模拟用户活动
  act(() => {
    window.dispatchEvent(new Event('mousemove'));
  });
  expect(result.current).toBe(false);

  // 等待 500ms，应该还是非空闲状态
  act(() => {
    vi.advanceTimersByTime(500);
  });
  expect(result.current).toBe(false);

  // 等待完整的 1000ms，应该变为空闲状态
  act(() => {
    vi.advanceTimersByTime(500);
  });
  expect(result.current).toBe(true);
});

test('应该响应默认事件列表中的所有事件', () => {
  const { result } = renderHook(() => useIdle(1000));

  // 等待进入空闲状态
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(result.current).toBe(true);

  // 测试所有默认事件
  const defaultEvents = [
    'mousemove',
    'mousedown',
    'keydown',
    'touchstart',
    'wheel',
    'resize',
  ];

  defaultEvents.forEach((eventType) => {
    act(() => {
      window.dispatchEvent(new Event(eventType));
    });
    expect(result.current).toBe(false);

    // 重置为空闲状态
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(true);
  });
});

test('应该支持自定义事件列表', () => {
  const customEvents = ['click', 'scroll'];
  const { result } = renderHook(() => useIdle(1000, { events: customEvents }));

  // 等待进入空闲状态
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(result.current).toBe(true);

  // 自定义事件应该触发重置
  act(() => {
    window.dispatchEvent(new Event('click'));
  });
  expect(result.current).toBe(false);

  // 默认事件不应该触发重置
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(result.current).toBe(true);

  act(() => {
    window.dispatchEvent(new Event('mousemove'));
  });
  expect(result.current).toBe(true); // 仍然应该是空闲状态
});

test('应该处理长超时时间', () => {
  const longTimeoutStep = 2 ** 31; // 超过 MAX_TIMEOUT
  const { result } = renderHook(() => useIdle(longTimeoutStep * 3));

  expect(result.current).toBe(false);

  // 即使是很长的超时时间，也应该正常工作
  act(() => {
    vi.advanceTimersByTime(longTimeoutStep);
    vi.advanceTimersByTime(longTimeoutStep);
    vi.advanceTimersByTime(longTimeoutStep);
  });

  expect(result.current).toBe(true);
});

test('应该在组件卸载时清理事件监听器', () => {
  const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
  const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

  const { unmount } = renderHook(() => useIdle(1000));

  // 验证事件监听器被添加
  expect(addEventListenerSpy).toHaveBeenCalled();

  // 卸载组件
  unmount();

  // 验证事件监听器被移除
  expect(removeEventListenerSpy).toHaveBeenCalled();

  addEventListenerSpy.mockRestore();
  removeEventListenerSpy.mockRestore();
});

test('应该在 ms 参数变化时重新设置定时器', () => {
  const { result, rerender } = renderHook(({ ms }) => useIdle(ms), {
    initialProps: { ms: 1000 },
  });

  // 等待 500ms，应该还是非空闲状态
  act(() => {
    vi.advanceTimersByTime(500);
  });
  expect(result.current).toBe(false);

  // 改变 ms 参数
  rerender({ ms: 500 });

  // 等待 500ms，现在应该进入空闲状态
  act(() => {
    vi.advanceTimersByTime(500);
  });
  expect(result.current).toBe(true);
});

test('应该在事件列表变化时重新设置监听器', () => {
  const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

  const { rerender } = renderHook(({ events }) => useIdle(1000, { events }), {
    initialProps: { events: ['click'] },
  });

  const initialCallCount = addEventListenerSpy.mock.calls.length;

  // 改变事件列表
  rerender({ events: ['scroll'] });

  // 应该重新添加事件监听器
  expect(addEventListenerSpy.mock.calls.length).toBeGreaterThan(
    initialCallCount,
  );

  addEventListenerSpy.mockRestore();
});

test('应该响应 visibilitychange 事件', () => {
  const { result } = renderHook(() => useIdle(1000));

  // 等待进入空闲状态
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(result.current).toBe(true);

  // 模拟页面变为可见（从隐藏状态恢复）
  act(() => {
    // 模拟 document.hidden 为 false
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  // 应该立即变为非空闲状态
  expect(result.current).toBe(false);
});

test('visibilitychange 事件应该重置计时器', () => {
  const { result } = renderHook(() => useIdle(1000));

  // 等待进入空闲状态
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(result.current).toBe(true);

  // 模拟页面变为可见
  act(() => {
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(result.current).toBe(false);

  // 等待 500ms，应该还是非空闲状态
  act(() => {
    vi.advanceTimersByTime(500);
  });
  expect(result.current).toBe(false);

  // 等待完整的 1000ms，应该变为空闲状态
  act(() => {
    vi.advanceTimersByTime(500);
  });
  expect(result.current).toBe(true);
});

test('页面隐藏时 visibilitychange 不应该触发重置', () => {
  const { result } = renderHook(() => useIdle(1000));

  // 等待进入空闲状态
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(result.current).toBe(true);

  // 模拟页面变为隐藏
  act(() => {
    Object.defineProperty(document, 'hidden', {
      value: true,
      writable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  // 应该仍然保持空闲状态
  expect(result.current).toBe(true);
});

test('应该在组件卸载时清理 visibilitychange 监听器', () => {
  const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
  const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

  const { unmount } = renderHook(() => useIdle(1000));

  // 验证 visibilitychange 事件监听器被添加
  expect(addEventListenerSpy).toHaveBeenCalledWith(
    'visibilitychange',
    expect.any(Function),
  );

  // 卸载组件
  unmount();

  // 验证 visibilitychange 事件监听器被移除
  expect(removeEventListenerSpy).toHaveBeenCalledWith(
    'visibilitychange',
    expect.any(Function),
  );

  addEventListenerSpy.mockRestore();
  removeEventListenerSpy.mockRestore();
});

test('visibilitychange 和用户事件应该协同工作', () => {
  const { result } = renderHook(() => useIdle(1000));

  // 等待进入空闲状态
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(result.current).toBe(true);

  // 模拟用户活动
  act(() => {
    window.dispatchEvent(new Event('mousemove'));
  });
  expect(result.current).toBe(false);

  // 等待 500ms
  act(() => {
    vi.advanceTimersByTime(500);
  });
  expect(result.current).toBe(false);

  // 模拟页面变为可见（应该重置计时器）
  act(() => {
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(result.current).toBe(false);

  // 等待 500ms，应该还是非空闲状态（因为计时器被重置了）
  act(() => {
    vi.advanceTimersByTime(500);
  });
  expect(result.current).toBe(false);

  // 等待完整的 1000ms，应该变为空闲状态
  act(() => {
    vi.advanceTimersByTime(500);
  });
  expect(result.current).toBe(true);
});

// 用于测试渲染次数的 hook
const useTestIdle = (ms: number): { idle: boolean; renderCount: number } => {
  const idle = useIdle(ms);
  const renderCountRef = useRef(1);

  useEffect(() => {
    renderCountRef.current += 1;
  });

  return { idle, renderCount: renderCountRef.current };
};

test('应该最小化渲染次数', () => {
  const { result } = renderHook(() => useTestIdle(1000));

  // 初始渲染
  expect(result.current.renderCount).toBe(1);
  expect(result.current.idle).toBe(false);

  // 等待进入空闲状态
  act(() => {
    vi.advanceTimersByTime(1000);
  });

  // 应该只有一次额外的渲染（状态变为空闲）
  expect(result.current.renderCount).toBe(2);
  expect(result.current.idle).toBe(true);

  // 继续等待，不应该有额外的渲染
  act(() => {
    vi.advanceTimersByTime(1000);
  });

  // 仍然应该是 2 次渲染
  expect(result.current.renderCount).toBe(2);
  expect(result.current.idle).toBe(true);
});

test('用户活动时应该只渲染一次', () => {
  const { result } = renderHook(() => useTestIdle(1000));

  // 初始渲染
  expect(result.current.renderCount).toBe(1);
  expect(result.current.idle).toBe(false);

  // 等待进入空闲状态
  act(() => {
    vi.advanceTimersByTime(1000);
  });

  // 空闲状态渲染
  expect(result.current.renderCount).toBe(2);
  expect(result.current.idle).toBe(true);

  // 模拟用户活动
  act(() => {
    window.dispatchEvent(new Event('mousemove'));
  });

  // 应该只有一次额外的渲染（状态变为非空闲）
  expect(result.current.renderCount).toBe(3);
  expect(result.current.idle).toBe(false);

  // 再次模拟用户活动，不应该有额外渲染（状态没有变化）
  act(() => {
    window.dispatchEvent(new Event('mousemove'));
  });

  // 仍然应该是 3 次渲染
  expect(result.current.renderCount).toBe(3);
  expect(result.current.idle).toBe(false);
});

test('参数变化时应该重新渲染', () => {
  const { result, rerender } = renderHook(({ ms }) => useTestIdle(ms), {
    initialProps: { ms: 1000 },
  });

  // 初始渲染
  expect(result.current.renderCount).toBe(1);

  // 改变 ms 参数
  rerender({ ms: 500 });

  // 应该重新渲染
  expect(result.current.renderCount).toBe(2);

  // 再次改变参数
  rerender({ ms: 2000 });

  // 应该再次重新渲染
  expect(result.current.renderCount).toBe(3);
});

test('连续快速事件应该避免过度渲染', () => {
  const { result } = renderHook(() => useTestIdle(1000));

  // 初始渲染
  expect(result.current.renderCount).toBe(1);

  // 等待进入空闲状态
  act(() => {
    vi.advanceTimersByTime(1000);
  });

  expect(result.current.renderCount).toBe(2);
  expect(result.current.idle).toBe(true);

  // 快速连续触发多个事件
  act(() => {
    window.dispatchEvent(new Event('mousemove'));
    window.dispatchEvent(new Event('keydown'));
    window.dispatchEvent(new Event('mousedown'));
  });

  // 应该只渲染一次（状态从空闲变为非空闲）
  expect(result.current.renderCount).toBe(3);
  expect(result.current.idle).toBe(false);

  act(() => {
    vi.advanceTimersByTime(100);
    window.dispatchEvent(new Event('mousedown'));
  });

  // 等待进入空闲状态
  act(() => {
    vi.advanceTimersByTime(1000);
  });

  // 应该只渲染一次（状态从非空闲变为空闲）
  expect(result.current.renderCount).toBe(4);
  expect(result.current.idle).toBe(true);
});

test('自定义事件列表变化时应该重新渲染', () => {
  const useTestIdleWithEvents = (
    ms: number,
    events: string[],
  ): { idle: boolean; renderCount: number } => {
    const idle = useIdle(ms, { events });
    const renderCountRef = useRef(1);

    useEffect(() => {
      renderCountRef.current += 1;
    });

    return { idle, renderCount: renderCountRef.current };
  };

  const { result, rerender } = renderHook(
    ({ ms, events }) => useTestIdleWithEvents(ms, events),
    { initialProps: { ms: 1000, events: ['click'] } },
  );

  // 初始渲染
  expect(result.current.renderCount).toBe(1);

  // 改变事件列表
  rerender({ ms: 1000, events: ['scroll'] });

  // 应该重新渲染
  expect(result.current.renderCount).toBe(2);

  // 改变 ms 参数
  rerender({ ms: 500, events: ['scroll'] });

  // 应该再次重新渲染
  expect(result.current.renderCount).toBe(3);
});

test('visibilitychange 事件应该正确触发渲染', () => {
  const { result } = renderHook(() => useTestIdle(1000));

  // 初始渲染
  expect(result.current.renderCount).toBe(1);
  expect(result.current.idle).toBe(false);

  // 等待进入空闲状态
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(result.current.renderCount).toBe(2);
  expect(result.current.idle).toBe(true);

  // 模拟页面变为可见
  act(() => {
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  // 应该只渲染一次（状态从空闲变为非空闲）
  expect(result.current.renderCount).toBe(3);
  expect(result.current.idle).toBe(false);

  // 再次模拟页面变为可见，不应该有额外渲染（状态没有变化）
  act(() => {
    Object.defineProperty(document, 'hidden', {
      value: false,
      writable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  // 仍然应该是 3 次渲染
  expect(result.current.renderCount).toBe(3);
  expect(result.current.idle).toBe(false);
});
