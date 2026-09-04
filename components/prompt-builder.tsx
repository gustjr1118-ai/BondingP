"use client";

import { FormEvent, useMemo, useState } from "react";
import type { CompletedResult, TransformResponse } from "@/lib/contracts";
import { MAX_ANSWER_LENGTH, MAX_REQUEST_LENGTH } from "@/lib/contracts";

type Stage = "input" | "clarification" | "complete";

const fieldMeta: Array<{ key: keyof Omit<CompletedResult, "status" | "questions" | "finalPrompt">; number: string; title: string; english: string }> = [
  { key: "role", number: "01", title: "역할", english: "Role" },
  { key: "task", number: "02", title: "작업", english: "Task" },
  { key: "context", number: "03", title: "상황", english: "Context" },
  { key: "constraints", number: "04", title: "제약 및 접근 방식", english: "Constraints & Approach" },
  { key: "outputFormat", number: "05", title: "출력 형식", english: "Output Format" },
  { key: "stopCondition", number: "06", title: "정지 조건", english: "Stop Condition" },
];

export default function PromptBuilder() {
  const [stage, setStage] = useState<Stage>("input");
  const [request, setRequest] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<CompletedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const requestCount = useMemo(() => request.length.toLocaleString("ko-KR"), [request.length]);

  async function transform(payload: { request: string; questions?: string[]; answers?: string[] }) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = (await response.json()) as TransformResponse | { error: string };
      if (!response.ok || "error" in data) throw new Error("error" in data ? data.error : "요청에 실패했습니다.");
      if (data.status === "clarification") {
        setQuestions(data.questions);
        setAnswers(data.questions.map(() => ""));
        setStage("clarification");
      } else {
        setResult(data);
        setStage("complete");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function submitRequest(event: FormEvent) {
    event.preventDefault();
    if (!request.trim()) return;
    await transform({ request: request.trim() });
  }

  async function submitAnswers(event: FormEvent) {
    event.preventDefault();
    if (answers.some((answer) => !answer.trim())) {
      setError("모든 질문에 답해주세요.");
      return;
    }
    await transform({ request: request.trim(), questions, answers: answers.map((answer) => answer.trim()) });
  }

  function reset() {
    setStage("input");
    setRequest("");
    setQuestions([]);
    setAnswers([]);
    setResult(null);
    setError("");
    setCopied(false);
  }

  async function copyPrompt() {
    if (!result) return;
    await navigator.clipboard.writeText(result.finalPrompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={reset} aria-label="처음으로">
          <span className="brand-symbol">✦</span><span>PROMPT SIX</span>
        </button>
        <button className="ghost-button" onClick={logout}>나가기</button>
      </header>

      <section className={`hero ${stage !== "input" ? "hero-compact" : ""}`}>
        <p className="eyebrow"><span /> FROM THOUGHT TO PROMPT</p>
        <h1>막연한 생각을<br /><em>선명한 프롬프트</em>로.</h1>
        <p className="hero-copy">하고 싶은 말을 편하게 적어주세요.<br />여섯 가지 관점으로 다듬어 바로 쓸 수 있게 만들어 드릴게요.</p>
      </section>

      <section className="workspace" aria-live="polite">
        {stage === "input" && (
          <form onSubmit={submitRequest} className="composer">
            <label htmlFor="request">무엇을 하고 싶으신가요?</label>
            <textarea
              id="request"
              value={request}
              onChange={(event) => setRequest(event.target.value)}
              placeholder="예: 다음 달에 출시할 친환경 텀블러의 인스타그램 광고 문구를 만들고 싶어. 타겟은 20~30대 직장인이야."
              maxLength={MAX_REQUEST_LENGTH}
              rows={6}
              autoFocus
            />
            <div className="composer-footer">
              <span>{requestCount} / {MAX_REQUEST_LENGTH.toLocaleString("ko-KR")}</span>
              <button type="submit" disabled={loading || !request.trim()}>
                {loading ? "생각을 정리하는 중…" : "프롬프트 만들기"}<span aria-hidden="true">→</span>
              </button>
            </div>
          </form>
        )}

        {stage === "clarification" && (
          <form onSubmit={submitAnswers} className="clarification-card">
            <div className="section-heading">
              <span className="step-badge">한 걸음만 더</span>
              <h2>조금만 더 알려주세요</h2>
              <p>답변을 바탕으로 더 정확한 프롬프트를 만들게요.</p>
            </div>
            <div className="question-list">
              {questions.map((question, index) => (
                <label key={question}>
                  <span><b>Q{index + 1}</b>{question}</span>
                  <textarea
                    value={answers[index] ?? ""}
                    onChange={(event) => setAnswers((current) => current.map((answer, answerIndex) => answerIndex === index ? event.target.value : answer))}
                    placeholder="편하게 답해주세요"
                    maxLength={MAX_ANSWER_LENGTH}
                    rows={3}
                  />
                </label>
              ))}
            </div>
            <div className="actions">
              <button type="button" className="secondary-button" onClick={reset}>처음으로</button>
              <button type="submit" disabled={loading}>{loading ? "완성하는 중…" : "완성하기 →"}</button>
            </div>
          </form>
        )}

        {stage === "complete" && result && (
          <div className="result-wrap">
            <div className="result-heading">
              <div><span className="step-badge success">완성</span><h2>당신의 프롬프트가 준비됐어요</h2></div>
              <button onClick={copyPrompt}>{copied ? "복사했어요 ✓" : "전체 복사"}</button>
            </div>
            <div className="result-grid">
              {fieldMeta.map((field) => (
                <article className="result-card" key={field.key}>
                  <div className="result-index">{field.number}</div>
                  <div><p className="result-label">{field.title} <span>{field.english}</span></p><p>{result[field.key]}</p></div>
                </article>
              ))}
            </div>
            <div className="result-actions">
              <button className="secondary-button" onClick={reset}>새 프롬프트 만들기</button>
              <button onClick={copyPrompt}>{copied ? "복사 완료 ✓" : "프롬프트 전체 복사"}</button>
            </div>
          </div>
        )}

        {error && <div className="error-banner" role="alert">{error}</div>}
      </section>

      <footer><span>ROLE</span><i /> <span>TASK</span><i /> <span>CONTEXT</span><i /> <span>CONSTRAINTS</span><i /> <span>FORMAT</span><i /> <span>STOP</span></footer>
    </main>
  );
}
