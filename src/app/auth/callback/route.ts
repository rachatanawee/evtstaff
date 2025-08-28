import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'


import type { NextRequest } from 'next/server'


export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            return (await cookieStore.get(name))?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              const newOptions: Record<string, unknown> = { ...options };
              if (newOptions.expires instanceof Date) {
                newOptions.expires = newOptions.expires.getTime();
              }
              cookieStore.set({ name, value, ...newOptions });
            } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
              // The `cookies().set()` method can only be called in a Server Component or Route Handler
              // that is part of a Next.js App Router route. This error is typically caused by calling
              // `cookies().set()` in a Client Component.
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              const newOptions: Record<string, unknown> = { ...options };
              if (newOptions.expires instanceof Date) {
                newOptions.expires = newOptions.expires.getTime();
              }
              cookieStore.set({ name, value: '', ...newOptions });
            } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
              // The `cookies().set()` method can only be called in a Server Component or Route Handler
              // that is part of a Next.js App Router route. This error is typically caused by calling
              // `cookies().set()` in a Client Component.
            }
          },
        },
      }
    )
    await supabase.auth.exchangeCodeForSession(code)
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
}