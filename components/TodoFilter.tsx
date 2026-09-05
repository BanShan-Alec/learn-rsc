'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { TodoFilterType } from '@/lib/types';

// [SPA 思维对比]
// 在传统 SPA 中，过滤条件经常被放在全局状态库（如 Redux/Zustand）或根组件的 useState(filter) 中。
// 弊端：
// 1. 刷新页面后过滤状态丢失，立即重置为 'all'。
// 2. 无法把当前特定过滤视图（如“待完成任务列表”）通过 URL 链接分享给他人。
// 3. 浏览器的前进/后退按钮无法响应过滤条件的切换。

// [RSC 核心机制]
// URL 即“单一事实来源（Single Source of Truth）”：
// 将客户端状态下沉至 URL Search Params（如 ?status=active）。
// 优势：
// 1. 天然具备跨会话持久性：复制链接即是当前视图，支持书签保存与分享。
// 2. 浏览器原生历史栈支持：点击前进/后退能够精准还原用户浏览上下文。
// 3. 驱动 RSC 刷新：URL 变化直接由 Next.js 路由层捕获，
//    作为新的 searchParams 传给服务端页面组件，按需触发精确的 Suspense 流式重验。

const FILTERS: { label: string; value: TodoFilterType }[] = [
  { label: '全部', value: 'all' },
  { label: '未完成', value: 'active' },
  { label: '已完成', value: 'completed' },
];

export function TodoFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 当前激活状态直接从 URL 查询参数中派生，无本地 useState 镜像
  const currentStatus = (searchParams.get('status') as TodoFilterType) || 'all';

  const handleFilterChange = (status: TodoFilterType) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === 'all') {
      params.delete('status');
    } else {
      params.set('status', status);
    }
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/');
  };

  return (
    <div className="flex items-center justify-between py-2 px-1 mb-4 border-b border-slate-100">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        任务过滤
      </span>
      <div className="inline-flex p-1 bg-slate-100/80 rounded-lg gap-1">
        {FILTERS.map((filter) => {
          const isActive = currentStatus === filter.value;
          return (
            <button
              key={filter.value}
              onClick={() => handleFilterChange(filter.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                isActive
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
