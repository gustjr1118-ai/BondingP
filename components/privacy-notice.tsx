export function ProtectionBadge() {
  return <span className="protection-badge" title="공유 암호로 접근을 보호합니다"><i aria-hidden="true" />안전하게 보호됨</span>;
}

export function PrivacyNotice() {
  return <div className="conversation-privacy"><p>이 앱은 입력한 대화 내용을 별도로 저장하지 않아요.</p><small>프롬프트 생성 시 입력 내용은 Gemini로 전송됩니다.</small></div>;
}
