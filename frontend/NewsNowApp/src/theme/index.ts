// 뉴픽 디자인 토큰
// 디자인 핸드오프 번들 (뉴픽.html) 기준 색상 시스템

export type Level = '하' | '중' | '상';

export const colors = {
  // Brand
  primary: '#5D7CE9',
  primaryLight: '#EEEEFF',
  primaryDark: '#5D7CE9',

  // Accents
  accentRed: '#FF4757',
  accentGreen: '#2ECC71',
  accentYellow: '#FFC107',

  // Categories (카테고리 컬러)
  catPolitics: '#FF4757',     // 정치
  catEconomy: '#5D7CE9',      // 경제
  catSociety: '#FFA502',      // 사회
  catCulture: '#A259FF',      // 문화
  catSports: '#2ECC71',       // 스포츠
  catIT: '#00C2D1',           // IT/과학
  catWorld: '#5D7CE9',        // 세계
  catEntertainment: '#FF6B9D',// 연예

  // Neutrals
  bg: '#F7F9FF',
  bgSoft: '#F5F5F5',
  white: '#FFFFFF',
  black: '#000000',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textSubtle: '#D1D5DB',

  // Border
  border: '#E5E7EB',
  borderSoft: '#E0E7FF',
  divider: '#F3F4F6',

  // Level (하/중/상)
  levelLow: '#9CA3AF',
  levelMid: '#5D7CE9',
  levelHigh: '#FF4757',
};

export const typography = {
  h1: { fontSize: 24, fontWeight: '700' as const },
  h2: { fontSize: 20, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  small: { fontSize: 13, fontWeight: '500' as const },
  tiny: { fontSize: 11, fontWeight: '500' as const },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

// 카테고리명 → 색상 매핑
export const categoryColor = (cat: string): string => {
  const key = cat.replace(/\s/g, '');
  if (key.includes('정치')) return colors.catPolitics;
  if (key.includes('경제') || key.includes('금융')) return colors.catEconomy;
  if (key.includes('사회')) return colors.catSociety;
  if (key.includes('문화')) return colors.catCulture;
  if (key.includes('스포츠')) return colors.catSports;
  if (key.includes('IT') || key.includes('과학')) return colors.catIT;
  if (key.includes('세계')) return colors.catWorld;
  if (key.includes('연예')) return colors.catEntertainment;
  return colors.primary;
};

// 레벨 → 색상
export const levelColor = (level: Level): string => {
  if (level === '상') return colors.levelHigh;
  if (level === '중') return colors.levelMid;
  return colors.levelLow;
};

// XP 구간 → 레벨
export const xpToLevel = (xp: number): Level => {
  if (xp >= 200) return '상';
  if (xp >= 100) return '중';
  return '하';
};
