import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, categoryColor } from '../theme';

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export default function CategoryPill({ label, active, onPress }: Props) {
  const color = categoryColor(label);
  return (
    <TouchableOpacity
      style={[
        styles.pill,
        active ? { backgroundColor: color, borderColor: color } : styles.pillIdle,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.text, active ? styles.textActive : styles.textIdle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    minWidth: 64,
    minHeight: 44,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    // 가벼운 섀도우 (텍스트 번짐 방지를 위해 아주 약하게)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  pillIdle: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: 0,
  },
  textIdle: {
    color: colors.textSecondary,
  },
  textActive: {
    color: colors.white,
  },
});
