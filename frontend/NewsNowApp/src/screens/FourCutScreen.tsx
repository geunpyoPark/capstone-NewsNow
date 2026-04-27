import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { colors, categoryColor } from '../theme';

const BASE_URL = 'https://mainrepo-production-4ca1.up.railway.app';

type Props = {
  navigation: any;
};

export default function FourCutScreen({ navigation }: Props) {
  const [fourCutList, setFourCutList] = useState<any[]>([]);

  useEffect(() => {
    const loadFourCut = async () => {
      try {
        const res = await fetch(`${BASE_URL}/news/fourcut`);
        const data = await res.json();
        setFourCutList(data);
      } catch (e) {
        console.error(e);
      }
    };

    loadFourCut();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>네컷뉴스</Text>
        <Text style={styles.subtitle}>긴 이야기를 4컷으로 가볍게 📖</Text>
      </View>
      <FlatList
        data={fourCutList}
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
                <View style={styles.fourCutBadge}>
                  <Text style={styles.fourCutBadgeText}>4컷</Text>
                </View>
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
  fourCutBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  fourCutBadgeText: { fontSize: 10, fontWeight: '700', color: colors.textPrimary },
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
});