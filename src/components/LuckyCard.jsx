import { useState, useCallback, useMemo } from 'react'
import { ArrowRight, RefreshCw } from 'lucide-react'

const FORTUNE_MESSAGES = {
  '1': ['맛있는 음식이 곧 보약! 건강운이 상승하는 아이템 🍽️', '주방의 품격이 당신의 가치를 높여줍니다 ✨'],
  '2': ['주변을 정리하면 막혔던 금전운이 뻥 뚫려요! 💰', '작은 편리함이 일상의 큰 행복을 불러옵니다 🍀'],
  '3': ['스마트한 변화가 성공을 앞당길 거예요 🚀', '지금 가장 핫한 아이템이 당신을 기다립니다 ⚡'],
  '4': ['공간의 변화가 새로운 인연을 데려옵니다 🏠', '당신의 센스가 돋보이는 순간이 찾아옵니다 🎨'],
  '5': ['사랑스러운 아이와 함께라면 행복 지수 200% 상승 🐾', '작은 배려가 더 깊은 교감을 만들어냅니다 🐶'],
  '6': ['오늘따라 더 빛나는 당신, 시선을 사로잡을 거예요 💖', '설레는 변화가 시작될 운명입니다 💄'],
  '7': ['입안 가득 퍼지는 즐거움이 하루를 완성합니다 🍷', '잘 챙겨 먹는 것이 성공의 지름길입니다 🥗'],
  '8': ['잃어버린 동심과 열정을 되찾을 시간입니다 🎈', '즐거운 몰입이 새로운 영감을 줍니다 🧶'],
  '9': ['안전하고 쾌적한 이동이 행운을 데려다 줍니다 🚗', '드라이브의 질을 높이면 좋은 곳에 닿게 됩니다 🛣️'],
}

const DEFAULT_MESSAGES = [
  '오늘 당신에게 딱 필요한 행운의 아이템! 🎁',
  '놓치면 후회할 대박 찬스! 🌟',
]

const CARD_ICONS = ['🌙', '⭐', '🔮']

function pickMessage(categoryCode) {
  const pool = FORTUNE_MESSAGES[String(categoryCode)] || DEFAULT_MESSAGES
  return pool[Math.floor(Math.random() * pool.length)]
}

function pickRandom3(arr) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

export default function LuckyCard({ products, onClickProduct }) {
  const [selected, setSelected] = useState(-1) // -1 = not picked
  const [candidates, setCandidates] = useState(() => pickRandom3(products))
  const [message, setMessage] = useState('')

  const isRevealed = selected >= 0
  const luckyItem = isRevealed ? candidates[selected] : null

  const handlePick = useCallback((idx) => {
    if (isRevealed) return
    const item = candidates[idx]
    setMessage(pickMessage(item.category_code))
    setSelected(idx)
  }, [isRevealed, candidates])

  const reset = useCallback(() => {
    setSelected(-1)
    setMessage('')
    setCandidates(pickRandom3(products))
  }, [products])

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4 px-0.5">
        <h2 className="text-lg font-bold text-gray-900">🔮 오늘의 행운템</h2>
        {isRevealed && (
          <button onClick={reset} className="flex items-center gap-1 text-xs text-gray-400 active:text-gray-600 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> 다시 뽑기
          </button>
        )}
      </div>

      {!isRevealed && (
        <p className="text-[13px] text-gray-400 mb-4 px-0.5">카드 한 장을 골라보세요!</p>
      )}

      {/* ─── 3 Cards ─── */}
      <div className="flex gap-3">
        {candidates.map((item, idx) => {
          const isPicked = selected === idx
          const isOther = isRevealed && !isPicked

          return (
            <div key={item.code} className="flex-1" style={{ perspective: '800px' }}>
              <div
                onClick={() => handlePick(idx)}
                className={`relative w-full transition-transform duration-700 ease-out ${!isRevealed ? 'cursor-pointer' : ''}`}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isPicked ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* ─ Front (mystic back) ─ */}
                <div
                  className={`w-full rounded-2xl overflow-hidden shadow-lg transition-all duration-500 ${isOther ? 'opacity-40 scale-95' : ''}`}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="relative bg-gradient-to-b from-[#F37021] via-[#FF8F50] to-[#F37021] flex flex-col items-center justify-center aspect-[3/4]">
                    {/* Pattern */}
                    <div className="absolute inset-0 opacity-[0.08]">
                      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id={`grid-${idx}`} x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                            <path d="M15 0L30 15L15 30L0 15Z" fill="none" stroke="white" strokeWidth="0.8" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill={`url(#grid-${idx})`} />
                      </svg>
                    </div>
                    <div className={`relative z-10 flex flex-col items-center gap-2 ${!isRevealed ? 'animate-[lucky-float_3s_ease-in-out_infinite]' : ''}`}
                         style={!isRevealed ? { animationDelay: `${idx * 0.4}s` } : undefined}>
                      <span className="text-3xl">{CARD_ICONS[idx]}</span>
                      <span className="text-white/70 text-[10px] font-medium">PICK ME</span>
                    </div>
                  </div>
                </div>

                {/* ─ Back (result) ─ */}
                <div
                  className="absolute inset-0 w-full rounded-2xl overflow-hidden shadow-xl bg-white"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  {isPicked && luckyItem && (
                    <div className="flex flex-col h-full">
                      <div className="relative aspect-square bg-gray-100 overflow-hidden">
                        <img src={luckyItem.image} alt={luckyItem.name} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-[#F37021] text-white text-[9px] font-bold">
                          Lucky ✨
                        </span>
                      </div>
                      <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                        <p className="text-[12px] font-bold text-[#191F28] leading-tight line-clamp-2">{luckyItem.name}</p>
                        <p className="text-[10px] text-[#F37021] font-medium leading-snug line-clamp-2">{message}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); onClickProduct(luckyItem) }}
                          className="mt-auto flex items-center justify-center gap-1 w-full py-2 rounded-lg bg-gradient-to-r from-[#F37021] to-[#FF8F50] text-white text-[11px] font-bold active:scale-[0.97] transition-transform"
                        >
                          보러가기 <ArrowRight className="w-3 h-3" />
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
