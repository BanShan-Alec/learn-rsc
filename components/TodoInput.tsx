'use client';

import { useRef, useTransition } from 'react';
import { createTodoAction } from '@/actions/todo';

// [SPA 思维对比]
// 在传统 SPA 中，提交表单通常需要：
// 1. 使用 useState 维护 input 的 value 状态 (受控组件双向绑定)。
// 2. 编写 onSubmit 拦截器处理 e.preventDefault()。
// 3. 发送异步请求并在成功后 setTodos(prev => [...])，最后 setInputValue('')。
// 而在带有 Server Action 的 React 中，表单可以直接作为天然的数据提交载体（FormData），
// 配合原生 form action 或 startTransition，服务端直接完成重验，客户端仅需在提交后清理表单 DOM！

// [RSC 核心机制]
// 表单与 Server Action 的协同：
// 通过 HTML 原生表单规范，FormData 自动打包所有的 input 键值，
// 借助 useRef<HTMLFormElement> 获取 DOM 引用，在 Action 完成后调用 formRef.current?.reset()，
// 既保持了极致轻量的客户端逻辑，又避免了为每个输入字符都触发 React 组件重渲染。

export function TodoInput() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    const title = formData.get('title');
    if (typeof title !== 'string' || !title.trim()) return;

    startTransition(async () => {
      await createTodoAction(formData);
      formRef.current?.reset();
    });
  };

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="relative flex items-center gap-2 mb-6"
    >
      <div className="relative flex-1">
        <input
          type="text"
          name="title"
          placeholder="添加一项新的学习任务（按回车提交）..."
          required
          disabled={isPending}
          className="w-full px-4 py-3 text-sm md:text-base bg-white border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all disabled:opacity-60"
        />
        {isPending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            <svg
              className="animate-spin h-5 w-5 text-indigo-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm md:text-base font-medium rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        <span>添加</span>
      </button>
    </form>
  );
}
