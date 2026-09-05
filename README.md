# Prompt Six

평범한 채팅 요청을 역할, 작업, 상황, 제약 및 접근 방식, 출력 형식, 정지 조건의 여섯 요소로 바꾸는 채팅형 웹앱입니다. 정보가 부족하면 한 번만 추가 질문하고, 답변을 반영해 복사 가능한 프롬프트를 완성합니다.

## 주요 기능

- 입력 언어를 유지하는 6요소 프롬프트 생성
- 필요한 경우 1~3개의 추가 질문
- Gemini Structured Outputs 기반 응답 검증
- 공유 암호와 서명된 보안 쿠키
- 대화 및 사용자 데이터 미저장
- 반응형 결과 카드와 전체 복사

## 로컬 실행

Node.js 20 이상과 Google AI Studio에서 발급한 Gemini API 키가 필요합니다.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Windows PowerShell에서는 두 번째 명령 대신 다음을 사용하세요.

```powershell
Copy-Item .env.example .env.local
```

`.env.local`의 값을 실제 값으로 바꾼 뒤 `http://localhost:3000`을 엽니다.

| 환경변수 | 용도 |
| --- | --- |
| `GEMINI_API_KEY` | 서버에서만 사용하는 Gemini API 키 |
| `GEMINI_MODEL` | 사용할 모델, 기본값 `gemini-3.5-flash-lite` |
| `APP_PASSWORD` | 방문자와 공유할 앱 암호 |
| `SESSION_SECRET` | 쿠키 서명용 32자 이상의 임의 문자열 |

비밀값이 포함된 `.env.local`은 Git에 포함되지 않습니다.

## 확인 명령

```bash
pnpm test
pnpm build
```

## Vercel 배포

1. 이 저장소를 GitHub에 푸시합니다.
2. Vercel에서 **Add New → Project**를 선택하고 저장소를 가져옵니다.
3. 위 네 환경변수를 Production 환경에 등록합니다.
4. 배포한 뒤 공유 암호 로그인, 바로 생성, 추가 질문 후 생성, 복사 기능을 확인합니다.

API 키와 공유 암호는 `NEXT_PUBLIC_` 접두사를 붙이지 마세요. 그 접두사는 브라우저에 공개되는 값에만 사용합니다.

## 데이터 처리

앱은 데이터베이스를 사용하지 않습니다. 요청과 답변은 프롬프트 생성 중 Gemini API로 전달되며 앱 서버에는 별도로 저장하지 않습니다. 무료 티어 입력은 Google의 제품 개선에 사용될 수 있습니다. 운영 환경의 플랫폼 로그 정책은 Vercel과 Google 계정 설정에서 별도로 확인하세요.
