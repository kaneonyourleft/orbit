---
description: Orbit 프로젝트의 개발 및 배포 워크플로우 (rules)
---
// turbo-all

# Orbit 개발 룰

## 배포 프로세스 (항상 따를 것)

코드 수정 후 반드시 아래 순서를 실행:

1. **상태 확인 및 코드 리뷰** — 수정한 파일에 import 에러, 오타, 누락 없는지 확인
2. **빌드 테스트** (apps/web)

   ```bash
   cd apps/web && npx next build
   ```

3. **빌드 성공 시 자동 배포**:

   ```bash
   cd C:\Kane-github\orbit
   git add -A
   git commit -m "적절한 커밋 메시지"
   git push origin main
   ```

4. **빌드 실패 시** — 에러 분석 후 수정하고 다시 빌드. 성공할 때까지 반복.

5. **결과 보고**

## 코드 규칙

- `@blocksuite/presets`는 절대 정적 import 금지. 반드시 `await import()` 사용
- SSR 관련 컴포넌트는 `'use client'` + `dynamic import (ssr: false)` 사용
- `next.config.ts`에 `typescript.ignoreBuildErrors: true` 항상 유지
- postinstall에서 BlockSuite 아이콘 오타 자동 패치(`scripts/patch-blocksuite.js`) 유지

## 프로젝트 경로

- 루트: `C:\Kane-github\orbit`
- 웹앱: `C:\Kane-github\orbit\apps\web`
- UI 패키지: `C:\Kane-github\orbit\packages\ui`
