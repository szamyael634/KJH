import { login, signup } from './actions'

export default async function LoginPage({ searchParams }: { searchParams: { message: string } }) {
  const params = await searchParams;

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 h-screen mx-auto">
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"></div>
      
      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
        
        <div className="flex flex-col mb-6 items-center">
            <h1 className="text-3xl font-bold mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-gray-500 text-sm">Sign in to your account or create a new one</p>
        </div>

        <label className="text-md" htmlFor="email">Email</label>
        <input
          className="rounded-md px-4 py-2 bg-white border border-slate-200 mb-4 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          name="email"
          placeholder="you@example.com"
          required
        />

        <label className="text-md" htmlFor="password">Password</label>
        <input
          className="rounded-md px-4 py-2 bg-white border border-slate-200 mb-4 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />

        <label className="text-md" htmlFor="role">Role (Sign up only)</label>
        <select 
          name="role" 
          defaultValue="buyer"
          className="rounded-md px-4 py-2 bg-white border border-slate-200 mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
        >
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
          <option value="rider">Rider</option>
          <option value="admin">Admin</option>
        </select>
        
        <button
          formAction={login}
          className="bg-indigo-600 rounded-md px-4 py-2 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all shadow-sm"
        >
          Sign In
        </button>
        <button
          formAction={signup}
          className="bg-white border rounded-md px-4 py-2 text-indigo-600 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all shadow-sm dark:bg-slate-800 dark:text-white dark:border-slate-600 mt-2"
        >
          Sign Up
        </button>
        
        {params?.message && (
          <p className="mt-4 p-4 bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-200 text-center text-sm rounded-md border border-red-200 dark:border-red-800">
            {params.message}
          </p>
        )}
      </form>
    </div>
  )
}
