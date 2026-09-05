'use server';

import { revalidatePath } from 'next/cache';
import { addTodo, deleteTodo, toggleTodo } from '@/lib/db';

// [RSC 核心机制]
// 为什么不需要声明 API Route (如 /api/todos)？
// 在 Next.js App Router 中，声明了 'use server' 的异步函数即为 Server Action（RPC 机制）。
// 编译器会在构建期自动为这些函数生成私有端点（POST 请求），并将参数安全打包传输。
// 开发者可以直接像调用本地普通函数一样在客户端触发服务端逻辑，
// 省略了路由文件创建、请求谓词解析、URL 拼接及手工 fetch 的样板流程。

// [SPA 思维对比]
// 在传统 SPA 中：
// 1. 必须编写服务端 /api/todos 路由控制器，处理 GET/POST/PATCH/DELETE。
// 2. 前端需要编写 api client（如 axios.post('/api/todos', { title })）。
// 3. 数据成功返回后，前端必须手工同步内存状态：
//    setTodos(prev => [newTodo, ...prev]); 或 dispatch(addTodoAction(res.data));
// 一旦网络失败或并发不同步，前端内存数据极易与数据库产生“幽灵差异”。

// [RSC 核心机制]
// revalidatePath 增量更新原理：
// 当调用 revalidatePath('/') 时，Next.js 服务端会重新计算该路径对应的 Server Component 树，
// 并将最新渲染出的虚拟 DOM 序列化为 React Flight Protocol (RSC Payload)。
// 客户端接收到这串轻量差异 Payload 后，在不动整页 DOM 状态（不销毁未被修改的 Client Component 状态）的前提下，
// 自动完成列表视图的就地热补丁更新。
// 因此前端组件完全不需要本地维护 todos 数组的副本，也无需调用 setTodos([...todos, newTodo])！

/**
 * 创建新任务的 Server Action
 * 从 Form 表单中提取数据并持久化
 */
export async function createTodoAction(formData: FormData): Promise<void> {
  const title = formData.get('title');

  if (typeof title !== 'string' || title.trim().length === 0) {
    return;
  }

  await addTodo(title);

  // 刷新当前页面路由，触发 Server Component 树重新计算并流式下发最新数据
  revalidatePath('/');
}

/**
 * 切换任务勾选状态的 Server Action
 */
export async function toggleTodoAction(id: string): Promise<void> {
  if (!id) return;
  await toggleTodo(id);
  revalidatePath('/');
}

/**
 * 删除任务的 Server Action
 */
export async function deleteTodoAction(id: string): Promise<void> {
  if (!id) return;
  await deleteTodo(id);
  revalidatePath('/');
}
