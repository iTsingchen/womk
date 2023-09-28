# userBusiness

## 介绍

随着React Hooks 的发布，React 16.8 版本正式成为 React 核心库的一部分。React Hooks 允许函数式组件使用 React 状态逻辑，并且可以在不编写类的情况下使用 React 组件，众多的状态库也开始支持 Hooks。

目前的状态管理大概分为三种：

1. 外部状态管理库，例如：`Redux`、`Valtio`、`Recoil`，其同时提供了状态管理、状态绑定、状态订阅等功能。
2. 完全基于 React Hooks 实现的状态管理，其本身既提供了状态管理，又提供了状态绑定、状态订阅等功能。
3. 将现有成熟的状态管理与 React 结合，提供状态绑定、状态订阅等功能。例如：`observable-hooks`。

`observable-hooks` 连接了 `Observable World` 与 `Normal World`，而 `userBusiness` 与 `useObservable` 类似，将 `Business World` 与 `Normal World` 连接起来。

相对于 `useObservable` 的使用，`userBusiness` 更加的简单，因为 `observable-hooks` 使用 `rxjs` , 而 ` rxjs` 本身就具有很陡的学习曲线，所以较难上手。`userBusiness` 则通过事件驱动来，相对来说更加简单,可以更快速上手。

## 核心概念

参考 https://observable-hooks.js.org/guide/core-concepts.html

### 两个世界

要理解 useBusiness 的设计你需要有两个“世界”的概念：业务世界与视图世界。

```

  +--------------------------------+
  |             　　　　            |
  |            业务世界             |
  |             　　　　            |
  +--------------------------------+

         +------------------+
         |   useBusiness    |
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

## 使用

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
import { useBusiness } from '@womk/react-hooks';

import { Business, add, remove, toggle } from './business';
import { Todos } from './ui';

export const App = () => {
  const business = React.useMemo(() => new Business(), []);

  const todos = useBusiness(business, [add, remove, toggle], (b) =>
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
