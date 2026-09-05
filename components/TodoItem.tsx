'use client';

import { useTransition } from 'react';
import { Todo } from '@/lib/types';
import { toggleTodoAction, deleteTodoAction } from '@/actions/todo';

// [SPA 思维对比]
// 为什么状态更新不再需要本地声明 const [completed, setCompleted] = useState(todo.completed)？
// 传统 SPA 中，每个组件倾向于将 Props 复制为内部 State，或依赖全局 Store 触发重渲染。
// 这会导致单向数据流断层（Props 变了还要写 useEffect 监听更新内部 State）。
// 在 RSC 架构中，数据源头位于服务端，当 Server Action 完成 revalidatePath 之后，
// 服务端推流下发包含最新 completed 字段的 todo prop，
// 组件直接以此为真理源渲染，无需本地冗余的状态副本！

// [RSC 核心机制]
// 为什么不能把服务端函数直接通过 Props 传给 Client Component？
// Server Component 在服务器执行，其内部的普通函数（闭包）无法跨越网络边界进行序列化传递（网络无法直接传输 Node.js 函数指针）。
// 如果需要由客户端事件（点击、表单提交）触发服务端代码，
// 必须将其声明为带 'use server' 的 Server Action。
// Next.js 编译器会将其转换为具有全局唯一 RPC 标识的网络调用契约，
// Client Component 才能在浏览器环境中以常规 import 的方式发起类型安全的 RPC 调用。

interface TodoItemProps {
  todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await toggleTodoAction(todo.id);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteTodoAction(todo.id);
    });
  };

  return (
    <li
      className={`group flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 ${
        isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <label className="relative flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={handleToggle}
            disabled={isPending}
            className="peer sr-only"
          />
          <div className="w-5 h-5 border-2 border-slate-300 rounded-md peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-colors flex items-center justify-center">
            <svg
              className={`w-3.5 h-3.5 text-white transition-transform duration-150 ${
                todo.completed ? 'scale-100' : 'scale-0'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </label>

        <span
          className={`text-sm md:text-base font-medium truncate transition-all duration-150 ${
            todo.completed ? 'line-through text-slate-400' : 'text-slate-700'
          }`}
        >
          {todo.title}
        </span>
      </div>

      <div className="flex items-center gap-2 pl-3">
        {isPending && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1 font-medium">
            <svg className="animate-spin h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            同步中
          </span>
        )}

        <button
          onClick={handleDelete}
          disabled={isPending}
          aria-label="删除任务"
          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </li>
  );
}
