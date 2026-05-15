import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme';
import { CAT_FILTERS, NewsItem } from '../data/news';
import { useAppContext } from '../context/AppContext';
import NewsCard from '../components/NewsCard';
import CategoryPill from '../components/CategoryPill';
import { formatNewsDate } from '../utils/date';
import {
  fetchNewsList,
  fetchOverallLevel,
  getCachedNewsList,
  getCachedOverallLevel,
} from '../utils/newsApi';

type Props = {
  navigation: any;
};

function toDisplayLevel(level: number) {
  if (level <= 1) return '하';
  if (level === 2) return '중';
  return '상';
}

function toLevelLabel(level: number) {
  const normalized = Math.min(4, Math.max(1, Math.round(level || 1)));
  return `Lv${normalized}`;
}

export default function NewsListScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<string>('전체');
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { readIds, isScrapped, toggleScrap, userEmail, getCategoryNumericLevel } = useAppContext();

  const loadNews = useCallback(async () => {
    try {
      const levelNum = getCachedOverallLevel(userEmail) ?? await fetchOverallLevel(userEmail);
      const cachedNews = getCachedNewsList(levelNum);
      if (!cachedNews) {
        setLoading(true);
      }

      const data = cachedNews ?? await fetchNewsList(levelNum);

      const mapped: NewsItem[] = data.map((a: any) => {
        const catLevel = getCategoryNumericLevel(a.category);
        return {
          id: String(a.id),
          title: a.title,
          cat: a.category,
          summary: a.content ?? '',
          body: [],
          views: a.view_count ?? 0,
          time: formatNewsDate(a.pub_date, 'compact'),
          level: toDisplayLevel(catLevel),
          color: '',
        };
      });

      setNewsList(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [getCategoryNumericLevel, userEmail]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const filtered = useMemo(() => {
    if (filter === '전체') return newsList;
    return newsList.filter(n => n.cat === filter);
  }, [filter, newsList]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>뉴스목록</Text>
        <Text style={styles.subtitle}>난이도별 색깔로 한눈에 확인해 보세요</Text>
      </View>

      <View style={styles.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {CAT_FILTERS.map(f => (
            <CategoryPill
              key={f}
              label={f}
              active={filter === f}
              onPress={() => setFilter(f)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <NewsCard
            item={item}
            levelLabel={toLevelLabel(getCategoryNumericLevel(item.cat))}
            read={readIds.includes(item.id)}
            scrapped={isScrapped(item.id)}
            onPress={() =>
              navigation.navigate('NewsDetail', {
                newsId: item.id,
                levelStyle: item.level,
                levelLabel: toLevelLabel(getCategoryNumericLevel(item.cat)),
              })
            }
            onScrapPress={() => toggleScrap(item.id, item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>해당 카테고리 뉴스가 없어요</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  filterWrap: { height: 72, justifyContent: 'center' },
  filterRow: { paddingHorizontal: 20, paddingVertical: 0, alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 14 },
});
