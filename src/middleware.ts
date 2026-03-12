import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "crm_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect all /crm routes
  if (pathname.startsWith("/crm")) {
    const session = req.cookies.get(SESSION_COOKIE);
    if (!session?.value) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Validate session structure
    try {
      const data = JSON.parse(Buffer.from(session.value, "base64").toString("utf-8"));
      if (!data.userId || !data.email) throw new Error("Invalid session");
    } catch {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from login
  if (pathname === "/login") {
    const session = req.cookies.get(SESSION_COOKIE);
    if (session?.value) {
      try {
        const data = JSON.parse(Buffer.from(session.value, "base64").toString("utf-8"));
        if (data.userId) return NextResponse.redirect(new URL("/crm", req.url));
      } catch {
        // Invalid session, let them login
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/crm/:path*", "/login"],
};
