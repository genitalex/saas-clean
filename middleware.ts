import { NextResponse } from 'next/server';

export function middleware() {
  // Dashboard pages are protected server-side in src/app/dashboard/layout.tsx.
  // API routes perform their own session checks in each route handler.
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*']
};
