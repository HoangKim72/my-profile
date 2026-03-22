// app/api/auth/[...path]/route.ts

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const proto = request.headers.get("x-forwarded-proto");
      const host = forwardedHost || request.headers.get("host") || "";
      const redirectUrl = proto ? `${proto}://${host}${next}` : next;
      return NextResponse.redirect(redirectUrl);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(
    `${request.nextUrl.origin}/auth/auth-code-error`,
  );
}
