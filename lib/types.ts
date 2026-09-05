/**
 * 全局 Todo 接口定义与过滤类型
 * 严格遵循 TypeScript strict 模式，杜绝 any
 */

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export type TodoFilterType = 'all' | 'active' | 'completed';
