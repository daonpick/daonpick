import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xcanzfhejvhxbjmhnerv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjYW56ZmhlanZoeGJqbWhuZXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjk5MzEsImV4cCI6MjA4NjgwNTkzMX0.XIAjp76SqAbkVPZo8oY4TOe58n5bkdHNSashCOyeVEU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)