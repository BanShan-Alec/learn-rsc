# 02. 项目工程化落地与过程情况记录

本项目根据 `@SPEC.md` 的规范和要求，全面践行了 React Server Components (RSC) 的架构心智模型转变。本文档详细记录了从环境初始化、模块架构设计、代码蓝图编写到完成的完整实施全过程。

---

## 步骤一：环境搭建与依赖配置

1. **包管理器与国内源配置：**
   - 检验 Node.js 运行时（`v22.22.2`）。
   - 配置淘宝/腾讯镜像源（`https://registry.npmmirror.com`）。
   - 安装并配置 Yarn `1.22.22` 作为专属包管理器。

2. **核心依赖项声明（`package.json`）：**
   - **Next.js 15+**（`^15.1.7`）：支持最新的 App Router 与 React 19 服务端特性。
   - **React 19**（`^19.0.0`）& **React DOM 19**（`^19.0.0`）：提供原生 `useTransition`、Action 机制及 Flight 协议流式传输。
   - **Tailwind CSS v3**（`^3.4.17`）与 PostCSS、Autoprefixer：遵循规范，杜绝手写外部 `.css` 模块，纯 Utility Class 驱动。
   - **TypeScript**（`^5.7.0`）：开启严格类型检查。

3. **TypeScript 配置（`tsconfig.json`）：**
   - 启用 `"strict": true`，禁止任何隐式 `any`。
   - 配置路径别名映射 `"@/*": ["./*"]`，规范化跨目录引用。

4. **样式体系配置（`tailwind.config.ts` & `postcss.config.mjs`）：**
   - 扫描 `app`、`components`、`lib` 等目录的所有 `.tsx` 文件。
   - 在 `app/globals.css` 中注入 `@tailwind base; @tailwind components; @tailwind utilities;`。

---

## 步骤二：数据模型设计（`lib/types.ts`）

遵循“先设计类型定义，再编写实现逻辑”的开发规范：
* 定义 `Todo` 接口：
  - `id: string`（UUID）
  - `title: string`（任务文本）
  - `completed: boolean`（完成标识）
  - `createdAt: number`（毫秒时间戳）
* 定义 `TodoFilterType` 联合类型：`'all' | 'active' | 'completed'`。

---

## 步骤三：数据访问层与持久化实现（`lib/db.ts`）

* **运行环境隔离：**
  该模块仅限 Node.js 服务端运行，绝不在任何带有 `'use client'` 的模块中引入。
* **文件初始化机制：**
  在调用读写前执行 `ensureDataFile()`，若 `data/todos.json` 不存在，自动递归创建 `data/` 目录并写入包含 3 条代表 RSC 核心理念的初始数据。
* **模拟服务端慢查询（1000ms 人工延迟）：**
  在 `getTodos(filter)` 中内置 `await new Promise(r => setTimeout(r, 1000))`，为后续的 Suspense 骨架屏推流验证提供可感知的延迟环境。
* **CRUD 基础接口：**
  提供原子化的 `getTodos`、`addTodo`、`toggleTodo`、`deleteTodo` 读写方法。

---

## 步骤四：[阶段三] Server Actions 实现（`actions/todo.ts`）

* **文件级指令：** 顶部声明 `'use server';`。
* **核心动作：**
  1. `createTodoAction(formData: FormData)`：直接接收 HTML Form 提交的 `FormData`，校验后写入持久化文件，并调用 `revalidatePath('/')`。
  2. `toggleTodoAction(id: string)`：切换任务状态并触发 `revalidatePath('/')`。
  3. `deleteTodoAction(id: string)`：删除任务条目并触发 `revalidatePath('/')`。
* **核心对比注释注入：**
  - 说明为什么不再需要定义 `/api/todos` 传统的 API Route 控制器。
  - 说明 `revalidatePath('/')` 触发服务端 Flight Payload 增量推流的底层机制，彻底消除前端手动调用 `setTodos([...todos, newTodo])` 的必要性。

---

## 步骤五：[阶段二] 异步数据流组件（`components/TodoList.tsx`）

* **组件性质：** 纯 Server Component，绝对不添加 `'use client'`。
* **异步直出：** 直接声明为 `async function TodoList({ filter }: TodoListProps)`，在组件内直接调用 `await getTodos(filter)`。
* **终端隔离性校验探针：**
  内置 `console.log("=== Server Query Executed ===");`，确保日志仅在 Node.js 服务端终端输出，绝不泄漏至浏览器控制台。
* **空状态与列表排版：** 使用 Tailwind CSS 编写优美的空状态引导和列表容器。

---

## 步骤六：[阶段一] 客户端交互叶子节点

1. **任务单项交互（`components/TodoItem.tsx`）：**
   - 顶部声明 `'use client';`。
   - 使用 React 19 原生 `useTransition` 捕获异步 Server Action 的执行状态。
   - 当 `isPending` 为 true 时，赋予组件 `opacity-50` 半透明及过渡微动效，实现平滑的即时用户反馈。
   - 注入注释解释为什么状态无需在本地复制一份 `useState(todo.completed)`，以及为何不能通过 props 传递服务端函数。

2. **任务输入框（`components/TodoInput.tsx`）：**
   - 顶部声明 `'use client';`。
   - 采用 Tailwind 现代扁平卡片风格。
   - 使用 `useRef<HTMLFormElement>`，在 Server Action 提交成功后直接调用 `formRef.current?.reset()`，保持客户端纯粹且零输入字符级无谓重渲染。

3. **URL 状态驱动筛选器（`components/TodoFilter.tsx`）：**
   - 顶部声明 `'use client';`。
   - 严禁引入任何第三方客户端状态库（无 Redux、无 Zustand）。
   - 使用 Next.js 的 `useRouter` 与 `useSearchParams` 将过滤状态编码进 URL 查询串（`/?status=active`）。
   - 详细注释说明 URL 作为单一事实来源（Single Source of Truth）对分享、刷新与历史记录的巨大优势。

---

## 步骤七：[主编排] 页面入口与流式装配（`app/page.tsx`）

* **Next.js 15+ 页面异步契约：**
  针对 Next.js 15 的规范，接收 `searchParams: Promise<{ ... }>`，页面声明为 `async function Page`。
* **Tailwind 骨架屏：**
  实现 `TodoListSkeleton`，使用纯 Tailwind `animate-pulse` 构建高度还原的列表占位骨架。
* **Suspense 关键设计：**
  使用 `<Suspense key={currentFilter} fallback={<TodoListSkeleton />}>` 紧密包裹 `<TodoList filter={currentFilter} />`。
  通过给 Suspense 赋予 `key={currentFilter}`，使得 URL 筛选条件切换时能够立刻重置该异步边界为 pending 态，即时渲染骨架屏。
* **首屏流式响应体验：**
  页面 Header、TodoInput、TodoFilter 秒级到达浏览器立即可用，下方列表异步推流到达完成就地注水拼接。
