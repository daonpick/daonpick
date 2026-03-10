/**
 * [REF: VOL_03.3] Telegram Mini App — [📝 수정] 버튼 진입 화면.
 * 저장 시 initData + post_id + content_html 를 /api/update-post 로 POST (HMAC-SHA256 서명 검증용 페이로드).
 */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null

export default function TelegramEdit() {
  const [searchParams] = useSearchParams()
  const postId = searchParams.get('id')
  const [contentHtml, setContentHtml] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (tg) {
      tg.ready()
      tg.expand()
    }
  }, [])

  useEffect(() => {
    if (!postId) {
      setError('post_id가 없습니다.')
      setLoading(false)
      return
    }
    if (!supabase) {
      setError('Supabase 설정이 없습니다.')
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { data, error: e } = await supabase
          .from('post_queue')
          .select('content_html')
          .eq('id', postId)
          .single()
        if (cancelled) return
        if (e) {
          setError(e.message || '조회 실패')
          return
        }
        setContentHtml(data?.content_html ?? '')
      } catch (err) {
        if (!cancelled) setError(err?.message ?? '로드 실패')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [postId])

  const handleSave = async () => {
    const isDev = import.meta.env.DEV
    if (!isDev) {
      const initData = tg?.initData
      if (!initData) {
        alert('Telegram 환경에서만 저장할 수 있습니다.')
        return
      }
    }
    if (!postId) {
      alert('post_id가 없습니다.')
      return
    }
    setSaving(true)
    try {
      if (isDev) {
        const { error: e } = await supabase
          .from('post_queue')
          .update({ content_html: contentHtml, status: 'Ready' })
          .eq('id', postId)
        if (e) {
          alert(e.message || '저장 실패')
          return
        }
        tg?.close?.()
        return
      }
      const res = await fetch('/api/update-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          content_html: contentHtml,
          initData: tg?.initData,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.ok) {
        tg?.close()
        return
      }
      alert(json?.error || json?.details || `저장 실패 (${res.status})`)
    } catch (err) {
      alert(err?.message ?? '네트워크 오류')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center p-4">
        <p className="text-neutral-600 dark:text-neutral-400">불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center p-4">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex flex-col p-4">
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
        본문 수정
      </label>
      <textarea
        className="w-full flex-1 min-h-[200px] rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 p-3 text-sm resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={contentHtml}
        onChange={(e) => setContentHtml(e.target.value)}
        placeholder="content_html"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-4 w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none text-white font-medium"
      >
        {saving ? '저장 중...' : '저장'}
      </button>
    </div>
  )
}
