import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Check if env vars exist before initializing
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables in Middleware')
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser().
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (e) {
    console.error('Auth check failed in middleware', e)
  }

  let isBanned = false
  let role: string | null = null
  if (user) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_banned, role')
        .eq('id', user.id)
        .single()
      isBanned = profile?.is_banned || false
      role = profile?.role || null
    } catch (e) {
      console.error('Banned check failed in middleware', e)
    }
  }

  // Handle banned users
  if (isBanned && !request.nextUrl.pathname.startsWith('/banned') && !request.nextUrl.pathname.startsWith('/auth/signout')) {
    const url = request.nextUrl.clone()
    url.pathname = '/banned'
    return NextResponse.redirect(url)
  }

  // Protect routes based on user role
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/products') &&
    !request.nextUrl.pathname.startsWith('/shop') &&
    !request.nextUrl.pathname.startsWith('/search') &&
    request.nextUrl.pathname !== '/'
  ) {
    // no user, potentially redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && request.nextUrl.pathname.startsWith('/dashboard/')) {
    const dashboardRole = request.nextUrl.pathname.split('/')[2]
    if (
      role &&
      ['buyer', 'seller', 'rider', 'admin'].includes(dashboardRole) &&
      dashboardRole !== role
    ) {
      const url = request.nextUrl.clone()
      url.pathname = role === 'buyer' ? '/' : `/dashboard/${role}`
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
