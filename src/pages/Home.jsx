// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [모듈 0] Imports 및 전역 설정
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import { Helmet } from 'react-helmet-async'
import Papa from 'papaparse'
import { Search, Eye, ChevronLeft, ChevronRight, ArrowRight, Menu, Heart } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useStore } from '../store/useStore'
import Sidebar from '../components/Sidebar'
import LuckyCard from '../components/LuckyCard'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [모듈 1] 커스텀 훅: 가로 스크롤
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
// [모듈 2] 설정 및 헬퍼 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PRODUCTS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSje1PMCjbJe528NHFMP4X5OEauML49AaRVb2sHUhJDfe3JwBub6raAxk4Zg-D-km2Cugw4xTy9E4cA/pub?output=csv'
const SETTINGS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSiix1Lxl3nmpURsLENJdkZexya5dfVBPwElybHj7goPEWmYQYYCm7fftJSt0dVPkhDMgLbpMJ4b_rg/pub?output=csv'

// ⭐ 쿠팡 골드박스 링크 (오류 번호 입력 시 이동)
const GOLDBOX_URL = 'https://link.coupang.com/a/dQHV5K';

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
  () => '🔥 주간 급상승',
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
// [모듈 3] 초기 더미 데이터
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DUMMY_PRODUCTS = [
  { id: '1', code: '10024', name: '무선 야채 다지기', category: '주방용품', link: 'https://example.com', image: 'https://placehold.co/300x400/e8e8e8/191919?text=10024' },
  { id: '2', code: '10025', name: '규조토 발매트', category: '생활잡화', link: 'https://example.com', image: 'https://placehold.co/300x400/e8e8e8/191919?text=10025' },
]

const DUMMY_SETTINGS = [
  { type: 'fallback', label: 'fallback', url: 'https://example.com/event' },
]

const ITEMS_PER_PAGE = 10

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [모듈 4] UI 서브 컴포넌트
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
  const { toggleWishlist, isWishlisted } = useStore()
  const wishlisted = isWishlisted(product.code)

  return (
    <div onClick={() => { if (!isDragged || !isDragged()) onClickProduct(product) }}
         className="shrink-0 w-40 text-left cursor-pointer select-none active:scale-[0.97] transition-transform"
         style={{ WebkitTouchCallout: 'none' }}>
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
        <img src={product.image} alt={product.name} draggable={false} loading="lazy" decoding="async"
             onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/f3f4f6/9ca3af?text=No+Image' }}
             className="w-full h-full object-cover pointer-events-none" />
        {badge && (
          <span className="badge-shimmer absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-white/90 backdrop-blur text-[#F37021] font-bold text-[10px]"
                style={{ '--shimmer-delay': `${(rank - 1) * 0.8}s` }}>
            <span className="relative z-10">{badge}</span>
          </span>
        )}
        <button aria-label={wishlisted ? '찜 해제' : '찜하기'} className="absolute top-2 right-2 z-10" onClick={(e) => { e.stopPropagation(); toggleWishlist(product) }}>
          <Heart className={`w-5 h-5 drop-shadow-lg transition-colors ${wishlisted ? 'text-red-500 fill-red-500' : 'text-white/80'}`} />
        </button>
        <span className="absolute bottom-1 left-2 text-6xl font-black italic leading-none tracking-tighter"
              style={{
                color: '#F37021',
                WebkitTextStroke: '2px rgba(255,255,255,0.85)',
                paintOrder: 'stroke fill',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              }}>
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
          <img src={product.image} alt={product.name} draggable={false} loading="lazy" decoding="async"
               onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/f3f4f6/9ca3af?text=No+Image' }}
               className="w-full h-full object-cover pointer-events-none" />
          {product.code && (
            <div className="absolute top-0 left-0 bg-[#191F28]/80 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1.5 rounded-br-xl z-10">
              {product.code}
            </div>
          )}
          <button aria-label={wishlisted ? '찜 해제' : '찜하기'} className="absolute top-2 right-2 z-10" onClick={(e) => { e.stopPropagation(); toggleWishlist(product) }}>
            <Heart className={`w-5 h-5 drop-shadow-lg transition-colors ${wishlisted ? 'text-red-500 fill-red-500' : 'text-white/70'}`} />
          </button>
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

const InfiniteProductGrid = memo(function InfiniteProductGrid({ filteredProducts, visibleCount, hasMore, onLoadMore, onClickProduct }) {
  const loadMoreRef = useRef(null)

  useEffect(() => {
    const el = loadMoreRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore()
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, onLoadMore])

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-4">
        {filteredProducts.slice(0, visibleCount).map((p, i) => {
          const isNewBatch = i >= visibleCount - ITEMS_PER_PAGE
          return (
            <div key={p.code}
                 className={isNewBatch ? 'opacity-0' : ''}
                 style={isNewBatch ? { animation: 'slide-up 0.7s ease-out forwards', animationDelay: `${(i % ITEMS_PER_PAGE) * 200}ms` } : undefined}>
              <ProductCard product={p} onClickProduct={onClickProduct} />
            </div>
          )
        })}
      </div>
      {hasMore && (
        <div ref={loadMoreRef} className="mt-6">
          <SkeletonGrid />
        </div>
      )}
    </div>
  )
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [모듈 5] 메인 페이지 컴포넌트 (Home)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function Home() {
  const [products, setProducts] = useState([])
  const [settings, setSettings] = useState(DUMMY_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
  const [activeTab, setActiveTab] = useState(undefined)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [typedText, setTypedText] = useState('')
  const [categoryVisible, setCategoryVisible] = useState(false)
  const [navVisible, setNavVisible] = useState(false)
  
  // ⭐ 황금 티켓 팝업 상태 추가
  const [showGoldenTicket, setShowGoldenTicket] = useState(false)

  const { addRecentView } = useStore()
  const { ref: rankingRef, canScrollLeft, canScrollRight, scrollDir, isDragged, onMouseDown: onRankingMouseDown } = useHorizontalScroll()
  const { ref: categoryRef, onMouseDown: onCategoryMouseDown } = useHorizontalScroll()
  const { ref: navRef, onMouseDown: onNavMouseDown } = useHorizontalScroll()
  const categorySectionRef = useRef(null)
  const categoryTabRef = useRef(null)
  const navSectionRef = useRef(null)

  const PLACEHOLDER_PHRASES = useMemo(() => [
    '찾으시는 상품의 시크릿 번호가 있나요?',
    '내가 찾던 그 제품, 번호로 검색!',
    '시크릿 번호를 입력해주세요',
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

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [csvProducts, csvSettings] = await Promise.all([
        fetchCSV(PRODUCTS_CSV_URL),
        fetchCSV(SETTINGS_CSV_URL),
      ])
      if (cancelled) return

      const sheetProducts = csvProducts?.length ? csvProducts : DUMMY_PRODUCTS
      if (csvSettings?.length) setSettings(csvSettings)

      let viewsData = [];
      if (supabase) {
        const { data, error } = await supabase.rpc('get_weekly_views');
        if (!error && data) {
          viewsData = data;
        } else {
          const fallback = await supabase.from('views').select('*');
          if (fallback.data) viewsData = fallback.data;
        }
      }

      const viewsMap = new Map()
      for (const row of viewsData) {
        viewsMap.set(String(row.code), row.total_views ?? row.count ?? 0)
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

  const navButtons = useMemo(() => settings.filter((s) => s.type === 'button'), [settings])
  const topProducts = useMemo(() => [...products].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 10), [products])

  const CATEGORY_ORDER = [
    { key: '주방용품', label: '🍽️주방용품' },
    { key: '생활용품', label: '🧺생활용품' },
    { key: '가전디지털', label: '🎧가전디지털' },
    { key: '인테리어', label: '🕯️인테리어' },
    { key: '반려용품', label: '🐾반려용품' },
    { key: '뷰티', label: '🧴뷰티' },
    { key: '식품', label: '🍷식품' },
    { key: '완구/취미', label: '🛹완구/취미' },
    { key: '자동차용품', label: '🏎️자동차용품' },
  ]

  const stripEmoji = (str) => str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F]/gu, '').trim()

  const categories = useMemo(() => {
    const existingKeys = new Set(products.map((p) => stripEmoji(p.category || '')))
    return CATEGORY_ORDER.filter((c) => existingKeys.has(c.key))
  }, [products])

  const allCategories = useMemo(() => [{ key: '전체', label: '전체' }, ...categories], [categories])
  const effectiveTab = activeTab !== undefined ? activeTab : '전체'

  const filteredProducts = useMemo(() => {
    if (effectiveTab === '전체') return products
    return products.filter((p) => stripEmoji(p.category || '') === effectiveTab)
  }, [products, effectiveTab])

  const hasMore = visibleCount < filteredProducts.length

  const onLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE)
  }, [])

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE)
  }, [effectiveTab])

  useEffect(() => {
    const navEl = navSectionRef.current
    if (!navEl) return
    const observer = new IntersectionObserver(([entry]) => setNavVisible(entry.isIntersecting), { threshold: 0.2 })
    observer.observe(navEl)
    return () => observer.disconnect()
  }, [loading])

  useEffect(() => {
    const el = categoryTabRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setCategoryVisible(entry.isIntersecting), { threshold: 0.2 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [loading])

  const badges = useMemo(() => getUniqueBadges(), [])

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⭐ 클릭 & 검색 핸들러
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleClickProduct = useCallback(async (product) => {
    addRecentView(product);

    if (window.gtag) {
      window.gtag('event', 'click_product', {
        'event_category': 'Outbound Link',
        'event_label': product.name,
        'product_code': String(product.code),
        'value': 1
      });
    }

    let targetUrl = product.link || product.shortLink || product.longLink;
    if (!targetUrl) return; 
    if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

    if (supabase) {
      try {
        await supabase.rpc('increment_daily_view', { p_product_code: String(product.code) });
      } catch (err) {
        console.warn("View API Error:", err);
      }
    }

    window.location.href = targetUrl;
  }, [addRecentView]);

  // ⭐ 검색 시 번호가 없으면 황금 티켓 팝업 실행
  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    
    const found = products.find((p) => String(p.code).trim() === trimmed);
    if (found) {
      await handleClickProduct(found);
    } else {
      // 에러 토스트 대신 기분 좋은 황금 팝업 띄우기
      setShowGoldenTicket(true);
      
      // 2초 동안 유저가 글을 읽고 즐거워할 시간을 준 뒤 골드박스로 이동!
      setTimeout(() => {
        window.location.href = GOLDBOX_URL;
      }, 2000);
    }
  }, [query, products, handleClickProduct]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // [모듈 6] 렌더링 영역
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const seoTitle = effectiveTab === '전체'
    ? '다온픽 | 영상 속 그 제품, 번호로 찾으세요'
    : `다온픽 | ${effectiveTab} 상품 모아보기`
  const seoDesc = effectiveTab === '전체'
    ? '유튜브, 쇼츠 꿀템 정보를 번호 하나로 쉽고 빠르게 확인하세요.'
    : `${effectiveTab} 카테고리의 인기 상품을 다온픽에서 확인하세요.`

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#FAFAFA] tracking-tight relative">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
      </Helmet>
      
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
          <button aria-label="메뉴 열기" onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 active:bg-gray-100 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[13px] text-gray-400">영상 속 그 제품, 번호만 입력하세요</p>

        {/* Search */}
        <form onSubmit={handleSearch} className="mt-6 relative">
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                 onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)}
                 className="w-full h-12 pl-5 pr-14 rounded-2xl bg-white text-[16px] text-gray-900 outline-none shadow-lg border-0 transition focus:shadow-xl" />
          {!query && !inputFocused && (
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[16px] text-gray-300 pointer-events-none">
              {typedText}<span className="inline-block w-[2px] h-[16px] bg-gray-300 align-middle ml-0.5 animate-pulse" />
            </span>
          )}
          <button type="submit" aria-label="검색" className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-gradient-to-r from-[#F37021] to-[#FF8F50] text-white flex items-center justify-center active:scale-90 transition-transform">
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Nav Buttons */}
        {navButtons.length > 0 && (
          <div ref={(el) => { navRef.current = el; navSectionRef.current = el }} onMouseDown={onNavMouseDown} className="mt-5 -mx-5 px-5 flex gap-2 overflow-x-auto no-scrollbar select-none cursor-grab active:cursor-grabbing">
            {navButtons.map((btn, i) => (
              <button key={btn.label} onClick={() => { window.location.href = btn.url }}
                      className={`shrink-0 px-4 py-2 rounded-full bg-gray-100 text-[13px] font-medium text-gray-600 active:scale-95 transition-transform ${navVisible ? '' : 'opacity-0'}`}
                      style={navVisible ? { animation: 'slide-in-left 0.5s ease-out forwards', animationDelay: `${i * 200}ms`, opacity: 0 } : undefined}>
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
                  <h2 className="text-lg font-bold text-gray-900 px-0.5">🔥 주간 급상승 TOP 10</h2>
                  <div className="flex gap-1">
                    <button type="button" aria-label="이전 상품" onClick={() => scrollDir(-1)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${canScrollLeft ? 'bg-gray-200 text-gray-600 active:bg-gray-300' : 'bg-gray-100 text-gray-300'}`}>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button type="button" aria-label="다음 상품" onClick={() => scrollDir(1)}
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
            {allCategories.length > 1 && (
              <section id="category-section" className="mt-12" ref={categorySectionRef}>
                <div ref={(el) => { categoryRef.current = el; categoryTabRef.current = el }} onMouseDown={onCategoryMouseDown} className="-mx-5 px-5 flex gap-2 overflow-x-auto no-scrollbar select-none cursor-grab active:cursor-grabbing">
                  {allCategories.map((cat, i) => (
                    <button key={cat.key} onClick={() => setActiveTab(cat.key)}
                            data-category-tab
                            className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-700 ease-out ${effectiveTab === cat.key ? 'bg-gradient-to-r from-[#F37021] to-[#FF8F50] text-white active-tab' : 'bg-gray-100 text-gray-500'} ${categoryVisible ? '' : 'opacity-0 translate-y-4'}`}
                            style={categoryVisible ? { animation: 'slide-up 0.7s ease-out forwards', animationDelay: `${i * 150}ms`, opacity: 0 } : undefined}>
                      {cat.label}
                    </button>
                  ))}
                </div>
                {effectiveTab && filteredProducts.length > 0 && (
                  <InfiniteProductGrid
                    filteredProducts={filteredProducts}
                    visibleCount={visibleCount}
                    hasMore={hasMore}
                    onLoadMore={onLoadMore}
                    onClickProduct={handleClickProduct}
                  />
                )}
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

      {/* ⭐ 숨겨진 황금 티켓 팝업 (오류 번호 입력 시 등장) */}
      <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${showGoldenTicket ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`bg-gradient-to-br from-[#FFD700] to-[#F37021] p-[3px] rounded-2xl shadow-2xl max-w-[320px] w-[85%] transform transition-all duration-500 ${showGoldenTicket ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'}`}>
          <div className="bg-white p-6 rounded-[14px] text-center flex flex-col items-center">
            <div className="text-5xl mb-3 animate-bounce">🎉</div>
            <h3 className="text-lg font-black text-[#F37021] mb-2 tracking-tight">앗! 숨겨진 황금 코드 발견!</h3>
            <p className="text-[14px] font-medium text-gray-700 leading-relaxed mb-5">
              다온픽이 몰래 준비한<br/>
              <strong className="text-gray-900">반짝특가 비밀통로</strong>가 열렸습니다!
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
              <div className="w-4 h-4 border-2 border-gray-200 border-t-[#F37021] rounded-full animate-spin"></div>
              황금박스로 이동 중...
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}