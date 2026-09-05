import fs from 'node:fs/promises';
import path from 'node:path';
import { Todo, TodoFilterType } from './types';

// [RSC 核心机制]
// 该模块属于服务端专有模块（Server-only Data Access Layer）。
// 在 RSC 架构中，服务端组件和 Server Actions 可以直接访问底层系统资源（如文件系统 fs、数据库、环境变量），
// 无需通过 HTTP 网络协议包装一层 RESTful API 或 GraphQL。
// 这意味着零网络延迟调用（同进程内访问）、更强的安全隔离（敏感凭证绝不会下发给客户端浏览器）。

// [SPA 思维对比]
// 在传统 SPA（如 Vite + React）中，前端无论如何都无法安全或直接操作 Node.js 的 fs 模块。
// SPA 开发者必须在独立的后端（如 Express、NestJS）中编写路由控制器，
// 前端使用 axios/fetch 发起 HTTP 请求，还要处理序列化、跨域 CORS、身份认证 Token 传递等一系列胶水代码。

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'todos.json');

const INITIAL_TODOS: Todo[] = [
  {
    id: '1',
    title: '理解 React Server Components 架构基底与客户端最小边界',
    completed: true,
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: '2',
    title: '体验 Node fs 直接读取数据与 1000ms Suspense 骨架屏流式直出 (Streaming SSR)',
    completed: false,
    createdAt: Date.now() - 3600000,
  },
  {
    id: '3',
    title: '使用 Server Action 与 URL Search Params 替代 Redux/Zustand 客户端全局状态',
    completed: false,
    createdAt: Date.now(),
  },
];

/**
 * 确保数据目录及 JSON 数据文件存在，不存在则自动初始化
 */
async function ensureDataFile(): Promise<void> {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(INITIAL_TODOS, null, 2), 'utf-8');
  }
}

/**
 * 从本地 JSON 文件读取 Todos 数据
 */
async function readTodos(): Promise<Todo[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  try {
    return JSON.parse(raw) as Todo[];
  } catch {
    return [];
  }
}

/**
 * 将 Todos 列表持久化到本地 JSON 文件
 */
async function writeTodos(todos: Todo[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(todos, null, 2), 'utf-8');
}

/**
 * 获取任务列表
 * 内置 1000ms 人工延迟，用于演示 RSC + Suspense 骨架屏流式推流
 */
export async function getTodos(filter: TodoFilterType = 'all'): Promise<Todo[]> {
  // [RSC 核心机制]
  // 模拟真实后端慢查询（I/O 阻塞 1000ms）。
  // 在 RSC Streaming SSR 下，该阻塞不会卡死整个页面，外层的框架骨架和静态部分先行直出，
  // 待该 Promise resolve 后，Next.js 会以 HTML + RSC Payload 流式推送到客户端完成就地拼接。
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const todos = await readTodos();

  // 根据过滤条件返回子集
  switch (filter) {
    case 'active':
      return todos.filter((todo) => !todo.completed);
    case 'completed':
      return todos.filter((todo) => todo.completed);
    case 'all':
    default:
      return todos;
  }
}

/**
 * 添加一条新任务
 */
export async function addTodo(title: string): Promise<Todo> {
  const todos = await readTodos();
  const newTodo: Todo = {
    id: crypto.randomUUID(),
    title: title.trim(),
    completed: false,
    createdAt: Date.now(),
  };

  // 新任务置顶
  todos.unshift(newTodo);
  await writeTodos(todos);
  return newTodo;
}

/**
 * 切换任务完成状态
 */
export async function toggleTodo(id: string): Promise<void> {
  const todos = await readTodos();
  const index = todos.findIndex((item) => item.id === id);
  if (index !== -1) {
    todos[index].completed = !todos[index].completed;
    await writeTodos(todos);
  }
}

/**
 * 删除指定任务
 */
export async function deleteTodo(id: string): Promise<void> {
  const todos = await readTodos();
  const filtered = todos.filter((item) => item.id !== id);
  await writeTodos(filtered);
}
