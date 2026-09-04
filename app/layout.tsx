import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt Six — 생각을 선명한 프롬프트로",
  description: "일상적인 요청을 AI가 이해하기 쉬운 6요소 프롬프트로 바꿔보세요.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
