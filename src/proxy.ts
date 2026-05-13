import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.NEXTAUTH_SECRET!;
const encodedKey = new TextEncoder().encode(secretKey);

// Routes that don't require authentication
const publicRoutes = ["/login"];

async function verifySession(session: string) {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as { userId: string; role: string };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // If user is logged in and tries to access login, redirect to dashboard
    const session = request.cookies.get("pms-session")?.value;
    if (session) {
      const payload = await verifySession(session);
      if (payload) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  // Protect all other routes
  const session = request.cookies.get("pms-session")?.value;
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifySession(session);
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("pms-session");
    return response;
  }

  // Role-based route protection
  const roleRestrictions: Record<string, string[]> = {
    "/reports": ["OWNER", "BRANCH_MANAGER"],
    "/branches": ["OWNER"],
    "/pricing": ["OWNER", "BRANCH_MANAGER"],
    "/contracts": ["OWNER", "BRANCH_MANAGER", "STAFF"],
    "/deposits": ["OWNER", "BRANCH_MANAGER", "STAFF"],
    "/utilities": ["OWNER", "BRANCH_MANAGER", "STAFF"],
    "/ota": ["OWNER", "BRANCH_MANAGER"],
  };

  for (const [route, allowedRoles] of Object.entries(roleRestrictions)) {
    if (
      pathname.startsWith(route) &&
      !allowedRoles.includes(payload.role as string)
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
