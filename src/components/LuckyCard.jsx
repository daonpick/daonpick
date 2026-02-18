import { useState, useCallback, useEffect } from 'react'
import { ArrowRight, RefreshCw, Moon, Star, Sun } from 'lucide-react'

const FORTUNE_MESSAGES = {
  '1': ['맛있는 음식이 곧 보약! 건강운이 상승해요 🍽️', '주방의 품격이 당신의 가치를 높여줍니다 ✨'],
  '2': ['주변을 정리하면 금전운이 뻥 뚫려요! 💰', '작은 편리함이 큰 행복을 불러옵니다 🍀'],
  '3': ['스마트한 변화가 성공을 앞당길 거예요 🚀', '지금 가장 핫한 아이템이 기다립니다 ⚡'],
  '4': ['공간의 변화가 새로운 인연을 데려옵니다 🏠', '당신의 센스가 돋보이는 순간입니다 🎨'],
  '5': ['사랑스러운 아이와 행복 지수 상승 🐾', '작은 배려가 깊은 교감을 만듭니다 🐶'],
  '6': ['오늘따라 더 빛나는 당신! 💖', '설레는 변화가 시작될 운명입니다 💄'],
  '7': ['입안 가득 퍼지는 즐거움 🍷', '잘 챙겨 먹는 것이 성공의 지름길 🥗'],
  '8': ['잃어버린 동심과 열정을 되찾을 시간 🎈', '즐거운 몰입이 영감을 줍니다 🧶'],
  '9': ['안전하고 쾌적한 이동이 행운을 줍니다 🚗', '드라이브의 질을 높여보세요 🛣️'],
}

const DEFAULT_MESSAGES = [
  '오늘 당신에게 딱 필요한 행운의 아이템! 🎁',
  '놓치면 후회할 대박 찬스! 🌟',
]

const CARD_ICONS = [Moon, Star, Sun]

function pickMessage(categoryCode) {
  const pool = FORTUNE_MESSAGES[String(categoryCode)] || DEFAULT_MESSAGES
  return pool[Math.floor(Math.random() * pool.length)]
}

function pickRandom3(arr) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

export default function LuckyCard({ products, onClickProduct }) {
  // -1 = idle, 0/1/2 = selected index
  const [selected, setSelected] = useState(-1)
  const [isFlipped, setIsFlipped] = useState(false)
  const [candidates, setCandidates] = useState(() => pickRandom3(products))
  const [message, setMessage] = useState('')
  const [luckyItem, setLuckyItem] = useState(null)

  const isIdle = selected === -1

  const handlePick = useCallback((idx) => {
    if (!isIdle) return
    const item = candidates[idx]
    setLuckyItem(item)
    setMessage(pickMessage(item.category_code))
    setSelected(idx)
  }, [isIdle, candidates])

  // Step 4: after expand (300ms), flip
  useEffect(() => {
    if (selected < 0) return
    const t = setTimeout(() => setIsFlipped(true), 350)
    return () => clearTimeout(t)
  }, [selected])

  const reset = useCallback(() => {
    setIsFlipped(false)
    setSelected(-1)
    setLuckyItem(null)
    setMessage('')
    setCandidates(pickRandom3(products))
  }, [products])

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4 px-0.5">
        <h2 className="text-lg font-bold text-gray-900">🔮 오늘의 행운템</h2>
        {!isIdle && (
          <button onClick={reset} className="flex items-center gap-1 text-xs text-gray-400 active:text-gray-600 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> 다시 뽑기
          </button>
        )}
      </div>

      {isIdle && (
        <p className="text-[13px] text-gray-400 mb-4 px-0.5">카드 한 장을 골라보세요!</p>
      )}

      {/* ─── Card Grid ─── */}
      <div className="grid grid-cols-3 gap-3">
        {candidates.map((item, idx) => {
          const isPicked = selected === idx
          const isOther = !isIdle && !isPicked
          const Icon = CARD_ICONS[idx]

          // Hide non-selected cards after selection
          if (isOther) return null

          return (
            <div
              key={item.code}
              className={`transition-all duration-300 ease-out ${isPicked ? 'col-span-3' : ''}`}
              style={{ perspective: '1000px' }}
            >
              <div
                className={`relative w-full transition-transform duration-600 ease-out ${!isIdle ? '' : 'cursor-pointer'}`}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transitionDuration: '600ms',
                }}
              >
                {/* ─ Front (mystic card back) ─ */}
                <div
                  onClick={() => handlePick(idx)}
                  className={`w-full rounded-2xl overflow-hidden shadow-lg ${isFlipped ? 'hidden' : ''}`}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className={`relative bg-gradient-to-b from-[#F37021] via-[#FF8F50] to-[#F37021] flex flex-col items-center justify-center ${isPicked ? 'py-10' : 'aspect-[3/4]'}`}>
                    {/* Diamond pattern */}
                    <div className="absolute inset-0 opacity-[0.08]">
                      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id={`lg-${idx}`} x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                            <path d="M15 0L30 15L15 30L0 15Z" fill="none" stroke="white" strokeWidth="0.8" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill={`url(#lg-${idx})`} />
                      </svg>
                    </div>
                    <div
                      className={`relative z-10 flex flex-col items-center gap-2 ${isIdle ? 'animate-[lucky-float_3s_ease-in-out_infinite]' : ''}`}
                      style={isIdle ? { animationDelay: `${idx * 0.4}s` } : undefined}
                    >
                      <Icon className="w-8 h-8 text-white" strokeWidth={1.5} />
                      <span className="text-white/70 text-[10px] font-medium tracking-wider">PICK ME</span>
                    </div>
                  </div>
                </div>

                {/* ─ Back (result — golden ticket) ─ */}
                <div
                  className={`${isFlipped ? '' : 'absolute inset-0'} w-full rounded-2xl overflow-hidden shadow-xl bg-white`}
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: isFlipped ? 'none' : 'rotateY(180deg)',
                  }}
                >
                  {luckyItem && (
                    <div className="flex flex-row h-40">
                      {/* Left — image */}
                      <div className="w-2/5 bg-gray-100 overflow-hidden relative shrink-0">
                        <img src={luckyItem.image} alt={luckyItem.name} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-[#F37021] text-white text-[9px] font-bold">
                          Lucky ✨
                        </span>
                      </div>
                      {/* Right — info */}
                      <div className="w-3/5 flex flex-col justify-between p-3 relative">
                        <button
                          onClick={reset}
                          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 active:text-gray-500 active:bg-gray-100 transition-colors"
                          title="다시 뽑기"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <div>
                          <p className="text-[13px] font-bold text-[#191F28] leading-tight truncate pr-7">{luckyItem.name}</p>
                          <p className="text-[11px] text-[#F37021] font-medium leading-snug mt-1.5 line-clamp-2">{message}</p>
                        </div>
                        <button
                          onClick={() => onClickProduct(luckyItem)}
                          className="flex items-center justify-center gap-1 w-full py-2 rounded-xl bg-gradient-to-r from-[#F37021] to-[#FF8F50] text-white text-[12px] font-bold active:scale-[0.97] transition-transform"
                        >
                          상품 보러가기 <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
