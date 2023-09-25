# React hooks

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

这两个世界仅是概念上的区分。业务世界是指纯业务逻辑存放的地方。视图世界是指纯视图世界。需要一个纽带将两者连接起来，这就是 useBusiness 存在的意义，其优点像是 react-redux，但是更加灵活，不局限于业务世界的实现方式。

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
