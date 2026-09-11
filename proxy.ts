import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PATHS = ["/build", "/builds"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Refreshes the Supabase session cookie on every request, and requires sign-in
 * for the actual product (the AI builder and saved builds) -- the landing
 * page, /explore, and the auth pages stay public so there's a way to learn
 * about the product and create an account in the first place.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });
  const { pathname, search } = request.nextUrl;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Supabase isn't configured yet -- there is no way to sign in, so send
    // protected routes to /sign-in, which explains what's missing instead
    // of rendering a builder no one can actually save anything from.
    if (isProtected(pathname)) {
      const redirectUrl = new URL("/sign-in", request.url);
      redirectUrl.searchParams.set("next", pathname + search);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();

  if (isProtected(pathname) && !data?.claims) {
    const redirectUrl = new URL("/sign-in", request.url);
    redirectUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
