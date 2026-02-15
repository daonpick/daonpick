import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'

export default function Home() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    try {
      const res = await fetch('/data.json')
      const data = await res.json()
      const found = data.find(
        (item) => item.code.toLowerCase() === trimmed.toLowerCase()
      )

      if (!found) {
        alert('유효하지 않은 코드입니다')
        return
      }

      navigate(`/bridge/${encodeURIComponent(found.code)}`)
    } catch {
      alert('유효하지 않은 코드입니다')
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#F9FAFB]">
      <div className="w-full max-w-[480px] px-5 pt-20 pb-12">
        {/* Header */}
        <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">
          다온픽
        </h1>
        <p className="mt-3 text-[15px] text-gray-500 leading-relaxed">
          상품 코드를 입력하면 추천 상품을 확인할 수 있어요
        </p>

        {/* Search Input */}
        <form onSubmit={handleSubmit} className="mt-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="상품 코드 입력 (예: DP001)"
              className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white text-[15px] text-gray-900 placeholder-gray-400 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 transition shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="mt-5 w-full h-14 rounded-2xl bg-blue-500 text-white text-[15px] font-semibold active:scale-[0.97] transition-transform shadow-sm"
          >
            상품 찾기
          </button>
        </form>
      </div>
    </div>
  )
}
