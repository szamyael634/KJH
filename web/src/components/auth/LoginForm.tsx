'use client'

import { useState } from 'react'
import { login } from '@/app/login/actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LogIn } from 'lucide-react'

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    try {
      await login(formData)
    } catch (err: any) {
      // In Next.js server actions, redirect is technically an error that is caught by the framework.
      // But if it's a real error, we handle it.
      if (err.message !== 'NEXT_REDIRECT') {
        setError(err.message || 'Something went wrong')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
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

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
          <p className="text-xs font-bold text-red-600 text-center">
            {error}
          </p>
        </div>
      )}

      <Button type="submit" className="w-full py-6 group" isLoading={isLoading}>
        Sign In
        <LogIn className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Button>
    </form>
  )
}
