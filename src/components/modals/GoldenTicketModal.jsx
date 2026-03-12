export default function GoldenTicketModal({ isOpen, loadingPhrase }) {
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className={`bg-gradient-to-br from-[#FFD700] to-[#F37021] p-[3px] rounded-2xl shadow-2xl max-w-[320px] w-[85%] transform transition-all duration-500 ${isOpen ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'}`}>
        <div className="bg-white p-6 rounded-[14px] text-center flex flex-col items-center">
          <div className="text-5xl mb-3 animate-bounce">🎉</div>
          <h3 className="text-lg font-black text-[#F37021] mb-2 tracking-tight">앗! 숨겨진 황금 코드 발견!</h3>
          <p className="text-[14px] font-medium text-gray-700 leading-relaxed mb-5">
            다온픽이 몰래 준비한<br/>
            <strong className="text-gray-900">반짝특가 비밀통로</strong>가 열렸습니다!
          </p>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
            <div className="w-4 h-4 border-2 border-gray-200 border-t-[#F37021] rounded-full animate-spin"></div>
            {loadingPhrase}
          </div>
        </div>
      </div>
    </div>
  )
}
