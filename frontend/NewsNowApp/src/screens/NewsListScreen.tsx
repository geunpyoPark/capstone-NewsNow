import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
} from 'react-native';
import { colors } from '../theme';
import { NEWS_DATA, CAT_FILTERS } from '../data/news';
import { useAppContext } from '../context/AppContext';
import NewsCard from '../components/NewsCard';
import CategoryPill from '../components/CategoryPill';

type Props = {
  navigation: any;
};

export default function NewsListScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<string>('전체');
  const { readIds, isScrapped, toggleScrap } = useAppContext();

  const filtered = useMemo(() => {
    if (filter === '전체') return NEWS_DATA;
    return NEWS_DATA.filter(n => n.cat === filter);
  }, [filter]);

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
  filterWrap: {
    height: 72,
    justifyContent: 'center',
  },
  filterRow: {
    paddingHorizontal: 20,
    paddingVertical: 0,
    alignItems: 'center',
  },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 14 },
});
