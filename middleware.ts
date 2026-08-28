import { NextRequest, NextResponse } from "next/server";

const DEFAULT_REGION = "all";
const DEFAULT_LOCALE = "ru";
const REGION_COOKIE_NAME = "region";
const NON_REGION_ROOTS = ["obyavlenie", "profile", "shop", "user", "legal"];
const REGION_SUB_ROUTES = ["category", "search"];
const ADMIN_HOST_PREFIX = "admin.";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get("host") ?? "";

  // admin.biztorg.uz: internally served from app/admin, no locale/region
  // prefixing — the admin panel is a single-locale internal tool, not part
  // of the public site's i18n routing. This runs before anything else so
  // none of the locale/region logic below ever touches admin requests.
  if (hostname.startsWith(ADMIN_HOST_PREFIX)) {
    const url = req.nextUrl.clone();
    url.pathname = `/admin${pathname}`;
    return NextResponse.rewrite(url);
  }

  // app/admin only exists to be served via the rewrite above. Block it on
  // the public host so biztorg.uz/admin/... 404s instead of exposing the
  // panel at a second, unintended URL.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return new NextResponse(null, { status: 404 });
  }

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
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-locale", locale);
  const passthroughInit = { request: { headers: requestHeaders } };

  if (segments.length > 0 && NON_REGION_ROOTS.includes(segments[0])) {
    return NextResponse.next(passthroughInit);
  }

  const missingRegion = segments.length === 0 || REGION_SUB_ROUTES.includes(segments[0]);
  if (missingRegion) {
    const region = req.cookies.get(REGION_COOKIE_NAME)?.value ?? DEFAULT_REGION;
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/${region}${rest}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next(passthroughInit);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};