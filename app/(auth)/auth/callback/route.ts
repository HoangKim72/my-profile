import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/lib/security/redirect";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = getSafeRedirectPath(searchParams.get("next"));

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // `next` is always a same-origin path, so resolving it against our own
      // origin can never leave the site.
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/auth/auth-code-error", origin));
}
