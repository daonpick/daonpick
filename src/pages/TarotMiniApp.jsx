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
   90종 HOOK_PHRASES — category(첫 2자리) 기반 듀얼톤 카피라이팅
   ═══════════════════════════════════════════════════════════════ */
const HOOK_PHRASES = {
  "10": [
    { main: "오늘 오전, 당신의 막힌 금전운을 틔워줄 매개체입니다.", action: "미뤄뒀던 결단을 내리기에 완벽한 타이밍입니다." },
    { main: "정체된 재물 흐름을 환기할 기운이 담겨 있습니다.", action: "평소 망설이던 선택이 있다면 지금 확신을 가지세요." },
    { main: "지갑을 닫고만 있다고 돈이 모이는 것은 아닙니다.", action: "흐름을 뚫어줄 작고 확실한 변화를 지금 시작하세요." },
    { main: "재물의 기운은 작은 결단에서부터 굴러가기 시작합니다.", action: "우주가 오늘 당신에게 제안하는 이 기운을 쟁취하세요." },
    { main: "오늘 당신의 손끝에 닿은 이 기운은 결코 우연이 아닙니다.", action: "마음속에 묵혀둔 고민들을 시원하게 털어낼 시간입니다." },
    { main: "재물운의 막힌 혈을 뚫어줄 작지만 강력한 조각입니다.", action: "해가 중천에 뜨기 전, 나를 위한 결단을 완료하세요." },
    { main: "망설임은 운의 흐름을 지연시킬 뿐입니다.", action: "당신을 부르는 이 매개체를 통해 긍정적인 에너지를 채우세요." },
    { main: "부를 끌어당기는 것은 결국 실행력입니다.", action: "가벼운 마음으로 확인하고, 미뤄둔 선택의 마침표를 찍으세요." },
    { main: "오늘 하루, 당신의 금전 감각이 가장 예리해지는 순간입니다.", action: "이 기운을 확인하는 즉시 망설임 없이 행동으로 옮기세요." },
    { main: "흐르지 않는 물은 썩기 마련입니다. 재물도 마찬가지죠.", action: "일상의 궤도를 바꿀 신선한 에너지를 지금 바로 맞이하세요." },
  ],
  "20": [
    { main: "당신의 일상 공간에 쌓인 탁기를 씻어낼 기운입니다.", action: "지금 확인하는 순간, 마음속 짐들까지 시원하게 정돈될 것입니다." },
    { main: "머물고 있는 공간의 에너지를 바꿀 시간입니다.", action: "미뤄두었던 생활 속 작은 결단을 지금 바로 내려보세요." },
    { main: "답답했던 집안의 기운을 환기시킬 매개체입니다.", action: "나를 위한 작고 확실한 변화를 더 이상 늦추지 마세요." },
    { main: "환경이 바뀌면 운명도 바뀝니다.", action: "오늘 하루, 당신의 공간에 새로운 흐름을 불어넣어 보세요." },
    { main: "안식처의 밸런스가 무너지면 모든 일상이 피로해집니다.", action: "공간의 온도를 바꿔줄 이 기운을 지금 바로 확인하세요." },
    { main: "흐트러진 주변을 정돈할 가장 완벽한 매개체입니다.", action: "묵혀둔 골칫거리들을 시원하게 해결할 결단을 내리세요." },
    { main: "당신의 공간이 당신을 갉아먹게 두지 마세요.", action: "막힌 에너지를 부드럽게 순환시킬 변화를 시작하세요." },
    { main: "가장 오래 머무는 곳의 기운이 당신의 오늘을 결정합니다.", action: "주저하던 선택이 있다면 지금 가벼운 마음으로 끝내세요." },
    { main: "어수선한 일상에 평온을 가져다줄 맑은 에너지입니다.", action: "눈에 거슬리던 것들을 치워버릴 명쾌한 결단을 촉구합니다." },
    { main: "공간의 여백이 생겨야 새로운 행운이 들어올 수 있습니다.", action: "오늘 오전 중으로 미뤄둔 정리를 위한 선택을 완료하세요." },
  ],
  "30": [
    { main: "고갈된 체력과 에너지를 채워줄 생기의 원천입니다.", action: "내일을 위해 고민만 하던 것들을 지금 바로잡을 시간입니다." },
    { main: "몸과 마음의 밸런스를 되찾아줄 맑은 기운입니다.", action: "나를 돌보기 위한 결단을 더 이상 뒤로 미루지 마세요." },
    { main: "바닥난 활력을 끌어올릴 완벽한 타이밍입니다.", action: "당신의 일상에 필요한 에너지가 이 안에 담겨 있습니다." },
    { main: "가장 중요한 것은 당신의 컨디션입니다.", action: "오늘만큼은 나를 위한 건강한 선택을 흔쾌히 허락해 보세요." },
    { main: "지친 몸이 보내는 신호를 무시하지 마세요.", action: "스스로를 챙기기 위한 묵혀둔 결단을 지금 당장 내리세요." },
    { main: "당신의 방전된 에너지를 고속 충전해 줄 매개체입니다.", action: "건강을 향한 작지만 확실한 변화를 오늘 시작하세요." },
    { main: "활기가 돌아와야 멈춰있던 운도 다시 굴러갑니다.", action: "망설이던 나를 위한 투자를 지금 가볍게 실행해 보세요." },
    { main: "피로는 쌓아둘수록 덜어내기 어려워집니다.", action: "오늘 하루의 피로를 사르르 녹여줄 확실한 선택을 하세요." },
    { main: "당신의 굳어버린 일상에 활력을 불어넣을 조각입니다.", action: "미뤄둔 결정을 통해 잃어버린 텐션을 되찾으세요." },
    { main: "내 몸을 아끼는 첫걸음이 모든 행운의 시작입니다.", action: "주저하던 선택의 마침표를 찍고 가벼워진 오늘을 맞이하세요." },
  ],
  "40": [
    { main: "숨겨져 있던 당신의 매력을 발현시킬 매개체입니다.", action: "망설임 없이 나를 위한 선택을 할 때, 새로운 흐름이 열립니다." },
    { main: "자신감을 한층 끌어올려 줄 도화의 기운입니다.", action: "평소 눈여겨보던 변화가 있다면 지금 당장 시도해 보세요." },
    { main: "당신을 더욱 빛나게 할 작은 터닝포인트입니다.", action: "시선을 사로잡는 긍정적인 에너지를 품어보세요." },
    { main: "나를 가꾸는 결단이 좋은 인연을 끌어당깁니다.", action: "오늘 하루, 온전히 당신의 아름다움에만 집중하세요." },
    { main: "당신이 가진 고유의 빛을 탁하게 두지 마세요.", action: "스스로를 빛내기 위한 묵혀둔 결단을 시원하게 내리세요." },
    { main: "주변의 공기를 바꿀 만큼 매력적인 에너지가 담겨있습니다.", action: "변화를 두려워 말고 지금 바로 새로운 선택을 쟁취하세요." },
    { main: "매력은 겉모습이 아닌 스스로를 향한 확신에서 나옵니다.", action: "자신감을 채워줄 확실한 매개체를 가벼운 마음으로 확인하세요." },
    { main: "오늘, 당신의 도화살이 긍정적으로 만개하는 날입니다.", action: "망설이던 투자가 있다면 나를 위해 과감히 실행하세요." },
    { main: "사람들의 호감을 자연스럽게 끌어당길 마법 같은 조각입니다.", action: "나를 사랑하기 위한 작은 행동을 지금 바로 시작하세요." },
    { main: "당신의 가치를 높이는 선택에 이유를 달지 마세요.", action: "미뤄왔던 결정을 통해 한층 더 매력적인 오늘을 완성하세요." },
  ],
  "50": [
    { main: "요동치는 마음을 차분히 가라앉혀 줄 평온의 조각입니다.", action: "오늘 하루, 온전히 당신만을 위한 보상을 허락해 보세요." },
    { main: "복잡한 머릿속을 비워줄 고요한 기운입니다.", action: "망설이던 휴식과 안정을 위한 결단을 지금 바로 내리세요." },
    { main: "지친 감정선에 따뜻한 위안이 되어줄 매개체입니다.", action: "스스로를 다독이는 작은 선물을 가벼운 마음으로 확인해 보세요." },
    { main: "긴장된 에너지를 부드럽게 풀어줄 시간입니다.", action: "아무 생각 없이 이 평안의 기운을 흔쾌히 받아들여 보세요." },
    { main: "당신은 이미 충분히 많은 에너지를 소모했습니다.", action: "이제는 멈춰 서서 스스로를 돌볼 결단을 내려야 할 때입니다." },
    { main: "날카로워진 신경을 둥글게 깎아내려 줄 마법 같은 에너지입니다.", action: "미뤄둔 힐링을 위한 선택의 마침표를 지금 찍으세요." },
    { main: "마음의 여유가 생겨야 꼬여있던 일들도 풀리기 시작합니다.", action: "당신을 짓누르던 고민을 잊게 해줄 작은 변화를 시작하세요." },
    { main: "치열했던 오늘 하루를 부드럽게 마감해 줄 조각입니다.", action: "나에게 주는 확실한 보상을 망설임 없이 선택하세요." },
    { main: "스트레스를 비워낸 자리에 새로운 행운이 깃듭니다.", action: "고요한 안식을 위한 묵혀둔 결단을 시원하게 실행하세요." },
    { main: "온전한 내 편이 되어줄 위로의 에너지가 여기에 있습니다.", action: "더 이상 고민하지 말고 평온을 위한 결정을 내리세요." },
  ],
  "60": [
    { main: "당신의 성취를 한 단계 끌어올릴 상승의 기운입니다.", action: "머뭇거리던 선택지가 있다면, 지금 확신을 가지고 움직이세요." },
    { main: "멈춰있던 커리어의 흐름을 뚫어줄 강력한 매개체입니다.", action: "미뤄둔 일의 매듭을 지금 당장 단호하게 지어보세요." },
    { main: "당신의 능력을 돋보이게 할 명예의 조각입니다.", action: "성공을 향한 작은 결단을 오늘 오전 중에 완벽히 내려보세요." },
    { main: "자신감 있는 선택이 더 큰 운을 부르는 법입니다.", action: "묵혀둔 계획들을 실행에 옮기기에 가장 완벽한 타이밍입니다." },
    { main: "당신의 노력이 마침내 긍정적인 평가로 돌아올 기운입니다.", action: "스스로를 높여줄 확실한 결단을 망설임 없이 내리세요." },
    { main: "사소한 디테일이 당신의 클래스를 결정합니다.", action: "더 높은 곳으로 가기 위한 변화의 시작을 지금 맞이하세요." },
    { main: "경쟁에서 우위를 점하게 해줄 날카로운 에너지입니다.", action: "주저하던 승부수가 있다면 오늘 과감하게 실행으로 옮기세요." },
    { main: "당신의 이름값이 한층 무거워지는 상승 곡선의 시작입니다.", action: "성공을 서포트해 줄 이 매개체를 가벼운 마음으로 쟁취하세요." },
    { main: "기회는 준비된 자에게 결단의 형태로 찾아옵니다.", action: "미뤄왔던 중요한 선택들을 지금 속 시원하게 뚫어내세요." },
    { main: "오늘의 작은 변화가 내일의 거대한 성과로 돌아옵니다.", action: "당신의 명예를 빛내줄 확실한 행동을 지금 당장 시작하세요." },
  ],
  "70": [
    { main: "소중한 사람들과의 관계에 따뜻한 온기를 불어넣을 기운입니다.", action: "마음속에 담아둔 작은 마음을 오늘 행동으로 옮겨보세요." },
    { main: "가족 간의 막힌 대화를 부드럽게 풀어줄 매개체입니다.", action: "망설이던 소통의 결단을 지금 당장 시원하게 시작해 보세요." },
    { main: "당신의 사람들을 지켜줄 화목의 에너지입니다.", action: "평소 전하고 싶었던 온기를 더 이상 뒤로 미루지 마세요." },
    { main: "안정적이고 편안한 유대감을 형성할 시간입니다.", action: "관계의 밸런스를 맞춰줄 이 기운을 흔쾌히 받아들여 보세요." },
    { main: "가화만사성, 집안이 편안해야 바깥일도 술술 풀립니다.", action: "가정을 위한 묵혀둔 결단을 오늘 가벼운 마음으로 내리세요." },
    { main: "서먹했던 공기를 순식간에 녹여줄 마법 같은 조각입니다.", action: "소중한 이를 위한 작지만 확실한 변화를 지금 실행하세요." },
    { main: "당신의 작은 관심이 주변을 따뜻하게 물들일 것입니다.", action: "표현하지 못하고 미뤄뒀던 선택들을 오늘 꼭 완료하세요." },
    { main: "함께하는 공간의 온도를 1도 올려줄 긍정적인 에너지입니다.", action: "행복을 채워넣기 위한 결단을 망설임 없이 시작하세요." },
    { main: "관계의 서운함은 작은 다정함으로 쉽게 치유됩니다.", action: "화목을 위한 당신의 선택이 오늘 큰 빛을 발할 것입니다." },
    { main: "내 사람들을 챙기는 것만큼 확실한 액땜은 없습니다.", action: "주저하던 챙김의 결단을 지금 당장 행동으로 보여주세요." },
  ],
  "80": [
    { main: "정체된 일상에 새로운 환기와 활력을 가져다줄 매개체입니다.", action: "답답했던 흐름을 끊어낼 작은 변화를 지금 시작하세요." },
    { main: "멈춰있는 에너지를 역동적으로 굴려줄 기운입니다.", action: "새로운 시작을 위한 결단을 더 이상 늦추지 말고 내리세요." },
    { main: "당신의 반경을 넓혀줄 이동의 조각입니다.", action: "망설이던 외출이나 새로운 시도를 오늘 꼭 실행해 보세요." },
    { main: "흐르지 않는 물은 썩기 마련입니다. 일상의 궤도를 바꿀 때입니다.", action: "신선한 에너지를 채워줄 결단을 지금 당장 맞이해 보세요." },
    { main: "익숙한 곳을 벗어날 때 생각지도 못한 행운이 찾아옵니다.", action: "변화를 위한 묵혀둔 선택들을 오늘 속 시원히 뚫어내세요." },
    { main: "당신의 역마살이 가장 긍정적으로 폭발하는 날입니다.", action: "주저하던 움직임이 있다면 과감하게 행동으로 옮겨보세요." },
    { main: "갇혀있던 에너지를 바깥으로 발산해야 운이 트입니다.", action: "새로운 흐름을 만들어줄 이 기운을 가벼운 마음으로 잡으세요." },
    { main: "작은 동선의 변화가 거대한 나비효과를 일으킵니다.", action: "오늘 하루, 색다른 선택을 향한 결단을 망설임 없이 내리세요." },
    { main: "답답한 가슴을 뻥 뚫어줄 시원한 바람 같은 에너지입니다.", action: "미뤄뒀던 계획들을 실행에 옮기기에 가장 완벽한 타이밍입니다." },
    { main: "이동과 변화의 기운이 당신의 오늘을 강력하게 지지합니다.", action: "정체기를 벗어나기 위한 작고 확실한 행동을 지금 시작하세요." },
  ],
  "90": [
    { main: "지친 하루의 끝, 당신에게 완벽한 위로가 되어줄 행운입니다.", action: "오늘만큼은 고민 없이 나를 위한 선물을 흔쾌히 고르세요." },
    { main: "메마른 일상에 작은 웃음을 찾아줄 기운입니다.", action: "묵혀둔 위시리스트가 있다면 지금 가볍게 털어내 보세요." },
    { main: "당신을 미소 짓게 할 부드러운 힐링의 조각입니다.", action: "복잡한 생각은 접어두고 이 소소한 행복을 즉시 즐겨보세요." },
    { main: "거창하지 않아도 좋습니다. 가장 중요한 건 오늘의 기분이죠.", action: "스트레스를 사르르 녹여줄 당신만의 결단을 지금 내리세요." },
    { main: "소소한 기쁨이 모여 긍정적인 운의 흐름을 만들어냅니다.", action: "나를 미소 짓게 할 묵혀둔 선택을 지금 시원하게 실행하세요." },
    { main: "무겁고 진지한 고민은 잠시 내려놓아도 괜찮습니다.", action: "당신을 기분 좋게 만들 작고 확실한 변화를 오늘 시작하세요." },
    { main: "평범한 일상을 특별하게 만들어줄 마법 같은 에너지입니다.", action: "망설이던 나를 위한 소소한 보상을 가벼운 마음으로 쟁취하세요." },
    { main: "작은 소비 하나로 하루의 온도가 완전히 달라질 수 있습니다.", action: "미뤄뒀던 기분 전환을 위한 결단을 오늘 오전에 완료하세요." },
    { main: "당신의 수고에 스스로 박수를 쳐주어야 할 타이밍입니다.", action: "아무 이유 없이 나를 위한 선택을 하는 사치를 부려보세요." },
    { main: "작고 소중한 기운이 당신의 오늘을 포근하게 감싸줍니다.", action: "주저하던 소박한 선택의 마침표를 찍고 행복을 충전하세요." },
  ],
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
  const [selectedHook, setSelectedHook] = useState(null);

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

  // ── cardData 확정 시 90종 Hook 랜덤 세팅 ──
  useEffect(() => {
    if (!cardData) return;
    const prefix = String(cardData.category || cardData.product_code || '').substring(0, 2);
    const phraseArray = HOOK_PHRASES[prefix] || HOOK_PHRASES["10"];
    setSelectedHook(phraseArray[Math.floor(Math.random() * phraseArray.length)]);
  }, [cardData]);

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
            {/* 최상단 공정위 배너 (다온픽 1층 사이트와 일체감 형성) */}
            <div className="absolute top-0 left-0 w-full bg-[#1e293b] text-white/80 text-[10px] md:text-xs py-1.5 text-center z-50">
              이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
            </div>

            {/* ✖ 닫기 (모바일 선명도 극대화) */}
            <button
              onClick={(e) => { e.stopPropagation(); handleCloseModal(); }}
              className="absolute top-10 right-5 z-[999] w-11 h-11 flex items-center justify-center rounded-full bg-black/70 border-2 border-white/90 text-white text-2xl font-black shadow-[0_0_15px_rgba(255,255,255,0.6)] backdrop-blur-none"
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
                                    <div className="mt-4 px-2 text-center break-keep flex-1 overflow-y-auto mb-4">
                                      <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                                        {selectedHook?.main}
                                      </p>
                                      <div className="h-3" />
                                      <p className="text-orange-600 font-bold text-sm md:text-base leading-relaxed drop-shadow-sm">
                                        {selectedHook?.action}
                                      </p>
                                    </div>

                                    <button
                                      onClick={handleCheckout}
                                      className="w-full py-3.5 bg-gradient-to-r from-[#F37021] to-[#FF8F50] text-white rounded-xl font-black text-[15px] shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                                    >
                                      ✨ 내 운명템 보러가기
                                    </button>

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
