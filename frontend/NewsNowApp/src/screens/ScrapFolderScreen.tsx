import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../theme';
import { NEWS_DATA } from '../data/news';
import { useAppContext } from '../context/AppContext';
import NewsCard from '../components/NewsCard';

type Props = {
  navigation: any;
  route: any;
};

export default function ScrapFolderScreen({ navigation, route }: Props) {
  const { folderName, folderCategories, folderKind } = route.params ?? {};
  const { scrappedIds, readIds, toggleScrap, isScrapped } = useAppContext();

  // 폴더에 지정된 카테고리에 속하는 스크랩만 필터
  // folderCategories가 없으면 (구버전 호환) 전체 스크랩을 보여줌
  const items = useMemo(() => {
    if (folderKind === 'word') {
      return [];
    }
    const scrapped = NEWS_DATA.filter(n => scrappedIds.includes(n.id));
    if (!folderCategories || !Array.isArray(folderCategories) || folderCategories.length === 0) {
      return scrapped;
    }
    return scrapped.filter(n => folderCategories.includes(n.cat));
  }, [scrappedIds, folderCategories, folderKind]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>{folderName ?? '스크랩'}</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <NewsCard
            item={item}
            read={readIds.includes(item.id)}
            scrapped={isScrapped(item.id)}
            onPress={() => navigation.navigate('NewsDetail', { newsId: item.id })}
            onScrapPress={() => toggleScrap(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>
              {folderKind === 'word' ? '스크랩한 단어가 없어요' : '스크랩한 뉴스가 없어요'}
            </Text>
            <Text style={styles.emptySub}>
              {folderKind === 'word'
                ? '단어 스크랩 기능이 연결되면 여기서 모아볼 수 있어요'
                : '뉴스 상세 화면에서 ☆ 버튼을 눌러 저장해 보세요'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
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

  list: { padding: 20, paddingBottom: 40 },
  empty: { paddingVertical: 80, alignItems: 'center' },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
});
