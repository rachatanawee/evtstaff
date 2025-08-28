import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
            // The `cookies().set()` method can only be called in a Server Component or Route Handler
            // that is part of a Next.js App Router route. This error is typically caused by calling
            // `cookies().set()` in a Client Component.
          }
        },
        remove(name: string, options: CookieOptions) { // eslint-disable-line @typescript-eslint/no-unused-vars
          try {
            cookieStore.delete(name)
          } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
            // The `cookies().set()` method can only be called in a Server Component or Route Handler
            // that is part of a Next.js App Router route. This error is typically caused by calling
            // `cookies().set()` in a Client Component.
          }
        },
      },
    }
  )
}