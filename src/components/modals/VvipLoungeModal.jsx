export default function VvipLoungeModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md transition-opacity duration-300">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-[340px] w-[88%] p-6 text-center transform transition-all duration-400">
        <div className="text-4xl mb-3">🗝️</div>
        <h3 className="text-[18px] font-black text-white mb-2 tracking-tight">VVIP 프라이빗 라운지</h3>
        <p className="text-[13px] text-gray-400 leading-relaxed mb-6">
          운기 유출 방지를 위해 소름 돋는 1:1 맞춤 운세는<br/>
          <strong className="text-gray-200">보안 메신저(텔레그램)</strong>로만 발송됩니다.
        </p>
        <div className="space-y-3">
          <a href="https://telegram.org/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full py-3.5 rounded-xl bg-gray-800 text-white font-bold text-[14px] active:scale-95 transition-transform border border-gray-700">
            ⚡ 앱 3초 만에 설치하기
          </a>
          <a href="https://t.me/DaonPickBot?start=fortune_hook" className="flex items-center justify-center w-full py-3.5 rounded-xl bg-gradient-to-r from-[#F37021] to-[#FF8F50] text-white font-black text-[15px] shadow-lg active:scale-95 transition-transform">
            🚪 이미 앱이 있다면 입장하기
          </a>
        </div>
        <button onClick={onClose} className="mt-5 text-[12px] text-gray-500 underline">다음에 할게요</button>
      </div>
    </div>
  );
}
