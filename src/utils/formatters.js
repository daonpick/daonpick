const BADGE_TEMPLATES = [
  () => '🔥 주간 급상승',
  () => `👁️ ${Math.floor(Math.random() * 301) + 200}명 보고 있음`,
  () => '📦 재구매율 1위',
  () => '⚡ 마감 임박',
  () => '⭐ 만족도 99%',
  () => '🏆 MD 강력 추천',
]

export const formatFakeViews = (baseViews, productCode) => {
  const numericStr = String(productCode ?? '').replace(/\D/g, '');
  const suffix = ((Number(numericStr) || 0) % 90) + 10;
  const base = Number(baseViews) || 0;
  const fakeNum = base === 0 ? suffix : Number(String(base) + String(suffix));

  if (fakeNum >= 10000) return (fakeNum / 10000).toFixed(1) + '만';
  if (fakeNum >= 1000) return (fakeNum / 1000).toFixed(1) + '천';
  return fakeNum.toLocaleString();
};

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const getUniqueBadges = () => shuffle(BADGE_TEMPLATES).slice(0, 3).map((fn) => fn())
