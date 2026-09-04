import { NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_COOKIE, createSession, passwordsMatch, sessionCookieOptions } from "@/lib/auth";

const loginSchema = z.object({ password: z.string().min(1).max(200) });

export async function POST(request: Request) {
  const expectedPassword = process.env.APP_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;
  if (!expectedPassword || !sessionSecret || sessionSecret.length < 32) {
    return NextResponse.json({ error: "서버 설정을 확인해 주세요." }, { status: 503 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success || !(await passwordsMatch(parsed.data.password, expectedPassword))) {
    return NextResponse.json({ error: "암호가 맞지 않습니다." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, await createSession(sessionSecret), sessionCookieOptions);
  return response;
}
