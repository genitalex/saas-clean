// This file is deprecated. Use middleware.ts instead.
// Kept for backward compatibility but all logic has been moved to middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)'
  ]
};

