import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, categoryColor } from '../theme';
import LevelBadge from './LevelBadge';
import { NewsItem } from '../data/news';

type Props = {
  item: NewsItem;
  onPress?: () => void;
  read?: boolean;
  scrapped?: boolean;
  onScrapPress?: () => void;
};

// 타이포그래피 중심 카드: 왼쪽 카테고리 컬러 사이드바 + 제목 중심
export default function NewsCard({ item, onPress, read, scrapped, onScrapPress }: Props) {
  const color = categoryColor(item.cat);

  return (
    <TouchableOpacity
      style={[styles.card, read && styles.cardRead]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* 카테고리 컬러 사이드바 */}
      <View style={[styles.sidebar, { backgroundColor: color }]} />

      <View style={styles.inner}>
        {/* 카테고리 행 */}
        <View style={styles.catRow}>
          <Text style={[styles.catText, { color }]}>{item.cat}</Text>
          <LevelBadge level={item.level} />
          {read && (
            <View style={styles.readChip}>
              <Text style={styles.readChipText}>읽음</Text>
            </View>
          )}
        </View>

        {/* 타이틀 */}
        <Text style={[styles.title, read && styles.titleRead]} numberOfLines={2}>
          {item.title}
        </Text>

        {/* 요약 */}
        <Text style={styles.summary} numberOfLines={2}>
          {item.summary}
        </Text>

        {/* 하단 메타 */}
        <View style={styles.bottomRow}>
          <Text style={styles.meta}>
            {item.time}  ·  조회 {item.views.toLocaleString()}
          </Text>
          {onScrapPress && (
            <TouchableOpacity onPress={onScrapPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.scrapIcon, scrapped && styles.scrapIconOn]}>
                {scrapped ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardRead: {
    opacity: 0.7,
  },
  sidebar: {
    width: 6,
  },
  inner: {
    flex: 1,
    padding: 14,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  catText: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  readChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.divider,
  },
  readChipText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 6,
  },
  titleRead: {
    color: colors.textSecondary,
  },
  summary: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    fontSize: 11,
    color: colors.textMuted,
  },
  scrapIcon: {
    fontSize: 20,
    color: colors.textSubtle,
  },
  scrapIconOn: {
    color: colors.accentYellow,
  },
});
