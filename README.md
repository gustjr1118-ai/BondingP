# Prompt Six

일반적인 요청을 업무 유형에 맞게 구조화하고 한글·영문 프롬프트를 동시에 만드는 웹앱입니다. 정보가 부족하면 한 번만 추가 질문합니다.

## 주요 기능

- 일반 업무 6개 구조: 역할·목표, 맥락, 명령, 예시, 포맷, 어조·완료 기준
- Bonding 업무 7개 구조: 전문 역할·목표, 공정·디자인 맥락, 재료·설비·입력 조건, 원인·메커니즘 분석, 개선안·검증 계획, 산출물·포맷, 근거·어조·완료 기준
- 입력창 아래 한글(왼쪽)·영문(오른쪽) 결과와 언어별 복사. 작은 화면은 세로 배치
- 필요한 경우 1~3개의 추가 질문
- Gemini Structured Outputs 기반 응답 검증
- 공유 암호와 서명된 보안 쿠키
- 대화 및 사용자 데이터 미저장
- Ctrl+Enter 또는 Command+Enter로 생성

## API 키 없이 UI 미리보기

`pnpm dev`로 실행하면 입력창 아래에 **예시 결과 미리보기** 버튼이 표시됩니다. 업무 유형을 선택하고 버튼을 누르면 고정된 한글·영문 예시를 표시합니다. API 호출이나 비용은 발생하지 않으며, 입력 문장에 따라 생성되는 실제 결과는 아닙니다. 이 버튼은 개발 환경에만 표시됩니다. **프롬프트 만들기**는 실제 API 키가 필요합니다.

PowerShell에서 로컬 전용 로그인 값을 임시로 지정할 수 있습니다. 기존 `.env.local` 파일을 덮어쓰지 않습니다.

```powershell
$env:APP_PASSWORD = 'local-preview'
$env:SESSION_SECRET = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
pnpm dev --hostname 127.0.0.1 --port 3000
```

`http://127.0.0.1:3000`에서 `local-preview`로 로그인합니다. 이 암호는 로컬 예시 확인에만 사용하세요. UI 검토 중에는 GitHub 푸시나 Vercel 배포를 진행하지 않습니다.

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
