"use client";

import { FormEvent, KeyboardEvent, useMemo, useState } from "react";
import type { CompletedResult, TransformResponse } from "@/lib/contracts";
import { MAX_ANSWER_LENGTH, MAX_REQUEST_LENGTH } from "@/lib/contracts";

type Stage = "input" | "clarification" | "complete";

const fieldMeta: Array<{ key: keyof Omit<CompletedResult, "status" | "questions" | "finalPrompt">; number: string; title: string; english: string; hint: string }> = [
  { key: "role", number: "01", title: "역할", english: "Role", hint: "전문 분야 · 책임 범위" },
  { key: "task", number: "02", title: "작업", english: "Task", hint: "목표 · 수행 항목 · 산출물" },
  { key: "context", number: "03", title: "상황", english: "Context", hint: "입력값 · 단위 · 공정 조건" },
  { key: "constraints", number: "04", title: "제약 및 접근 방식", english: "Constraints", hint: "공차 · 검증 · 예외 처리" },
  { key: "outputFormat", number: "05", title: "출력 형식", english: "Output", hint: "표 · 수식 · 체크리스트" },
  { key: "stopCondition", number: "06", title: "완료 조건", english: "Done", hint: "판정 기준 · 제외 범위" },
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

  function handleRequestShortcut(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && !loading && request.trim()) {
      event.preventDefault();
      void transform({ request: request.trim() });
    }
  }

  async function submitAnswers(event: FormEvent) {
    event.preventDefault();
    if (answers.some((answer) => !answer.trim())) {
      setError("모든 질문에 답해주세요.");
      return;
    }
    await transform({ request: request.trim(), questions, answers: answers.map((answer) => answer.trim()) });
  }

  function handleAnswerShortcut(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && !loading && answers.every((answer) => answer.trim())) {
      event.preventDefault();
      void transform({ request: request.trim(), questions, answers: answers.map((answer) => answer.trim()) });
    }
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
          <span className="brand-symbol">P</span><span>Prompt Six</span>
        </button>
        <div className="topbar-actions"><span className="security-status"><i /> 안전하게 보호됨</span><button className="ghost-button" onClick={logout}>로그아웃</button></div>
      </header>

      <div className="page-container">
        <section className="hero">
          <span className="product-badge">AI PROMPT WORKSPACE</span>
          <h1>요청을 입력하면,<br /><strong>실행 가능한 프롬프트</strong>로 정리해드려요.</h1>
          <p>일반 업무부터 디스플레이·설계·공정 계산까지<br className="desktop-break" /> 필요한 조건과 검증 기준을 빠짐없이 구조화합니다.</p>
        </section>

        <section className="workspace" aria-live="polite">
        {stage === "input" && (
          <form onSubmit={submitRequest} className="composer">
            <div className="composer-title"><div><span className="step-dot">1</span><div><label htmlFor="request">어떤 작업이 필요한가요?</label><p>평소 말하듯 입력해도 괜찮아요.</p></div></div><span className="shortcut-chip">Ctrl + Enter</span></div>
            <textarea
              id="request"
              value={request}
              onChange={(event) => setRequest(event.target.value)}
              placeholder="예: 압착부 접속 면적과 절연 갭을 입력값에 따라 자동 계산하고, 결과와 검증 기준을 표로 보여주는 도구를 만들고 싶어."
              maxLength={MAX_REQUEST_LENGTH}
              rows={6}
              autoFocus
              onKeyDown={handleRequestShortcut}
            />
            <div className="composer-footer">
              <span><b>{requestCount}</b> / {MAX_REQUEST_LENGTH.toLocaleString("ko-KR")}자</span>
              <button type="submit" disabled={loading || !request.trim()}>
                {loading ? "요청을 분석하고 있어요" : "프롬프트 만들기"}<span aria-hidden="true">→</span>
              </button>
            </div>
          </form>
        )}

        {stage === "clarification" && (
          <form onSubmit={submitAnswers} className="clarification-card">
            <div className="section-heading">
              <span className="step-dot">2</span>
              <div><h2>정확도를 높이기 위한 질문이에요</h2><p>모르는 항목은 “합리적으로 가정해줘”라고 답해도 됩니다.</p></div>
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
                    onKeyDown={handleAnswerShortcut}
                  />
                </label>
              ))}
            </div>
            <div className="actions">
              <button type="button" className="secondary-button" onClick={reset}>처음으로</button>
              <button type="submit" disabled={loading}>{loading ? "프롬프트를 완성하고 있어요" : "답변 반영하기 →"}</button>
            </div>
          </form>
        )}

        {stage === "complete" && result && (
          <div className="result-wrap" id="result">
            <div className="result-heading">
              <div><span className="completion-icon">✓</span><div><p>구조화 완료</p><h2>바로 사용할 수 있는 프롬프트예요</h2></div></div>
              <button onClick={copyPrompt}>{copied ? "복사 완료 ✓" : "전체 복사"}</button>
            </div>
            <div className="result-grid">
              {fieldMeta.map((field) => (
                <article className="result-card" key={field.key}>
                  <div className="result-card-head"><span className="result-index">{field.number}</span><div><p className="result-label">{field.title} <span>{field.english}</span></p><small>{field.hint}</small></div></div>
                  <p className="result-content">{result[field.key]}</p>
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
        {stage !== "complete" && <section className="framework-preview"><div><span>6</span><p><b>핵심 요소로 구조화</b><small>역할부터 완료 조건까지</small></p></div>{fieldMeta.map((field) => <span key={field.key}>{field.number} {field.title}</span>)}</section>}
      </div>
      <footer className="app-footer">Prompt Six · Gemini 기반 프롬프트 워크스페이스</footer>
    </main>
  );
}
