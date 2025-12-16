import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const protectedRoutes = ["/dashboard", "/capture"];

export default auth((req) => {
  const { nextUrl } = req;
  const isProtected = protectedRoutes.some((path) =>
    nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", nextUrl.origin);
    const callbackUrl = `${nextUrl.pathname}${nextUrl.search}`;
    loginUrl.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/capture/:path*"],
};
