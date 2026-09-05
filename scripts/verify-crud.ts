import fs from 'node:fs/promises';
import path from 'node:path';
import { addTodo, toggleTodo, deleteTodo, getTodos } from '../lib/db';

async function runTests() {
  console.log('--- Starting DB CRUD Verification ---');
  
  // 1. Initial todos
  const initial = await getTodos('all');
  console.log(`Initial count: ${initial.length}`);
  
  // 2. Add todo
  const newTodo = await addTodo('验证 RSC 自动化测试任务');
  console.log(`Added todo: ID = ${newTodo.id}, Title = "${newTodo.title}"`);
  
  // 3. Verify in json file
  const dataFilePath = path.join(process.cwd(), 'data', 'todos.json');
  let todos = JSON.parse(await fs.readFile(dataFilePath, 'utf-8'));
  const found = todos.find((t: { id: string }) => t.id === newTodo.id);
  if (!found) throw new Error('New todo not found in data/todos.json!');
  console.log('Verified: New todo successfully written to data/todos.json');
  
  // 4. Toggle todo
  await toggleTodo(newTodo.id);
  todos = JSON.parse(await fs.readFile(dataFilePath, 'utf-8'));
  const toggled = todos.find((t: { id: string }) => t.id === newTodo.id);
  if (!toggled?.completed) throw new Error('Todo completed status was not toggled!');
  console.log('Verified: Todo completed status toggled to true');
  
  // 5. Delete todo
  await deleteTodo(newTodo.id);
  todos = JSON.parse(await fs.readFile(dataFilePath, 'utf-8'));
  const deleted = todos.find((t: { id: string }) => t.id === newTodo.id);
  if (deleted) throw new Error('Todo was not deleted from data/todos.json!');
  console.log('Verified: Todo successfully deleted from data/todos.json');
  
  console.log('--- All DB CRUD Tests Passed Successfully! ---');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
