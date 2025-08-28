import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface CookieStore {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options: CookieOptions): void;
  remove(name: string, options: CookieOptions): void;
}

export function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return (cookies() as unknown as CookieStore).get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            (cookies() as unknown as CookieStore).set(name, value, options)
          } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
            // The `cookies().set()` method can only be called in a Server Component or Route Handler
            // that is part of a Next.js App Router route. This error is typically caused by calling
            // `cookies().set()` in a Client Component.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            (cookies() as unknown as CookieStore).remove(name, options)
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