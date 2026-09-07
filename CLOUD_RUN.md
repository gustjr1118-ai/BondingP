# Cloud Run 배포

현재 Vercel 서비스와 별개로 배포합니다. Dockerfile은 Cloud Run의 PORT(기본 8080)를 사용하며 기존 공유 암호 인증을 유지합니다. `.gcloudignore`와 `.dockerignore`는 앱에 필요한 파일만 허용하고 환경파일과 로컬 문서를 제외합니다.

## 준비

- Google Cloud 로그인, 배포 대상 프로젝트 ID 및 결제 계정 연결 확인
- Cloud Run, Cloud Build, Artifact Registry API 활성화 및 배포 권한
- 런타임 환경변수 `GEMINI_API_KEY`, `APP_PASSWORD`, `SESSION_SECRET` 설정. 비밀값은 Secret Manager 사용 권장
- `SESSION_SECRET`은 32자 이상. `GEMINI_MODEL`은 선택 사항

## 소스 배포

Google Cloud CLI가 있는 환경에서 프로젝트 루트의 소스를 사용합니다. PROJECT_ID는 실제 프로젝트 ID로 바꾸고 리전은 계정/사내 정책에 맞게 선택합니다.

```sh
gcloud run deploy bondingp --source . --project PROJECT_ID --region asia-northeast3 --port 8080 --memory 512Mi --cpu 1 --min-instances 0 --max-instances 2 --timeout 60
```

콘솔에서 런타임 비밀값을 설정한 뒤 외부 웹 접근 정책을 확인합니다. 공개 웹 진입을 허용해도 앱의 공유 암호는 필요합니다. 결제·권한 설정을 확인하기 전에 공개 배포하지 않습니다.

배포 후 로그인, 일반 업무 6개/Bonding 업무 7개 한영 생성, 복사, 잘못된 암호 거부를 확인합니다. 개발 전용 예시 버튼은 운영에서 표시되지 않습니다. 실제 회사 네트워크의 접속 허용 여부는 별도 확인이 필요합니다.

공식 안내: https://docs.cloud.google.com/run/docs/deploying-source-code
