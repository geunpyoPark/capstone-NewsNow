import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { colors, categoryColor } from '../theme';
import { FOURCUT_ALL } from '../data/news';

type Props = {
  navigation: any;
};

export default function FourCutScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>네컷뉴스</Text>
        <Text style={styles.subtitle}>긴 이야기를 4컷으로 가볍게 📖</Text>
      </View>

      <FlatList
        data={FOURCUT_ALL}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.grid}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => {
          const color = categoryColor(item.cat);
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('FourCutDetail', { fourCutId: item.id })}
            >
              <View style={[styles.thumb, { backgroundColor: color }]}>
                <Text style={styles.thumbEmoji}>📰</Text>
                <View style={styles.fourCutBadge}>
                  <Text style={styles.fourCutBadgeText}>4컷</Text>
                </View>
              </View>
              <View style={styles.body}>
                <Text style={[styles.cat, { color }]}>{item.cat}</Text>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.meta}>
                  조회 {item.views.toLocaleString()} · {item.time}
                </Text>
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
