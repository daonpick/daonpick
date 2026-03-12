import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Search, ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useStore } from '../store/useStore'

import useHorizontalScroll from '../hooks/useHorizontalScroll'
import { shuffle, getUniqueBadges } from '../utils/formatters'
import { CATEGORY_BUTTONS, GOLDBOX_URL, LOADING_PHRASES, ITEMS_PER_PAGE, getOosThemeRoute } from '../utils/constants'

import Sidebar from '../components/Sidebar'
import LuckyCard from '../components/LuckyCard'
import RankingCard from '../components/Product/RankingCard'
import SkeletonRanking from '../components/Product/SkeletonRanking'
import SkeletonGrid from '../components/Product/SkeletonGrid'
import InfiniteProductGrid from '../components/Product/InfiniteProductGrid'
import OosFallbackModal from '../components/modals/OosFallbackModal'
import GoldenTicketModal from '../components/modals/GoldenTicketModal'
import VvipLoungeModal from '../components/modals/VvipLoungeModal'

const DUMMY_PRODUCTS = [
  { product_code: '0', display_code: '10024', ai_title: '무선 야채 다지기', category: '주방용품', short_link: 'https://example.com', thumbnail_url: 'https://placehold.co/300x400/e8e8e8/191919?text=10024' },
  { product_code: '1', display_code: '10025', ai_title: '규조토 발매트', category: '생활잡화', short_link: 'https://example.com', thumbnail_url: 'https://placehold.co/300x400/e8e8e8/191919?text=10025' },
]

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
  const [activeTab, setActiveTab] = useState('ALL')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [typedText, setTypedText] = useState('')
  const [categoryVisible, setCategoryVisible] = useState(false)

  const [showGoldenTicket, setShowGoldenTicket] = useState(false)
  const [showVvipModal, setShowVvipModal] = useState(false)
  const [oosPopup, setOosPopup] = useState({ show: false, product: null })
  const [loadingPhrase] = useState(() => LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)])

  const { addRecentView } = useStore()
  const { ref: rankingRef, canScrollLeft, canScrollRight, scrollDir, isDragged, onMouseDown: onRankingMouseDown } = useHorizontalScroll()
  const { ref: categoryRef, onMouseDown: onCategoryMouseDown } = useHorizontalScroll()
  const categorySectionRef = useRef(null)
  const categoryTabRef = useRef(null)

  // ━━━ Typewriter placeholder ━━━
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

  // ━━━ Supabase 데이터 로드 ━━━
  useEffect(() => {
    let cancelled = false
    async function load() {
      let dbProducts = []
      if (supabase) {
        const { data, error } = await supabase.from('products').select('*')
        if (!error && data?.length) dbProducts = data
      }
      if (cancelled) return

      const base = dbProducts.length > 0 ? dbProducts : DUMMY_PRODUCTS
      const normalized = base.map((p) => ({
        ...p,
        code: p.display_code,
        name: p.ai_title,
        image: p.thumbnail_url,
        link: p.short_link,
      }))

      let realTrendingData = [];
      if (supabase) {
        const { data, error } = await supabase.rpc('get_real_trending_products');
        if (!error && data) realTrendingData = data;
      }

      const merged = normalized.map((p) => ({
        ...p,
        views: Number(p.total_views) || 0,
      }));

      setProducts(shuffle(merged));
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  // ━━━ 파생 데이터 ━━━
  const topProducts = useMemo(() => [...products].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 10), [products])

  const filteredProducts = useMemo(() => {
    if (activeTab === 'ALL') return products
    const btn = CATEGORY_BUTTONS.find((b) => b.id === activeTab)
    if (!btn || !btn.dbPrefix) return products
    return products.filter((p) => {
      const cat = String(p.category || '')
      return cat.startsWith(btn.dbPrefix)
    })
  }, [products, activeTab])

  const hasMore = visibleCount < filteredProducts.length

  const onLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE)
  }, [])

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE)
  }, [activeTab])

  useEffect(() => {
    const el = categoryTabRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setCategoryVisible(entry.isIntersecting), { threshold: 0.2 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [loading])

  const badges = useMemo(() => getUniqueBadges(), [])

  // ━━━ 클릭 & 검색 핸들러 ━━━
  const handleClickProduct = useCallback((product) => {
    addRecentView(product);

    if (window.gtag) {
      window.gtag('event', 'click_product', {
        'event_category': 'Outbound Link',
        'event_label': product.name,
        'product_code': String(product.product_code),
        'display_code': String(product.display_code),
        'value': 1
      });
    }

    if (product.is_oos === true) {
      setOosPopup({ show: true, product });
      return;
    }

    let targetUrl = product.short_link || product.link;
    if (!targetUrl) return;
    if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

    window.history.replaceState(null, '', '/');
    window.location.href = targetUrl;

    if (supabase) {
      supabase.rpc('increment_base_views', { p_code: String(product.product_code) }).then(({ error }) => { if (error) console.error(error); });
      supabase.rpc('increment_daily_view', { p_product_code: String(product.product_code) }).then(({ error }) => { if (error) console.error(error); });
    }
  }, [addRecentView]);

  const handleOosConfirm = useCallback(() => {
    if (!oosPopup.product) return;
    const route = getOosThemeRoute(oosPopup.product);
    setOosPopup({ show: false, product: null });
    window.history.replaceState(null, '', '/');
    window.location.href = route.url;
  }, [oosPopup.product]);

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    const found = products.find((p) => String(p.display_code).trim() === trimmed);
    if (found) {
      await handleClickProduct(found);
    } else {
      setShowGoldenTicket(true);
    }
  }, [query, products, handleClickProduct]);

  // ━━━ V9 Engine: 무한루프 Trap Breaker (History Hijacking) ━━━
  useEffect(() => {
    if (showGoldenTicket) {
      const timer = setTimeout(() => {
        window.history.replaceState(null, '', '/');
        window.location.href = GOLDBOX_URL;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showGoldenTicket]);

  // ━━━ V9 Engine: BFCache Trap Breaker ━━━
  useEffect(() => {
    const handlePageShow = (event) => {
      const isFromBFCache = event.persisted;
      const isStuckState = !window.location.hash && showGoldenTicket;

      if (isFromBFCache || isStuckState) {
        setShowGoldenTicket(false);
        setLoading(false);
        setQuery('');
        window.history.replaceState(null, '', '/');

        if (isFromBFCache) {
          window.location.reload();
        }
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [showGoldenTicket]);

  // ━━━ V9 Engine: 트래픽 추적 파이프라인 ━━━
  const trafficLogged = useRef(false);

  const logTraffic = useCallback(() => {
    if (trafficLogged.current || !supabase) return;
    const sp = new URLSearchParams(window.location.search);
    if (!sp.get('pid') && !sp.get('src') && !sp.get('pt')) return;
    trafficLogged.current = true;

    const insertData = {
      session_id: crypto.randomUUID(),
      product_code: sp.get('pid'),
      source_platform: sp.get('src'),
      emotion_tag: sp.get('pt'),
      is_converted: true,
      geo_city: 'Unknown',
    };

    supabase.from('traffic_log').insert(insertData).then(() => {
      console.log('Traffic logged successfully');
    }).catch((err) => {
      console.error('Traffic log failed:', err);
    });
  }, []);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (!sp.get('pid') && !sp.get('src') && !sp.get('pt')) return;
    const hash = window.location.hash;
    if (hash && hash.length > 1) return;

    const onInteract = () => logTraffic();

    window.addEventListener('click', onInteract, { once: true, passive: true });
    window.addEventListener('scroll', onInteract, { once: true, passive: true });

    return () => {
      window.removeEventListener('click', onInteract);
      window.removeEventListener('scroll', onInteract);
    };
  }, [logTraffic]);

  // ━━━ V9 Engine: 스텔스 브릿지 (Base64 디코딩 및 자동 라우팅) ━━━
  useEffect(() => {
    if (products.length === 0) return;
    const hash = window.location.hash;
    if (!hash || hash.length <= 1) return;

    logTraffic();

    try {
      let base64 = hash.substring(1).replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4;
      if (pad) base64 += '='.repeat(4 - pad);
      const decodedCode = atob(base64);

      const found = products.find(p => String(p.display_code) === String(decodedCode));
      if (found) {
        handleClickProduct(found);
      } else {
        setShowGoldenTicket(true);
      }
    } catch (e) {
      setShowGoldenTicket(true);
    }
  }, [products, handleClickProduct, logTraffic]);

  // ━━━ SEO ━━━
  const activeLabel = CATEGORY_BUTTONS.find((b) => b.id === activeTab)?.label || '전체'
  const seoTitle = activeTab === 'ALL'
    ? '다온픽 | 영상 속 그 제품, 번호로 찾으세요'
    : `다온픽 | ${activeLabel} 상품 모아보기`
  const seoDesc = activeTab === 'ALL'
    ? '유튜브, 쇼츠 꿀템 정보를 번호 하나로 쉽고 빠르게 확인하세요.'
    : `${activeLabel} 카테고리의 인기 상품을 다온픽에서 확인하세요.`

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
                    <RankingCard key={p.product_code} product={p} rank={i + 1} onClickProduct={handleClickProduct} badge={i < 3 ? badges[i] : null} isDragged={isDragged} />
                  ))}
                </div>
              </section>
            )}

            {/* Lucky Pick */}
            {products.length > 0 && (
              <LuckyCard products={products} onClickProduct={handleClickProduct} />
            )}

            {/* Telegram VVIP Hook */}
            <div className="mt-6 mb-2 bg-gray-900 rounded-[20px] p-6 text-center shadow-xl border border-gray-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#F37021] opacity-10 blur-3xl rounded-full"></div>
              <p className="text-white font-bold mb-4 text-[15px] tracking-tight relative z-10">🔮 내 진짜 운명의 아이템은?</p>
              <button onClick={() => setShowVvipModal(true)} className="w-full py-3.5 bg-gradient-to-r from-[#F37021] to-[#FF8F50] text-white rounded-xl font-black text-[15px] shadow-lg active:scale-95 transition-transform relative z-10">
                🃏 1:1 맞춤 운세 카드 뽑기 (무료)
              </button>
            </div>

            {/* Category Tabs (V9 CATEGORY_BUTTONS) */}
            {CATEGORY_BUTTONS.length > 1 && (
              <section id="category-section" className="mt-12" ref={categorySectionRef}>
                <div ref={(el) => { categoryRef.current = el; categoryTabRef.current = el }} onMouseDown={onCategoryMouseDown} className="-mx-5 px-5 flex gap-2 overflow-x-auto no-scrollbar select-none cursor-grab active:cursor-grabbing">
                  {CATEGORY_BUTTONS.map((btn, i) => (
                    <button key={btn.id} onClick={() => setActiveTab(btn.id)}
                            data-category-tab
                            className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-700 ease-out ${activeTab === btn.id ? 'bg-gradient-to-r from-[#F37021] to-[#FF8F50] text-white active-tab' : 'bg-gray-100 text-gray-500'} ${categoryVisible ? '' : 'opacity-0 translate-y-4'}`}
                            style={categoryVisible ? { animation: 'slide-up 0.7s ease-out forwards', animationDelay: `${i * 150}ms`, opacity: 0 } : undefined}>
                      {btn.label}
                    </button>
                  ))}
                </div>
                {filteredProducts.length > 0 && (
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
        categories={CATEGORY_BUTTONS.filter((b) => b.id !== 'ALL').map((b) => ({ key: b.id, label: b.label }))}
        onSelectCategory={(cat) => setActiveTab(cat)}
      />

      {/* Modals */}
      <GoldenTicketModal isOpen={showGoldenTicket} loadingPhrase={loadingPhrase} />
      <OosFallbackModal oosPopup={oosPopup} onConfirm={handleOosConfirm} onClose={() => setOosPopup({ show: false, product: null })} />
      <VvipLoungeModal isOpen={showVvipModal} onClose={() => setShowVvipModal(false)} />
    </div>
  )
}
