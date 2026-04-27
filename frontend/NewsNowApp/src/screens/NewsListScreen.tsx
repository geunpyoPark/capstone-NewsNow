import React, { useState, useEffect, useMemo } from 'react';
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

const BASE_URL = 'https://mainrepo-production-4ca1.up.railway.app';

type Props = {
  navigation: any;
};

export default function NewsListScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<string>('전체');
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { readIds, isScrapped, toggleScrap, userEmail } = useAppContext();

  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true);

        // 유저 레벨 조회
        let levelNum = 1;
        if (userEmail) {
          const levelRes = await fetch(`${BASE_URL}/quiz/level/${userEmail}`);
          const levelData = await levelRes.json();
          levelNum = levelData.overall_level ?? 1;
        }

        // 뉴스 목록 조회
        const cat = filter === '전체' ? '' : `&category=${encodeURIComponent(filter)}`;
        const res = await fetch(`${BASE_URL}/news/?level=${levelNum}${cat}`);
        const data = await res.json();

        const mapped: NewsItem[] = data.map((a: any) => ({
          id: String(a.id),
          title: a.title,
          cat: a.category,
          summary: a.content ?? '',
          body: [],
          views: 0,
          time: a.pub_date ?? '',
          level: levelNum === 1 ? '하' : levelNum === 2 ? '중' : '상',
          color: '',
        }));

        setNewsList(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, [filter, userEmail]);

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
            read={readIds.includes(item.id)}
            scrapped={isScrapped(item.id)}
            onPress={() => navigation.navigate('NewsDetail', { newsId: item.id })}
            onScrapPress={() => toggleScrap(item.id)}
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