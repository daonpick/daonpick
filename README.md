# 다온픽 (DAON PICK)

모바일 퍼스트 큐레이션 플랫폼. 영상에서 본 상품을 코드 하나로 바로 찾아주는 서비스입니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | React 19 (Vite 7) |
| Styling | Tailwind CSS 4, PostCSS, Autoprefixer |
| Data | Google Sheets CSV + papaparse |
| Icons | lucide-react |
| Routing | react-router-dom 7 |
| Lint | ESLint 9 (flat config) |
| Deploy | Vercel |

## 구글 시트 연동 방식

`papaparse`를 사용하여 Google Sheets를 CSV로 export한 URL에서 데이터를 가져옵니다.

**시트 구조:**

| 시트 | gid | 용도 | 주요 컬럼 |
|------|-----|------|-----------|
| products | 0 | 상품 리스트 | id, code, name, category, price, link, image, baseViews, tag |
| settings | 1 | 버튼·설정 | type, label, url |

**연동 방법:**

1. Google Sheets에서 **파일 > 공유 > 웹에 게시** (CSV 형식)
2. `src/pages/Home.jsx` 상단의 `PRODUCTS_CSV_URL`, `SETTINGS_CSV_URL`에 실제 URL 입력
3. CSV 로드 실패 시 코드 내부의 더미 데이터로 자동 폴백

```
https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid=0
https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid=1
```

## 개발

```bash
npm install          # 의존성 설치
npm run dev          # 개발 서버 (http://localhost:5173)
npm run build        # 프로덕션 빌드
npm run lint         # ESLint 검사
```
