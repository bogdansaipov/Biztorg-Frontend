import { NextRequest, NextResponse } from "next/server";

const DEFAULT_REGION = "all";
const DEFAULT_LOCALE = "ru";
const REGION_COOKIE_NAME = "region";
const NON_REGION_ROOTS = ["obyavlenie", "profile", "shop", "user", "legal"];
const REGION_SUB_ROUTES = ["category", "search"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const localeMatch = pathname.match(/^\/(ru|uz)(\/.*)?$/);

  if (!localeMatch) {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0 && NON_REGION_ROOTS.includes(segments[0])) {
      const url = req.nextUrl.clone();
      url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
      return NextResponse.redirect(url);
    }
    const region = req.cookies.get(REGION_COOKIE_NAME)?.value ?? DEFAULT_REGION;
    const url = req.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}/${region}${pathname}`;
    return NextResponse.redirect(url);
  }

  const locale = localeMatch[1];
  const rest = localeMatch[2] ?? "";
  const segments = rest.split("/").filter(Boolean);

  if (segments.length > 0 && NON_REGION_ROOTS.includes(segments[0])) {
    return NextResponse.next();
  }

  const missingRegion = segments.length === 0 || REGION_SUB_ROUTES.includes(segments[0]);
  if (missingRegion) {
    const region = req.cookies.get(REGION_COOKIE_NAME)?.value ?? DEFAULT_REGION;
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/${region}${rest}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};