import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import MessengerClient from '@/components/messaging/MessengerClient'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-slate-950">
      <MessengerClient userId={session.user.id} />
    </div>
  )
}
