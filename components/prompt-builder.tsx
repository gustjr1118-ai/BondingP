"use client";

import { FormEvent, KeyboardEvent, useMemo, useState } from "react";
import type { CompletedResult, TransformResponse, WorkMode } from "@/lib/contracts";
import { frameworks, MAX_ANSWER_LENGTH, MAX_REQUEST_LENGTH } from "@/lib/contracts";
import { previewResult } from "@/lib/preview";

type Stage = "input" | "clarification" | "complete";

export default function PromptBuilder() {
  const [mode, setMode] = useState<WorkMode>("general");
  const [stage, setStage] = useState<Stage>("input");
  const [request, setRequest] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<CompletedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"ko" | "en" | null>(null);

  const requestCount = useMemo(() => request.length.toLocaleString("ko-KR"), [request.length]);

  async function transform(payload: { request: string; questions?: string[]; answers?: string[] }) {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, mode }),
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
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && !loading && stage !== "clarification" && request.trim()) {
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
    setCopied(null);
  }

  function clearOutput() {
    setStage("input");
    setQuestions([]);
    setAnswers([]);
    setResult(null);
    setCopied(null);
    setError("");
  }

  async function copyPrompt(language: "ko" | "en") {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result[language].finalPrompt);
      setCopied(language);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setError("복사하지 못했어요. 결과 텍스트를 선택해서 복사해 주세요.");
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={reset} disabled={loading} aria-label="처음으로">
          <span className="brand-symbol">P</span><span>Prompt Six</span>
        </button>
        <div className="topbar-actions"><span className="creator-credit"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></svg>제작자: hyunseok.ko</span><button className="ghost-button" onClick={logout}>로그아웃</button></div>
      </header>

      <div className="page-container">
        <section className="hero">
          <span className="product-badge">AI PROMPT WORKSPACE</span>
          <h1>업무용 <strong>프롬프트 생성기</strong></h1>
          <p>업무에 맞게 구조화하고, 한글과 영어로 한 번에 완성하세요.</p>
        </section>

        <section className="workspace" aria-live="polite">
          <form onSubmit={submitRequest} className="composer">
            <div className="mode-picker"><label htmlFor="work-mode">업무 유형</label><select id="work-mode" value={mode} disabled={loading} onChange={(event) => { setMode(event.target.value as WorkMode); clearOutput(); }}><option value="general">일반 업무</option><option value="bonding">Bonding 업무</option></select><span>{mode === "general" ? "일상 업무를 명확하게 · 6개 구조" : "Flexible OLED Module 전문 · 7개 구조"}</span></div>
            <div className="composer-title"><div><span className="step-dot">1</span><div><label htmlFor="request">어떤 작업이 필요한가요?</label><p>평소 말하듯 입력해도 괜찮아요.</p></div></div><span className="shortcut-chip">Ctrl + Enter</span></div>
            <textarea
              id="request"
              value={request}
              onChange={(event) => { setRequest(event.target.value); clearOutput(); }}
              disabled={loading}
              placeholder={mode === "general" ? "예: 팀장에게 보고할 주간 업무 보고서 초안을 작성하고 싶어. 완료 업무, 진행 상황, 다음 주 계획을 표로 정리해줘." : "예: Flexible OLED OLB 공정에서 발생하는 Open 불량의 원인과 검증 계획을 정리하고 싶어. ACF, 얼라인먼트, 압착 조건별로 가설과 필요한 측정 항목을 구분해줘."}
              maxLength={MAX_REQUEST_LENGTH}
              rows={6}
              autoFocus
              onKeyDown={handleRequestShortcut}
            />
            <div className="composer-footer">
              <span><b>{requestCount}</b> / {MAX_REQUEST_LENGTH.toLocaleString("ko-KR")}자</span>
              <button type="submit" disabled={loading || !request.trim() || stage === "clarification"}>
                {loading ? "요청을 분석하고 있어요" : "프롬프트 만들기"}<span aria-hidden="true">→</span>
              </button>
            </div>
            {process.env.NODE_ENV === "development" && <div className="local-preview"><span>로컬 UI 확인용 · 실제 AI 생성 결과가 아닌 예시입니다.</span><button type="button" className="ghost-button" disabled={loading} onClick={() => { clearOutput(); setResult(previewResult(mode)); setStage("complete"); }}>예시 결과 미리보기</button></div>}
          </form>

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
                    disabled={loading}
                    onKeyDown={handleAnswerShortcut}
                  />
                </label>
              ))}
            </div>
            <div className="actions">
              <button type="button" className="secondary-button" disabled={loading} onClick={reset}>처음으로</button>
              <button type="submit" disabled={loading}>{loading ? "프롬프트를 완성하고 있어요" : "답변 반영하기 →"}</button>
            </div>
          </form>
        )}

        {stage === "complete" && result && (
          <div className="result-wrap" id="result">
            <div className="result-heading">
              <div><span className="completion-icon">✓</span><div><p>{result.mode === "general" ? "일반 업무 · 6개 구조" : "Bonding 업무 · 7개 구조"}</p><h2>한글·영문 프롬프트</h2></div></div>
            </div>
            <div className="bilingual-grid">
              {(["ko", "en"] as const).map((language) => (
                <section className="language-column" lang={language} key={language} aria-label={language === "ko" ? "한글 프롬프트" : "English prompt"}>
                  <div className="language-heading"><h3>{language === "ko" ? "한글 버전" : "English version"}</h3><button className="secondary-button" onClick={() => copyPrompt(language)}>{copied === language ? "복사 완료 ✓" : language === "ko" ? "한글 복사" : "Copy English"}</button></div>
                  {result[language].sections.map((content, index) => <article className="result-card" key={index}><div className="result-card-head"><span className="result-index">{String(index + 1).padStart(2, "0")}</span><h4 className="result-label">{frameworks[result.mode][index][language === "ko" ? 0 : 1]}</h4></div><p className="result-content">{content}</p></article>)}
                </section>
              ))}
            </div>
            <div className="result-actions">
              <button className="secondary-button" disabled={loading} onClick={reset}>새 프롬프트 만들기</button>
            </div>
          </div>
        )}

        {error && <div className="error-banner" role="alert">{error}</div>}
        </section>
        {stage !== "complete" && <section className="framework-preview"><div><span>{frameworks[mode].length}</span><p><b>선택한 프롬프트 구조</b><small>한글·영문 동시 생성</small></p></div>{frameworks[mode].map((field, index) => <span key={field[0]}>{String(index + 1).padStart(2, "0")} {field[0]}</span>)}</section>}
      </div>
      <footer className="app-footer">Prompt Six · Gemini 기반 프롬프트 워크스페이스</footer>
    </main>
  );
}
