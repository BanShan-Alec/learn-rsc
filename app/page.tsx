import { Suspense } from 'react';
import { TodoFilterType } from '@/lib/types';
import { TodoInput } from '@/components/TodoInput';
import { TodoFilter } from '@/components/TodoFilter';
import { TodoList } from '@/components/TodoList';

// [RSC 核心机制]
// 1. Next.js 15+ 类型规范与流式直出：
//    在 Next.js 15+ 中，Page 组件的 searchParams 是一个 Promise，页面必须声明为 async 函数。
//    整个 Page 依然是纯粹的 Server Component。
// 2. 首屏流式推流 (Streaming SSR)：
//    服务器生成 HTML 时，顶部的标题、说明面板、TodoInput 以及 TodoFilter 不需要等待数据 I/O，
//    首个字节（TTFB）极速下发，并在客户端以可交互形态秒级挂载直出！
//    被 <Suspense> 包裹的 <TodoList> 在经历 1000ms 延迟解析完成后，
//    Next.js 会自动将后续 HTML 块和 React Flight Payload 追加推流到同一个 HTTP 连接中，完成无缝就地替换。

// [SPA 思维对比]
// 为什么 Suspense 需要 key={currentFilter}？
// 在 SPA 中，改变筛选条件只是触发父组件重渲染或重新调用 fetchTodos()，伴随局部的 setState(isLoading)。
// 而在 RSC 中，React 依靠 key 标识来判定边界是否应该重新进入 pending 悬挂态。
// 若无 key={currentFilter}，当 URL query 发生变化时，React 会保留旧列表内容直到新数据就绪；
// 添加了 key 后，React 知道这是一组新的异步资源，会立刻卸载旧树并重新展示带有 Tailwind animate-pulse 的骨架屏，
// 为用户提供极其清晰明确的加载预期。

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * 列表加载骨架屏组件 (Suspense Fallback)
 * 纯 Tailwind animate-pulse 驱动
 */
function TodoListSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="正在加载任务列表">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 bg-white/80 rounded-xl border border-slate-200/60 shadow-sm animate-pulse"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-5 h-5 bg-slate-200 rounded-md" />
            <div
              className="h-4 bg-slate-200 rounded"
              style={{ width: `${45 + i * 18}%` }}
            />
          </div>
          <div className="w-6 h-6 bg-slate-200 rounded-lg" />
        </div>
      ))}
      <div className="flex items-center justify-center pt-2 gap-1.5 text-xs text-slate-400">
        <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
        <span>Node.js fs 异步读取中 (模拟 1000ms 延迟)...</span>
      </div>
    </div>
  );
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const statusParam = resolvedParams.status;
  const currentFilter: TodoFilterType =
    statusParam === 'active' || statusParam === 'completed' ? statusParam : 'all';

  return (
    <main className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      {/* 头部标题区 */}
      <header className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/80 mb-3">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Next.js 15+ & React 19 RSC 心智模型实战
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          RSC Todo Architecture Demo
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          基于服务端组件基底、Node.js 文件持久化、Server Actions 与 URL 状态驱动。零客户端全局状态库，零自定义 API Route。
        </p>

        {/* 学习向思维导引卡片 */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-600">
          <div className="p-3 bg-white/70 backdrop-blur rounded-xl border border-slate-200/80 shadow-xs">
            <span className="font-semibold text-slate-800 block mb-1">阶段一：客户端边界最小化</span>
            <span>仅在交互叶子节点声明 <code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded font-mono">'use client'</code></span>
          </div>
          <div className="p-3 bg-white/70 backdrop-blur rounded-xl border border-slate-200/80 shadow-xs">
            <span className="font-semibold text-slate-800 block mb-1">阶段二：流式直出 (Streaming)</span>
            <span>Node fs 读写 + Suspense 骨架屏 1000ms 异步非阻塞直出</span>
          </div>
          <div className="p-3 bg-white/70 backdrop-blur rounded-xl border border-slate-200/80 shadow-xs">
            <span className="font-semibold text-slate-800 block mb-1">阶段三：状态下沉至 URL</span>
            <span>URL Search Params + Server Action revalidatePath 驱动</span>
          </div>
        </div>
      </header>

      {/* 核心应用容器 */}
      <section className="bg-white/95 backdrop-blur shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80 p-5 sm:p-7">
        {/* [阶段一] 客户端交互组件：任务输入 */}
        <TodoInput />

        {/* [阶段三] 客户端控制器：URL Query 驱动的过滤器 */}
        <TodoFilter />

        {/* [阶段二] 异步服务端组件挂载点与 Suspense 骨架屏边界 */}
        <Suspense key={currentFilter} fallback={<TodoListSkeleton />}>
          <TodoList filter={currentFilter} />
        </Suspense>
      </section>

      {/* 底部架构说明与调试引导 */}
      <footer className="mt-8 text-center text-xs text-slate-500 space-y-1">
        <p>
          💡 调试提示：请在浏览器打开 F12 Network 查看 React Flight 数据流，并在终端查看
          <code className="text-slate-700 bg-slate-200/80 px-1.5 py-0.5 rounded mx-1">=== Server Query Executed ===</code>
          控制台输出。
        </p>
      </footer>
    </main>
  );
}
