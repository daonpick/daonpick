import { createClient } from '@supabase/supabase-js'

// Vercel 환경 변수 가져오기 (없으면 빈 문자열)
const rawUrl = import.meta.env.VITE_SUPABASE_URL || ''
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// [초강력 세탁] 공백(\s), 엔터, 탭, 따옴표(" ')를 모조리 삭제
const cleanUrl = rawUrl.replace(/[\s"']/g, '')
const cleanKey = rawKey.replace(/[\s"']/g, '')

// 값이 제대로 없으면 supabase 클라이언트 자체를 생성하지 않음 (에러 캐치용)
export const supabase = (cleanUrl && cleanKey) 
  ? createClient(cleanUrl, cleanKey) 
  : null;