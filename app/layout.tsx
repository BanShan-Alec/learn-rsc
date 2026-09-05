import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RSC Mental Model Learning Todo App',
  description: 'React Server Components 架构心智模型实战对比应用',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
