import { useState, useCallback } from 'react'
import { ArrowRight, RefreshCw } from 'lucide-react'

const MESSAGES = {
  주방용품: [
    '맛있는 요리가 행복을 가져다 줄 거예요!',
    '주방의 품격을 높여줄 아이템!',
  ],
  생활용품: [
    '깔끔한 정리가 금전운을 불러옵니다.',
    '삶의 질이 수직 상승할 기회!',
  ],
  가전디지털: [
    '스마트한 생활이 당신을 기다려요!',
    '오늘 가장 핫한 테크 아이템!',
  ],
  뷰티: [
    '오늘따라 더 빛나는 당신을 위해!',
    '설레는 변화가 시작될 거예요.',
  ],
}

const DEFAULT_MESSAGES = [
  '오늘 당신에게 딱 필요한 행운의 아이템!',
  '놓치면 후회할 대박 찬스!',
]

function pickMessage(category) {
  const pool = MESSAGES[category] || DEFAULT_MESSAGES
  return pool[Math.floor(Math.random() * pool.length)]
}

export default function LuckyCard({ products, onClickProduct }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [luckyItem, setLuckyItem] = useState(null)
  const [message, setMessage] = useState('')

  const flip = useCallback(() => {
    if (!products.length) return
    const item = products[Math.floor(Math.random() * products.length)]
    setLuckyItem(item)
    setMessage(pickMessage(item.category))
    setIsFlipped(true)
  }, [products])

  const reset = useCallback(() => {
    setIsFlipped(false)
    setLuckyItem(null)
    setMessage('')
  }, [])

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-gray-900 px-0.5 mb-4">🔮 오늘의 행운템</h2>

      {/* Card wrapper — perspective for 3D */}
      <div className="relative w-full" style={{ perspective: '1000px' }}>
        <div
          className="relative w-full transition-transform duration-700 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* ─── Front (card back — the mystic side) ─── */}
          <div
            onClick={flip}
            className="w-full rounded-2xl overflow-hidden shadow-xl cursor-pointer"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="relative bg-gradient-to-br from-[#F37021] via-[#FF8F50] to-[#F37021] p-8 flex flex-col items-center justify-center min-h-[200px]">
              {/* Geometric pattern overlay */}
              <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="lucky-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M20 0L40 20L20 40L0 20Z" fill="none" stroke="white" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#lucky-grid)" />
                </svg>
              </div>

              {/* Floating animation wrapper */}
              <div className="relative z-10 flex flex-col items-center gap-4 animate-[lucky-float_3s_ease-in-out_infinite]">
                <span className="text-5xl">🔮</span>
                <p className="text-white font-bold text-[15px] tracking-tight">터치해서 오늘의 행운템 확인하기</p>
                <span className="text-white/60 text-xs">Tap to reveal your lucky pick</span>
              </div>
            </div>
          </div>

          {/* ─── Back (result side) ─── */}
          <div
            className="absolute inset-0 w-full rounded-2xl overflow-hidden shadow-xl bg-white"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {luckyItem && (
              <div className="flex flex-col">
                {/* Product image */}
                <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                  <img
                    src={luckyItem.image}
                    alt={luckyItem.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#F37021] text-white text-xs font-bold">
                    Lucky Pick ✨
                  </span>
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <p className="text-[15px] font-bold text-[#191F28] leading-snug line-clamp-2">{luckyItem.name}</p>
                  <p className="text-[13px] text-[#F37021] font-medium">{message}</p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onClickProduct(luckyItem)}
                      className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl bg-gradient-to-r from-[#F37021] to-[#FF8F50] text-white text-sm font-bold active:scale-[0.97] transition-transform"
                    >
                      보러가기 <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={reset}
                      className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 active:bg-gray-200 transition-colors"
                      title="다시 뽑기"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
