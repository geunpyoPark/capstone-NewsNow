import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_CATEGORY_LEVELS,
  normalizeCategoryLevelMap,
  normalizeMainCategory,
  XP_CORRECT,
  XP_WRONG,
  NewsItem,
} from '../data/news';
import { xpToLevel } from '../theme';
import { API_BASE_URL } from '../config/api';
import { clearOnboarded } from '../utils/onboarding';

type CatXp = Record<string, number>;
type ScrappedWord = {
  id: string;
  word: string;
  definition: string;
  articleId?: number | null;
};

export type FontScale = 'sm' | 'md' | 'lg';

// 글자 크기 배수. NewsDetail 본문 등 읽기 텍스트에 곱해서 사용.
export const FONT_SCALE_MULTIPLIER: Record<FontScale, number> = {
  sm: 0.9,
  md: 1.0,
  lg: 1.2,
};

export const FONT_SCALE_LABEL: Record<FontScale, string> = {
  sm: '작게',
  md: '보통',
  lg: '크게',
};

type AppState = {
  ready: boolean;
  userEmail: string | null;
  userName: string | null;
  selectedCategories: string[];
  readIds: string[];
  scrappedIds: string[];
  scrappedArticles: NewsItem[];
  scrappedWords: ScrappedWord[];
  catXp: CatXp;
  categoryBaseLevels: Record<string, number>;
  solvedQuizIds: string[];
  todayReadDate: string;
  todayReadIds: string[];
  // 이번주 요일별 읽음 상태 (월=0 ~ 일=6).
  // weekStartMs는 현재 기록된 주의 월요일 00:00 타임스탬프.
  // Date.now()로 계산한 월요일이 다르면 새 주가 된 것으로 보고 리셋한다.
  weekStartMs: number;
  readWeekdays: boolean[];
  fontScale: FontScale;
};

type AppContextValue = AppState & {
  setUserEmail: (email: string | null) => void;
  setUserName: (name: string | null) => void;
  setSelectedCategories: (cats: string[]) => void;
  setCategoryBaseLevels: (levels: Record<string, number>) => void;
  markRead: (newsId: string) => void;
  toggleScrap: (newsId: string, article?: NewsItem) => void;
  isScrapped: (newsId: string) => boolean;
  scrapWord: (word: string, definition: string, articleId: number) => Promise<{ ok: boolean; message: string }>;
  isWordScrapped: (word: string, articleId?: number | null) => boolean;
  refreshScrapWords: () => Promise<void>;
  addQuizResult: (newsId: string, cat: string, correct: boolean) => { firstAttempt: boolean; delta: number; levelUp: boolean };
  getCategoryXp: (cat: string) => number;
  getCategoryLevel: (cat: string) => '하' | '중' | '상';
  getCategoryNumericLevel: (cat: string) => number;
  getTodayReadCount: () => number;
  /** 이번주(월~일)의 요일별 읽음 여부. 지난주 데이터면 전부 false로 반환. */
  getCurrentWeekReadDays: () => boolean[];
  setFontScale: (s: FontScale) => void;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const defaultState: AppState = {
  ready: false,
  userEmail: null,
  userName: null,
  selectedCategories: [],
  readIds: [],
  scrappedIds: [],
  scrappedArticles: [],
  scrappedWords: [],
  catXp: {},
  categoryBaseLevels: DEFAULT_CATEGORY_LEVELS,
  solvedQuizIds: [],
  todayReadDate: '',
  todayReadIds: [],
  weekStartMs: 0,
  readWeekdays: [false, false, false, false, false, false, false],
  fontScale: 'md',
};

// 이번주 월요일 00:00 타임스탬프
function getMondayStartMs(ts: number): number {
  const d = new Date(ts);
  // JS getDay(): 일=0, 월=1, ..., 토=6  →  월요일 오프셋
  const mondayOffset = (d.getDay() + 6) % 7; // 월=0, 화=1, ..., 일=6
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - mondayOffset);
  return d.getTime();
}

// 월=0 ~ 일=6 인덱스
function getWeekdayIndex(ts: number): number {
  return (new Date(ts).getDay() + 6) % 7;
}

function getLocalDateKey(ts: number = Date.now()): string {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = '@newspick/appstate/v1';
const USER_PROGRESS_KEY = '@newspick/userProgress/v1';

type UserProgress = Pick<
  AppState,
  'selectedCategories' | 'readIds' | 'scrappedIds' | 'scrappedArticles' | 'catXp' | 'categoryBaseLevels' | 'solvedQuizIds' | 'todayReadDate' | 'todayReadIds' | 'weekStartMs' | 'readWeekdays'
>;

const emptyProgress = (): UserProgress => ({
  selectedCategories: [],
  readIds: [],
  scrappedIds: [],
  scrappedArticles: [],
  catXp: {},
  categoryBaseLevels: DEFAULT_CATEGORY_LEVELS,
  solvedQuizIds: [],
  todayReadDate: '',
  todayReadIds: [],
  weekStartMs: 0,
  readWeekdays: [false, false, false, false, false, false, false],
});

const pickProgress = (state: AppState): UserProgress => ({
  selectedCategories: state.selectedCategories,
  readIds: state.readIds,
  scrappedIds: state.scrappedIds,
  scrappedArticles: state.scrappedArticles,
  catXp: state.catXp,
  categoryBaseLevels: normalizeCategoryLevelMap(state.categoryBaseLevels),
  solvedQuizIds: state.solvedQuizIds,
  todayReadDate: state.todayReadDate,
  todayReadIds: state.todayReadIds,
  weekStartMs: state.weekStartMs,
  readWeekdays: state.readWeekdays,
});

async function readUserProgressMap(): Promise<Record<string, UserProgress>> {
  try {
    const raw = await AsyncStorage.getItem(USER_PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function saveUserProgress(email: string | null, progress: UserProgress): Promise<void> {
  if (!email) return;
  const map = await readUserProgressMap();
  map[email] = progress;
  await AsyncStorage.setItem(USER_PROGRESS_KEY, JSON.stringify(map));
}

async function clearUserProgress(email: string | null): Promise<void> {
  if (!email) return;
  const map = await readUserProgressMap();
  delete map[email];
  await AsyncStorage.setItem(USER_PROGRESS_KEY, JSON.stringify(map));
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(defaultState);

  // 초기 로드
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setState({ ...defaultState, ...parsed, ready: true });
          return;
        }
      } catch (e) {
        // ignore
      }
      setState(s => ({ ...s, ready: true }));
    })();
  }, []);

  // 저장
  useEffect(() => {
    if (!state.ready) return;
    const { ready, ...rest } = state;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rest)).catch(() => {});
    saveUserProgress(state.userEmail, pickProgress(state)).catch(() => {});
  }, [state]);

  const refreshScrapWords = useCallback(async () => {
    if (!state.userEmail) {
      setState(s => ({ ...s, scrappedWords: [] }));
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/scrap/words/${encodeURIComponent(state.userEmail)}`);
      const data = await res.json();
      const words = Array.isArray(data)
        ? data.map((item: any) => ({
            id: String(item.id),
            word: item.word,
            definition: item.definition,
            articleId: item.article_id ?? null,
          }))
        : [];
      setState(s => ({ ...s, scrappedWords: words }));
    } catch (e) {
      console.error(e);
    }
  }, [state.userEmail]);

  useEffect(() => {
    refreshScrapWords();
  }, [refreshScrapWords]);

  const setUserEmail = useCallback((email: string | null) => {
    if (!email) {
      setState(s => ({ ...s, userEmail: null }));
      return;
    }

    const previousEmail = state.userEmail;
    const previousProgress = pickProgress(state);
    saveUserProgress(previousEmail, previousProgress)
      .then(readUserProgressMap)
      .then(map => {
        const progress = map[email] ?? emptyProgress();
        setState(s => ({
          ...s,
          userEmail: email,
          ...progress,
          categoryBaseLevels: normalizeCategoryLevelMap(progress.categoryBaseLevels),
        }));
        fetch(`${API_BASE_URL}/quiz/level/${encodeURIComponent(email)}`)
          .then(res => res.json())
          .then(data => {
            if (data?.has_result === false) return;
            setState(s => ({
              ...s,
              categoryBaseLevels: normalizeCategoryLevelMap(data?.categories),
            }));
          })
          .catch(() => {});
      })
      .catch(() => {
        setState(s => ({ ...s, userEmail: email }));
      });
  }, [state]);

  const setUserName = useCallback((name: string | null) => {
    setState(s => ({ ...s, userName: name }));
  }, []);

  const setSelectedCategories = useCallback((cats: string[]) => {
    setState(s => ({ ...s, selectedCategories: cats }));
  }, []);

  const setCategoryBaseLevels = useCallback((levels: Record<string, number>) => {
    setState(s => ({ ...s, categoryBaseLevels: normalizeCategoryLevelMap(levels) }));
  }, []);

  const markRead = useCallback((newsId: string) => {
    setState(s => {
      // 이번주 요일 체크: 주가 바뀌었으면 flags 리셋 후 오늘 요일만 true
      const now = Date.now();
      const todayKey = getLocalDateKey(now);
      const currentWeekStart = getMondayStartMs(now);
      const todayIdx = getWeekdayIndex(now);
      const weekChanged = s.weekStartMs !== currentWeekStart;
      const nextWeekdays = weekChanged
        ? [false, false, false, false, false, false, false]
        : [...s.readWeekdays];
      nextWeekdays[todayIdx] = true;
      const todayIds = s.todayReadDate === todayKey ? s.todayReadIds : [];
      const nextTodayReadIds = todayIds.includes(newsId)
        ? todayIds
        : [...todayIds, newsId];
      const nextReadIds = s.readIds.includes(newsId)
        ? s.readIds
        : [...s.readIds, newsId];

      return {
        ...s,
        readIds: nextReadIds,
        todayReadDate: todayKey,
        todayReadIds: nextTodayReadIds,
        weekStartMs: currentWeekStart,
        readWeekdays: nextWeekdays,
      };
    });
  }, []);

  const getTodayReadCount = useCallback((): number => {
    if (state.todayReadDate !== getLocalDateKey()) {
      return 0;
    }
    return state.todayReadIds.length;
  }, [state.todayReadDate, state.todayReadIds]);

  const getCurrentWeekReadDays = useCallback((): boolean[] => {
    const currentWeekStart = getMondayStartMs(Date.now());
    if (state.weekStartMs !== currentWeekStart) {
      // 지난주 기록 → 이번주는 전부 비어있는 상태로 표시
      return [false, false, false, false, false, false, false];
    }
    return state.readWeekdays;
  }, [state.weekStartMs, state.readWeekdays]);

  const toggleScrap = useCallback((newsId: string, article?: NewsItem) => {
    setState(s => {
      const exists = s.scrappedIds.includes(newsId);
      if (!exists && s.userEmail) {
        fetch(`${API_BASE_URL}/scrap/article`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_email: s.userEmail, article_id: Number(newsId) }),
        }).catch(() => {});
      }
      return {
        ...s,
        scrappedIds: exists
          ? s.scrappedIds.filter(id => id !== newsId)
          : [...s.scrappedIds, newsId],
        scrappedArticles: exists
          ? s.scrappedArticles.filter(a => a.id !== newsId)
          : article
          ? [...s.scrappedArticles, article]
          : s.scrappedArticles,
      };
    });
  }, []);

  const isScrapped = useCallback((newsId: string) => {
    return state.scrappedIds.includes(newsId);
  }, [state.scrappedIds]);

  const isWordScrapped = useCallback((word: string, articleId?: number | null) => {
    return state.scrappedWords.some(item => item.word === word && (articleId == null || item.articleId === articleId));
  }, [state.scrappedWords]);

  const scrapWord = useCallback(async (word: string, definition: string, articleId: number) => {
    if (!state.userEmail) {
      return { ok: false, message: '로그인 후 사용할 수 있어요.' };
    }

    if (state.scrappedWords.some(item => item.word === word && item.articleId === articleId)) {
      return { ok: true, message: '이미 저장한 단어예요.' };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/scrap/word`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: state.userEmail,
          word,
          definition,
          article_id: articleId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, message: data?.detail ?? '단어 저장에 실패했어요.' };
      }
      await refreshScrapWords();
      return { ok: true, message: data?.message ?? '단어 스크랩 저장 완료!' };
    } catch (e) {
      console.error(e);
      return { ok: false, message: '단어 저장 중 오류가 발생했어요.' };
    }
  }, [refreshScrapWords, state.scrappedWords, state.userEmail]);

  const addQuizResult = useCallback((newsId: string, cat: string, correct: boolean) => {
    const firstAttempt = !state.solvedQuizIds.includes(newsId);
    const delta = firstAttempt ? (correct ? XP_CORRECT : XP_WRONG) : 0;
    const normalizedCat = normalizeMainCategory(cat);
    let levelUp = false;

    if (firstAttempt) {
      setState(s => {
        const prevXp = s.catXp[normalizedCat] ?? 0;
        const nextXp = Math.max(0, prevXp + delta);
        levelUp = xpToLevel(nextXp) !== xpToLevel(prevXp) && nextXp > prevXp;
        return {
          ...s,
          catXp: { ...s.catXp, [normalizedCat]: nextXp },
          solvedQuizIds: [...s.solvedQuizIds, newsId],
        };
      });
    }

    return { firstAttempt, delta, levelUp };
  }, [state.solvedQuizIds]);

  const getCategoryXp = useCallback((cat: string) => {
    const normalizedCat = normalizeMainCategory(cat);
    return Object.entries(state.catXp).reduce((sum, [key, xp]) => {
      return normalizeMainCategory(key) === normalizedCat ? sum + xp : sum;
    }, 0);
  }, [state.catXp]);

  const getCategoryNumericLevel = useCallback((cat: string) => {
    const normalizedCat = normalizeMainCategory(cat);
    const xp = Object.entries(state.catXp).reduce((sum, [key, value]) => {
      return normalizeMainCategory(key) === normalizedCat ? sum + value : sum;
    }, 0);
    const baseLevel = normalizeCategoryLevelMap(state.categoryBaseLevels)[normalizedCat] ?? 2;
    return Math.min(4, Math.max(1, baseLevel + Math.floor(xp / 100)));
  }, [state.catXp, state.categoryBaseLevels]);

  const getCategoryLevel = useCallback((cat: string) => {
    const level = getCategoryNumericLevel(cat);
    if (level <= 1) return '하';
    if (level === 2) return '중';
    return '상';
  }, [getCategoryNumericLevel]);

  const setFontScale = useCallback((s: FontScale) => {
    setState(prev => ({ ...prev, fontScale: s }));
  }, []);

  const logout = useCallback(async () => {
    await saveUserProgress(state.userEmail, pickProgress(state));
    setState(s => ({
      ...s,
      userEmail: null,
      userName: null,
      scrappedWords: [],
    }));
  }, [state]);

  const deleteAccount = useCallback(async () => {
    const email = state.userEmail;
    if (email) {
      await clearOnboarded(email);
      await clearUserProgress(email);
    }
    setState({
      ...defaultState,
      ready: true,
      fontScale: state.fontScale,
    });
  }, [state.fontScale, state.userEmail]);

  const value: AppContextValue = {
    ...state,
    setUserEmail,
    setUserName,
    setSelectedCategories,
    setCategoryBaseLevels,
    markRead,
    toggleScrap,
    isScrapped,
    scrapWord,
    isWordScrapped,
    refreshScrapWords,
    addQuizResult,
    getCategoryXp,
    getCategoryLevel,
    getCategoryNumericLevel,
    getTodayReadCount,
    getCurrentWeekReadDays,
    setFontScale,
    logout,
    deleteAccount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
};
