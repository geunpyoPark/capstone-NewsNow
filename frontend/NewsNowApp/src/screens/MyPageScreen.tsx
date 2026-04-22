import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, categoryColor, xpToLevel } from '../theme';
import { MAIN_CATEGORIES, SCRAP_FOLDERS, NEWS_DATA } from '../data/news';
import { useAppContext } from '../context/AppContext';
import XPBar from '../components/XPBar';
import LevelBadge from '../components/LevelBadge';

type Props = {
  navigation: any;
};

export default function MyPageScreen({ navigation }: Props) {
  const {
    userEmail,
    selectedCategories,
    readIds,
    scrappedIds,
    solvedQuizIds,
    catXp,
    logout,
  } = useAppContext();

  const stats = useMemo(() => ({
    read: readIds.length,
    scrapped: scrappedIds.length,
    solved: solvedQuizIds.length,
  }), [readIds, scrappedIds, solvedQuizIds]);

  // 각 폴더별 실제 스크랩 개수 계산
  const folderCounts = useMemo(() => {
    const scrappedNews = NEWS_DATA.filter(n => scrappedIds.includes(n.id));
    return SCRAP_FOLDERS.reduce<Record<string, number>>((acc, f) => {
      acc[f.id] = scrappedNews.filter(n => f.categories.includes(n.cat)).length;
      return acc;
    }, {});
  }, [scrappedIds]);

  const visibleCategories = selectedCategories.length ? selectedCategories : MAIN_CATEGORIES;

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃할까요? 모든 진행 상황이 초기화돼요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 프로필 카드 */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(userEmail ?? '뉴픽')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{userEmail ?? '뉴픽 독자'}</Text>
          <Text style={styles.sub}>
            {selectedCategories.length
              ? `관심: ${selectedCategories.join(' · ')}`
              : '관심 카테고리를 설정해 보세요'}
          </Text>
        </View>

        {/* 스탯 */}
        <View style={styles.stats}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.read}</Text>
            <Text style={styles.statLabel}>읽은 뉴스</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.solved}</Text>
            <Text style={styles.statLabel}>푼 퀴즈</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.scrapped}</Text>
            <Text style={styles.statLabel}>스크랩</Text>
          </View>
        </View>

        {/* 카테고리별 레벨 */}
        <Text style={styles.sectionTitle}>카테고리별 성장</Text>
        <View style={styles.levelCard}>
          {visibleCategories.map(cat => {
            const xp = catXp[cat] ?? 0;
            const level = xpToLevel(xp);
            return (
              <View key={cat} style={styles.levelRow}>
                <View style={styles.levelHead}>
                  <View style={styles.levelTitleRow}>
                    <View style={[styles.dot, { backgroundColor: categoryColor(cat) }]} />
                    <Text style={styles.levelName}>{cat}</Text>
                  </View>
                  <LevelBadge level={level} />
                </View>
                <XPBar cat={cat} xp={xp} compact />
              </View>
            );
          })}
        </View>

        {/* 스크랩 폴더 */}
        <Text style={styles.sectionTitle}>스크랩 폴더</Text>
        <View style={styles.folderList}>
          {SCRAP_FOLDERS.map(f => (
            <TouchableOpacity
              key={f.id}
              style={styles.folderItem}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('ScrapFolder', {
                  folderId: f.id,
                  folderName: f.name,
                  folderCategories: f.categories,
                })
              }
            >
              <Text style={styles.folderEmoji}>{f.emoji}</Text>
              <View style={styles.folderBody}>
                <Text style={styles.folderName}>{f.name}</Text>
                <Text style={styles.folderCount}>{folderCounts[f.id] ?? 0}개</Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 로그아웃 */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },

  profile: { alignItems: 'center', paddingVertical: 20 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: colors.white, fontSize: 28, fontWeight: '700' },
  name: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },

  stats: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 16,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 10,
  },
  levelCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  levelRow: { marginBottom: 4 },
  levelHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: -2,
  },
  levelTitleRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  levelName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },

  folderList: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  folderEmoji: { fontSize: 22, marginRight: 12 },
  folderBody: { flex: 1 },
  folderName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  folderCount: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  chev: { fontSize: 22, color: colors.textSubtle },

  logoutBtn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
});
