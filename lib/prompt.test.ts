import { describe, expect, it } from "vitest";
import { modelOutputSchema, transformRequestSchema } from "./contracts";
import { buildModelInput, normalizeModelOutput } from "./prompt";
import { previewResult } from "./preview";

describe("bilingual prompt contract", () => {
  it("rejects invalid requests and modes before generation", () => {
    for (const request of ["", " ", "a".repeat(4001)]) expect(transformRequestSchema.safeParse({ request }).success).toBe(false);
    expect(transformRequestSchema.safeParse({ request: "보고서", mode: "unknown" }).success).toBe(false);
    expect(transformRequestSchema.safeParse({ request: "보고서", questions: ["대상?"], answers: ["팀장", "팀원"] }).success).toBe(false);
  });
  for (const mode of ["general", "bonding"] as const) {
    it(`validates both languages and heading order for ${mode}`, () => {
      const fixture = previewResult(mode);
      const output = { status: "completed" as const, questions: [], ko: fixture.ko.sections, en: fixture.en.sections };
      expect(normalizeModelOutput(modelOutputSchema.parse(output), mode)).toEqual(fixture);
      expect(fixture.ko.finalPrompt.match(/^## /gm)).toHaveLength(mode === "general" ? 6 : 7);
      expect(fixture.en.finalPrompt).toContain("1. " + (mode === "general" ? "Role & Objective" : "Expert Role & Objective"));
      expect(() => normalizeModelOutput({ ...output, en: output.en.slice(1) }, mode)).toThrow();
      expect(() => normalizeModelOutput({ ...output, ko: output.ko.map(() => " ") }, mode)).toThrow();
    });
  }
  it("rejects wrong framework count and missing language", () => {
    const sample = previewResult("bonding");
    expect(() => normalizeModelOutput({ status: "completed", questions: [], ko: sample.ko.sections, en: sample.en.sections }, "general")).toThrow();
    expect(modelOutputSchema.safeParse({ status: "completed", questions: [], ko: sample.ko.sections }).success).toBe(false);
  });
  it("accepts one clarification round only with empty prompt fields", () => {
    const output = { status: "clarification" as const, questions: ["대상은 누구인가요?"], ko: [], en: [] };
    expect(normalizeModelOutput(output)).toEqual({ status: "clarification", questions: output.questions });
    expect(() => normalizeModelOutput({ ...output, questions: [] })).toThrow();
    expect(() => normalizeModelOutput({ ...output, ko: ["unexpected"] })).toThrow();
  });
  it("keeps mode and user answers in model input", () => {
    expect(JSON.parse(buildModelInput("Open 분석", ["공정?"], ["OLB"], "bonding"))).toMatchObject({ selected_framework: "bonding", user_answers: ["OLB"] });
  });
});
