import { useState, useEffect, useMemo, useCallback } from 'react'
import Papa from 'papaparse'
import { Search, Eye, ChevronDown } from 'lucide-react'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Google Sheets CSV URLs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PRODUCTS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSje1PMCjbJe528NHFMP4X5OEauML49AaRVb2sHUhJDfe3JwBub6raAxk4Zg-D-km2Cugw4xTy9E4cA/pub?output=csv'
const SETTINGS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSiix1Lxl3nmpURsLENJdkZexya5dfVBPwElybHj7goPEWmYQYYCm7fftJSt0dVPkhDMgLbpMJ4b_rg/pub?output=csv'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 더미 데이터 (CSV 로드 실패 시 폴백)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DUMMY_PRODUCTS = [
  { id: '1', code: '10024', name: '접이식 논슬립 빨래건조대', category: '주방용품', price: '29900', link: 'https://example.com/aff/10024', image: 'https://placehold.co/300x400/e8e8e8/191919?text=10024', baseViews: '1.2만', ranking: '1' },
  { id: '2', code: '10025', name: '무선 핸디 블렌더 3세대', category: '주방용품', price: '45900', link: 'https://example.com/aff/10025', image: 'https://placehold.co/300x400/e8e8e8/191919?text=10025', baseViews: '8천', ranking: '2' },
  { id: '3', code: '10026', name: '초경량 항공점퍼 바람막이', category: '생활잡화', price: '39800', link: 'https://example.com/aff/10026', image: 'https://placehold.co/300x400/e8e8e8/191919?text=10026', baseViews: '4.2만', ranking: '3' },
  { id: '4', code: '10027', name: '스테인리스 진공 텀블러 750ml', category: '생활잡화', price: '18900', link: 'https://example.com/aff/10027', image: 'https://placehold.co/300x400/e8e8e8/191919?text=10027', baseViews: '1.9만', ranking: '4' },
  { id: '5', code: '10028', name: '프리미엄 두피 스케일러 브러시', category: '뷰티', price: '12900', link: 'https://example.com/aff/10028', image: 'https://placehold.co/300x400/e8e8e8/191919?text=10028', baseViews: '6천', ranking: '5' },
  { id: '6', code: '10029', name: '고밀도 메모리폼 경추 베개', category: '생활잡화', price: '34900', link: 'https://example.com/aff/10029', image: 'https://placehold.co/300x400/e8e8e8/191919?text=10029', baseViews: '3.7만', ranking: '' },
]

const DUMMY_SETTINGS = [
  { type: 'button', label: '주방특가', url: 'https://example.com/kitchen' },
  { type: 'button', label: '생활꿀템', url: 'https://example.com/living' },
  { type: 'button', label: '뷰티SALE', url: 'https://example.com/beauty' },
  { type: 'fallback', label: 'fallback', url: 'https://example.com/event' },
]

const INITIAL_COUNT = 4
const LOAD_MORE_STEP = 6

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CSV 파싱 헬퍼
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function fetchCSV(url) {
  return new Promise((resolve) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: () => resolve(null),
    })
  })
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 로딩 스켈레톤
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SkeletonRanking() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="shrink-0 w-36 animate-pulse">
          <div className="aspect-[3/4] rounded-2xl bg-gray-200" />
          <div className="mt-2 h-3 w-20 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square rounded-2xl bg-gray-200" />
          <div className="mt-2.5 space-y-2">
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-3 w-1/2 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 랭킹 카드 (가로 스크롤용, 세로 3:4)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function RankingCard({ product, rank }) {
  const isTop3 = rank <= 3
  return (
    <button
      onClick={() => { window.location.href = product.link }}
      className="shrink-0 w-36 text-left group"
    >
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-active:scale-[0.96] transition-transform"
        />
        {/* 하단 그라데이션 */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/60 to-transparent" />
        {/* 순위 숫자 */}
        <span
          className={`absolute bottom-1 left-2 text-6xl font-black italic leading-none tracking-tighter ${isTop3 ? 'text-orange-500' : 'text-white/40'}`}
          style={{ WebkitTextStroke: isTop3 ? 'none' : '1px rgba(255,255,255,0.5)' }}
        >
          {rank}
        </span>
      </div>
      <p className="mt-2 text-[13px] font-medium text-gray-900 truncate tracking-tight">
        {product.name}
      </p>
    </button>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 일반 상품 카드
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ProductCard({ product }) {
  return (
    <button
      onClick={() => { window.location.href = product.link }}
      className="text-left w-full group"
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-active:scale-[0.96] transition-transform"
        />
        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 text-[10px] text-white font-medium backdrop-blur">
          {product.code}
        </span>
      </div>

      <div className="mt-2 px-0.5">
        <p className="text-[13px] text-gray-900 font-medium leading-snug truncate tracking-tight">
          {product.name}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-xs text-gray-400">{product.category}</span>
          {product.baseViews && (
            <span className="flex items-center gap-0.5 text-xs text-gray-400">
              <Eye className="w-3 h-3" />
              {product.baseViews}
            </span>
          )}
        </div>
        {product.price && (
          <p className="mt-0.5 text-[13px] font-bold text-gray-900 tracking-tight">
            {Number(product.price).toLocaleString()}원
          </p>
        )}
      </div>
    </button>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메인 페이지
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function Home() {
  const [products, setProducts] = useState(DUMMY_PRODUCTS)
  const [settings, setSettings] = useState(DUMMY_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [visibleCounts, setVisibleCounts] = useState({})
  const [activeTab, setActiveTab] = useState(undefined)

  // ── Google Sheets CSV 로드 ────────────────────────
  useEffect(() => {
    let cancelled = false

    async function load() {
      const [csvProducts, csvSettings] = await Promise.all([
        fetchCSV(PRODUCTS_CSV_URL),
        fetchCSV(SETTINGS_CSV_URL),
      ])
      if (cancelled) return
      if (csvProducts?.length) setProducts(csvProducts)
      if (csvSettings?.length) setSettings(csvSettings)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  // ── 파생 데이터 ────────────────────────────────────
  const navButtons = useMemo(
    () => settings.filter((s) => s.type === 'button'),
    [settings]
  )
  const fallbackUrl = useMemo(
    () => settings.find((s) => s.type === 'fallback')?.url || 'https://example.com/event',
    [settings]
  )

  // ranking 필터 + 오름차순 정렬
  const rankingProducts = useMemo(
    () =>
      products
        .filter((p) => p.ranking && parseInt(p.ranking, 10) >= 1 && parseInt(p.ranking, 10) <= 10)
        .sort((a, b) => parseInt(a.ranking, 10) - parseInt(b.ranking, 10)),
    [products]
  )

  // product.category 기준 고유 카테고리 (등장 순서 유지)
  const categories = useMemo(() => {
    const seen = new Set()
    const list = []
    for (const p of products) {
      if (p.category && !seen.has(p.category)) {
        seen.add(p.category)
        list.push(p.category)
      }
    }
    return list
  }, [products])

  // 첫 카테고리를 기본 active 탭으로 (파생 값)
  const effectiveTab = activeTab !== undefined ? activeTab : categories[0] ?? null

  // ── 더보기 핸들러 ─────────────────────────────────
  const getVisible = useCallback(
    (key) => visibleCounts[key] ?? INITIAL_COUNT,
    [visibleCounts]
  )
  const handleLoadMore = useCallback((key) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [key]: (prev[key] ?? INITIAL_COUNT) + LOAD_MORE_STEP,
    }))
  }, [])

  // ── 코드 검색 ──────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    const found = products.find((p) => p.code === trimmed)

    if (found) {
      window.location.href = found.link
    } else {
      alert('존재하지 않는 코드입니다. 관련 기획전으로 이동합니다.')
      window.location.href = fallbackUrl
    }
  }

  // ── 렌더 ───────────────────────────────────────────
  return (
    <div className="flex flex-col items-center min-h-screen bg-[#F9F9F9] tracking-tight">
      {/* ── 공정위 문구 (sticky) ── */}
      <div className="sticky top-0 z-50 w-full bg-gray-800">
        <p className="max-w-[480px] mx-auto px-4 py-1.5 text-[10px] text-gray-400 text-center leading-relaxed">
          이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의
          수수료를 제공받습니다.
        </p>
      </div>

      <div className="w-full max-w-[480px] px-5 pb-16">
        {/* ── Header ── */}
        <div className="pt-7 pb-1 flex items-baseline justify-between">
          <h1 className="text-2xl font-black tracking-tighter">
            <span className="text-orange-500">DAON</span>
            <span className="text-gray-900"> PICK</span>
          </h1>
        </div>
        <p className="text-[13px] text-gray-400">
          영상 속 그 제품, 번호만 입력하세요
        </p>

        {/* ── Search (떠 있는 느낌) ── */}
        <form onSubmit={handleSearch} className="mt-5">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="상품번호 입력"
              className="w-full h-12 pl-5 pr-14 rounded-2xl bg-white text-[14px] text-gray-900 placeholder-gray-300 outline-none shadow-lg border-0 transition focus:shadow-xl"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center active:scale-90 transition-transform"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* ── Horizontal Nav ── */}
        {navButtons.length > 0 && (
          <div className="mt-5 -mx-5 px-5 flex gap-2 overflow-x-auto scrollbar-hide">
            {navButtons.map((btn) => (
              <button
                key={btn.label}
                onClick={() => { window.location.href = btn.url }}
                className="shrink-0 px-4 py-2 rounded-full bg-gray-100 text-[13px] font-medium text-gray-600 active:scale-95 transition-transform"
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* ── 로딩 ── */}
        {loading && (
          <div className="mt-8 space-y-8">
            <div>
              <div className="h-5 w-44 rounded bg-gray-200 animate-pulse mb-4" />
              <SkeletonRanking />
            </div>
            <div>
              <div className="h-5 w-32 rounded bg-gray-200 animate-pulse mb-4" />
              <SkeletonGrid />
            </div>
          </div>
        )}

        {/* ── 데이터 로드 완료 ── */}
        {!loading && (
          <>
            {/* ─ Section 1: 실시간 급상승 TOP 10 ─ */}
            {rankingProducts.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-bold text-gray-900 px-0.5">
                  🔥 실시간 급상승 TOP 10
                </h2>

                <div className="mt-3 -mx-5 px-5 flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                  {rankingProducts.map((p) => (
                    <RankingCard
                      key={p.code}
                      product={p}
                      rank={parseInt(p.ranking, 10)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ─ Section 2: 카테고리 탭 ─ */}
            {categories.length > 0 && (
              <section className="mt-10">
                <div className="-mx-5 px-5 flex gap-2 overflow-x-auto scrollbar-hide">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveTab(cat)}
                      className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                        effectiveTab === cat
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* ─ Section 3: 상품 그리드 (active 탭) ─ */}
                {effectiveTab && (() => {
                  const filtered = products.filter((p) => p.category === effectiveTab)
                  const visible = getVisible(effectiveTab)

                  return (
                    <div className="mt-5">
                      <div className="grid grid-cols-2 gap-3">
                        {filtered.slice(0, visible).map((p) => (
                          <ProductCard key={p.code} product={p} />
                        ))}
                      </div>

                      {visible < filtered.length && (
                        <button
                          onClick={() => handleLoadMore(effectiveTab)}
                          className="mt-4 w-full py-3 rounded-2xl bg-white text-[14px] font-medium text-gray-500 flex items-center justify-center gap-1 active:scale-[0.98] transition-transform shadow-sm"
                        >
                          더보기
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )
                })()}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
