# RSC Mental Model Learning Todo App

这是一个专为熟练掌握传统 SPA（单页应用）的前端工程师打造的 **React Server Components (RSC)** 架构心智模型实战项目。

本项目摒弃了无意义的 CRUD 模板化代码，基于 **Next.js 15 (App Router)**、**React 19**、**TypeScript (Strict)** 和 **Tailwind CSS v3**，深度展示 RSC 的三大核心思维转变：

1. **阶段一（客户端边界最小化）：** 默认全站为 Server Component，仅在具有用户交互和 DOM 监听的叶子节点声明 `'use client'`。
2. **阶段二（异步组件与流式直出）：** 服务端组件直接使用 Node.js `fs/promises` 读写本地文件，结合 `<Suspense>` 与 Tailwind 骨架屏实现 1000ms 模拟延迟的非阻塞 Streaming SSR。
3. **阶段三（状态下沉与轻量化）：** 彻底废除客户端全局状态库（无 Redux、无 Zustand），采用 **URL Search Params** 驱动过滤筛选，通过 **Server Actions (`'use server'`) + `revalidatePath`** 驱动数据变更与增量视图更新。

---

## 目录与架构

```text
learn-rsc/
├── data/
│   └── todos.json              # 本地持久化数据存储文件 (自动创建并初始化)
├── lib/
│   ├── types.ts                # 全局 TypeScript 接口与联合类型定义
│   └── db.ts                   # 基于 Node fs 的 JSON 文件读写 + 1000ms 延迟模拟 (仅限服务端)
├── actions/
│   └── todo.ts                 # [阶段三] Server Actions：服务端文件写入与 revalidatePath
├── components/
│   ├── TodoInput.tsx           # [阶段一] Client Component：表单输入与提交 (useRef 重置)
│   ├── TodoItem.tsx            # [阶段一] Client Component：状态切换、删除与 useTransition 过渡
│   ├── TodoFilter.tsx          # [阶段三] Client Component：URL Query 参数控制器
│   └── TodoList.tsx            # [阶段二] 异步 Server Component：服务端读文件与静态列表装配
├── app/
│   ├── globals.css             # Tailwind 核心指令与全局基础样式
│   ├── layout.tsx              # 根布局
│   └── page.tsx                # [主编排] 页面入口：Server Component + Suspense 骨架屏
├── docs/                       # 详细工程化落地过程与心智模型文档
│   ├── 01-mental-model-transformation.md # 核心心智模型解析与黄金法则
│   ├── 02-implementation-log.md          # 详细实施过程记录与防滚动重置优化
│   ├── 03-verification-and-acceptance.md # 验收标准与功能自检报告
│   ├── 04-revalidate-path-and-flight-protocol.md # revalidatePath 与 React Flight 协议深度剖析
│   └── 05-nextjs-architecture-and-best-practices.md # 目录结构与服务端架构最佳实践评估
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── postcss.config.mjs
```

---

## 源码注释规范

本项目所有关键代码均注入了严格规范的对比注释：
* `// [SPA 思维对比]`：指出传统 SPA 模式下的实现弊端与思维局限。
* `// [RSC 核心机制]`：解析 RSC 底层运行逻辑、打包边界以及 React 19 新特性原理。

---

## 快速启动

### 1. 配置国内源与安装依赖
项目已预设淘宝 npmmirror 源：
```bash
yarn install
```

### 2. 本地开发运行
```bash
yarn dev
```
打开浏览器访问 [http://localhost:3000](http://localhost:3000)。

### 3. 类型检查与构建验证
```bash
yarn typecheck   # 执行 npx tsc --noEmit
yarn build       # 执行 next build 校验生产构建与服务端边界
```

---

## 验收检查项

- [x] **隔离性测试**：`TodoList.tsx` 中的 `console.log("=== Server Query Executed ===");` 仅在 Node.js 服务端控制台打印，浏览器 F12 控制台完全不存在。
- [x] **类型安全度**：`npx tsc --noEmit` 0 报错，严格满足 TypeScript 5+ `strict: true`。
- [x] **文件系统持久化**：`data/todos.json` 自动初始化并随任务增删改实时持久化写入。
- [x] **服务端边界隔离**：编译产物客户端 Bundle 中 100% 杜绝 `fs/promises`、`db.ts` 与 `TodoList.tsx` 源码。
- [x] **Suspense 流式表现**：1000ms 模拟延迟期间展示带有 `animate-pulse` 的骨架屏，顶部输入框与筛选按钮立即可交互。
- [x] **RSC 通信协议**：无 `/api/*` REST 端点，通过 React Flight 协议下发 RSC Payload。
