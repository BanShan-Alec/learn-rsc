import { getTodos } from '@/lib/db';
import { TodoFilterType } from '@/lib/types';
import { TodoItem } from './TodoItem';

// [SPA 思维对比]
// 传统 SPA 的组件数据加载链路：
// 1. 组件在浏览器中首次挂载，此时必须展示空白或统一 Loading 状态。
// 2. 触发 useEffect(() => { fetchTodos().then(...) }, []) 发起网络请求。
// 3. 数据返回后，调用 setTodos(data) 并 setLoading(false) 触发第二次重渲染。
// 4. 导致严重的瀑布流（Waterfall）与客户端 CPU 运行时开销。
// 而在 RSC 中：组件本身就是一个原生 async 函数！
// 数据在服务端就地直接 await，渲染产物直接携带完整结构，彻底消灭了客户端挂载后的二次请求与 Loading 抖动！

// [RSC 核心机制]
// 零客户端打包体积（Zero Bundle Size）：
// 注意本文件顶部完全没有 'use client'，它是一个标准的服务端组件（Server Component）。
// 它的所有代码逻辑、依赖的 @/lib/db 模块、node:fs 核心库，
// 全都只在 Node.js 服务端执行，绝对不会被 Webpack/Turbopack 打包进任何发往浏览器的 .js 静态资源中！
// 发往浏览器的只是该组件计算生成的轻量结构化描述（React Flight Payload）。

interface TodoListProps {
  filter: TodoFilterType;
}

export async function TodoList({ filter }: TodoListProps) {
  // [验收标准 0：隔离性测试]
  // 确认该 Log 仅在 Node.js 服务端控制台输出，在浏览器 F12 Console 中绝不存在
  console.log("=== Server Query Executed ===");

  const todos = await getTodos(filter);

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
        <div className="w-12 h-12 mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-600">暂无相关任务</p>
        <p className="text-xs text-slate-400 mt-1">
          {filter === 'all'
            ? '快去上方输入框添加你的第一个待办事项吧！'
            : filter === 'active'
            ? '太棒了，所有任务都已完成！'
            : '还没有已完成的任务，继续加油！'}
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
