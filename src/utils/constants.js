export const CATEGORY_BUTTONS = [
  { id: "ALL", label: "전체", dbPrefix: null },
  { id: "HOT", label: "🔥핫딜", dbPrefix: "10" },
  { id: "LIV", label: "✨생활/주방", dbPrefix: "20" },
  { id: "HLT", label: "💊식품/건강", dbPrefix: "30" },
  { id: "BTY", label: "🪞뷰티/패션", dbPrefix: "40" },
  { id: "HOM", label: "🛋️홈/인테리어", dbPrefix: "50" },
  { id: "DIG", label: "🤖가전/디지털", dbPrefix: "60" },
  { id: "KID", label: "👼출산/유아동", dbPrefix: "70" },
  { id: "SPO", label: "✈️스포츠/레저", dbPrefix: "80" },
  { id: "PET", label: "🐶반려/취미", dbPrefix: "90" },
];

export const OOS_THEME_ROUTES = {
  '4': { label: '💎 블랙라벨', url: 'https://link.coupang.com/a/dNKFsQ' },
  '5': { label: '🎁 테마라운지', url: 'https://link.coupang.com/a/dNKLhu' },
  '6': { label: '⚡ 플래시딜', url: 'https://link.coupang.com/a/dNKQGF' },
  '1': { label: '🥗 프레시마켓', url: 'https://link.coupang.com/a/dNKRLu' },
  '3': { label: '🥗 프레시마켓', url: 'https://link.coupang.com/a/dNKRLu' },
  '8': { label: '🥗 프레시마켓', url: 'https://link.coupang.com/a/dNKRLu' },
  '2': { label: '✈️ 히든게이트', url: 'https://link.coupang.com/a/dNKLIg' },
  '7': { label: '✈️ 히든게이트', url: 'https://link.coupang.com/a/dNKLIg' },
  '9': { label: '✈️ 히든게이트', url: 'https://link.coupang.com/a/dNKLIg' },
};

export const GOLDBOX_URL = 'https://link.coupang.com/a/dQHV5K';

export const LOADING_PHRASES = [
  '⚡ 실시간 최저가 혜택을 확인 중입니다...',
  '🎁 시크릿 할인가를 적용하고 있습니다...',
  '✨ VIP 전용 특가 페이지로 이동합니다.',
];

export const ITEMS_PER_PAGE = 10;

export const getOosThemeRoute = (product) => {
  const code = String(product.category || product.display_code || '');
  const prefix = code.charAt(0);
  return OOS_THEME_ROUTES[prefix] || OOS_THEME_ROUTES['1'];
};
