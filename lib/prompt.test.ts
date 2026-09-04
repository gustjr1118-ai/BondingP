import { describe, expect, it } from "vitest";
import { transformRequestSchema } from "./contracts";
import { buildFinalPrompt, normalizeModelOutput } from "./prompt";

const complete = {
  status: "completed" as const,
  questions: [],
  role: "전문가",
  task: "초안을 작성한다.",
  context: "독자는 초보자다.",
  constraints: "쉬운 말을 쓴다.",
  outputFormat: "목록으로 작성한다.",
  stopCondition: "다섯 항목 이내로 끝낸다.",
};

describe("prompt contract", () => {
  it("rejects empty and oversized requests", () => {
    expect(transformRequestSchema.safeParse({ request: "" }).success).toBe(false);
    expect(transformRequestSchema.safeParse({ request: "a".repeat(4001) }).success).toBe(false);
  });

  it("rejects mismatched clarification answers", () => {
    expect(transformRequestSchema.safeParse({ request: "글 써줘", questions: ["독자는?"], answers: [] }).success).toBe(true);
    expect(transformRequestSchema.safeParse({ request: "글 써줘", questions: ["독자는?"], answers: ["학생", "교사"] }).success).toBe(false);
  });

  it("builds all six headings in order", () => {
    const prompt = buildFinalPrompt(complete);
    expect(prompt.match(/^## /gm)).toHaveLength(6);
    expect(prompt).toContain("1. 역할 (Role)");
    expect(prompt).toContain("6. 정지 조건 (Stop Condition)");
  });

  it("rejects incomplete completed output", () => {
    expect(() => normalizeModelOutput({ ...complete, role: "" })).toThrow();
  });

  it("accepts one to three clarification questions", () => {
    expect(normalizeModelOutput({ ...complete, status: "clarification", questions: ["대상은 누구인가요?"] })).toEqual({
      status: "clarification",
      questions: ["대상은 누구인가요?"],
    });
  });
});
