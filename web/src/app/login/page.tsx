import { login } from './actions'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'
import { LogIn } from 'lucide-react'
import MultiStepSignup from '@/components/auth/MultiStepSignup'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message: string, mode?: string }> }) {
  const params = await searchParams;
  const isSignup = params?.mode === 'signup'

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 font-black text-3xl tracking-tighter text-slate-900 dark:text-white mb-8">
          NEXUS
          <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-[520px]">
        <Card className="px-10 py-12 shadow-2xl border-none">
          {isSignup ? (
             <div className="space-y-6">
                <div className="text-center space-y-2 mb-8">
                   <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Create an account</h2>
                   <p className="text-slate-500 text-sm font-medium">Follow the steps to join the Nexus community.</p>
                </div>
                
                <MultiStepSignup />
                <p className="text-center text-sm text-slate-500">
                  Already have an account?{' '}
                  <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-500">
                    Sign in
                  </Link>
                </p>
             </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-2 mb-8">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Welcome back</h2>
                <p className="text-slate-500 text-sm font-medium">Log in to manage your Nexus marketplace experience.</p>
              </div>

              <form action={login} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Password
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {params?.message && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 rounded-2xl">
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 text-center">
                      {params.message}
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full py-6 group">
                  Sign In
                  <LogIn className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-100 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-sm font-medium">
                  <span className="bg-white dark:bg-slate-900 px-4 text-slate-400">or continue with</span>
                </div>
              </div>

              <p className="text-center text-sm text-slate-500">
                Don't have an account?{' '}
                <Link href="/login?mode=signup" className="font-bold text-indigo-600 hover:text-indigo-500">
                  Join for free
                </Link>
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
