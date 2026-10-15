import { NextResponse, type NextRequest } from "next/server";

/**
 * O Next trata "/index" como a página inicial "/". A listagem do Index mora em /indice
 * e é servida no endereço /index por esta reescrita.
 */
export function proxy(request: NextRequest) {
  return NextResponse.rewrite(new URL("/indice", request.url));
}

export const config = { matcher: "/index" };
