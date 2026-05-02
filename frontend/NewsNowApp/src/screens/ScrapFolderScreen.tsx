import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../theme';
import { NewsItem } from '../data/news';
import { useAppContext } from '../context/AppContext';
import NewsCard from '../components/NewsCard';

type Props = {
  navigation: any;
  route: any;
};

export default function ScrapFolderScreen({ navigation, route }: Props) {
  const { folderName, folderCategories, folderKind } = route.params ?? {};
  const { scrappedArticles, readIds, toggleScrap, isScrapped, scrappedWords } = useAppContext();

  const newsItems = useMemo((): NewsItem[] => {
    if (folderKind === 'word') return [];
    if (!folderCategories || !Array.isArray(folderCategories) || folderCategories.length === 0) {
      return scrappedArticles;
    }
    return scrappedArticles.filter(n => folderCategories.includes(n.cat));
  }, [scrappedArticles, folderCategories, folderKind]);

  const emptyText = folderKind === 'word' ? '스크랩한 단어가 없어요' : '스크랩한 뉴스가 없어요';
  const emptySub = folderKind === 'word'
    ? '단어 스크랩 기능이 연결되면 여기서 모아볼 수 있어요'
    : '뉴스 상세 화면에서 ☆ 버튼을 눌러 저장해 보세요';

  const EmptyComponent = (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>📭</Text>
      <Text style={styles.emptyTitle}>{emptyText}</Text>
      <Text style={styles.emptySub}>{emptySub}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
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

      {folderKind === 'word' ? (
        <FlatList
          data={scrappedWords}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.wordCard}>
              <Text style={styles.wordTitle}>{item.word}</Text>
              <Text style={styles.wordDefinition}>{item.definition}</Text>
            </View>
          )}
          ListEmptyComponent={EmptyComponent}
        />
      ) : (
        <FlatList
          data={newsItems}
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
          ListEmptyComponent={EmptyComponent}
        />
      )}
    </View>
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
  wordCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  wordTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  wordDefinition: { fontSize: 14, lineHeight: 21, color: colors.textSecondary },
  empty: { paddingVertical: 80, alignItems: 'center' },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
});
