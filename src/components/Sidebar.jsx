import { useEffect, useState } from 'react'
import { X, Clock, Heart, Grid3X3, Share2, Megaphone } from 'lucide-react'
import { useStore } from '../store/useStore'

const BUSINESS_INQUIRY_URL = 'https://tally.so/r/n0XyZm'

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
      const el = document.getElementById('category-section')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
                    <button key={cat} onClick={() => handleCategory(cat)}
                            className="px-3 py-1.5 rounded-full bg-gray-100 text-[13px] font-medium text-gray-600 active:scale-95 transition-transform">
                      {cat}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100 space-y-2">
            <a href={BUSINESS_INQUIRY_URL} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-[#191F28] hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <Megaphone className="w-4 h-4 text-[#F37021] shrink-0" />
              비즈니스 제휴 문의
            </a>
            <button onClick={handleShare}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[#191F28] hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <Share2 className="w-4 h-4 text-[#F37021] shrink-0" />
              공유하기
            </button>
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
