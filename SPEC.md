# Project Specification: RSC Mental Model Learning Todo App (TypeScript + Tailwind + Local JSON)

## 1. 项目定位与核心目标

本项目是一个专为熟练掌握传统 SPA（单页应用）的前端工程师设计的 **React Server Components (RSC)** 转型架构演示项目。

项目通过一个精炼但功能完备的 TODO 应用，不是简单的 CRUD，而是通过工程化结构与详细的代码对比注释，全面落地以下三个思维转变阶段，并由 AI 编码代理自动在生成的源码中注入对比注释（规范为 `// [SPA 思维对比]` 与 `// [RSC 核心机制]`）：

1. **阶段一（客户端边界最小化）：** 全站以 Server Component 为默认基底，仅在具有用户交互和 DOM 监听的最小叶子节点声明 `'use client'`。
2. **阶段二（异步组件与流式直出）：** 服务端组件直接使用 Node.js `fs/promises` 异步读写本地 `todos.json`，配合 `<Suspense>` 与 Tailwind 骨架屏实现非阻塞的 Streaming SSR。
3. **阶段三（状态下沉与轻量化）：** 废除客户端全局状态库（无 Redux、无 Zustand），使用 **URL Search Params** 驱动过滤筛选，使用 **Server Actions (`'use server'`) + `revalidatePath**` 驱动数据变更，彻底移除客户端内存维护的 `useState` 数据副本。

---

## 2. 技术栈与环境要求

* **框架：** Next.js 15+ (App Router)
* **核心库：** React 19
* **语言规范：** **TypeScript (严格模式 `strict: true`)**
* **UI 框架：** **Tailwind CSS v3**（禁止手写分散的 `.css` 模块，纯 Utility Class 驱动）
* **存储介质：** **本地文件系统 JSON 文件 (`data/todos.json`)**，基于 Node.js `node:fs/promises` 操作，包含 1000ms 人工延迟模拟
* 配置国内的淘宝源，使用yarn 管理依赖

---

## 3. 目录与文件架构

```text
rsc-todo-learning/
├── data/
│   └── todos.json              # 本地持久化数据存储文件
├── lib/
│   ├── types.ts                # 全局 TypeScript 接口与联合类型定义
│   └── db.ts                   # 基于 Node fs 的 JSON 文件读写 + 延迟模拟 (仅服务端)
├── actions/
│   └── todo.ts                 # [阶段三] Server Actions：服务端文件写入与数据重验
├── components/
│   ├── TodoInput.tsx           # [阶段一] Client Component：表单输入与提交
│   ├── TodoItem.tsx            # [阶段一] Client Component：状态切换、删除与 useTransition 过渡
│   ├── TodoFilter.tsx          # [阶段三] Client Component：URL Query 参数控制器
│   └── TodoList.tsx            # [阶段二] 异步 Server Component：服务端读文件与静态列表装配
├── app/
│   ├── globals.css             # Tailwind 核心指令 (@tailwind / @import "tailwindcss")
│   ├── layout.tsx              # 根布局
│   └── page.tsx                # [主编排] 页面入口：Server Component + Suspense 骨架屏
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md

```

---

## 4. 详细模块实现规范与代码蓝图
AI 编码代理在生成代码时，必须在每个关键位置插入规范注释，统一以 // [SPA 思维对比] 和 // [RSC 核心机制] 格式输出，强化学习效果。

### 4.1 类型定义 (`lib/types.ts`)

必须先设计定义（数据结构），再实现具体逻辑，并严格遵守类型，禁止 `any`：

```typescript
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export type TodoFilterType = 'all' | 'active' | 'completed';

```

---

### 4.2 数据访问层 (`lib/db.ts`)

* **运行约束：** 仅限服务端运行。禁止在任何声明了 `'use client'` 的文件中引入此模块。
* **文件初始化机制：** 若 `data/todos.json` 不存在，需自动创建目录并写入包含 3 条初始数据的 JSON 数组。
* **功能接口：**：
`
getTodos(filter: 'all' | 'active' | 'completed'): Promise<Todo[]>

强制要求： 内置 await new Promise(r => setTimeout(r, 1000)) 模拟 1 秒网络与查询延迟，用于触发 Suspense 骨架屏。

addTodo(title: string): Promise<Todo>

toggleTodo(id: string): Promise<void>

deleteTodo(id: string): Promise<void>
`


---

### 4.3 [阶段三] Server Actions (`actions/todo.ts`)

* **文件指令：** 首行声明 `'use server';`。
* 实现要求：
createTodoAction(formData: FormData): 解析表单项并执行校验，调用 addTodo，随后触发 revalidatePath('/')。

toggleTodoAction(id: string): 切换状态，随后触发 revalidatePath('/')。

deleteTodoAction(id: string): 删除指定条目，随后触发 revalidatePath('/')。

* 注释规范：
阐述为什么不需要声明 API Route（如 /api/todos）。

阐述 revalidatePath 触发 RSC Payload 增量更新的机制，解释前端为什么不再需要写 setTodos([...todos, newTodo])。



---

### 4.4 [阶段二] 异步数据流组件 (`components/TodoList.tsx`)

* **文件约束：** **绝不可添加 `'use client'**`。作为 Server Component 存在。
* **样式要求：** 使用 Tailwind 编写任务空状态与列表容器。
* 实现要求：
必须声明为 async function TodoList({ filter })。
直接调用 const todos = await getTodos(filter)。
遍历数据时渲染 <TodoItem todo="{todo}"/>。

* 注释规范：
对比 SPA 中“页面挂载 $\to$ useEffect 发起 fetch $\to$ setLoading(false)”的繁琐流程。
阐述该组件的源码不会被打进客户端 JS Bundle。
---

### 4.5 [阶段一] 客户端交互叶子节点

#### 任务项交互 (`components/TodoItem.tsx`)

* **文件声明：** 首行声明 `'use client';`。
* 实现要求：
使用 React 原生 useTransition 处理异步 Action。

复选框切换绑定 toggleTodoAction(todo.id)，删除按钮绑定 deleteTodoAction(todo.id)。

在 isPending 为 true 时，组件呈现视觉透明度衰减（如 opacity: 0.5），提供即时反馈。

* 注释规范：
解释为什么状态更新不再需要本地声明 useState(todo.completed)。

说明为什么不能把服务端函数通过 Props 传给 Client Component，必须通过统一的 Server Action 引入。

#### 任务输入框 (`components/TodoInput.tsx`)

* **文件声明：** 首行声明 `'use client';`。
* **UI 规范：** 使用 Tailwind 现代扁平化表单样式。通过 `useRef<HTMLFormElement>` 在调用 Server Action 成功后重置表单。

---

### 4.6 [阶段三] URL 状态驱动筛选器 (`components/TodoFilter.tsx`)

* **文件声明：** 首行声明 `'use client';`。
* **机制约束：** 严禁引入任何状态库。通过 Next.js 的 `useRouter` 与 `useSearchParams` 操控路由参数。点击“全部 / 未完成 / 已完成”按钮时，将参数写入 URL 查询串（/?status=active）。
* 注释规范：
说明 URL 即“单一事实来源（Single Source of Truth）”的设计优势：状态天然支持分享、刷新保持、前进后退历史栈。

---

### 4.7 [主编排] 页面入口 (`app/page.tsx`)

* **Next.js 15+ 类型规范：** `searchParams` 是一个 Promise，页面需声明为 `async`。
* **Tailwind 骨架屏：** 实现一个带 `animate-pulse` 的骨架占位组件作为 Suspense Fallback。
* 实现要求：
使用 <Suspense fallback="{<TodoListSkeleton" key="{currentFilter}"/>}> 紧密包裹 <TodoList filter="{currentFilter}"/>。

* 布局结构：
```JavaScript
<main>
  <h1>RSC Todo Architecture Demo</h1>
  <TodoInput />
  <TodoFilter />
  <Suspense key={currentFilter} fallback={<Skeleton />}>
    <TodoList filter={currentFilter} />
  </Suspense>
</main>
```
* 注释规范：
解释 key={currentFilter} 在筛选状态变更时重新触发 Suspense 边界的作用。

解释首屏流式响应特征：标题、输入框、筛选器秒级加载直出，列表随后推流完成拼接。
---

## 5. 验收标准与功能自检项

AI 编码代理在项目生成完成后，应自动校验以下项目：

0. 终端与控制台验证（隔离性测试）
在 TodoList.jsx 中添加 console.log("=== Server Query Executed ===");
刷新浏览器，确认该 Log 仅在服务启动的终端命令行打印，在 Chrome F12 控制台中完全不存在。

1. **类型安全度：** 执行 `npx tsc --noEmit` 保证 **0 报错**，严格满足 TypeScript 5+ 要求。
2. **文件系统持久化验证：**
* 启动项目并添加新任务后，项目根目录下的 `data/todos.json` 能够实时写入最新内容。


3. **服务端边界隔离验证：**
* 打开 Chrome 开发者工具的 Network 选项卡，过滤 `.js` 资源。
* 搜索构建产物，确认 `fs/promises`、`db.ts` 和 `TodoList.tsx` 的源码**完全未出现在客户端 Bundle 中**。


4. **Suspense 流式表现：**
* 首次进入页面或点击筛选切换状态时，顶部输入框与筛选按钮立即可用，下方准确展示 1000ms 的 Tailwind `animate-pulse` 骨架动画，随后平滑渲染列表。


5. **RSC 通信协议确认：**
* 勾选任务状态时，Network 面板不会发出针对 `/api/*` 的 REST 请求，而是发出带有 `_rsc` 查询参数或针对当前页面的 POST 请求，返回由 React Flight 协议编码的流式虚拟 DOM 描述。
