import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { colors, categoryColor } from '../theme';
import { CAT_FILTERS } from '../data/news';
import CategoryPill from '../components/CategoryPill';
import { API_BASE_URL } from '../config/api';

type Props = {
  navigation: any;
};

export default function FourCutScreen({ navigation }: Props) {
  const [fourCutList, setFourCutList] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('전체');

  useEffect(() => {
    const loadFourCut = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/news/fourcut`);
        const data = await res.json();
        setFourCutList(data);
      } catch (e) {
        console.error(e);
      }
    };

    loadFourCut();
  }, []);

  const filtered = useMemo(() => {
    if (filter === '전체') return fourCutList;
    return fourCutList.filter(n => n.category === filter);
  }, [filter, fourCutList]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>네컷뉴스</Text>
        <Text style={styles.subtitle}>긴 이야기를 4컷으로 가볍게 📖</Text>
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
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.grid}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => {
          const color = categoryColor(item.category);
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('FourCutDetail', { fourCutId: item.id })}
            >
              <View style={[styles.thumb, { backgroundColor: color }]}>
                {item.comic_path ? (
                  <Image
                    source={{ uri: item.comic_path }}
                    style={styles.thumbImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.thumbEmoji}>📰</Text>
                )}
              </View>
              <View style={styles.body}>
                <Text style={[styles.cat, { color }]}>{item.category}</Text>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.meta}>{item.pub_date ?? ''}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>해당 카테고리 뉴스가 없어요</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const CARD_GAP = 12;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  filterWrap: { height: 72, justifyContent: 'center' },
  filterRow: { paddingHorizontal: 20, paddingVertical: 0, alignItems: 'center' },
  grid: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8 },
  row: { justifyContent: 'space-between', marginBottom: CARD_GAP },
  card: {
    width: '48.5%',
    backgroundColor: colors.white,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  thumb: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbEmoji: { fontSize: 40 },
  body: { padding: 12 },
  cat: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 19,
    minHeight: 38,
  },
  meta: { fontSize: 10, color: colors.textMuted, marginTop: 8 },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 14 },
});
 