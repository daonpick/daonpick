import { useEffect, useState } from 'react'
import { X, Clock, Heart, Grid3X3, Share2, Briefcase } from 'lucide-react'
import { useStore } from '../store/useStore'

const TALLY_FORM_ID = 'jayQoY'


export default function Sidebar({ open, onClose, categories, onSelectCategory }) {
  const { recentViews, wishlist } = useStore()
  const [toast, setToast] = useState(false)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleShare = async () => {
    const shareData = {
      title: '다온픽 - 평범한 일상에 한 끗을 더하다',
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // 사용자가 공유 취소한 경우 무시
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        setToast(true)
        setTimeout(() => setToast(false), 1500)
      } catch {
        // fallback
      }
    }
  }

  const handleCategory = (cat) => {
    onSelectCategory(cat)
    onClose()
    setTimeout(() => {
      document.body.style.overflow = ''
      const section = document.getElementById('category-section')
      if (section) {
        const y = section.getBoundingClientRect().top + window.pageYOffset - 60
        window.scrollTo({ top: y, behavior: 'smooth' })
      }
      // 선택된 탭을 가로 스크롤 중앙으로 이동
      const activeBtn = document.querySelector('[data-category-tab].active-tab')
      if (activeBtn && activeBtn.parentElement) {
        const container = activeBtn.parentElement
        const scrollLeft = activeBtn.offsetLeft - container.offsetWidth / 2 + activeBtn.offsetWidth / 2
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
      }
    }, 500)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`fixed top-0 right-0 z-[70] h-full w-[85%] max-w-[360px] bg-white shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full overflow-y-auto">

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-[#191F28] tracking-tight">다온픽 메뉴</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 active:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 px-5 py-4 space-y-6">

            {/* 최근 본 상품 */}
            <section>
              <div className="flex items-center gap-1.5 mb-3">
                <Clock className="w-4 h-4 text-[#F37021]" />
                <h3 className="text-sm font-bold text-[#191F28]">최근 본 상품</h3>
              </div>
              {recentViews.length === 0 ? (
                <p className="text-xs text-gray-400">아직 본 상품이 없어요</p>
              ) : (
                <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
                  {recentViews.map((p) => (
                    <a key={p.code} href={p.link} className="shrink-0 w-16 text-center group">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="mt-1 text-[10px] text-gray-600 truncate">{p.name}</p>
                    </a>
                  ))}
                </div>
              )}
            </section>

            {/* 찜한 상품 */}
            <section>
              <div className="flex items-center gap-1.5 mb-3">
                <Heart className="w-4 h-4 text-[#F37021]" />
                <h3 className="text-sm font-bold text-[#191F28]">찜한 상품</h3>
              </div>
              {wishlist.length === 0 ? (
                <p className="text-xs text-gray-400">찜한 상품이 없어요</p>
              ) : (
                <div className="space-y-2">
                  {wishlist.map((p) => (
                    <a key={p.code} href={p.link} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors">
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-sm text-[#191F28] font-medium truncate">{p.name}</span>
                    </a>
                  ))}
                </div>
              )}
            </section>

            {/* 카테고리 */}
            {categories.length > 0 && (
              <section>
                <div className="flex items-center gap-1.5 mb-3">
                  <Grid3X3 className="w-4 h-4 text-[#F37021]" />
                  <h3 className="text-sm font-bold text-[#191F28]">카테고리</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button key={cat.key} onClick={() => handleCategory(cat.key)}
                            className="px-3 py-1.5 rounded-full bg-gray-100 text-[13px] font-medium text-gray-600 active:scale-95 transition-transform">
                      {cat.label}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto px-5 py-4 pt-6 border-t border-gray-100 flex flex-col gap-3">
            <button onClick={handleShare}
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">
              <Share2 size={18} />
              <span>친구에게 공유하기</span>
            </button>
            <button onClick={() => {
                      if (window.Tally) {
                        window.Tally.openPopup(TALLY_FORM_ID, {
                          layout: 'modal',
                          width: 420,
                          emoji: { text: '👋', animation: 'wave' },
                          autoClose: 3000,
                        })
                      } else {
                        window.open(`https://tally.so/r/${TALLY_FORM_ID}`, '_blank')
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-[#F37021]/10 text-[#F37021] font-bold py-3 rounded-xl hover:bg-[#F37021]/20 transition-colors">
              <Briefcase size={18} />
              <span>비즈니스 제휴문의</span>
            </button>
            <p className="text-[10px] text-center text-gray-400 mt-2">
              다온픽 &copy; 2026. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[80] px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium shadow-lg transition-all duration-300 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        링크가 복사되었습니다!
      </div>
    </>
  )
}
