import { getCurrentUser } from '../lib/session';
import { redirect } from 'next/navigation';
import { logout } from '../actions/auth';

export default async function DashboardPage() {
  // 获取当前登录用户
  const user = await getCurrentUser();
  
  // 如果用户未登录，重定向到登录页面
  if (!user) {
    redirect('/login');
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Welcome to your Dashboard
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Hello, {user.name}! You are successfully logged in.
          </p>
          <div className="mt-8 p-6 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
            <h2 className="text-xl font-medium mb-4">User Information</h2>
            <div className="space-y-2">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
          </div>
        </div>
        <form action={logout} className="mt-12">
          <button type="submit" className="px-6 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-700 transition-colors">
            Logout
          </button>
        </form>
      </main>
    </div>
  );
}