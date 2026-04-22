import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { XP_CORRECT, XP_WRONG } from '../data/news';
import { xpToLevel } from '../theme';

type CatXp = Record<string, number>;

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
  selectedCategories: string[];
  readIds: string[];
  scrappedIds: string[];
  catXp: CatXp;
  solvedQuizIds: string[];
  // 이번주 요일별 읽음 상태 (월=0 ~ 일=6).
  // weekStartMs는 현재 기록된 주의 월요일 00:00 타임스탬프.
  // Date.now()로 계산한 월요일이 다르면 새 주가 된 것으로 보고 리셋한다.
  weekStartMs: number;
  readWeekdays: boolean[];
  fontScale: FontScale;
};

type AppContextValue = AppState & {
  setUserEmail: (email: string | null) => void;
  setSelectedCategories: (cats: string[]) => void;
  markRead: (newsId: string) => void;
  toggleScrap: (newsId: string) => void;
  isScrapped: (newsId: string) => boolean;
  addQuizResult: (newsId: string, cat: string, correct: boolean) => { firstAttempt: boolean; delta: number; levelUp: boolean };
  getCategoryXp: (cat: string) => number;
  getCategoryLevel: (cat: string) => '하' | '중' | '상';
  /** 이번주(월~일)의 요일별 읽음 여부. 지난주 데이터면 전부 false로 반환. */
  getCurrentWeekReadDays: () => boolean[];
  setFontScale: (s: FontScale) => void;
  logout: () => Promise<void>;
};

const defaultState: AppState = {
  ready: false,
  userEmail: null,
  selectedCategories: [],
  readIds: [],
  scrappedIds: [],
  catXp: {},
  solvedQuizIds: [],
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

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = '@newspick/appstate/v1';

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
  }, [state]);

  const setUserEmail = useCallback((email: string | null) => {
    setState(s => ({ ...s, userEmail: email }));
  }, []);

  const setSelectedCategories = useCallback((cats: string[]) => {
    setState(s => ({ ...s, selectedCategories: cats }));
  }, []);

  const markRead = useCallback((newsId: string) => {
    setState(s => {
      if (s.readIds.includes(newsId)) return s;

      // 이번주 요일 체크: 주가 바뀌었으면 flags 리셋 후 오늘 요일만 true
      const now = Date.now();
      const currentWeekStart = getMondayStartMs(now);
      const todayIdx = getWeekdayIndex(now);
      const weekChanged = s.weekStartMs !== currentWeekStart;
      const nextWeekdays = weekChanged
        ? [false, false, false, false, false, false, false]
        : [...s.readWeekdays];
      nextWeekdays[todayIdx] = true;

      return {
        ...s,
        readIds: [...s.readIds, newsId],
        weekStartMs: currentWeekStart,
        readWeekdays: nextWeekdays,
      };
    });
  }, []);

  const getCurrentWeekReadDays = useCallback((): boolean[] => {
    const currentWeekStart = getMondayStartMs(Date.now());
    if (state.weekStartMs !== currentWeekStart) {
      // 지난주 기록 → 이번주는 전부 비어있는 상태로 표시
      return [false, false, false, false, false, false, false];
    }
    return state.readWeekdays;
  }, [state.weekStartMs, state.readWeekdays]);

  const toggleScrap = useCallback((newsId: string) => {
    setState(s => {
      const exists = s.scrappedIds.includes(newsId);
      return {
        ...s,
        scrappedIds: exists
          ? s.scrappedIds.filter(id => id !== newsId)
          : [...s.scrappedIds, newsId],
      };
    });
  }, []);

  const isScrapped = useCallback((newsId: string) => {
    return state.scrappedIds.includes(newsId);
  }, [state.scrappedIds]);

  const addQuizResult = useCallback((newsId: string, cat: string, correct: boolean) => {
    const firstAttempt = !state.solvedQuizIds.includes(newsId);
    const delta = firstAttempt ? (correct ? XP_CORRECT : XP_WRONG) : 0;
    let levelUp = false;

    if (firstAttempt) {
      setState(s => {
        const prevXp = s.catXp[cat] ?? 0;
        const nextXp = Math.max(0, prevXp + delta);
        levelUp = xpToLevel(nextXp) !== xpToLevel(prevXp) && nextXp > prevXp;
        return {
          ...s,
          catXp: { ...s.catXp, [cat]: nextXp },
          solvedQuizIds: [...s.solvedQuizIds, newsId],
        };
      });
    }

    return { firstAttempt, delta, levelUp };
  }, [state.solvedQuizIds]);

  const getCategoryXp = useCallback((cat: string) => {
    return state.catXp[cat] ?? 0;
  }, [state.catXp]);

  const getCategoryLevel = useCallback((cat: string) => {
    return xpToLevel(state.catXp[cat] ?? 0);
  }, [state.catXp]);

  const setFontScale = useCallback((s: FontScale) => {
    setState(prev => ({ ...prev, fontScale: s }));
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setState({ ...defaultState, ready: true });
  }, []);

  const value: AppContextValue = {
    ...state,
    setUserEmail,
    setSelectedCategories,
    markRead,
    toggleScrap,
    isScrapped,
    addQuizResult,
    getCategoryXp,
    getCategoryLevel,
    getCurrentWeekReadDays,
    setFontScale,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
};

