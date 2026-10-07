import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isWorkspaceRoute = request.nextUrl.pathname.startsWith('/forms');
  const hasSession = request.cookies.has('formflow_session');

  // If trying to access protected workspace without session, redirect to landing
  if (isWorkspaceRoute && !hasSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If authenticated user visits landing page, redirect to workspace
  if (request.nextUrl.pathname === '/' && hasSession) {
    return NextResponse.redirect(new URL('/forms', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/forms/:path*'],
};
