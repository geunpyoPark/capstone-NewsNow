import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

type Props = {
  navigation: any;
  route: any;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.95;
const BUTTON_WIDTH = SCREEN_WIDTH * 0.86;

const getLevel = (score: number) => {
  if (score <= 3) return 1;
  if (score <= 6) return 2;
  if (score <= 9) return 3;
  return 4;
};

const getLevelDescription = (level: number) => {
  switch (level) {
    case 1:
      return '기초 개념부터 천천히 익히는 단계';
    case 2:
      return '기본 내용을 어느 정도 이해하는 단계';
    case 3:
      return '핵심 내용을 꽤 잘 이해하는 단계';
    case 4:
      return '난이도 있는 내용도 잘 이해하는 단계';
    default:
      return '';
  }
};

export default function LevelResultScreen({ navigation, route }: Props) {
  const { selectedCategories, categoryScores } = route.params;

  const categoryResults = selectedCategories.map((category: string) => {
    const score = categoryScores[category] ?? 0;
    const level = getLevel(score);

    return {
      category,
      score,
      level,
      description: getLevelDescription(level),
    };
  });

  const averageScore =
    categoryResults.reduce((sum: number, item: any) => sum + item.score, 0) /
    categoryResults.length;

  const overallLevel = getLevel(Math.round(averageScore));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topCard}>
          <Text style={styles.topLabel}>레벨 분석 완료</Text>
          <Text style={styles.title}>너의 뉴스 이해 레벨은</Text>
          <Text style={styles.mainLevel}>Level {overallLevel}</Text>
          <Text style={styles.subTitle}>{getLevelDescription(overallLevel)}</Text>
        </View>

        <View style={styles.resultList}>
          {categoryResults.map((item: any) => (
            <View key={item.category} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.categoryText}>{item.category}</Text>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>Level {item.level}</Text>
                </View>
              </View>

              <Text style={styles.scoreText}>점수: {item.score} / 12</Text>
              <Text style={styles.descriptionText}>{item.description}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomArea}>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.popToTop()}
          activeOpacity={0.85}
        >
          <Text style={styles.retryButtonText}>처음으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FF',
    alignItems: 'center',
    paddingTop: 10,
  },

  scrollContent: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 20,
  },

  topCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: '#E8EDFF',
    alignItems: 'center',
  },

  topLabel: {
    color: '#5D7CE9',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
    textAlign: 'center',
  },

  mainLevel: {
    fontSize: 38,
    fontWeight: '900',
    color: '#5D7CE9',
    marginBottom: 10,
  },

  subTitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  resultList: {
    width: CARD_WIDTH,
    marginTop: 18,
    gap: 12,
  },

  resultCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: '#E8EDFF',
  },

  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  categoryText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  levelBadge: {
    backgroundColor: '#EAF0FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  levelBadgeText: {
    color: '#5D7CE9',
    fontSize: 13,
    fontWeight: '800',
  },

  scoreText: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },

  descriptionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  bottomArea: {
    width: BUTTON_WIDTH,
    paddingBottom: 22,
  },

  retryButton: {
    backgroundColor: '#5D7CE9',
    minHeight: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});