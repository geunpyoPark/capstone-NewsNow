import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { colors, categoryColor } from '../theme';
import { FOURCUT_ALL } from '../data/news';

type Props = {
  navigation: any;
  route: any;
};

const { width: SCREEN_W } = Dimensions.get('window');

export default function FourCutDetailScreen({ navigation, route }: Props) {
  const { fourCutId } = route.params;
  const item = useMemo(() => FOURCUT_ALL.find(f => f.id === fourCutId), [fourCutId]);
  const [page, setPage] = useState(0);

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text>네컷을 찾을 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const color = categoryColor(item.cat);
  // 2048×2048 이미지를 4개 사분면으로 분할
  // 프레임 크기 = SCREEN_W - padding
  const frameSize = SCREEN_W - 80;
  const quadIndex = page; // 0,1,2,3

  const total = item.panels.length;

  const handlePrev = () => setPage(p => Math.max(0, p - 1));
  const handleNext = () => setPage(p => Math.min(total - 1, p + 1));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>네컷뉴스</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.header}>
        <View style={[styles.catPill, { backgroundColor: color }]}>
          <Text style={styles.catPillText}>{item.cat}</Text>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>

      <View style={styles.frameWrap}>
        <View style={[styles.frame, { width: frameSize, height: frameSize }]}>
          <Image
            // Cloudinary URL이 있으면 원격, 없으면 로컬 데모 이미지 사용
            source={
              item.imageUrl
                ? { uri: item.imageUrl }
                : require('../assets/images/news_cartoon.png')
            }
            style={{
              width: frameSize * 2,
              height: frameSize * 2,
              position: 'absolute',
              // 사분면 이동: 0=LT, 1=RT, 2=LB, 3=RB
              left: (quadIndex % 2) === 0 ? 0 : -frameSize,
              top: quadIndex < 2 ? 0 : -frameSize,
            }}
            resizeMode="cover"
          />
          {/* 번호 오버레이 */}
          <View style={[styles.panelNumber, { backgroundColor: color }]}>
            <Text style={styles.panelNumberText}>{page + 1} / {total}</Text>
          </View>
        </View>

        {/* 패널 캡션 */}
        <View style={styles.caption}>
          <Text style={styles.captionTitle}>{item.panels[page].title}</Text>
          <Text style={styles.captionBody}>{item.panels[page].body}</Text>
        </View>
      </View>

      {/* 네비게이션 */}
      <View style={styles.nav}>
        <TouchableOpacity
          style={[styles.navBtn, page === 0 && styles.navBtnDisabled]}
          onPress={handlePrev}
          disabled={page === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.navText}>‹ 이전</Text>
        </TouchableOpacity>
        <View style={styles.dots}>
          {[0, 1, 2, 3].map(i => (
            <View
              key={i}
              style={[styles.dot, page === i && { backgroundColor: color, width: 16 }]}
            />
          ))}
        </View>
        <TouchableOpacity
          style={[styles.navBtn, page === total - 1 && styles.navBtnDisabled]}
          onPress={handleNext}
          disabled={page === total - 1}
          activeOpacity={0.8}
        >
          <Text style={styles.navText}>다음 ›</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  backIcon: { fontSize: 28, color: colors.textPrimary, width: 32 },
  topTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  catPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  catPillText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, lineHeight: 28 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },

  frameWrap: { alignItems: 'center', paddingHorizontal: 20, flex: 1, justifyContent: 'center' },
  frame: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  panelNumber: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  panelNumberText: { color: colors.white, fontSize: 12, fontWeight: '700' },

  caption: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 14,
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  captionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  captionBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },

  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  navBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navBtnDisabled: { opacity: 0.4 },
  navText: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },

  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
});
