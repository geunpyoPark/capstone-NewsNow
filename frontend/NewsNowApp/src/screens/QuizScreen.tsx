import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';

type Props = {
  navigation: any;
  route: any;
};

type Difficulty = '하' | '중' | '상';

type QuizItem = {
  question: string;
  options: string[];
  answer: number;
  difficulty: Difficulty;
  score: number;
};

const quizData: Record<string, QuizItem[]> = {
  정치: [
    {
      question: '나라를 운영하는 활동을 무엇이라고 할까?',
      options: ['정치', '요리', '운동', '게임'],
      answer: 0,
      difficulty: '하',
      score: 1,
    },
    {
      question: '대표를 뽑는 제도는?',
      options: ['선거', '시험', '면접', '추첨'],
      answer: 0,
      difficulty: '하',
      score: 1,
    },
    {
      question: '법을 만드는 곳은?',
      options: ['국회', '학교', '은행', '병원'],
      answer: 0,
      difficulty: '중',
      score: 2,
    },
    {
      question: '정당은 무엇일까?',
      options: ['정치 모임', '운동 팀', '회사', '방송국'],
      answer: 0,
      difficulty: '중',
      score: 2,
    },
    {
      question: '국민이 나라의 주인인 제도는?',
      options: ['민주주의', '독재', '귀족제', '왕정'],
      answer: 0,
      difficulty: '상',
      score: 3,
    },
    {
      question: '대통령의 역할과 가장 가까운 것은?',
      options: ['국가 운영', '수업', '경기', '배달'],
      answer: 0,
      difficulty: '상',
      score: 3,
    },
  ],

  경제: [
    {
      question: '물건을 살 때 사용하는 것은?',
      options: ['돈', '돌', '종이', '연필'],
      answer: 0,
      difficulty: '하',
      score: 1,
    },
    {
      question: '돈을 모아두는 것은?',
      options: ['저축', '소비', '낭비', '광고'],
      answer: 0,
      difficulty: '하',
      score: 1,
    },
    {
      question: '은행에 돈 맡기는 것은?',
      options: ['예금', '삭제', '복사', '이동'],
      answer: 0,
      difficulty: '중',
      score: 2,
    },
    {
      question: '회사가 물건을 만드는 이유는?',
      options: ['이익', '심심해서', '운동', '게임'],
      answer: 0,
      difficulty: '중',
      score: 2,
    },
    {
      question: '가격이 전반적으로 오르는 현상은?',
      options: ['인플레이션', '할인', '저축', '환불'],
      answer: 0,
      difficulty: '상',
      score: 3,
    },
    {
      question: '나라의 생산과 소비 활동은?',
      options: ['경제', '정치', '사회', '과학'],
      answer: 0,
      difficulty: '상',
      score: 3,
    },
  ],

  사회: [
    {
      question: '사람들이 함께 살아가는 모습을 다루는 분야는?',
      options: ['사회', '수학', '미술', '체육'],
      answer: 0,
      difficulty: '하',
      score: 1,
    },
    {
      question: '사람들이 서로 지켜야 하는 약속은?',
      options: ['규칙', '광고', '주문', '게임'],
      answer: 0,
      difficulty: '하',
      score: 1,
    },
    {
      question: '도움이 필요한 사람을 함께 돕는 제도는?',
      options: ['복지', '투자', '예금', '광고'],
      answer: 0,
      difficulty: '중',
      score: 2,
    },
    {
      question: '다른 사람의 입장을 이해하고 존중하는 태도는?',
      options: ['배려', '독점', '무시', '경쟁'],
      answer: 0,
      difficulty: '중',
      score: 2,
    },
    {
      question: '인터넷에서 다른 사람을 존중하는 태도는?',
      options: ['디지털 시민의식', '속독', '암기', '체력'],
      answer: 0,
      difficulty: '상',
      score: 3,
    },
    {
      question: '공동체 안에서 책임 있게 행동하는 태도와 가까운 것은?',
      options: ['시민의식', '무관심', '독점', '방관'],
      answer: 0,
      difficulty: '상',
      score: 3,
    },
  ],

  'IT/과학': [
    {
      question: '컴퓨터 프로그램을 만드는 과정을 뭐라고 할까?',
      options: ['코딩', '요리', '운동', '운전'],
      answer: 0,
      difficulty: '하',
      score: 1,
    },
    {
      question: 'AI는 무엇의 줄임말일까?',
      options: ['인공지능', '자동입력', '인터넷연결', '정보저장'],
      answer: 0,
      difficulty: '하',
      score: 1,
    },
    {
      question: '인터넷에 연결된 여러 기기가 정보를 주고받는 것은?',
      options: ['네트워크', '광합성', '저축', '투표'],
      answer: 0,
      difficulty: '중',
      score: 2,
    },
    {
      question: '비밀번호를 잘 관리해야 하는 가장 큰 이유는?',
      options: ['개인정보 보호', '배터리 절약', '화면 밝기 조절', '앱 삭제'],
      answer: 0,
      difficulty: '중',
      score: 2,
    },
    {
      question: '지구가 태양 주위를 도는 현상은?',
      options: ['자전', '공전', '증발', '복사'],
      answer: 1,
      difficulty: '상',
      score: 3,
    },
    {
      question: '실험을 통해 사실을 확인하고 설명하는 활동과 가장 관련 깊은 것은?',
      options: ['과학', '광고', '패션', '응원'],
      answer: 0,
      difficulty: '상',
      score: 3,
    },
  ],
};

export default function QuizScreen({ navigation, route }: Props) {
  const { selectedCategories, currentCategoryIndex, categoryScores = {} } = route.params;

  const currentCategory = selectedCategories[currentCategoryIndex];
  const questions = useMemo(() => quizData[currentCategory] || [], [currentCategory]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [currentCategoryScore, setCurrentCategoryScore] = useState(0);

  const currentQuestion = questions[questionIndex];
  const isLastQuestion = questionIndex === questions.length - 1;
  const isLastCategory = currentCategoryIndex === selectedCategories.length - 1;

  const getButtonText = () => {
    if (!isLastQuestion) {
      return `다음 문제 (${questionIndex + 1}/${questions.length})`;
    }

    if (!isLastCategory) {
      return `${selectedCategories[currentCategoryIndex + 1]} 퀴즈 보기`;
    }

    return '레벨 확인하기';
  };

  const handleNext = () => {
    if (questions.length === 0) {
      Alert.alert('알림', '해당 카테고리 문제 데이터가 없습니다.');
      navigation.goBack();
      return;
    }

    if (selectedOption === null) {
      Alert.alert('알림', '답을 선택해주세요.');
      return;
    }

    let updatedScore = currentCategoryScore;

    if (selectedOption === currentQuestion.answer) {
      updatedScore += currentQuestion.score;
      setCurrentCategoryScore(updatedScore);
    }

    if (!isLastQuestion) {
      setQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      return;
    }

    const updatedCategoryScores = {
      ...categoryScores,
      [currentCategory]: updatedScore,
    };

    if (!isLastCategory) {
      navigation.replace('Quiz', {
        selectedCategories,
        currentCategoryIndex: currentCategoryIndex + 1,
        categoryScores: updatedCategoryScores,
      });
      return;
    }

    navigation.replace('LevelResult', {
      selectedCategories,
      categoryScores: updatedCategoryScores,
    });
  };

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyArea}>
          <Text style={styles.emptyTitle}>문제를 불러오지 못했어.</Text>
          <Text style={styles.emptyText}>
            선택한 카테고리에 해당하는 문제가 없거나 데이터가 비어 있어.
          </Text>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => navigation.popToTop()}
          >
            <Text style={styles.nextButtonText}>처음으로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.badgeRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{currentCategory}</Text>
          </View>

        </View>

        <Text style={styles.title}>카테고리 퀴즈</Text>
        <Text style={styles.subTitle}>선택한 관심 분야를 순서대로 풀어보자</Text>
      </View>

      <View style={styles.questionCard}>
        <ScrollView
          contentContainerStyle={styles.questionScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.questionLabel}>문제 {questionIndex + 1}</Text>
          <Text style={styles.question}>{currentQuestion.question}</Text>

          <View style={styles.optionList}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === index;

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.option, isSelected && styles.selectedOption]}
                  onPress={() => setSelectedOption(index)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.optionNumber,
                      isSelected && styles.selectedOptionNumber,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionNumberText,
                        isSelected && styles.selectedOptionNumberText,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>

                  <Text
                    style={[styles.optionText, isSelected && styles.selectedOptionText]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.bottomArea}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>{getButtonText()}</Text>
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

  headerCard: {
    width: '95%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 20,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E8EDFF',
  },

  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  categoryBadge: {
    backgroundColor: '#EAF0FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  categoryBadgeText: {
    color: '#5D7CE9',
    fontSize: 13,
    fontWeight: '700',
  },

  difficultyBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  difficultyBadgeText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '700',
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginTop: 16,
  },

  subTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 20,
  },

  questionCard: {
    width: '95%',
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    marginTop: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E8EDFF',
    overflow: 'hidden',
  },

  questionScrollContent: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 24,
  },

  questionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5D7CE9',
    marginBottom: 12,
  },

  question: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 34,
    marginBottom: 28,
  },

  optionList: {
    gap: 12,
  },

  option: {
    minHeight: 68,
    backgroundColor: '#F9FAFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E3E8F5',
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  selectedOption: {
    backgroundColor: '#EEF3FF',
    borderColor: '#5D7CE9',
  },

  optionNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E3E8F5',
  },

  selectedOptionNumber: {
    backgroundColor: '#5D7CE9',
    borderColor: '#5D7CE9',
  },

  optionNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },

  selectedOptionNumberText: {
    color: '#FFFFFF',
  },

  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    lineHeight: 22,
  },

  selectedOptionText: {
    color: '#355BD6',
  },

  bottomArea: {
    width: '86%',
    paddingBottom: 22,
  },

  nextButton: {
    backgroundColor: '#5D7CE9',
    minHeight: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  emptyArea: {
    flex: 1,
    width: '86%',
    justifyContent: 'center',
  },

  emptyTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },

  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 24,
  },
});