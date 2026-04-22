import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, categoryColor, xpToLevel } from '../theme';
import { XP_PER_LEVEL } from '../data/news';

type Props = {
  cat: string;
  xp: number;
  compact?: boolean;
};

export default function XPBar({ cat, xp, compact }: Props) {
  const color = categoryColor(cat);
  const level = xpToLevel(xp);
  // 다음 레벨까지 남은 XP
  const progress = xp >= 200 ? 1 : (xp % XP_PER_LEVEL) / XP_PER_LEVEL;
  const nextTarget = xp >= 200 ? 200 : (level === '중' ? 200 : 100);
  const current = xp >= 200 ? 200 : (xp % XP_PER_LEVEL);

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.head}>
        <Text style={styles.cat}>{cat}</Text>
        <Text style={styles.xp}>
          {xp >= 200 ? '최고 레벨' : `${current} / ${nextTarget} XP`}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.round(progress * 100)}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 8,
  },
  wrapCompact: {
    paddingVertical: 4,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cat: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  xp: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.divider,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
});
