# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Identity

- **다온픽 (DaonPick)** — Mobile-First Curation 서비스

## Rules

- **Toss Style UI** — 토스 앱 스타일의 깔끔한 UI/UX를 따른다
- **max-width: 480px** — 모든 페이지는 모바일 퍼스트, 최대 너비 480px 기준으로 설계
- **공정위 문구 필수** — 제휴 링크·광고 관련 페이지에는 공정거래위원회 문구를 반드시 포함

## Tech

- **React 19** — JSX, Functional Components, Hooks
- **Tailwind CSS 4** — 유틸리티 기반 스타일링 (PostCSS + autoprefixer)

## Commands

```bash
npm run dev        # Start Vite dev server (default http://localhost:5173)
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint across all .js/.jsx files
```

No test runner is configured yet.

## Tech Stack

- **React 19** with JSX (no TypeScript) — Vite 7 + @vitejs/plugin-react
- **Routing:** react-router-dom 7
- **Styling:** Tailwind CSS 4 via PostCSS + autoprefixer
- **Utilities:** clsx + tailwind-merge for className composition, lucide-react for icons, react-helmet-async for `<head>` management
- **Linting:** ESLint 9 flat config — `no-unused-vars` ignores names starting with uppercase or underscore

## Architecture

Early-stage scaffold. Entry point: `index.html` → `src/main.jsx` → `src/App.jsx`. ES modules throughout (`"type": "module"`).

## Conventions

- Functional React components with hooks
- CSS files colocated with components (`App.css`), plus global styles in `index.css`
- Git branches: `main` is the primary branch; `master` exists from initial scaffold
