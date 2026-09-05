# 05. Next.js App Router 目录结构与服务端架构最佳实践评估

本文档针对本项目当前的目录结构、服务端逻辑划分与边界设计进行系统性评估，剖析其与 Next.js 官方最佳实践及生产级主流架构的差异，并提供业界主流架构参考方案。

---

## 一、评估总体结论

* **对于学习 Demo / PoC 原型：**
  当前结构**基本符合** Next.js App Router 的基础心智。项目将路由入口（`app/`）、RPC 变更（`actions/`）、组件呈现（`components/`）与底层持久化（`lib/`）进行了清晰的模块拆分，非常适合理解 RSC（React Server Components）与客户端水合边界的转换机制。

* **对照生产级工程化最佳实践：**
  当前结构属于**基础过渡形态，尚未达到生产级交付标准**。尤其在**服务端逻辑划分、安全边界隔离、输入防御性校验与代码就近组织（Colocation）**四个维度存在明显改进空间。

---

## 二、当前项目服务端逻辑划分的深度诊断

### 2.1 缺少 `server-only` 物理安全屏障
* **现状：**
  [`lib/db.ts`](file:///C:/myGit/learn-rsc/lib/db.ts) 包含 Node.js 原生 `node:fs/promises`、敏感文件路径操作与持久化逻辑。
* **风险点：**
  在 Next.js 中，只要一个模块没有使用 `'use server'` 或 `'use client'` 显式声明，它默认是“通用模块（Universal Module）”。如果未来某位开发者无意在 [`components/TodoItem.tsx`](file:///C:/myGit/learn-rsc/components/TodoItem.tsx) 等客户端组件中导入了 `lib/db.ts` 的辅助方法，打包工具可能会尝试在客户端环境中打入该模块，导致：
  1. 编译期报缺少 Node 内置模块错误（如 `Module not found: Can't resolve 'fs'`）；
  2. 若涉及环境变量或敏感凭证，极易发生向客户端泄漏的重大安全风险。
* **最佳实践：**
  所有专供服务端运行的数据访问与持久化文件，顶部必须显式声明：
  ```ts
  import 'server-only';
  ```

---

### 2.2 数据访问层（DAL）与持久化逻辑耦合
* **现状：**
  [`lib/db.ts`](file:///C:/myGit/learn-rsc/lib/db.ts) 既承担底层 I/O（文件创建、读写），又承担了数据的筛选过滤逻辑（`getTodos`）。
* **生产级缺失：**
  Next.js 官方倡导建立专门的 **Data Access Layer (DAL)**：
  1. **查询（Query / DAL）：** 专供 Server Component 读取数据，负责会话安全校验、用户权限过滤、DTO 数据清洗与脱敏，通常搭配 `cache()` 实现请求期去重（Request Memoization）。
  2. **变更（Mutation / Action）：** 专供数据更新写操作。
  3. **数据源驱动（Driver / ORM）：** 底层统一的 Prisma / Drizzle / DB Client 连接池。

---

### 2.3 Server Action 缺乏输入校验与统一防线
* **现状：**
  [`actions/todo.ts`](file:///C:/myGit/learn-rsc/actions/todo.ts) 中直接使用 `formData.get('title')` 并做简易的字符串判空。
* **生产级缺失：**
  1. **公开端点认知：** 声明了 `'use server'` 的函数在构建后本质上是一个**公开的 HTTP POST 端点**。任何用户都可以通过抓包、脚本直接向该 endpoint 发送伪造参数，绕过前端表单的 HTML 校验。
  2. **缺少 Schema 强校验：** 生产级实践必须使用 Zod、Valibot 等工具进行严格的 Schema 校验。
  3. **缺少统一错误流：** 生产级通常使用 `next-safe-action` 或自定义高阶函数包裹 Action，将认证鉴权、速率限制（Rate Limiting）、异常捕获、国际化错误码封装为统一契约返回。

---

### 2.4 组件目录划分模糊：RSC 与 Client Component 混杂
* **现状：**
  `components/` 目录下同时存放了：
  * [`components/TodoList.tsx`](file:///C:/myGit/learn-rsc/components/TodoList.tsx)（**服务端组件**，直接调用 `lib/db.ts`）
  * [`components/TodoInput.tsx`](file:///C:/myGit/learn-rsc/components/TodoInput.tsx) 等（**客户端组件**，声明 `'use client'`）
* **生产级缺失：**
  随着组件数量增多，开发者无法从文件目录上直观判断组件运行环境，极易造成“客户端组件误引用服务端组件”或“服务端逻辑被污染”。

---

## 三、Next.js 业界主流架构对比

在 Next.js App Router 生态中，根据团队规模与业务复杂度，主流架构主要演进为以下两种模式：

### 模式 A：分层架构（Layered Architecture / 官方推荐标准）

适用于中小型全栈团队、业务边界相对聚焦的产品。强调“按技术职责水平分层”，严格确立 `server/` 专有领域。

```text
├── app/                        # 路由与页面编排层 (纯声明式)
│   ├── layout.tsx              # 全局根布局
│   ├── page.tsx                # 页面组装入口 (RSC，负责调用 DAL 取数)
│   └── loading.tsx             # 原生流式 Suspense 骨架屏
├── server/                     # 【核心：服务端领域，禁止客户端打包】
│   ├── db/                     # 数据库连接与底层 Client (Prisma / Drizzle / fs)
│   │   └── client.ts
│   ├── dal/                    # 【Data Access Layer】只读查询层
│   │   └── todos.ts            # import 'server-only'，负责鉴权、数据脱敏、DTO
│   ├── actions/                # 【Mutations】写操作 RPC 端点
│   │   └── todo-actions.ts     # 'use server'，Zod 参数校验、执行变更、revalidate
│   └── schemas/                # 跨端共享的数据与表单校验 Schema (Zod)
│       └── todo.schema.ts
├── components/                 # 表现层 (UI)
│   ├── ui/                     # 基础无业务组件 (Button, Input, Dialog 等纯 UI)
│   └── features/               # 业务复合组件 (清晰标识 Client/Server)
│       ├── todo-list.tsx       # RSC 列表容器
│       └── todo-input.tsx      # 'use client' 交互叶子节点
└── lib/                        # 纯纯通用工具库 (cn、formatDate 等无副作用函数)
```

#### 数据流动与控制反转时序
```
[读数据链路 - 零 HTTP 开销]:
Page (RSC) -> server/dal/todos.ts (鉴权 + DTO) -> Database / fs
    ↓
直出 HTML + Flight Payload 流式推送到浏览器

[写数据链路 - 安全 RPC]:
Browser (Client Component) 
    ↓ 调用 Server Action (POST)
server/actions/todo-actions.ts 
    ↓ (1) Zod 校验入参
    ↓ (2) 获取 Session 验证身份
    ↓ (3) 写入 Database
    ↓ (4) revalidatePath / revalidateTag
    ↓
返回 Result / 触发局部 RSC Payload 增量重算更新
```

---

### 模式 B：特性就近收拢架构（Feature-based / Route Colocation，大型项目主流）

适用于中大型团队、多业务线、路由层级较深的复杂应用。充分利用 Next.js 的 **私有文件夹（Private Folders `_folder`）** 和 **路由组（Route Groups `(folder)`）** 特性，实现高内聚、低耦合。

```text
app/
├── (auth)/                     # 认证域路由组
│   ├── login/
│   └── register/
├── (dashboard)/                # 控制台域路由组
│   ├── todos/
│   │   ├── _actions/           # 该功能私有的 Server Actions
│   │   │   └── todo.actions.ts
│   │   ├── _components/        # 该路由专用的组件 (按需标 'use client')
│   │   │   ├── todo-filter.tsx
│   │   │   └── todo-list.tsx
│   │   ├── _dal/               # 该路由独享的只读数据访问逻辑
│   │   │   └── get-todos.ts
│   │   ├── _schemas/           # 页面专用校验规则
│   │   ├── page.tsx            # 路由主入口
│   │   ├── loading.tsx
│   │   └── error.tsx
│   └── layout.tsx
├── _shared/                    # 跨多个路由共用的业务抽象
│   ├── components/
│   └── services/
├── components/ui/              # 全局通用基础设计系统 (shadcn/ui, Radix)
└── server/                     # 全局基础设施 (DB Client, Auth, Base DAL)
```

#### 优势：
1. **就近原则（Colocation）：** 删除或重构某个路由（如 `todos/`）时，只需删除该文件夹，无需在全局 `actions/`、`components/` 中清理遗留碎片。
2. **私有目录保护：** `_actions/`、`_components/` 带有下划线前缀，Next.js 不会将其识别为可公开访问的 URL 路径。

---

## 四、生产级演进指导建议（Roadmap）

若后续要将本项目演进为生产级工程结构，建议按照以下优先级推进：

| 阶段 | 改造项 | 改造价值 |
| :--- | :--- | :--- |
| **P0（安全底线）** | 在底层数据层加入 `import 'server-only'` | 杜绝服务端敏感代码被误引入前端 Bundle |
| **P1（防御性架构）** | 引入 Zod 对 Server Actions 进行 Schema 验证 | 防御恶意伪造请求，提供强类型错误提示 |
| **P2（架构正规化）** | 建立独立的 `server/dal/` 读模型 | 明确数据读取与数据变更的职责分离 |
| **P3（目录清晰化）** | 规范 `components/` 或使用 `_components` 就近组织 | 消除 Server/Client 组件混放带来的认知心智负担 |
