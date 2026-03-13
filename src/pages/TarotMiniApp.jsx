import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { getOosThemeRoute } from '../utils/constants';

/* ──────────────────────────────────────────────
   10종 3D 등장 애니메이션 (framer-motion variants)
   렌더 시 Math.random()으로 1개 픽업
   ────────────────────────────────────────────── */
const CARD_ANIMATIONS = [
  // 1. The Fan — 부채꼴로 쫙 펴지며 등장
  {
    initial: { opacity: 0, rotate: -35, scale: 0.4, x: -180 },
    animate: { opacity: 1, rotate: 0, scale: 1, x: 0 },
    transition: { duration: 1.4, type: 'spring', stiffness: 55, damping: 12 },
  },
  // 2. The Vortex — 소용돌이치며 줌인
  {
    initial: { opacity: 0, scale: 0, rotate: 540 },
    animate: { opacity: 1, scale: 1, rotate: 0 },
    transition: { duration: 1.6, ease: [0.16, 1, 0.3, 1] },
  },
  // 3. The Halo — 원형으로 돌다가 후광과 함께 정지
  {
    initial: { opacity: 0, scale: 0.2, rotate: 360, boxShadow: '0 0 0px rgba(255,215,0,0)' },
    animate: { opacity: 1, scale: 1, rotate: 0, boxShadow: '0 0 60px rgba(255,215,0,0.5)' },
    transition: { duration: 1.8, ease: [0.22, 1, 0.36, 1] },
  },
  // 4. The Glitch — 지지직 해킹 이펙트
  {
    initial: { opacity: 0, x: 0, skewX: 0 },
    animate: {
      opacity: [0, 1, 0.5, 1, 0.6, 1, 1],
      x: [0, -35, 28, -18, 12, -4, 0],
      skewX: [0, -10, 7, -5, 3, -1, 0],
    },
    transition: { duration: 1.2, times: [0, 0.12, 0.28, 0.44, 0.6, 0.8, 1] },
  },
  // 5. Constellation — 블러에서 선명하게 별자리처럼 등장
  {
    initial: { opacity: 0, scale: 0.1, filter: 'blur(30px) brightness(2.5)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px) brightness(1)' },
    transition: { duration: 1.8, ease: 'easeOut' },
  },
  // 6. The Levitation — 바닥에 눕혀져 있다가 공중 부상
  {
    initial: { opacity: 0, rotateX: 80, y: 160, scale: 0.7 },
    animate: { opacity: 1, rotateX: 0, y: 0, scale: 1 },
    transition: { duration: 1.6, type: 'spring', stiffness: 50, damping: 14 },
  },
  // 7. The Ripple — 물방울 파문처럼 일렁이며 등장
  {
    initial: { opacity: 0, scale: 0 },
    animate: {
      opacity: [0, 0.7, 1, 0.9, 1],
      scale: [0, 1.35, 0.82, 1.12, 1],
    },
    transition: { duration: 1.6, times: [0, 0.3, 0.5, 0.75, 1], ease: 'easeOut' },
  },
  // 8. The Eclipse — 어두워졌다가 테두리부터 밝아지며 등장
  {
    initial: { opacity: 0, scale: 1.5, filter: 'brightness(0)' },
    animate: {
      opacity: [0, 0.3, 0.7, 1],
      scale: [1.5, 1.15, 1.03, 1],
      filter: ['brightness(0)', 'brightness(0.3)', 'brightness(0.8)', 'brightness(1)'],
      boxShadow: [
        '0 0 0px rgba(147,51,234,0)',
        '0 0 35px rgba(147,51,234,0.4)',
        '0 0 55px rgba(147,51,234,0.6)',
        '0 0 40px rgba(147,51,234,0.3)',
      ],
    },
    transition: { duration: 2.0, times: [0, 0.3, 0.65, 1], ease: [0.22, 1, 0.36, 1] },
  },
  // 9. The Shuffle — 현란하게 카드를 섞다가 꽂힘
  {
    initial: { opacity: 0, x: 300, y: -120, rotate: 35 },
    animate: {
      opacity: [0, 1, 1, 1, 1, 1],
      x: [300, -65, 45, -22, 8, 0],
      y: [-120, 55, -30, 14, -4, 0],
      rotate: [35, -22, 14, -7, 2, 0],
    },
    transition: { duration: 1.5, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
  },
  // 10. The Heartbeat — 심장 박동처럼 두 번 펌핑 후 빛남
  {
    initial: { opacity: 0, scale: 0.3 },
    animate: {
      opacity: [0, 1, 1, 1, 1, 1],
      scale: [0.3, 1.28, 0.82, 1.18, 0.94, 1],
      boxShadow: [
        '0 0 0px rgba(243,112,33,0)',
        '0 0 45px rgba(243,112,33,0.8)',
        '0 0 8px rgba(243,112,33,0.15)',
        '0 0 35px rgba(243,112,33,0.6)',
        '0 0 4px rgba(243,112,33,0.1)',
        '0 0 22px rgba(243,112,33,0.35)',
      ],
    },
    transition: { duration: 1.8, times: [0, 0.2, 0.35, 0.5, 0.7, 1], ease: 'easeInOut' },
  },
];

export default function TarotMiniApp() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid');
  const pid = searchParams.get('pid');

  const [authFailed, setAuthFailed] = useState(false);
  const [uidMismatch, setUidMismatch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [entranceComplete, setEntranceComplete] = useState(false);

  const selectedAnimation = useMemo(
    () => CARD_ANIMATIONS[Math.floor(Math.random() * CARD_ANIMATIONS.length)],
    [],
  );

  // 텔레그램 환경 보안 검증 + uid 대조
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

    const tgUserId = tg?.initDataUnsafe?.user?.id;
    if (uid && tgUserId && String(tgUserId) !== String(uid)) {
      setUidMismatch(true);
    }
  }, [uid]);

  // DB에서 상품 정보와 사주 텍스트 동시 조달
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
            fortune_text: gacha?.fortune_text || '우주의 기운이 당신을 이 상품으로 이끌었습니다.',
          });
        }
      } catch (err) {
        // Supabase fetch 실패 — 카드 없이 로딩 종료
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [uid, pid, authFailed]);

  // 외부 이동 및 텔레그램 인앱 브라우저 강제 닫기
  const handleCheckout = useCallback(() => {
    if (!cardData) return;
    let targetUrl = cardData.link || cardData.short_link;

    if (cardData.is_oos) {
      targetUrl = getOosThemeRoute(cardData).url;
    } else {
      if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;
    }

    window.Telegram?.WebApp?.openLink(targetUrl);
    setTimeout(() => {
      window.Telegram?.WebApp?.close();
    }, 500);
  }, [cardData]);

  const handleCloseModal = useCallback(() => setShowModal(false), []);

  const handleEntranceComplete = useCallback(() => {
    setEntranceComplete(true);
    setTimeout(() => setIsFlipped(true), 800);
  }, []);

  const handleCardClick = useCallback(() => {
    if (entranceComplete && !isFlipped) {
      setIsFlipped(true);
    }
  }, [entranceComplete, isFlipped]);

  const fakeViews = useMemo(() => {
    if (!cardData) return '0';
    const numCode = String(cardData.product_code || '').replace(/\D/g, '');
    const suffix = ((Number(numCode) || 0) % 90) + 10;
    const base = Number(cardData.total_views) || 0;
    const total = base === 0 ? suffix : Number(String(base) + String(suffix));
    return total >= 1000 ? (total / 1000).toFixed(1) + '천' : total.toLocaleString();
  }, [cardData]);

  /* ──── 에러 스크린 ──── */

  if (uidMismatch) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-[#0a0014] via-[#1a0033] to-[#0a0014] text-white p-5 text-center">
        <div className="max-w-xs">
          <span className="text-6xl block mb-5 animate-pulse">👁️</span>
          <h1 className="text-xl font-black mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent leading-relaxed">
            앗! 타인의 운명 카드를 엿보셨군요.
          </h1>
          <p className="text-gray-300 text-sm mb-8 leading-relaxed">
            이제 당신만의 진짜 사주 명식을<br />확인할 차례입니다.
          </p>
          <button
            onClick={() => window.open('https://t.me/daonpick_v9_bot')}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-black text-[15px] shadow-lg active:scale-95 transition-transform"
          >
            👉 나의 무료 1:1 사주 확인하기
          </button>
        </div>
      </div>
    );
  }

  if (authFailed) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white p-5 text-center">
        <div>
          <span className="text-5xl block mb-4">⛔</span>
          <h1 className="text-xl font-bold mb-2">잘못된 접근입니다</h1>
          <p className="text-gray-400 text-sm">
            운세 카드는 텔레그램 봇을 통해서만<br />확인할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  /* ──── 메인 2-Layer 렌더 ──── */

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* ─── Layer 1 (z-10): 다온픽 메인 사이트 배경 ─── */}
      <iframe
        src="https://daonpick.com"
        title="다온픽 메인"
        className="absolute inset-0 z-10 w-full h-full border-0"
        loading="lazy"
      />

      {/* ─── Layer 2 (z-100): 카드 모달 오버레이 ─── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            key="card-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-md flex flex-col items-center justify-center"
            onClick={handleCloseModal}
          >
            {/* ✖ 닫기 버튼 */}
            <button
              onClick={(e) => { e.stopPropagation(); handleCloseModal(); }}
              className="absolute top-4 right-4 z-[110] w-11 h-11 rounded-full bg-white/15 backdrop-blur border border-white/25 flex items-center justify-center text-white text-lg font-bold hover:bg-white/30 active:scale-90 transition-all shadow-lg"
              aria-label="닫기"
            >
              ✖
            </button>

            {/* 카드 콘텐츠 영역 (클릭 버블 차단) */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm flex flex-col items-center px-5"
            >
              {loading ? (
                <div className="text-center animate-pulse">
                  <div className="w-12 h-12 border-4 border-[#F37021] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[#F37021] font-bold text-sm tracking-widest">운명을 해독하는 중...</p>
                </div>
              ) : cardData ? (
                <>
                  {/* 타이틀 */}
                  <h2 className="text-white font-black text-2xl mb-8 tracking-tighter drop-shadow-lg text-center">
                    {isFlipped ? '🔮 오늘의 맞춤 사주 처방' : '카드가 열립니다'}
                  </h2>

                  {/* 랜덤 등장 애니메이션 래퍼 */}
                  <motion.div
                    initial={selectedAnimation.initial}
                    animate={selectedAnimation.animate}
                    transition={selectedAnimation.transition}
                    onAnimationComplete={handleEntranceComplete}
                    className="w-72 mx-auto rounded-3xl"
                  >
                    {/* 3D 카드 (Perspective Container) */}
                    <div
                      onClick={handleCardClick}
                      className="relative w-full aspect-[2/3] cursor-pointer"
                      style={{ perspective: '1000px' }}
                    >
                      <div
                        className="w-full h-full transition-transform duration-1000"
                        style={{
                          transformStyle: 'preserve-3d',
                          transform: isFlipped ? 'rotateY(180deg)' : '',
                        }}
                      >
                        {/* ── 뒷면 (신비 카드) ── */}
                        <div
                          className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-black rounded-3xl shadow-2xl border-2 border-indigo-500/30 flex items-center justify-center"
                          style={{ backfaceVisibility: 'hidden' }}
                        >
                          <div className="w-4/5 h-4/5 border border-indigo-500/20 rounded-2xl flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse" />
                            <span className="text-7xl drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">✨</span>
                          </div>
                        </div>

                        {/* ── 앞면 (상품 + 사주 텍스트) ── */}
                        <div
                          className="absolute inset-0 w-full h-full bg-white rounded-3xl shadow-[0_0_30px_rgba(243,112,33,0.3)] overflow-hidden flex flex-col"
                          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        >
                          <div className="h-[45%] bg-gray-100 relative">
                            <img
                              src={cardData.thumbnail_url}
                              alt="product"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://placehold.co/400x400/111/fff?text=Secret+Item';
                              }}
                            />
                            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur text-white text-[10px] px-2 py-1 rounded-md font-bold">
                              👁️ {fakeViews}명 주목
                            </div>
                          </div>

                          <div className="flex-1 p-5 flex flex-col bg-gradient-to-b from-white to-gray-50">
                            <p className="text-[14px] font-medium text-gray-800 leading-relaxed text-justify break-keep flex-1 overflow-y-auto mb-4 tracking-tight whitespace-pre-wrap">
                              &ldquo;{cardData.fortune_text}&rdquo;
                            </p>

                            {/* 메인 CTA (쿠팡 이동) */}
                            <button
                              onClick={handleCheckout}
                              className="w-full py-3.5 bg-gradient-to-r from-[#F37021] to-[#FF8F50] text-white rounded-xl font-black text-[15px] shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                            >
                              ✨ 내 운명템 보러가기
                            </button>

                            <p className="text-[9px] text-gray-400 text-center mt-3">
                              이 큐레이션은 쿠팡 파트너스 활동의 일환으로<br />이에 따른 일정액의 수수료를 제공받습니다.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
