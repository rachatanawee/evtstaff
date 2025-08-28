import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware';

const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'th'],
  defaultLocale: 'en'
});

const protectedRoutes = ['', '/home', '/register', '/prize', '/profile'];

export async function middleware(request: NextRequest) {
  // 1. Handle i18n. This returns a response.
  const response = intlMiddleware(request);

  // 2. Create Supabase client that reads from request and writes to response.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.delete({ name, ...options })
        },
      },
    }
  )

  // 3. Refresh session. This will update cookies on the `response` object.
  const { data: { session } } = await supabase.auth.getSession();

  // 4. Auth logic
  const { pathname } = request.nextUrl;
  const locale = pathname.split('/')[1] || 'en';
  const requestedPath = pathname.substring(locale.length + 1);

  if (!session && protectedRoutes.includes(requestedPath)) {
    const redirectResponse = NextResponse.redirect(new URL(`${request.nextUrl.origin}/${locale}/login`));
    return redirectResponse;
  }

  if (session && requestedPath === '/login') {
    const redirectResponse = NextResponse.redirect(new URL(`${request.nextUrl.origin}/${locale}/home`));
    return redirectResponse;
  }

  // 5. Return the response from intlMiddleware, which now has the Supabase cookies.
  return response;
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - /api (API routes)
    // - /_next/static (static files)
    // - /_next/image (image optimization files)
    // - /favicon.ico (favicon file)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};
