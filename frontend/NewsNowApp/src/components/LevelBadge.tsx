import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Level } from '../theme';

type Props = {
  level: Level;
  size?: 'sm' | 'md';
  style?: ViewStyle;
};

// 프로토타입 톤: 소프트 파스텔 bg + 진한 텍스트
const LEVEL_STYLE: Record<Level, { bg: string; color: string }> = {
  '하': { bg: '#F0FDF4', color: '#16A34A' },
  '중': { bg: '#FFFBEB', color: '#B45309' },
  '상': { bg: '#FFF5F5', color: '#C53030' },
};

export default function LevelBadge({ level, size = 'sm', style }: Props) {
  const s = LEVEL_STYLE[level] ?? LEVEL_STYLE['중'];
  return (
    <View
      style={[
        styles.badge,
        size === 'md' && styles.badgeMd,
        { backgroundColor: s.bg },
        style,
      ]}
    >
      <Text style={[styles.text, size === 'md' && styles.textMd, { color: s.color }]}>
        {level}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  text: {
    fontSize: 9,
    fontWeight: '700',
  },
  textMd: {
    fontSize: 12,
  },
});
