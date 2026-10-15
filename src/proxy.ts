import { NextResponse, type NextRequest } from "next/server";

/**
 * - "/" sem sessão mostra o site público (src/app/(site)/site); com sessão, o app.
 * - O Next trata "/index" como a página inicial "/". A listagem do Index mora em /indice
 *   e é servida no endereço /index por esta reescrita.
 */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    if (request.cookies.has("oraclo_session")) return NextResponse.next();
    return NextResponse.rewrite(new URL("/site", request.url));
  }
  return NextResponse.rewrite(new URL("/indice", request.url));
}

export const config = { matcher: ["/", "/index"] };
