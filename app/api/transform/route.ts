import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE, verifySession } from "@/lib/auth";
import { modelOutputSchema, transformRequestSchema } from "@/lib/contracts";
import { buildModelInput, MODEL_OUTPUT_JSON_SCHEMA, normalizeModelOutput, TRANSFORM_INSTRUCTIONS } from "@/lib/prompt";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const authenticated = await verifySession(cookieStore.get(AUTH_COOKIE)?.value, process.env.SESSION_SECRET);
  if (!authenticated) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "AI 연결 설정이 필요합니다." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }
  const parsed = transformRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력 내용을 확인해 주세요." }, { status: 400 });
  }

  try {
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await client.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
      contents: buildModelInput(parsed.data.request, parsed.data.questions, parsed.data.answers),
      config: {
        systemInstruction: TRANSFORM_INSTRUCTIONS,
        maxOutputTokens: 2_500,
        responseMimeType: "application/json",
        responseJsonSchema: MODEL_OUTPUT_JSON_SCHEMA,
        httpOptions: { timeout: 25_000 },
      },
    });

    if (!response.text) throw new Error("Gemini returned an empty response");
    const result = modelOutputSchema.parse(JSON.parse(response.text));
    if (parsed.data.answers.length > 0 && result.status !== "completed") {
      throw new Error("Model requested a second clarification round");
    }
    return NextResponse.json(normalizeModelOutput(result));
  } catch (error) {
    const details = error && typeof error === "object" ? error as Record<string, unknown> : {};
    const status = typeof details.status === "number" ? details.status : undefined;
    const code = typeof details.code === "string" ? details.code : undefined;
    const name = error instanceof Error ? error.name : "UnknownError";
    const message = error instanceof Error
      ? error.message
          .replace(/AQ\.[A-Za-z0-9._-]+/g, "[REDACTED_API_KEY]")
          .replace(/AIza[A-Za-z0-9_-]+/g, "[REDACTED_API_KEY]")
          .slice(0, 500)
      : undefined;

    // Do not log request text, API keys, or provider messages because they can
    // contain user data. These fields are enough to distinguish auth, quota,
    // timeout, and local validation failures in Vercel logs.
    console.error("Gemini transform failed", { name, status, code, message });
    return NextResponse.json(
      { error: "프롬프트를 만드는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요." },
      { status: 502 },
    );
  }
}
