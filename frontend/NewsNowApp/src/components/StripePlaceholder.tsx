import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';

type Props = {
  color: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

// 대각선 줄무늬 느낌을 React Native에서 구현
// 실제 stripe는 SVG/Skia가 필요하지만, 간단히 semi-transparent 오버레이 바 여러 개로 근사
export default function StripePlaceholder({ color, label, style }: Props) {
  return (
    <View style={[styles.wrap, { backgroundColor: color }, style]}>
      {/* 대각선 줄무늬 (회전된 반투명 바 반복) */}
      <View style={styles.stripes} pointerEvents="none">
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.stripe,
              {
                left: -50 + i * 20,
              },
            ]}
          />
        ))}
      </View>
      {label ? (
        <Text style={styles.label} numberOfLines={3}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stripes: {
    ...StyleSheet.absoluteFillObject,
  },
  stripe: {
    position: 'absolute',
    top: -100,
    width: 4,
    height: 600,
    backgroundColor: 'rgba(255,255,255,0.12)',
    transform: [{ rotate: '-45deg' }],
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 18,
  },
});
