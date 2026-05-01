import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, categoryColor, Level } from '../theme';
import { NewsItem } from '../data/news';
import { useAppContext, FONT_SCALE_LABEL, FontScale } from '../context/AppContext';
import StripePlaceholder from '../components/StripePlaceholder';
import LevelBadge from '../components/LevelBadge';
import { formatNewsDate } from '../utils/date';
import { API_BASE_URL } from '../config/api';

type Props = {
  navigation: any;
};

const { width: SCREEN_W } = Dimensions.get('window');
const SLIDE_GUTTER = 20; // 양쪽 여백
const SLIDE_WIDTH = SCREEN_W - SLIDE_GUTTER * 2;

function formatViews(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  return n.toLocaleString();
}

export default function HomeScreen({ navigation }: Props) {
  const {
    userEmail,
    userName,
    selectedCategories,
    readIds,
    getCurrentWeekReadDays,
    fontScale,
    setFontScale,
  } = useAppContext();

  // 글자 크기 선택 다이얼로그
  const openFontScalePicker = () => {
    const options: { text: string; value: FontScale }[] = [
      { text: `작게${fontScale === 'sm' ? '  ✓' : ''}`, value: 'sm' },
      { text: `보통${fontScale === 'md' ? '  ✓' : ''}`, value: 'md' },
      { text: `크게${fontScale === 'lg' ? '  ✓' : ''}`, value: 'lg' },
    ];
    Alert.alert('글자 크기', '뉴스 본문에 적용돼요.', [
      ...options.map(o => ({
        text: o.text,
        onPress: () => setFontScale(o.value),
      })),
      { text: '취소', style: 'cancel' as const },
    ]);
  };

  // 사용자 표시명 우선순위: userName → 이메일 앞부분 → '뉴픽 독자'
  const displayName = useMemo(() => {
    if (userName && userName.trim()) return userName.trim();
    if (!userEmail) return '뉴픽 독자';
    const at = userEmail.indexOf('@');
    return at > 0 ? userEmail.slice(0, at) : userEmail;
  }, [userName, userEmail]);

  // API 뉴스 데이터
  const [apiNews, setApiNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNews = useCallback(async () => {
    try {
      setLoading(true);

      let levelNum = 2;
      let categoryLevels: Record<string, number> = {};
      if (userEmail) {
        try {
          const levelRes = await fetch(`${API_BASE_URL}/quiz/level/${userEmail}`);
          const levelData = await levelRes.json();
          levelNum = levelData.overall_level ?? 2;
          categoryLevels = levelData.categories ?? {};
        } catch {}
      }

      const res = await fetch(`${API_BASE_URL}/news/?level=${levelNum}`);
      const data = await res.json();

      const toDisplayLevel = (n: number): Level => {
        if (n <= 1) return '하';
        if (n <= 3) return '중';
        return '상';
      };

      const mapped: NewsItem[] = (data as any[]).map(a => ({
        id: String(a.id),
        title: a.title,
        cat: a.category,
        summary: a.content ?? '',
        body: [],
        views: a.view_count ?? 0,
        time: formatNewsDate(a.pub_date, 'compact'),
        level: toDisplayLevel(categoryLevels[a.category] ?? levelNum),
        color: categoryColor(a.category),
      }));

      setApiNews(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useFocusEffect(
    useCallback(() => {
      loadNews();
    }, [loadNews]),
  );

  // 추천 뉴스: 관심 카테고리 기준 최대 4개. 부족하면 전체에서 채움.
  const recommended = useMemo(() => {
    if (apiNews.length === 0) return [];
    const rec = apiNews.filter(n =>
      selectedCategories.some(c => n.cat === c || n.cat.includes(c) || c.includes(n.cat))
    );
    return rec.length >= 2 ? rec.slice(0, 4) : apiNews.slice(0, 4);
  }, [apiNews, selectedCategories]);
  const recommendedLoop = useMemo(() => {
    if (recommended.length <= 1) return recommended;
    return [...recommended, recommended[0]];
  }, [recommended]);

  // 오늘의 인기 뉴스: 조회수 상위 5개
  const popular = useMemo(
    () => [...apiNews].sort((a, b) => b.views - a.views).slice(0, 5),
    [apiNews],
  );

  // 슬라이드 자동 이동
  const [slideIdx, setSlideIdx] = useState(0);
  const slideRef = useRef<FlatList>(null);

  useEffect(() => {
    if (recommended.length <= 1) return;
    const t = setInterval(() => {
      setSlideIdx(prev => {
        const next = prev + 1;
        slideRef.current?.scrollToIndex({ index: next, animated: true });
        return next >= recommended.length ? 0 : next;
      });
    }, 3000);
    return () => clearInterval(t);
  }, [recommended.length]);

  const handleSlideScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / SLIDE_WIDTH);
    if (recommended.length > 1 && idx === recommended.length) {
      setSlideIdx(0);
      requestAnimationFrame(() => {
        slideRef.current?.scrollToIndex({ index: 0, animated: false });
      });
      return;
    }
    if (idx !== slideIdx) setSlideIdx(idx);
  };

  // 이번주 요일별 읽음 상태: [월, 화, 수, 목, 금, 토, 일]
  // 예) 월요일에 3개 읽어도 월 한 칸만 켜지고, 월+화 둘 다 읽어야 월화 두 칸이 켜짐.
  // 주(週)가 바뀌면 자동으로 전부 꺼진 상태로 표시됨.
  const weekRead = getCurrentWeekReadDays();
  const weekLabels = ['월', '화', '수', '목', '금', '토', '일'];

  // 카테고리 타이틀용 이모지 맵
  const catEmoji = (cat: string) => {
    if (cat === '정치') return '🏛️';
    if (cat === '경제') return '💰';
    if (cat === '사회') return '🏙️';
    if (cat === 'IT/과학' || cat.includes('IT')) return '🔬';
    return '📰';
  };

  const catLabel = selectedCategories.length
    ? selectedCategories.join(' · ')
    : '오늘의';
  const catEmojiMain = selectedCategories.length ? catEmoji(selectedCategories[0]) : '✨';

  return (
    <SafeAreaView style={styles.container}>
      {/* Top header */}
      <View style={styles.topBar}>
        <Text style={styles.topLogo}>뉴픽</Text>
        <View style={styles.topRight}>
          <TouchableOpacity
            style={styles.fontBtn}
            activeOpacity={0.7}
            onPress={openFontScalePicker}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.fontBtnSmall}>가</Text>
            <Text style={styles.fontBtnLarge}>가</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('MyPage')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {displayName[0]?.toUpperCase() ?? '🙂'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        {/* Purple hero */}
        <View style={styles.hero}>
          <Text style={styles.greeting}>안녕하세요 👋</Text>
          <Text style={styles.heroName}>
            {displayName}님, 오늘도 뉴스 읽어볼까요?
          </Text>

          <View style={styles.readCounter}>
            <View>
              <Text style={styles.readCounterLabel}>오늘 읽은 뉴스</Text>
              <View style={styles.readCounterNumRow}>
                <Text style={styles.readCounterNum}>{readIds.length}</Text>
                <Text style={styles.readCounterUnit}>개</Text>
              </View>
            </View>
            <View style={styles.streakWrap}>
              <Text style={styles.streakLabel}>이번주 연속</Text>
              <View style={styles.streakRow}>
                {weekLabels.map((d, i) => (
                  <View key={d} style={styles.streakItem}>
                    <View
                      style={[
                        styles.streakDot,
                        weekRead[i] && styles.streakDotActive,
                      ]}
                    />
                    <Text style={styles.streakDay}>{d}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* 추천 뉴스 슬라이드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {catEmojiMain} <Text style={styles.sectionTitleEm}>{catLabel}</Text> 추천 뉴스
          </Text>

          {loading && apiNews.length === 0 ? (
            <View style={styles.slideLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <>
              <FlatList
                ref={slideRef}
                data={recommendedLoop}
                keyExtractor={(n, i) => `${n.id}-${i}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={SLIDE_WIDTH}
                decelerationRate="fast"
                onMomentumScrollEnd={handleSlideScroll}
                style={styles.slideList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('NewsDetail', { newsId: item.id })}
                    style={[styles.slideCard, { width: SLIDE_WIDTH }]}
                  >
                    <StripePlaceholder
                      color={item.color}
                      label={item.title}
                      style={styles.slideThumb}
                    />
                    <View style={styles.slideBody}>
                      <Text style={styles.slideCat}>{item.cat}</Text>
                      <Text style={styles.slideTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <View style={styles.slideMeta}>
                        <LevelBadge level={item.level} />
                        <Text style={styles.metaText}>
                          👁 {formatViews(item.views)}
                        </Text>
                        <Text style={styles.metaTimeDot}>·</Text>
                        <Text style={styles.metaText}>{item.time}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
              {/* 슬라이드 인디케이터 */}
              <View style={styles.dots}>
                {recommended.map((_item, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === slideIdx && styles.dotActive]}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        {/* 오늘의 인기 뉴스 */}
        <View style={[styles.section, { marginBottom: 32 }]}>
          <Text style={styles.sectionTitle}>
            🔥 오늘의 <Text style={styles.sectionTitleEm}>인기 뉴스</Text>
          </Text>

          <View style={styles.popCard}>
            {popular.map((item, i) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.popRow,
                  i === popular.length - 1 && styles.popRowLast,
                ]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('NewsDetail', { newsId: item.id })}
              >
                <View
                  style={[
                    styles.rankBadge,
                    i === 0 && styles.rankTop1,
                    i === 1 && styles.rankTop2,
                    i === 2 && styles.rankTop3,
                  ]}
                >
                  <Text
                    style={[
                      styles.rankText,
                      i === 0 && styles.rankTextTop1,
                      i === 1 && styles.rankTextTop2,
                      i === 2 && styles.rankTextTop3,
                    ]}
                  >
                    {i + 1}
                  </Text>
                </View>
                <View style={styles.popBody}>
                  <Text style={styles.popTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.popMeta}>
                    <LevelBadge level={item.level} />
                    <Text style={styles.popMetaCat}>{item.cat}</Text>
                    <Text style={styles.metaText}>
                      👁 {formatViews(item.views)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollBody: { paddingBottom: 20 },

  /* Top bar */
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  topLogo: { fontSize: 20, fontWeight: '900', color: colors.primary, letterSpacing: -0.5 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fontBtn: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  fontBtnSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 14,
  },
  fontBtnLarge: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 19,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: colors.primary },

  /* Hero (보라 그라디언트 — solid로 근사) */
  hero: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  heroName: { fontSize: 20, fontWeight: '800', color: colors.white, lineHeight: 28 },

  readCounter: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readCounterLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  readCounterNumRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  readCounterNum: { fontSize: 28, fontWeight: '900', color: colors.white },
  readCounterUnit: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

  streakWrap: { alignItems: 'flex-end' },
  streakLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 6 },
  streakRow: { flexDirection: 'row', gap: 4 },
  streakItem: { alignItems: 'center', gap: 3 },
  streakDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  streakDotActive: { backgroundColor: '#FFD700' },
  streakDay: { fontSize: 8, color: 'rgba(255,255,255,0.5)' },

  /* Sections */
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  sectionTitleEm: { color: colors.primary },

  /* Slide */
  slideLoading: { height: 200, alignItems: 'center', justifyContent: 'center' },
  slideList: { marginHorizontal: -20, paddingHorizontal: 20 },
  slideCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    marginRight: 0,
  },
  slideThumb: { height: 140, width: '100%' },
  slideBody: { padding: 14 },
  slideCat: { fontSize: 10, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  slideTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 8,
  },
  slideMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  metaText: { fontSize: 10, color: colors.textMuted },
  metaTimeDot: { fontSize: 10, color: colors.textSubtle, marginHorizontal: -4 },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },

  /* Popular list */
  popCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  popRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  popRowLast: { borderBottomWidth: 0 },
  rankBadge: {
    width: 20,
    height: 20,
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  rankTop1: { backgroundColor: '#FFD700' },
  rankTop2: { backgroundColor: '#C0C0C0' },
  rankTop3: { backgroundColor: '#CD7F32' },
  rankText: { fontSize: 11, fontWeight: '800', color: colors.white },
  rankTextTop1: { color: '#7B5E00' },
  rankTextTop2: { color: '#555555' },
  rankTextTop3: { color: colors.white },
  popBody: { flex: 1 },
  popTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 19,
    marginBottom: 4,
  },
  popMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  popMetaCat: { fontSize: 10, color: colors.textMuted },
});
