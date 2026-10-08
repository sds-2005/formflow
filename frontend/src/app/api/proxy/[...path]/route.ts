import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
const PROXY_SECRET = process.env.PROXY_SECRET || "dev-secret-change-in-production";

export async function ANY(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const p = await params;
  const path = p.path.join("/");
  const url = new URL(req.url);
  const searchParams = url.searchParams.toString();
  
  const backendUrl = `${BACKEND_URL}/api/v1/${path}${searchParams ? `?${searchParams}` : ""}`;

  const headers = new Headers();
  headers.set("X-Proxy-Secret", PROXY_SECRET);
  headers.set("Content-Type", req.headers.get("content-type") || "application/json");

  // Forward auth cookie as Bearer token if present
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("formflow_session");
  
  if (sessionCookie?.value) {
    headers.set("Authorization", `Bearer ${sessionCookie.value}`);
  }

  try {
    const body = req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined;
    
    const response = await fetch(backendUrl, {
      method: req.method,
      headers,
      body,
      // Next.js specific fetch options
      cache: "no-store",
    });

    const data = await response.text();
    let parsedData = data;
    try {
      parsedData = JSON.parse(data);
    } catch {
      // not json
    }

    // Special handling for auth/demo route: extract token and set HttpOnly cookie
    if (path === "auth/demo" && response.status === 200 && typeof parsedData === "object" && parsedData !== null && "token" in parsedData) {
      const { token, ...rest } = parsedData as Record<string, unknown> & { token: string };
      
      const res = NextResponse.json(rest, { status: 200 });
      
      // Set the HTTP-only cookie
      res.cookies.set("formflow_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60, // 24 hours
      });
      
      return res;
    }

    const res = NextResponse.json(parsedData, { status: response.status });
    
    return res;
  } catch (error: unknown) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { detail: "Internal Server Error (Proxy)" },
      { status: 500 }
    );
  }
}

export const GET = ANY;
export const POST = ANY;
export const PUT = ANY;
export const PATCH = ANY;
export const DELETE = ANY;
