# @womk/react-hooks

## 介绍

随着React Hooks 的发布，React 16.8 版本正式成为 React 核心库的一部分。React Hooks 允许函数式组件使用 React 状态逻辑，并且可以在不编写类的情况下使用 React 组件，众多的状态库也开始支持 Hooks。

目前的状态管理大概分为三种：

1. 外部状态管理库，例如：`Redux`、`Valtio`、`Recoil`，其同时提供了状态管理、状态绑定、状态订阅等功能。
2. 完全基于 React Hooks 实现的状态管理，其本身既提供了状态管理，又提供了状态绑定、状态订阅等功能。
3. 将现有成熟的状态管理与 React 结合，提供状态绑定、状态订阅等功能。例如：`observable-hooks`。

`observable-hooks` 连接了 `Observable World` 与 `Normal World`，而 `useBusinessState` 与 `useObservable` 类似，将 `Business World` 与 `Normal World` 连接起来。

相对于 `useObservable` 的使用，`useBusinessState` 更加的简单，因为 `observable-hooks` 使用 `rxjs` , 而 ` rxjs` 本身就具有很陡的学习曲线，所以较难上手。`useBusinessState` 则通过事件驱动来，相对来说更加简单,可以更快速上手。

## 核心概念

参考 https://observable-hooks.js.org/guide/core-concepts.html

### 两个世界

要理解 `useBusinessState` 的设计你需要有两个"世界"的概念：业务世界与视图世界。

```

  +--------------------------------+
  |             　　　　            |
  |            业务世界             |
  |             　　　　            |
  +--------------------------------+

         +------------------+
         | useBusinessState |
         +------------------+

  +--------------------------------+
  |             　　　　            |
  |            视图世界             |
  |             　　　　            |
  +--------------------------------+

```

## 安装

yarn

```
yarn add @womk/react-hooks
```

pnpm

```
pnpm add @womk/react-hooks
```

npm

```
npm install --save @womk/react-hooks
```

## Hooks 概览

本库提供了以下 React Hooks：

- **useBusinessState** - 业务状态管理 Hook
- **useBusinessEvent** - 业务事件监听 Hook
- **usePrevious** - 获取前一个值的 Hook
- **usePreviousDistinct** - 获取前一个不同值的 Hook
- **useIdle** - 检测用户空闲状态的 Hook
- **useIsomorphicEffect** - 同构 Effect Hook
- **useBusiness** - 已废弃，请使用 useBusinessState

## 使用

### useBusinessState

第一步：创建业务逻辑

```ts
// business.ts
import EventEmitter from 'eventemitter3';

export const add = 'add';
export const remove = 'delete';
export const toggle = 'toggle';

export class Business extends EventEmitter {
  private todos: Array<{ text: string; completed: boolean }> = [];

  add = (text: string) => {
    this.todos = [...this.todos, { text, completed: false }];

    this.emit(add);
  };

  remove = (index: number) => {
    this.todos = [
      ...this.todos.slice(0, index),
      ...this.todos.slice(index + 1),
    ];

    this.emit(remove);
  };

  toggle = (index: number) => {
    this.todos = [
      ...this.todos.slice(0, index),
      { text: this.todos[index].text, completed: !this.todos[index].completed },
      ...this.todos.slice(index + 1),
    ];

    this.emit(toggle);
  };

  getState() {
    return this.todos.slice();
  }
}
```

第二步：创建视图

```ts
// todos.tsx

interface Props {
  todos: Array<{ text: string; completed: boolean }>;

  add: (text: string) => void;
  remove: (index: number) => void;
  toggle: (index: number) => void;
}

export const Todos = (props: Props) => {
  // ...
};
```

第三步：绑定

```ts
import { useMemo } from 'react';
import { useBusinessState } from '@womk/react-hooks';

import { Business, add, remove, toggle } from './business';
import { Todos } from './ui';

export const App = () => {
  const business = React.useMemo(() => new Business(), []);

  const todos = useBusinessState(business, [add, remove, toggle], (b) =>
    b.getState()
  );

  return (
    <Todos
        todos={todos}
        toggle={business.toggle}
        remove={business.remove}
        add={business.add}
    />
  );

}

```

Example: https://stackblitz.com/edit/react-ts-sjnpp3?file=app.tsx

### useBusinessEvent

用于监听业务事件，当指定事件触发时执行回调函数。

```ts
import { useBusinessEvent } from '@womk/react-hooks';

function MyComponent({ business }) {
  useBusinessEvent(business, ['userLogin', 'userLogout'], (emitter) => {
    console.log('用户状态发生变化');
  });

  return <div>...</div>;
}
```

### usePrevious

获取前一个渲染周期的值。

```ts
import { usePrevious } from '@womk/react-hooks';

function MyComponent({ count }) {
  const previousCount = usePrevious(count);

  return (
    <div>
      当前值: {count}
      前一个值: {previousCount}
    </div>
  );
}
```

### usePreviousDistinct

获取前一个不同的值，支持自定义比较函数。

```ts
import { usePreviousDistinct } from '@womk/react-hooks';

function MyComponent({ user }) {
  // 只有当用户 ID 发生变化时才更新
  const previousUser = usePreviousDistinct(
    user,
    (prev, next) => prev?.id === next?.id
  );

  return (
    <div>
      当前用户: {user.name}
      前一个用户: {previousUser?.name}
    </div>
  );
}
```

### useIdle

检测用户是否处于空闲状态。

```ts
import { useIdle } from '@womk/react-hooks';

function MyComponent() {
  const isIdle = useIdle(30000); // 30秒无操作视为空闲

  return (
    <div>
      {isIdle ? '用户处于空闲状态' : '用户正在操作'}
    </div>
  );
}
```

### useIsomorphicEffect

同构 Effect Hook，在服务端渲染时使用 useEffect，在客户端使用 useLayoutEffect。

```ts
import { useIsomorphicEffect } from '@womk/react-hooks';

function MyComponent() {
  useIsomorphicEffect(() => {
    // 在客户端使用 useLayoutEffect，在服务端使用 useEffect
    console.log('组件已挂载');
  }, []);

  return <div>...</div>;
}
```

## API

### `useBusinessState<E extends EventEmitter, R>(emitter: E, events: string[], evalFn: (emitter: E) => R): R`

### `useBusinessState<E extends EventEmitter, A extends unknown[], R>(emitter: E, events: string[], evalFn: (emitter: E, args: [...A]) => R, args: [...A]): R`

#### 参数

- emitter: 事件发射器，必须实现 `on` 和 `off` 方法
- events: 要监听的事件列表
- evalFn: 状态计算函数，用于从 emitter 中获取当前状态
- args: 可选的依赖参数列表，如果传入将会作为 evalFn 的第二个参数传入，args 的变化也会导致 evalFn 的重新执行

#### 返回值

返回值为 evalFn 的结果，每当 events 中的事件触发时，evalFn 会被调用，返回值会被更新。使用 `fast-equals` 进行深度比较，避免不必要的重新渲染。

#### 特性

- 使用 `useSyncExternalStore` 确保状态同步
- 自动进行深度比较，避免不必要的重新渲染
- 支持依赖参数，当参数变化时重新计算状态

### `useBusinessEvent<E extends EventEmitter, A extends unknown[]>(emitter: E, events: string[], listener: (emitter: E, args?: A) => void, args?: A)`

#### 参数

- emitter: 事件发射器
- events: 要监听的事件列表
- listener: 事件触发时的回调函数
- args: 可选的参数，会传递给回调函数

### `usePrevious<T>(state: T): T | undefined`

#### 参数

- state: 当前值

#### 返回值

返回前一个渲染周期的值，首次渲染时返回 undefined。

### `usePreviousDistinct<T>(value: T, compare?: (prev: T | undefined, next: T) => boolean): T | undefined`

#### 参数

- value: 当前值
- compare: 可选的比较函数，默认为严格相等比较

#### 返回值

返回前一个不同的值，首次渲染时返回 undefined。

### `useIdle(ms: number, options?: UseIdleOptions): boolean`

#### 参数

- ms: 空闲超时时间（毫秒），支持超过 `2 ^ 31` 的时间值
- options: 可选的配置对象
  - events: 自定义要监听的事件列表，默认为 `['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'resize']`

#### 返回值

返回布尔值，表示用户是否处于空闲状态。

#### 示例

```ts
import { useIdle } from '@womk/react-hooks';

function MyComponent() {
  // 基本用法：30秒无操作视为空闲
  const isIdle = useIdle(30000);

  // 自定义事件监听
  const isIdleCustom = useIdle(5000, {
    events: ['mousemove', 'keydown', 'click']
  });

  return (
    <div>
      {isIdle ? '用户处于空闲状态' : '用户正在操作'}
    </div>
  );
}
```

### `useIsomorphicEffect`

同构版本的 useEffect，在服务端使用 useEffect，在客户端使用 useLayoutEffect。

## 完整示例

以下是一个综合使用多个 hooks 的完整示例：

```tsx
import React, { useMemo } from 'react';
import {
  useBusinessState,
  useBusinessEvent,
  usePrevious,
  useIdle,
  useIsomorphicEffect,
} from '@womk/react-hooks';
import EventEmitter from 'eventemitter3';

// 业务逻辑
class TodoBusiness extends EventEmitter {
  private todos: Array<{ id: number; text: string; completed: boolean }> = [];
  private nextId = 1;

  add = (text: string) => {
    this.todos = [...this.todos, { id: this.nextId++, text, completed: false }];
    this.emit('todosChanged');
  };

  toggle = (id: number) => {
    this.todos = this.todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo,
    );
    this.emit('todosChanged');
  };

  remove = (id: number) => {
    this.todos = this.todos.filter((todo) => todo.id !== id);
    this.emit('todosChanged');
  };

  getTodos() {
    return this.todos.slice();
  }

  getCompletedCount() {
    return this.todos.filter((todo) => todo.completed).length;
  }
}

// 组件
function TodoApp() {
  const business = useMemo(() => new TodoBusiness(), []);

  // 使用 useBusinessState 获取状态
  const todos = useBusinessState(business, ['todosChanged'], (b) =>
    b.getTodos(),
  );
  const completedCount = useBusinessState(business, ['todosChanged'], (b) =>
    b.getCompletedCount(),
  );

  // 使用 usePrevious 跟踪变化
  const previousCompletedCount = usePrevious(completedCount);

  // 使用 useIdle 检测用户空闲状态
  const isIdle = useIdle(30000);

  // 使用 useBusinessEvent 监听事件
  useBusinessEvent(business, ['todosChanged'], (emitter) => {
    console.log('待办事项已更新');
  });

  // 使用 useIsomorphicEffect 处理副作用
  useIsomorphicEffect(() => {
    if (
      previousCompletedCount !== undefined &&
      completedCount > previousCompletedCount
    ) {
      console.log(`完成了 ${completedCount - previousCompletedCount} 个任务！`);
    }
  }, [completedCount, previousCompletedCount]);

  return (
    <div className={isIdle ? 'idle' : 'active'}>
      <h1>
        待办事项 ({completedCount}/{todos.length})
      </h1>

      {isIdle && <div className="idle-notice">用户处于空闲状态</div>}

      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => business.toggle(todo.id)}
            />
            <span
              style={{
                textDecoration: todo.completed ? 'line-through' : 'none',
              }}
            >
              {todo.text}
            </span>
            <button onClick={() => business.remove(todo.id)}>删除</button>
          </li>
        ))}
      </ul>

      <button onClick={() => business.add(`新任务 ${Date.now()}`)}>
        添加任务
      </button>
    </div>
  );
}
```

## TypeScript 支持

所有 hooks 都提供完整的 TypeScript 类型支持：

```ts
// EventEmitter 接口
interface EventEmitter {
  on: (type: string, listener: () => void) => void;
  off: (type: string, listener: () => void) => void;
}

// useIdle 配置选项
interface UseIdleOptions {
  events?: string[];
}

// 业务逻辑示例
class MyBusiness extends EventEmitter {
  private state = { count: 0 };

  increment() {
    this.state.count++;
    this.emit('countChanged');
  }

  getCount() {
    return this.state.count;
  }
}
```

## 注意事项

- `useBusiness` Hook 已被废弃，将在下一个主要版本中移除，请使用 `useBusinessState` 替代。
- 所有 Hook 都遵循 React Hooks 的使用规则。
- 在服务端渲染环境中，`useIsomorphicEffect` 会自动选择合适的 Effect Hook。
- `useIdle` Hook 会自动处理页面可见性变化，当页面隐藏时不会触发空闲状态。
- `useBusinessState` 使用深度比较来避免不必要的重新渲染，确保性能优化。
- 所有 hooks 都支持 TypeScript，提供完整的类型推断和类型检查。

## 贡献

欢迎提交 Issue 和 Pull Request！

### 开发环境设置

```bash
# 安装依赖
pnpm install

# 运行测试
pnpm test

# 运行类型检查
pnpm type-check

# 构建
pnpm build
```

## 许可证

MIT License
