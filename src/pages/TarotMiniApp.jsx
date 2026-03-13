import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { getOosThemeRoute } from '../utils/constants';

/* ═══════════════════════════════════════════════════════════════
   9-Card → 1-Card  3-Phase Animation Presets
   dealing(9장 뒷면 등장) → selecting(1장 선택) → flipped(앞면 공개)
   ═══════════════════════════════════════════════════════════════ */
const TOTAL_CARDS = 9;
const CHOSEN = 4;

const PRESETS = [
  /* ── 1. The Fan (부채꼴) ─────────────────────────── */
  {
    initial: (i) => ({ opacity: 0, scale: 0.26, x: 0, y: 220, rotate: 0 }),
    dealing: (i) => ({
      opacity: 1,
      scale: 0.26,
      rotate: -40 + i * 10,
      x: (i - 4) * 36,
      y: Math.abs(i - 4) * 7,
    }),
    selecting: (i) =>
      i === CHOSEN
        ? { opacity: 1, scale: 1, rotate: 0, x: 0, y: 0 }
        : { opacity: 0, scale: 0.12, y: 420, x: (i - 4) * 110, rotate: (i - 4) * 30 },
    dealT: (i) => ({ duration: 0.7, delay: i * 0.07, type: 'spring', stiffness: 100, damping: 13 }),
    selT: (i) =>
      i === CHOSEN
        ? { duration: 0.9, type: 'spring', stiffness: 65, damping: 16 }
        : { duration: 0.5, delay: (8 - Math.abs(i - 4)) * 0.04, ease: 'easeIn' },
  },

  /* ── 2. The Roulette (원형 회전) ─────────────────── */
  {
    initial: (i) => ({ opacity: 0, scale: 0.26, x: 0, y: 0, rotate: 0 }),
    dealing: (i) => {
      const a = (i * 40) * (Math.PI / 180);
      return { opacity: 1, scale: 0.26, x: Math.cos(a) * 105, y: Math.sin(a) * 105, rotate: i * 40 };
    },
    selecting: (i) => {
      if (i === CHOSEN) return { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 };
      const a = (i * 40) * (Math.PI / 180);
      return { opacity: 0, scale: 0.08, x: Math.cos(a) * 500, y: Math.sin(a) * 500, rotate: i * 40 + 180 };
    },
    dealT: (i) => ({ duration: 0.85, delay: i * 0.06, type: 'spring', stiffness: 90, damping: 12 }),
    selT: (i) =>
      i === CHOSEN
        ? { duration: 1.0, type: 'spring', stiffness: 55, damping: 15 }
        : { duration: 0.55, delay: i * 0.03, ease: [0.4, 0, 1, 1] },
  },

  /* ── 3. The Grid (3×3 배열) ──────────────────────── */
  {
    initial: (i) => ({ opacity: 0, scale: 0.26, x: 0, y: -200 }),
    dealing: (i) => {
      const row = Math.floor(i / 3) - 1;
      const col = (i % 3) - 1;
      return { opacity: 1, scale: 0.26, x: col * 80, y: row * 108, rotate: 0 };
    },
    selecting: (i) => {
      if (i === CHOSEN) return { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 };
      const row = Math.floor(i / 3) - 1;
      const col = (i % 3) - 1;
      return { opacity: 0, scale: 0.04, x: col * 280, y: row * 320, rotate: (i - 4) * 18 };
    },
    dealT: (i) => ({ duration: 0.55, delay: i * 0.06, type: 'spring', stiffness: 120, damping: 14 }),
    selT: (i) =>
      i === CHOSEN
        ? { duration: 0.85, type: 'spring', stiffness: 75, damping: 14 }
        : { duration: 0.4, delay: Math.abs(i - 4) * 0.05, ease: 'easeIn' },
  },

  /* ── 4. The Phantom (분신술) ─────────────────────── */
  {
    initial: (i) => ({ opacity: 0, scale: 0.30, x: 0, y: 0, rotate: 0 }),
    dealing: (i) => {
      const ox = [[-14, -10], [16, 8], [-8, 14], [12, -16], [0, 0], [-16, 12], [14, -8], [-10, 16], [8, -14]];
      return {
        opacity: i === CHOSEN ? 0.75 : 0.25 + (i % 3) * 0.08,
        scale: 0.30,
        x: ox[i][0],
        y: ox[i][1],
        rotate: (i - 4) * 2.5,
      };
    },
    selecting: (i) =>
      i === CHOSEN
        ? { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }
        : { opacity: 0, scale: 0.30, x: 0, y: 0, rotate: 0 },
    dealT: (i) => ({ duration: 0.45, delay: i * 0.025, type: 'spring', stiffness: 160, damping: 10 }),
    selT: (i) =>
      i === CHOSEN
        ? { duration: 1.1, type: 'spring', stiffness: 55, damping: 18 }
        : { duration: 0.35, ease: 'easeOut' },
  },
];

const PHASE_TITLE = {
  dealing: '🃏 운명의 카드를 섞는 중...',
  selecting: '✨ 당신의 카드를 선택합니다...',
  flipped: '🔮 오늘의 맞춤 사주 처방',
};

/* ═══════════════════════════════════════════════════════════════
   Card Back Component (9장 공용 뒷면)
   ═══════════════════════════════════════════════════════════════ */
function CardBack() {
  return (
    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-black rounded-3xl shadow-2xl border-2 border-indigo-500/30 flex items-center justify-center">
      <div className="w-4/5 h-4/5 border border-indigo-500/20 rounded-2xl flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse" />
        <span className="text-5xl drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] select-none">✨</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════ */
export default function TarotMiniApp() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid');
  const pid = searchParams.get('pid');

  const [authFailed, setAuthFailed] = useState(false);
  const [uidMismatch, setUidMismatch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState(null);
  const [showModal, setShowModal] = useState(true);

  const [animPhase, setAnimPhase] = useState('dealing');

  const preset = useMemo(
    () => PRESETS[Math.floor(Math.random() * PRESETS.length)],
    [],
  );

  // ── 텔레그램 환경 보안 검증 ──
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

  // ── DB 조달 ──
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
      } catch (_) {
        // fetch 실패 — 카드 없이 로딩 종료
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [uid, pid, authFailed]);

  // ── Phase 자동 전환 타이머 ──
  useEffect(() => {
    if (loading || !cardData) return;

    if (animPhase === 'dealing') {
      const t = setTimeout(() => setAnimPhase('selecting'), 2000);
      return () => clearTimeout(t);
    }
    if (animPhase === 'selecting') {
      const t = setTimeout(() => setAnimPhase('flipped'), 1200);
      return () => clearTimeout(t);
    }
  }, [animPhase, loading, cardData]);

  // ── 쿠팡 이동 ──
  const handleCheckout = useCallback(() => {
    if (!cardData) return;
    let targetUrl = cardData.link || cardData.short_link;

    if (cardData.is_oos) {
      targetUrl = getOosThemeRoute(cardData).url;
    } else {
      if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;
    }

    window.Telegram?.WebApp?.openLink(targetUrl);
    setTimeout(() => { window.Telegram?.WebApp?.close(); }, 500);
  }, [cardData]);

  const handleCloseModal = useCallback(() => setShowModal(false), []);

  const fakeViews = useMemo(() => {
    if (!cardData) return '0';
    const numCode = String(cardData.product_code || '').replace(/\D/g, '');
    const suffix = ((Number(numCode) || 0) % 90) + 10;
    const base = Number(cardData.total_views) || 0;
    const total = base === 0 ? suffix : Number(String(base) + String(suffix));
    return total >= 1000 ? (total / 1000).toFixed(1) + '천' : total.toLocaleString();
  }, [cardData]);

  /* ════ 에러 스크린 ════ */

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

  /* ════ 메인 2-Layer ════ */

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* ─── Layer 1 (z-10): 메인 사이트 배경 ─── */}
      <iframe
        src="https://daonpick.com"
        title="다온픽 메인"
        className="absolute inset-0 z-10 w-full h-full border-0"
        loading="lazy"
      />

      {/* ─── Layer 2 (z-100): 카드 모달 ─── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            key="modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-md flex flex-col items-center justify-center"
            onClick={handleCloseModal}
          >
            {/* ✖ 닫기 (모바일 선명도 극대화) */}
            <button
              onClick={(e) => { e.stopPropagation(); handleCloseModal(); }}
              className="absolute top-5 right-5 z-[999] w-11 h-11 flex items-center justify-center rounded-full bg-black/70 border-2 border-white/90 text-white text-2xl font-black shadow-[0_0_15px_rgba(255,255,255,0.6)] backdrop-blur-none"
              aria-label="닫기"
            >
              ✕
            </button>

            {/* 콘텐츠 (클릭 버블 차단) */}
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm flex flex-col items-center px-5">

              {loading ? (
                <div className="text-center animate-pulse">
                  <div className="w-12 h-12 border-4 border-[#F37021] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[#F37021] font-bold text-sm tracking-widest">운명을 해독하는 중...</p>
                </div>
              ) : cardData ? (
                <>
                  {/* Phase-aware 타이틀 */}
                  <motion.h2
                    key={animPhase}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-white font-black text-xl mb-6 tracking-tighter drop-shadow-lg text-center"
                  >
                    {PHASE_TITLE[animPhase]}
                  </motion.h2>

                  {/* ═══ 9-Card Arena ═══ */}
                  <div className="relative w-72 aspect-[2/3] mx-auto">
                    {Array.from({ length: TOTAL_CARDS }, (_, i) => {
                      const isChosen = i === CHOSEN;

                      if (animPhase === 'flipped' && !isChosen) return null;

                      const target =
                        animPhase === 'dealing'
                          ? preset.dealing(i)
                          : preset.selecting(i);

                      const transition =
                        animPhase === 'dealing'
                          ? preset.dealT(i)
                          : preset.selT(i);

                      return (
                        <motion.div
                          key={i}
                          initial={preset.initial(i)}
                          animate={target}
                          transition={transition}
                          className="absolute inset-0 will-change-transform"
                          style={{
                            zIndex: isChosen && animPhase !== 'dealing' ? 20 : i,
                          }}
                        >
                          {/* Perspective + Flip Wrapper */}
                          <div className="w-full h-full" style={{ perspective: '1200px' }}>
                            <div
                              className="w-full h-full relative"
                              style={{
                                transformStyle: 'preserve-3d',
                                transform: isChosen && animPhase === 'flipped' ? 'rotateY(180deg)' : '',
                                transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                            >
                              {/* ── Card Back (모든 카드 공용) ── */}
                              <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
                                <CardBack />
                              </div>

                              {/* ── Card Front (선택된 카드에만 존재) ── */}
                              {isChosen && (
                                <div
                                  className="absolute inset-0 w-full h-full bg-white rounded-3xl shadow-[0_0_30px_rgba(243,112,33,0.3)] overflow-hidden flex flex-col"
                                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                                >
                                  {/* 썸네일 */}
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

                                  {/* 사주 텍스트 + CTA */}
                                  <div className="flex-1 p-5 flex flex-col bg-gradient-to-b from-white to-gray-50">
                                    <p className="text-[14px] font-medium text-gray-800 leading-relaxed text-justify break-keep flex-1 overflow-y-auto mb-4 tracking-tight whitespace-pre-wrap">
                                      &ldquo;{cardData.fortune_text}&rdquo;
                                    </p>

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
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
