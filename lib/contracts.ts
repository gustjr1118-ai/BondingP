import { z } from "zod";

export const MAX_REQUEST_LENGTH = 4_000;
export const MAX_ANSWER_LENGTH = 2_000;
export const modeSchema = z.enum(["general", "bonding"]);
export type WorkMode = z.infer<typeof modeSchema>;
export const frameworks = {
  general: [
    ["역할·목표", "Role & Objective"], ["맥락", "Context"],
    ["명령", "Instructions"], ["예시", "Examples"],
    ["포맷", "Output Format"], ["어조·완료 기준", "Tone & Completion Criteria"],
  ],
  bonding: [
    ["전문 역할·목표", "Expert Role & Objective"],
    ["공정·디자인 맥락", "Process & Design Context"],
    ["재료·설비·입력 조건", "Materials, Equipment & Inputs"],
    ["원인·메커니즘 분석", "Root Cause & Mechanism"],
    ["개선안·검증 계획", "Solutions & Validation"],
    ["산출물·포맷", "Deliverables & Format"],
    ["근거·어조·완료 기준", "Evidence, Tone & Completion Criteria"],
  ],
} as const;

export const transformRequestSchema = z.object({
  request: z.string().trim().min(1).max(MAX_REQUEST_LENGTH),
  mode: modeSchema.default("general"),
  questions: z.array(z.string().trim().min(1).max(300)).max(3).default([]),
  answers: z.array(z.string().trim().min(1).max(MAX_ANSWER_LENGTH)).max(3).default([]),
}).superRefine((value, context) => {
  if (value.answers.length > 0 && value.answers.length !== value.questions.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "질문과 답변 수가 일치하지 않습니다." });
  }
});
export const modelOutputSchema = z.object({
  status: z.enum(["clarification", "completed"]),
  questions: z.array(z.string().trim().min(1).max(300)).max(3),
  ko: z.array(z.string().trim().min(1).max(4000)).max(7),
  en: z.array(z.string().trim().min(1).max(4000)).max(7),
});
export type ModelOutput = z.infer<typeof modelOutputSchema>;
export type CompletedResult = {
  status: "completed";
  mode: WorkMode;
  ko: { sections: string[]; finalPrompt: string };
  en: { sections: string[]; finalPrompt: string };
};
export type TransformResponse = { status: "clarification"; questions: string[] } | CompletedResult;
