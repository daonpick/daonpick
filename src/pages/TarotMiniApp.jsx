import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getOosThemeRoute } from '../utils/constants';

export default function TarotMiniApp() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid');
  const pid = searchParams.get('pid');
  
  const [authFailed, setAuthFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const[cardData, setCardData] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // 17번 누락: 텔레그램 환경 보안 검증
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    tg?.ready();
    tg?.expand();
    
    if (!tg || !tg.initData) {
      if (process.env.NODE_ENV !== 'development') {
        setAuthFailed(true);
        return;
      }
    }
  },[]);

  // 6번 누락: DB에서 상품 정보와 사주 텍스트 동시 조달
  useEffect(() => {
    if (authFailed || !uid || !pid) return;
    
    async function fetchData() {
      try {
        const { data: gacha } = await supabase
          .from('user_gacha_log')
          .select('fortune_text')
          .eq('telegram_id', uid)
          .eq('product_code', pid)
          .order('drawn_at', { ascending: false })
          .limit(1)
          .single();

        const { data: product } = await supabase
          .from('products')
          .select('*')
          .eq('product_code', pid)
          .single();

        if (product) {
          setCardData({
            ...product,
            fortune_text: gacha?.fortune_text || "우주의 기운이 당신을 이 상품으로 이끌었습니다.",
          });
          // 3D 카드 자동 플립 연출 (1.5초 뒤)
          setTimeout(() => setIsFlipped(true), 1500);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [uid, pid, authFailed]);

  // 14번 누락: 외부 이동 및 텔레그램 인앱 브라우저 강제 닫기
  const handleCheckout = () => {
    if (!cardData) return;
    let targetUrl = cardData.link || cardData.short_link;
    
    if (cardData.is_oos) {
      targetUrl = getOosThemeRoute(cardData).url;
    } else {
      if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;
    }

    window.open(targetUrl, '_blank');
    
    // 0.5초 뒤 텔레그램 미니 앱 스스로 종료 (잔해물 제거)
    setTimeout(() => {
      window.Telegram?.WebApp?.close();
    }, 500);
  };

  const fakeViews = useMemo(() => {
    if (!cardData) return '0';
    const numCode = String(cardData.product_code || '').replace(/\D/g, '');
    const suffix = ((Number(numCode) || 0) % 90) + 10;
    const base = Number(cardData.total_views) || 0;
    const total = base === 0 ? suffix : Number(String(base) + String(suffix));
    return total >= 1000 ? (total / 1000).toFixed(1) + '천' : total.toLocaleString();
  }, [cardData]);

  if (authFailed) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white p-5 text-center">
        <div>
          <span className="text-5xl block mb-4">⛔</span>
          <h1 className="text-xl font-bold mb-2">잘못된 접근입니다</h1>
          <p className="text-gray-400 text-sm">운세 카드는 텔레그램 봇을 통해서만<br/>확인할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center p-5 font-sans overflow-hidden">
      {loading ? (
        <div className="text-center animate-pulse">
          <div className="w-12 h-12 border-4 border-[#F37021] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#F37021] font-bold text-sm tracking-widest">운명을 해독하는 중...</p>
        </div>
      ) : cardData ? (
        <div className="w-full max-w-sm flex flex-col items-center">
          <h2 className="text-white font-black text-2xl mb-8 tracking-tighter drop-shadow-lg text-center">
            {isFlipped ? '🔮 당신의 운명템' : '카드가 열립니다'}
          </h2>
          
          {/* 3D Card Container */}
          <div className="relative w-72 aspect-[2/3] perspective-1000 mx-auto">
            <div className={`w-full h-full transition-transform duration-1000 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
              
              {/* 뒷면 (최초에 보이는 신비로운 카드면) */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-black rounded-3xl shadow-2xl border-2 border-indigo-500/30 flex items-center justify-center" style={{ backfaceVisibility: 'hidden' }}>
                <div className="w-4/5 h-4/5 border border-indigo-500/20 rounded-2xl flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse"></div>
                   <span className="text-7xl drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">✨</span>
                </div>
              </div>

              {/* 앞면 (상품 및 사주 텍스트) */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-white rounded-3xl shadow-[0_0_30px_rgba(243,112,33,0.3)] overflow-hidden flex flex-col rotate-y-180" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <div className="h-[45%] bg-gray-100 relative">
                  <img src={cardData.thumbnail_url} alt="product" className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur text-white text-[10px] px-2 py-1 rounded-md font-bold">
                    👁️ {fakeViews}명 주목
                  </div>
                </div>
                <div className="flex-1 p-5 flex flex-col bg-gradient-to-b from-white to-gray-50">
                  <p className="text-[14px] font-medium text-gray-800 leading-relaxed flex-1 overflow-y-auto mb-4 tracking-tight whitespace-pre-wrap">
                    "{cardData.fortune_text}"
                  </p>
                  <button onClick={handleCheckout} className="w-full py-3.5 bg-gradient-to-r from-[#F37021] to-[#FF8F50] text-white rounded-xl font-black text-[15px] shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
                    운명템 확인하기 <span className="text-lg">➔</span>
                  </button>
                  <p className="text-[9px] text-gray-400 text-center mt-3">이 큐레이션은 쿠팡 파트너스 활동의 일환으로<br/>이에 따른 일정액의 수수료를 제공받습니다.</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
