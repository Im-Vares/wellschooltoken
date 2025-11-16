import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get tokens from cookies
  const token = request.cookies.get('token');
  const adminToken = request.cookies.get('adminToken');
  
  const { pathname } = request.nextUrl;

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    // Allow admin login page
    if (pathname === '/admin/login') {
      // Redirect to admin dashboard if already logged in
      if (adminToken) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.next();
    }
    
    // Protect all other admin routes
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    return NextResponse.next();
  }

  // User routes protection
  const protectedUserRoutes = [
    '/dashboard',
    '/profile',
    '/questions',
    '/achievements',
    '/history'
  ];

  const isProtectedRoute = protectedUserRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname === '/login' || pathname === '/register') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
