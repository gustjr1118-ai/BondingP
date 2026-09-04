"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setError(response.status === 401 ? "암호가 맞지 않아요." : "잠시 후 다시 시도해 주세요.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("네트워크 연결을 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand-mark" aria-hidden="true">✦</div>
        <p className="eyebrow">PROMPT SIX</p>
        <h1>좋은 질문의 시작</h1>
        <p className="muted">공유받은 암호를 입력하면 프롬프트 빌더를 사용할 수 있어요.</p>
        <form onSubmit={submit} className="login-form">
          <label htmlFor="password">공유 암호</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            maxLength={200}
            required
            autoFocus
          />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" disabled={loading || !password}>
            {loading ? "확인 중…" : "시작하기"}
          </button>
        </form>
      </section>
    </main>
  );
}
