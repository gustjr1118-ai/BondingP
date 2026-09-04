import { z } from "zod";

export const MAX_REQUEST_LENGTH = 4_000;
export const MAX_ANSWER_LENGTH = 2_000;

export const transformRequestSchema = z.object({
  request: z.string().trim().min(1).max(MAX_REQUEST_LENGTH),
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
  role: z.string().trim().max(2_000),
  task: z.string().trim().max(3_000),
  context: z.string().trim().max(3_000),
  constraints: z.string().trim().max(3_000),
  outputFormat: z.string().trim().max(2_000),
  stopCondition: z.string().trim().max(2_000),
});

export type ModelOutput = z.infer<typeof modelOutputSchema>;
export type CompletedResult = Omit<ModelOutput, "status" | "questions"> & {
  status: "completed";
  questions: [];
  finalPrompt: string;
};

export type TransformResponse =
  | { status: "clarification"; questions: string[] }
  | CompletedResult;
