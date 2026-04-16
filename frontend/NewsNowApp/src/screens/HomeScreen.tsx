import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';

type Article = {
  id: number;
  title: string;
  subtitle?: string;
  image: string;
  category: string;
  level: string;
  time: string;
};

const categoryRecommended: Article = {
  id: 1,
  title: '카테고리별 추천 기사',
  subtitle: '사용자 관심 분야에 맞는 기사',
  image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1000',
  category: '경제',
  level: 'Lv.3',
  time: '2분',
};

const levelRecommended: Article = {
  id: 2,
  title: '난이도별 추천 기사',
  subtitle: '사용자 레벨에 맞는 쉬운 기사',
  image: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1000',
  category: 'IT',
  level: 'Lv.2',
  time: '3분',
};

const todaysPick: Article = {
  id: 3,
  title: '오늘의 픽 뉴스',
  subtitle: '오늘 가장 주목할 만한 기사',
  image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1000',
  category: '핫이슈',
  level: 'Lv.4',
  time: '4분',
};

const getTodayText = () => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const today = new Date();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const day = days[today.getDay()];

  return `${month}월 ${date}일 (${day})`;
};

type RecommendationCardProps = {
  label: string;
  article: Article;
  backgroundColor: string;
};

const RecommendationCard = ({
  label,
  article,
  backgroundColor,
}: RecommendationCardProps) => {
  return (
    <TouchableOpacity activeOpacity={0.85} style={[styles.recommendCard, { backgroundColor }]}>
      <View style={styles.cardTextArea}>
        <View style={styles.badgeRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{label}</Text>
          </View>
          <Text style={styles.levelText}>{article.level}</Text>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {article.title}
        </Text>

        <Text style={styles.cardSubtitle} numberOfLines={2}>
          {article.subtitle}
        </Text>

        <Text style={styles.metaText}>{article.category} · {article.time}</Text>
      </View>

      <Image source={{ uri: article.image }} style={styles.cardImage} />
    </TouchableOpacity>
  );
};

type TodayPickCardProps = {
  article: Article;
};

const TodayPickCard = ({ article }: TodayPickCardProps) => {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.pickCard}>
      <Image source={{ uri: article.image }} style={styles.pickImage} />
      <View style={styles.pickOverlay} />
      <View style={styles.pickContent}>
        <Text style={styles.pickLabel}>TODAY PICK</Text>
        <Text style={styles.pickTitle}>{article.title}</Text>
        <Text style={styles.pickMetaText}>
          {article.category} · {article.level} · {article.time}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const BottomTabBar = () => {
  const activeTab = 'home';

  return (
    <View style={styles.bottomTabContainer}>
      <TouchableOpacity style={styles.tabItem}>
        <Image
          source={require('../assets/images/home.png')}
          style={[
            styles.tabIcon,
            activeTab === 'home' && styles.activeTabIcon,
          ]}
        />
        <Text style={[styles.tabLabel, activeTab === 'home' && styles.activeTabLabel]}>
          홈
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabItem}>
        <Image
          source={require('../assets/images/news.png')}
          style={styles.tabIcon}
        />
        <Text style={styles.tabLabel}>뉴스</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabItem}>
        <Image
          source={require('../assets/images/comic.png')}
          style={styles.tabIcon}
        />
        <Text style={styles.tabLabel}>네컷뉴스</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabItem}>
        <Image
          source={require('../assets/images/mypage.png')}
          style={styles.tabIcon}
        />
        <Text style={styles.tabLabel}>마이</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>NewPick</Text>
              <Text style={styles.dateText}>{getTodayText()}</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>내 레벨 추천</Text>
          </View>

          <RecommendationCard
            label="카테고리 추천"
            article={categoryRecommended}
            backgroundColor="#EEF6FF"
          />

          <RecommendationCard
            label="난이도 추천"
            article={levelRecommended}
            backgroundColor="#FFF7EC"
          />

          <View style={styles.todaySectionHeader}>
            <Text style={styles.sectionTitle}>오늘의 픽</Text>
          </View>

          <TodayPickCard article={todaysPick} />
        </ScrollView>

        <BottomTabBar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 96,
  },

  header: {
    marginBottom: 28,
  },
  greeting: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 6,
  },
  dateText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  sectionHeader: {
    marginBottom: 14,
  },
  todaySectionHeader: {
    marginTop: 28,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  recommendCard: {
    flexDirection: 'row',
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    minHeight: 145,
  },
  cardTextArea: {
    flex: 1,
    paddingRight: 12,
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#4DB6AC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginRight: 10,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  levelText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  cardImage: {
    width: 110,
    height: '100%',
    borderRadius: 18,
  },

  pickCard: {
    height: 230,
    borderRadius: 26,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  pickImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  pickOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  pickContent: {
    padding: 22,
  },
  pickLabel: {
    color: '#E0F2FE',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  pickTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '900',
    marginBottom: 10,
  },
  pickMetaText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
  },

  bottomTabContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 78,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    paddingHorizontal: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
    resizeMode: 'contain',
    tintColor: '#94A3B8',
  },
  activeTabIcon: {
    opacity: 1,
    tintColor: '#5D7CE9',
  },
  tabLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  activeTabLabel: {
    color: '#5D7CE9',
    fontWeight: '800',
  },
});
