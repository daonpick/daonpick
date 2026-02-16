import { useState, useMemo } from 'react'
import { Search, Eye, ExternalLink, ChevronRight } from 'lucide-react'
// import Papa from 'papaparse'

// ── 외부 내비 (하드코딩) ─────────────────────────────
const EXTERNAL_NAV = [
  { label: '기획전', url: 'https://example.com/event' },
  { label: '주방특가', url: 'https://example.com/kitchen' },
  { label: '뷰티SALE', url: 'https://example.com/beauty' },
  { label: '가전딜', url: 'https://example.com/electronics' },
  { label: '리빙마켓', url: 'https://example.com/living' },
]

// ── 더미 상품 데이터 (추후 Google Sheets CSV 교체) ───
const DUMMY_PRODUCTS = [
  { code: '10024', name: '접이식 논슬립 빨래건조대', category: '리빙', image: 'https://placehold.co/400x400/f4f4f5/191919?text=10024', link: 'https://example.com/aff/10024', baseViews: 30, tag: 'hot' },
  { code: '10025', name: '무선 핸디 블렌더 3세대', category: '주방', image: 'https://placehold.co/400x400/f4f4f5/191919?text=10025', link: 'https://example.com/aff/10025', baseViews: 58, tag: 'hot' },
  { code: '10026', name: '초경량 항공점퍼 바람막이', category: '패션', image: 'https://placehold.co/400x400/f4f4f5/191919?text=10026', link: 'https://example.com/aff/10026', baseViews: 42, tag: 'hot' },
  { code: '10027', name: '스테인리스 진공 텀블러 750ml', category: '리빙', image: 'https://placehold.co/400x400/f4f4f5/191919?text=10027', link: 'https://example.com/aff/10027', baseViews: 19, tag: 'hot' },
  { code: '10028', name: '프리미엄 두피 스케일러 브러시', category: '뷰티', image: 'https://placehold.co/400x400/f4f4f5/191919?text=10028', link: 'https://example.com/aff/10028', baseViews: 65, tag: 'all' },
  { code: '10029', name: '고밀도 메모리폼 경추 베개', category: '리빙', image: 'https://placehold.co/400x400/f4f4f5/191919?text=10029', link: 'https://example.com/aff/10029', baseViews: 37, tag: 'all' },
  { code: '10030', name: '음식물 쓰레기 냄새차단 휴지통', category: '주방', image: 'https://placehold.co/400x400/f4f4f5/191919?text=10030', link: 'https://example.com/aff/10030', baseViews: 24, tag: 'all' },
  { code: '10031', name: '자동회전 화장품 정리대', category: '뷰티', image: 'https://placehold.co/400x400/f4f4f5/191919?text=10031', link: 'https://example.com/aff/10031', baseViews: 51, tag: 'all' },
  { code: '10032', name: 'LED 센서등 무선 현관 조명', category: '리빙', image: 'https://placehold.co/400x400/f4f4f5/191919?text=10032', link: 'https://example.com/aff/10032', baseViews: 44, tag: 'all' },
  { code: '10033', name: '올인원 멀티 충전 케이블', category: '가전', image: 'https://placehold.co/400x400/f4f4f5/191919?text=10033', link: 'https://example.com/aff/10033', baseViews: 72, tag: 'all' },
]

const HOT_LIMIT_STEP = 4
const ALL_LIMIT_STEP = 6

// ── 조회수: baseViews 뒤에 랜덤 0~9 붙이기 ─────────
function fakeViews(base) {
  return `${base}${Math.floor(Math.random() * 10)}`
}

// ── 상품 카드 ────────────────────────────────────────
function ProductCard({ product }) {
  return (
    <button
      onClick={() => window.open(product.link, '_blank')}
      className="text-left w-full group"
    >
      {/* 이미지 + 코드 뱃지 */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-active:scale-[0.97] transition-transform"
        />
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/50 text-[11px] text-white font-medium backdrop-blur-sm">
          {product.code}
        </span>
      </div>

      {/* 정보 */}
      <div className="mt-2.5 px-0.5">
        <p className="text-[14px] text-gray-900 font-medium leading-snug truncate">
          {product.name}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[12px] text-gray-400">{product.category}</span>
          <span className="flex items-center gap-0.5 text-[12px] text-gray-400">
            <Eye className="w-3 h-3" />
            {fakeViews(product.baseViews)}
          </span>
        </div>
      </div>
    </button>
  )
}

// ── 메인 페이지 ──────────────────────────────────────
export default function Home() {
  const [products, _setProducts] = useState(DUMMY_PRODUCTS)
  const [query, setQuery] = useState('')
  const [hotLimit, setHotLimit] = useState(HOT_LIMIT_STEP)
  const [allLimit, setAllLimit] = useState(ALL_LIMIT_STEP)

  // TODO: Google Sheets CSV 연동 시 아래 주석 해제
  // useEffect(() => {
  //   const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/..../export?format=csv'
  //   Papa.parse(SHEET_CSV_URL, {
  //     download: true,
  //     header: true,
  //     complete: (results) => setProducts(results.data),
  //   })
  // }, [])

  const hotProducts = useMemo(
    () => products.filter((p) => p.tag === 'hot'),
    [products]
  )
  const allProducts = useMemo(() => products, [products])

  // ── 코드 검색 ──────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    const found = products.find(
      (p) => p.code.toLowerCase() === trimmed.toLowerCase()
    )

    if (!found) {
      alert('상품이 없습니다')
      return
    }

    window.open(found.link, '_blank')
    setQuery('')
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#F9FAFB]">
      {/* ── 공정위 문구 (sticky) ── */}
      <div className="sticky top-0 z-50 w-full bg-gray-200">
        <p className="max-w-[480px] mx-auto px-4 py-1.5 text-[10px] text-gray-500 text-center leading-relaxed">
          이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의
          수수료를 제공받습니다.
        </p>
      </div>

      <div className="w-full max-w-[480px] px-5 pb-16">
        {/* ── Header ── */}
        <div className="pt-8 pb-2">
          <h1 className="text-[28px] font-extrabold tracking-tight">
            <span className="text-orange-500">DAON PICK</span>
          </h1>
          <p className="mt-1.5 text-[15px] text-gray-500">
            영상 속 그 제품, 번호만 입력하세요!
          </p>
        </div>

        {/* ── Search ── */}
        <form onSubmit={handleSearch} className="mt-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="상품번호 입력 (예: 10024)"
              className="w-full h-12 pl-12 pr-24 rounded-full bg-white text-[14px] text-gray-900 placeholder-gray-400 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-orange-400 transition shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-5 rounded-full bg-orange-500 text-white text-[13px] font-semibold active:scale-95 transition-transform"
            >
              검색
            </button>
          </div>
        </form>

        {/* ── External Nav (가로 스크롤) ── */}
        <div className="mt-6 -mx-5 px-5 flex gap-2.5 overflow-x-auto scrollbar-hide">
          {EXTERNAL_NAV.map((nav) => (
            <button
              key={nav.label}
              onClick={() => window.open(nav.url, '_blank')}
              className="shrink-0 flex items-center gap-1 px-4 py-2.5 rounded-full bg-white ring-1 ring-gray-200 text-[13px] font-medium text-gray-700 active:scale-95 transition-transform shadow-sm"
            >
              {nav.label}
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </button>
          ))}
        </div>

        {/* ── 🔥 방금 뜬 꿀템 ── */}
        <section className="mt-9">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-gray-900">
              🔥 방금 뜬 꿀템
            </h2>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {hotProducts.slice(0, hotLimit).map((p) => (
              <ProductCard key={p.code} product={p} />
            ))}
          </div>

          {hotLimit < hotProducts.length && (
            <button
              onClick={() => setHotLimit((v) => v + HOT_LIMIT_STEP)}
              className="mt-4 w-full py-3 rounded-2xl bg-white ring-1 ring-gray-200 text-[14px] font-medium text-gray-600 flex items-center justify-center gap-1 active:scale-[0.98] transition-transform"
            >
              더보기
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </section>

        {/* ── 전체 ── */}
        <section className="mt-10">
          <h2 className="text-[18px] font-bold text-gray-900">전체</h2>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {allProducts.slice(0, allLimit).map((p) => (
              <ProductCard key={p.code} product={p} />
            ))}
          </div>

          {allLimit < allProducts.length && (
            <button
              onClick={() => setAllLimit((v) => v + ALL_LIMIT_STEP)}
              className="mt-4 w-full py-3 rounded-2xl bg-white ring-1 ring-gray-200 text-[14px] font-medium text-gray-600 flex items-center justify-center gap-1 active:scale-[0.98] transition-transform"
            >
              더보기
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </section>
      </div>
    </div>
  )
}
