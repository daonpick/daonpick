import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Papa from 'papaparse'
import { Search, Eye, ChevronDown, ChevronLeft, ChevronRight, ArrowRight, Menu, Heart } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useStore } from '../store/useStore'
import Sidebar from '../components/Sidebar'
import LuckyCard from '../components/LuckyCard'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 0. 가로 스크롤 (화살표 + 드래그 + 휠)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function useHorizontalScroll() {
  const ref = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const drag = useRef({ active: false, startX: 0, sl: 0, moved: false })

  const check = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }, [])

  const scrollDir = useCallback((dir) => {
    const el = ref.current
    if (!el) return
    el.scrollTo({ left: el.scrollLeft + dir * 180, behavior: 'smooth' })
  }, [])

  const isDragged = useCallback(() => drag.current.moved, [])

  // React onMouseDown 핸들러 — JSX에 직접 바인딩
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    const el = ref.current
    if (!el) return
    e.preventDefault()
    drag.current = { active: true, startX: e.clientX, sl: el.scrollLeft, moved: false }

    const onMouseMove = (ev) => {
      if (!drag.current.active) return
      ev.preventDefault()
      const dx = ev.clientX - drag.current.startX
      if (Math.abs(dx) > 3) drag.current.moved = true
      el.scrollLeft = drag.current.sl - dx
    }

    const onMouseUp = () => {
      drag.current.active = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      setTimeout(() => { drag.current.moved = false }, 0)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    check()
    el.addEventListener('scroll', check, { passive: true })

    const onWheel = (e) => {
      if (el.scrollWidth <= el.clientWidth) return
      e.preventDefault()
      el.scrollLeft += (e.deltaY || e.deltaX)
    }
    el.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      el.removeEventListener('scroll', check)
      el.removeEventListener('wheel', onWheel)
    }
  }, [check])

  return { ref, canScrollLeft, canScrollRight, scrollDir, isDragged, onMouseDown }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. 설정 및 헬퍼 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PRODUCTS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSje1PMCjbJe528NHFMP4X5OEauML49AaRVb2sHUhJDfe3JwBub6raAxk4Zg-D-km2Cugw4xTy9E4cA/pub?output=csv'
const SETTINGS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSiix1Lxl3nmpURsLENJdkZexya5dfVBPwElybHj7goPEWmYQYYCm7fftJSt0dVPkhDMgLbpMJ4b_rg/pub?output=csv'

const formatViewCount = (realCount, code) => {
  const views = Number(realCount) || 0;
  const productCode = Number(code) || 0;

  const suffix = (productCode % 90) + 10;
  const fakeNum = views === 0 ? suffix : Number(String(views) + String(suffix));

  if (fakeNum < 1000) return String(fakeNum);
  if (fakeNum < 10000) return (fakeNum / 1000).toFixed(1) + '천';
  if (fakeNum < 1000000) return (fakeNum / 10000).toFixed(1) + '만';
  return Math.floor(fakeNum / 10000).toLocaleString() + '만';
};

const BADGE_TEMPLATES = [
  () => '🔥 실시간 주문 폭주',
  () => `👁️ ${Math.floor(Math.random() * 301) + 200}명 보고 있음`,
  () => '📦 재구매율 1위',
  () => '⚡ 마감 임박',
  () => '⭐ 만족도 99%',
  () => '🏆 MD 강력 추천',
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const getUniqueBadges = () => shuffle(BADGE_TEMPLATES).slice(0, 3).map((fn) => fn())

const fetchCSV = (url) => {
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
// 2. 초기 데이터 (더미 & 설정)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DUMMY_PRODUCTS = [
  { id: '1', code: '10024', name: '무선 야채 다지기', category: '주방용품', price: '23900', link: 'https://example.com', image: 'https://placehold.co/300x400/e8e8e8/191919?text=10024' },
  { id: '2', code: '10025', name: '규조토 발매트', category: '생활잡화', price: '15900', link: 'https://example.com', image: 'https://placehold.co/300x400/e8e8e8/191919?text=10025' },
]

const DUMMY_SETTINGS = [
  { type: 'fallback', label: 'fallback', url: 'https://example.com/event' },
]

const INITIAL_COUNT = 4
const LOAD_MORE_STEP = 6

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. 서브 컴포넌트 (스켈레톤 및 카드)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SkeletonRanking() {
  return (
    <div className="flex gap-4 overflow-hidden">
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
    <div className="grid grid-cols-2 gap-4">
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

function RankingCard({ product, rank, onClickProduct, badge, isDragged }) {
  const isTop3 = rank <= 3
  const { toggleWishlist, isWishlisted } = useStore()
  const wishlisted = isWishlisted(product.code)

  return (
    <div onClick={() => { if (!isDragged || !isDragged()) onClickProduct(product) }}
         className="shrink-0 w-40 text-left cursor-pointer select-none active:scale-[0.97] transition-transform"
         style={{ WebkitTouchCallout: 'none' }}>
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
        <img src={product.image} alt={product.name} draggable={false} className="w-full h-full object-cover pointer-events-none" />
        {badge && (
          <span className="badge-shimmer absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-white/90 backdrop-blur text-[#F37021] font-bold text-[10px]"
                style={{ '--shimmer-delay': `${(rank - 1) * 0.8}s` }}>
            <span className="relative z-10">{badge}</span>
          </span>
        )}
        <div className="absolute top-2 right-2 z-10" onClick={(e) => { e.stopPropagation(); toggleWishlist(product) }}>
          <Heart className={`w-5 h-5 drop-shadow-lg transition-colors ${wishlisted ? 'text-red-500 fill-red-500' : 'text-white/80'}`} />
        </div>
        <span className="absolute bottom-1 left-2 text-6xl font-black italic leading-none tracking-tighter text-[#F37021]"
              style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>
          {rank}
        </span>
      </div>
      <div className="mt-1.5 px-0.5">
        <p className="text-sm font-bold text-gray-900 tracking-tight line-clamp-2 leading-snug">{product.name}</p>
        <span className="flex items-center gap-0.5 text-[11px] text-gray-400 mt-0.5">
          <Eye className="w-3 h-3" /> {formatViewCount(product.views, product.code)}
        </span>
      </div>
    </div>
  )
}

function ProductCard({ product, onClickProduct }) {
  const { toggleWishlist, isWishlisted } = useStore()
  const wishlisted = isWishlisted(product.code)

  return (
    <div onClick={() => onClickProduct(product)}
         className="w-full select-none cursor-pointer active:scale-[0.97] transition-transform"
         style={{ WebkitTouchCallout: 'none' }}>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img src={product.image} alt={product.name} draggable={false}
               className="w-full h-full object-cover pointer-events-none" />
          {product.code && (
            <div className="absolute top-0 left-0 bg-[#191F28]/80 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1.5 rounded-br-xl z-10">
              {product.code}
            </div>
          )}
          <div className="absolute top-2 right-2 z-10" onClick={(e) => { e.stopPropagation(); toggleWishlist(product) }}>
            <Heart className={`w-5 h-5 drop-shadow-lg transition-colors ${wishlisted ? 'text-red-500 fill-red-500' : 'text-white/70'}`} />
          </div>
        </div>
        <div className="p-3">
          <p className="text-[14px] font-bold text-[#222] leading-snug truncate tracking-tight">{product.name}</p>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Eye className="w-3 h-3" /> {formatViewCount(product.views, product.code)}
            </span>
            <span className="flex items-center gap-0.5 text-xs font-semibold text-[#F37021]">
              View <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. 메인 페이지 컴포넌트
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function Home() {
  const [products, setProducts] = useState([])
  const [settings, setSettings] = useState(DUMMY_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [visibleCounts, setVisibleCounts] = useState({})
  const [activeTab, setActiveTab] = useState(undefined)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [typedText, setTypedText] = useState('')

  const { addRecentView } = useStore()
  const { ref: rankingRef, canScrollLeft, canScrollRight, scrollDir, isDragged, onMouseDown: onRankingMouseDown } = useHorizontalScroll()
  const { ref: categoryRef, onMouseDown: onCategoryMouseDown } = useHorizontalScroll()
  const { ref: navRef, onMouseDown: onNavMouseDown } = useHorizontalScroll()

  // ── 타이핑 플레이스홀더 ─────────────────────────────
  const PLACEHOLDER_PHRASES = useMemo(() => [
    '찾으시는 상품 번호가 있나요?',
    '상품번호를 입력해주세요',
    '영상 속 그 제품, 번호로 검색!',
    '번호만 입력하면 바로 확인!',
  ], [])

  useEffect(() => {
    if (inputFocused || query) return
    let phraseIdx = 0
    let charIdx = 0
    let deleting = false
    let timer

    const tick = () => {
      const phrase = PLACEHOLDER_PHRASES[phraseIdx]
      if (!deleting) {
        charIdx++
        setTypedText(phrase.slice(0, charIdx))
        if (charIdx === phrase.length) {
          timer = setTimeout(() => { deleting = true; tick() }, 1500)
          return
        }
        timer = setTimeout(tick, 80)
      } else {
        charIdx--
        setTypedText(phrase.slice(0, charIdx))
        if (charIdx === 0) {
          deleting = false
          phraseIdx = (phraseIdx + 1) % PLACEHOLDER_PHRASES.length
          timer = setTimeout(tick, 400)
          return
        }
        timer = setTimeout(tick, 40)
      }
    }
    tick()
    return () => clearTimeout(timer)
  }, [inputFocused, query, PLACEHOLDER_PHRASES])

  // ── 데이터 로드 ────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      const [csvProducts, csvSettings, viewsResult] = await Promise.all([
        fetchCSV(PRODUCTS_CSV_URL),
        fetchCSV(SETTINGS_CSV_URL),
        supabase ? supabase.from('views').select('*') : Promise.resolve({ data: null }),
      ])
      if (cancelled) return

      const sheetProducts = csvProducts?.length ? csvProducts : DUMMY_PRODUCTS
      if (csvSettings?.length) setSettings(csvSettings)

      const viewsMap = new Map()
      if (viewsResult.data) {
        for (const row of viewsResult.data) {
          viewsMap.set(String(row.code), row.count ?? 0)
        }
      }

      const merged = sheetProducts.map((p) => ({
        ...p,
        views: viewsMap.get(String(p.code)) ?? 0,
      }))

      setProducts(shuffle(merged))
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  // ── 파생 데이터 ────────────────────────────────────
  const navButtons = useMemo(() => settings.filter((s) => s.type === 'button'), [settings])
  const fallbackUrl = useMemo(() => settings.find((s) => s.type === 'fallback')?.url || '#', [settings])
  const topProducts = useMemo(() => [...products].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 10), [products])

  const categories = useMemo(() => {
    const seen = new Set(); const list = []
    for (const p of products) {
      if (p.category && !seen.has(p.category)) {
        seen.add(p.category); list.push(p.category)
      }
    }
    return list
  }, [products])

  const effectiveTab = activeTab !== undefined ? activeTab : categories[0] ?? null
  const getVisible = useCallback((key) => visibleCounts[key] ?? INITIAL_COUNT, [visibleCounts])
  const handleLoadMore = useCallback((key) => {
    setVisibleCounts((prev) => ({ ...prev, [key]: (prev[key] ?? INITIAL_COUNT) + LOAD_MORE_STEP }))
  }, [])

  // ── TOP3 뱃지 (새로고침 시 랜덤) ──────────────────
  const badges = useMemo(() => getUniqueBadges(), [])

  // ── 클릭 핸들러 (GA4 + Supabase Await + 최근 본 상품 + 이동) ──
  const handleClickProduct = useCallback(async (product) => {
    addRecentView(product)

    if (window.gtag) {
      window.gtag('event', 'click_product', {
        'event_category': 'Outbound Link',
        'event_label': product.name,
        'product_code': String(product.code),
        'value': 1
      });
    }

    if (supabase) {
      const code = String(product.code)
      const { data } = await supabase
        .from('views')
        .select('count')
        .eq('code', code)
        .single()

      if (data) {
        await supabase
          .from('views')
          .update({ count: (data.count ?? 0) + 1 })
          .eq('code', code)
      } else {
        await supabase
          .from('views')
          .insert({ code, count: 1 })
      }
    }

    window.location.href = product.link;
  }, [addRecentView]);

  const handleSearch = (e) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    const found = products.find((p) => p.code === trimmed)
    if (found) handleClickProduct(found)
    else { alert('존재하지 않는 코드입니다.'); window.location.href = fallbackUrl }
  }

  // ── 렌더링 ─────────────────────────────────────────
  return (
    <div className="flex flex-col items-center min-h-screen bg-[#FAFAFA] tracking-tight">
      <div className="sticky top-0 z-50 w-full bg-gray-800">
        <p className="max-w-[480px] mx-auto px-4 py-1.5 text-[10px] text-gray-400 text-center leading-relaxed">
          이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
        </p>
      </div>

      <div className="w-full max-w-[480px] px-5 pb-16">
        {/* Header */}
        <div className="pt-7 pb-1 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tighter">
            <span className="text-[#F37021]">DAON</span><span className="text-gray-900"> PICK</span>
          </h1>
          <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 active:bg-gray-100 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[13px] text-gray-400">영상 속 그 제품, 번호만 입력하세요</p>

        {/* Search */}
        <form onSubmit={handleSearch} className="mt-6 relative">
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                 onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)}
                 className="w-full h-12 pl-5 pr-14 rounded-2xl bg-white text-[14px] text-gray-900 outline-none shadow-lg border-0 transition focus:shadow-xl" />
          {!query && !inputFocused && (
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[14px] text-gray-300 pointer-events-none">
              {typedText}<span className="inline-block w-[2px] h-[16px] bg-gray-300 align-middle ml-0.5 animate-pulse" />
            </span>
          )}
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-gradient-to-r from-[#F37021] to-[#FF8F50] text-white flex items-center justify-center active:scale-90 transition-transform">
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Nav Buttons */}
        {navButtons.length > 0 && (
          <div ref={navRef} onMouseDown={onNavMouseDown} className="mt-5 -mx-5 px-5 flex gap-2 overflow-x-auto no-scrollbar select-none cursor-grab active:cursor-grabbing">
            {navButtons.map((btn, i) => (
              <button key={btn.label} onClick={() => { window.location.href = btn.url }}
                      className="shrink-0 px-4 py-2 rounded-full bg-gray-100 text-[13px] font-medium text-gray-600 active:scale-95 transition-transform opacity-0"
                      style={{ animation: 'slide-in-left 0.5s ease-out forwards', animationDelay: `${i * 200}ms` }}>
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="mt-10 space-y-10">
            <div><div className="h-5 w-44 rounded bg-gray-200 animate-pulse mb-4" /><SkeletonRanking /></div>
            <div><div className="h-5 w-32 rounded bg-gray-200 animate-pulse mb-4" /><SkeletonGrid /></div>
          </div>
        )}

        {!loading && (
          <>
            {/* TOP 10 Ranking */}
            {topProducts.length > 0 && (
              <section className="mt-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 px-0.5">🔥 실시간 급상승 TOP 10</h2>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => scrollDir(-1)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${canScrollLeft ? 'bg-gray-200 text-gray-600 active:bg-gray-300' : 'bg-gray-100 text-gray-300'}`}>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => scrollDir(1)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${canScrollRight ? 'bg-gray-200 text-gray-600 active:bg-gray-300' : 'bg-gray-100 text-gray-300'}`}>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div ref={rankingRef} onMouseDown={onRankingMouseDown} className="-mx-5 px-5 flex gap-3 overflow-x-auto no-scrollbar pb-1 select-none cursor-grab active:cursor-grabbing">
                  {topProducts.map((p, i) => (
                    <RankingCard key={p.code} product={p} rank={i + 1} onClickProduct={handleClickProduct} badge={i < 3 ? badges[i] : null} isDragged={isDragged} />
                  ))}
                </div>
              </section>
            )}

            {/* Lucky Pick */}
            {products.length > 0 && (
              <LuckyCard products={products} onClickProduct={handleClickProduct} />
            )}

            {/* Category Grid */}
            {categories.length > 0 && (
              <section className="mt-12">
                <div ref={categoryRef} onMouseDown={onCategoryMouseDown} className="-mx-5 px-5 flex gap-2 overflow-x-auto no-scrollbar select-none cursor-grab active:cursor-grabbing">
                  {categories.map((cat) => (
                    <button key={cat} onClick={() => setActiveTab(cat)}
                            className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${effectiveTab === cat ? 'bg-gradient-to-r from-[#F37021] to-[#FF8F50] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
                {effectiveTab && (() => {
                  const filtered = products.filter((p) => p.category === effectiveTab)
                  const visible = getVisible(effectiveTab)
                  return (
                    <div className="mt-6">
                      <div className="grid grid-cols-2 gap-4">
                        {filtered.slice(0, visible).map((p) => (
                          <ProductCard key={p.code} product={p} onClickProduct={handleClickProduct} />
                        ))}
                      </div>
                      {visible < filtered.length && (
                        <button onClick={() => handleLoadMore(effectiveTab)}
                                className="mt-6 w-full py-3 rounded-2xl bg-white text-[14px] font-semibold text-[#F37021] flex items-center justify-center gap-1 active:scale-[0.98] transition-transform shadow-sm">
                          더보기 <ChevronDown className="w-4 h-4" />
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

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        categories={categories}
        onSelectCategory={(cat) => setActiveTab(cat)}
      />
    </div>
  )
}
