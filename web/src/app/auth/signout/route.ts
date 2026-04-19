import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Check if we have a session
  const { data } = await supabase.auth.getSession()
  const session = data?.session

  if (session) {
    await supabase.auth.signOut()
  }

  return NextResponse.redirect(new URL('/', request.url), {
    status: 302,
  })
}
