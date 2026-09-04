import OpenAI from "openai";
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
  if (!process.env.OPENAI_API_KEY) {
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
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 25_000, maxRetries: 1 });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      instructions: TRANSFORM_INSTRUCTIONS,
      input: buildModelInput(parsed.data.request, parsed.data.questions, parsed.data.answers),
      reasoning: { effort: "low" },
      max_output_tokens: 2_500,
      text: {
        format: {
          type: "json_schema",
          name: "prompt_six_result",
          strict: true,
          schema: MODEL_OUTPUT_JSON_SCHEMA,
        },
      },
    });

    const result = modelOutputSchema.parse(JSON.parse(response.output_text));
    if (parsed.data.answers.length > 0 && result.status !== "completed") {
      throw new Error("Model requested a second clarification round");
    }
    return NextResponse.json(normalizeModelOutput(result));
  } catch {
    return NextResponse.json(
      { error: "프롬프트를 만드는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요." },
      { status: 502 },
    );
  }
}
