import { NextResponse, type NextRequest } from "next/server";

/**
 * Atalho de navegação: sem o cookie de sessão, as telas logadas vão direto
 * para /login. NÃO é a verificação de segurança — quem valida a sessão (e o
 * dispositivo) é a API em toda chamada.
 */
const COOKIE = process.env.COOKIE_NAME || "oncodash_session";

export function proxy(request: NextRequest) {
  if (request.cookies.has(COOKIE)) return NextResponse.next();
  const url = new URL("/login", request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== "/") url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/", "/admin/:path*"],
};
