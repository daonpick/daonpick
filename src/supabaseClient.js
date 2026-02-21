import { createClient } from '@supabase/supabase-js'

// Vercel에서 넘어온 값에 띄어쓰기나 줄바꿈이 있으면 강제로 잘라냄(trim)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || ''

// 찌꺼기가 묻은 따옴표까지 모두 제거
const cleanUrl = supabaseUrl.replace(/['"]/g, '')
const cleanKey = supabaseAnonKey.replace(/['"]/g, '')

export const supabase = createClient(cleanUrl, cleanKey)