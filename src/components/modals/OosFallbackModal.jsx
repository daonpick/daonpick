import { getOosThemeRoute } from '../../utils/constants'

export default function OosFallbackModal({ oosPopup, onConfirm, onClose }) {
  return (
    <div className={`fixed inset-0 z-[110] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${oosPopup.show ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className={`bg-white rounded-2xl shadow-2xl max-w-[340px] w-[88%] p-6 text-center transform transition-all duration-400 ${oosPopup.show ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'}`}>
        <div className="text-5xl mb-3">😭</div>
        <h3 className="text-[16px] font-black text-gray-900 mb-2 leading-snug tracking-tight">
          앗! 방금 전 누군가<br/>마지막 재고를 쓸어갔어요
        </h3>
        <p className="text-[13px] text-gray-500 leading-relaxed mb-5">
          대신, 다온픽이 준비한 기획전에서<br/>비슷한 특가를 확인해 보세요!
        </p>
        <button
          onClick={onConfirm}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F37021] to-[#FF8F50] text-white font-bold text-[15px] active:scale-95 transition-transform"
        >
          {oosPopup.product ? getOosThemeRoute(oosPopup.product).label + ' 바로가기' : '확인'}
        </button>
        <button
          onClick={onClose}
          className="mt-2 text-[12px] text-gray-400 underline"
        >
          다른 상품 둘러보기
        </button>
      </div>
    </div>
  )
}
