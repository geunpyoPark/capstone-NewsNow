import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, categoryColor } from '../theme';
import { XP_PER_LEVEL } from '../data/news';

type Props = {
  cat: string;
  xp: number;
  compact?: boolean;
  hideCatLabel?: boolean;
};

export default function XPBar({ cat, xp, compact, hideCatLabel }: Props) {
  const color = categoryColor(cat);
  const current = xp % XP_PER_LEVEL;
  const progress = current / XP_PER_LEVEL;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.head}>
        {hideCatLabel ? <View /> : <Text style={styles.cat}>{cat}</Text>}
        <Text style={styles.xp}>
          {current} / {XP_PER_LEVEL} XP
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
