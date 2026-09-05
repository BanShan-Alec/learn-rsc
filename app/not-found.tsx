import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h2 className="text-2xl font-bold text-slate-800">404 - 页面未找到</h2>
      <p className="mt-2 text-sm text-slate-500">抱歉，您访问的页面不存在。</p>
      <Link
        href="/"
        className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        返回首页
      </Link>
    </div>
  );
}
