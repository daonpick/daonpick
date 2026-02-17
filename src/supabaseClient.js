import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 값이 잘 들어오는지 확인하기 위한 로그 (배포 후 개발자 도구 Console에서 확인 가능)
console.log("Supabase URL 체크:", supabaseUrl ? "있음" : "없음");

export const supabase = createClient(supabaseUrl, supabaseAnonKey)