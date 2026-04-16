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
    { question: '대한민국의 국가 원수는 누구인가?', options: ['국무총리', '대통령', '국회의장', '대법원장'], answer: 1, difficulty: '하', score: 1 },
    { question: '국회의원의 임기는 몇 년인가?', options: ['5년', '6년', '3년', '4년'], answer: 3, difficulty: '하', score: 1 },
    { question: '삼권분립에서 행정권을 담당하는 기관은?', options: ['국회', '법원', '정부', '헌법재판소'], answer: 2, difficulty: '중', score: 2 },
    { question: '대통령의 임기와 연임 가능 여부는?', options: ['4년 연임 가능', '6년 단임', '5년 연임 가능', '5년 단임'], answer: 3, difficulty: '중', score: 2 },
    { question: '헌법재판소의 역할로 올바른 것은?', options: ['범죄자 재판', '법률의 위헌 여부 심판', '예산 심의', '법률 제정'], answer: 1, difficulty: '상', score: 3 },
    { question: '국회에서 예산안을 심의·확정하는 헌법상 기한은?', options: ['60일 전', '15일 전', '90일 전', '회계연도 개시 30일 전'], answer: 3, difficulty: '상', score: 3 },
  ],
  경제: [
    { question: 'GDP란 무엇인가?', options: ['국제무역량', '물가지수', '국내총생산', '정부예산'], answer: 2, difficulty: '하', score: 1 },
    { question: '금리가 오르면 대출 이자는?', options: ['내려간다', '반반이다', '변화없다', '올라간다'], answer: 3, difficulty: '하', score: 1 },
    { question: '환율이 올라가면 수출에 어떤 영향을 미치는가?', options: ['수출 불리', '수입 감소', '영향 없음', '수출 유리'], answer: 3, difficulty: '중', score: 2 },
    { question: '중앙은행이 기준금리를 올리는 주된 이유는?', options: ['수출 증가', '인플레이션 억제', '환율 안정', '실업률 감소'], answer: 1, difficulty: '중', score: 2 },
    { question: '경기 침체 시 정부가 취하는 확장적 재정정책으로 올바른 것은?', options: ['세금 인상', '통화량 축소', '정부 지출 증가', '금리 인상'], answer: 2, difficulty: '상', score: 3 },
    { question: '필립스 곡선이 나타내는 관계는?', options: ['GDP와 물가의 비례', '금리와 환율의 비례', '수출과 환율의 반비례', '인플레이션과 실업률의 반비례'], answer: 3, difficulty: '상', score: 3 },
  ],
  사회: [
    { question: '대한민국 헌법이 보장하는 기본권이 아닌 것은?', options: ['평등권', '참정권', '재산 축적권', '자유권'], answer: 2, difficulty: '하', score: 1 },
    { question: '다문화 사회에서 중요한 태도는?', options: ['자국 문화 우월', '문화 다양성 존중', '전통 문화 고수', '외래 문화 배척'], answer: 1, difficulty: '하', score: 1 },
    { question: '사회적 불평등을 해소하기 위한 제도로 올바른 것은?', options: ['역진세', '비례세', '법인세', '누진세'], answer: 3, difficulty: '중', score: 2 },
    { question: '저출산 고령화 사회의 문제점으로 가장 적절한 것은?', options: ['소비 증가', '주택 수요 증가', '생산가능인구 감소', '교육비 증가'], answer: 2, difficulty: '중', score: 2 },
    { question: '사회 이동 중 세대 간 이동의 예로 올바른 것은?', options: ['평사원이 임원으로 승진', '부모는 농부, 자녀는 의사', '중산층이 실직으로 빈곤층', '빈민이 복권 당첨'], answer: 1, difficulty: '상', score: 3 },
    { question: "롤스의 정의론에서 '차등의 원칙'이란?", options: ['능력에 따른 차등 분배', '필요에 따른 분배', '최소 수혜자에게 최대 이익', '모든 사람에게 동등한 분배'], answer: 2, difficulty: '상', score: 3 },
  ],
  'IT/과학': [
    { question: 'CPU는 무엇의 약자인가?', options: ['중앙저장장치', '입력처리장치', '중앙처리장치', '화면출력장치'], answer: 2, difficulty: '하', score: 1 },
    { question: '인터넷 주소를 나타내는 것은?', options: ['RAM', 'SSD', 'CPU', 'IP 주소'], answer: 3, difficulty: '하', score: 1 },
    { question: '빅데이터 분석에서 가장 많이 활용되는 기술은?', options: ['블록체인', '머신러닝', '증강현실', '양자컴퓨팅'], answer: 1, difficulty: '중', score: 2 },
    { question: '빛의 속도에 가장 가까운 값은?', options: ['약 3만 km/s', '약 300만 km/s', '약 30만 km/s', '약 3천 km/s'], answer: 2, difficulty: '중', score: 2 },
    { question: '블록체인 기술의 핵심 특징으로 올바른 것은?', options: ['중앙 서버에서 관리', '익명성 보장 불가', '속도가 매우 빠름', '분산 저장으로 위변조 어려움'], answer: 3, difficulty: '상', score: 3 },
    { question: '양자컴퓨터가 기존 컴퓨터보다 뛰어난 이유는?', options: ['전력 소비가 적음', '큐비트로 동시에 여러 상태 처리', '인터넷 속도가 빠름', '크기가 작음'], answer: 1, difficulty: '상', score: 3 },
  ],
};

export default function QuizScreen({ navigation, route }: Props) {
  const { selectedCategories, currentCategoryIndex, categoryScores = {}, userEmail } = route.params;

  const currentCategory = selectedCategories[currentCategoryIndex];
  const questions = useMemo(() => quizData[currentCategory] || [], [currentCategory]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [currentCategoryScore, setCurrentCategoryScore] = useState(0);

  const currentQuestion = questions[questionIndex];
  const isLastQuestion = questionIndex === questions.length - 1;
  const isLastCategory = currentCategoryIndex === selectedCategories.length - 1;

  const getButtonText = () => {
    if (!isLastQuestion) return `다음 문제 (${questionIndex + 1}/${questions.length})`;
    if (!isLastCategory) return `${selectedCategories[currentCategoryIndex + 1]} 퀴즈 보기`;
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
        userEmail,
      });
      return;
    }

    navigation.replace('LevelResult', {
      selectedCategories,
      categoryScores: updatedCategoryScores,
      userEmail,
    });
  };

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyArea}>
          <Text style={styles.emptyTitle}>문제를 불러오지 못했어.</Text>
          <Text style={styles.emptyText}>선택한 카테고리에 해당하는 문제가 없거나 데이터가 비어 있어.</Text>
          <TouchableOpacity style={styles.nextButton} onPress={() => navigation.popToTop()}>
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
        <ScrollView contentContainerStyle={styles.questionScrollContent} showsVerticalScrollIndicator={false}>
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
                  <View style={[styles.optionNumber, isSelected && styles.selectedOptionNumber]}>
                    <Text style={[styles.optionNumberText, isSelected && styles.selectedOptionNumberText]}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>{option}</Text>
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
  container: { flex: 1, backgroundColor: '#F6F8FF', alignItems: 'center', paddingTop: 10 },
  headerCard: { width: '95%', backgroundColor: '#FFFFFF', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 20, marginTop: 14, borderWidth: 1, borderColor: '#E8EDFF' },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryBadge: { backgroundColor: '#EAF0FF', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  categoryBadgeText: { color: '#5D7CE9', fontSize: 13, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginTop: 16 },
  subTitle: { fontSize: 14, color: '#6B7280', marginTop: 8, lineHeight: 20 },
  questionCard: { width: '95%', flex: 1, backgroundColor: '#FFFFFF', borderRadius: 28, marginTop: 18, marginBottom: 18, borderWidth: 1, borderColor: '#E8EDFF', overflow: 'hidden' },
  questionScrollContent: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 24 },
  questionLabel: { fontSize: 14, fontWeight: '700', color: '#5D7CE9', marginBottom: 12 },
  question: { fontSize: 24, fontWeight: '800', color: '#111827', lineHeight: 34, marginBottom: 28 },
  optionList: { gap: 12 },
  option: { minHeight: 68, backgroundColor: '#F9FAFF', borderRadius: 18, borderWidth: 1.5, borderColor: '#E3E8F5', paddingVertical: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  selectedOption: { backgroundColor: '#EEF3FF', borderColor: '#5D7CE9' },
  optionNumber: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#E3E8F5' },
  selectedOptionNumber: { backgroundColor: '#5D7CE9', borderColor: '#5D7CE9' },
  optionNumberText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  selectedOptionNumberText: { color: '#FFFFFF' },
  optionText: { flex: 1, fontSize: 16, color: '#111827', fontWeight: '600', lineHeight: 22 },
  selectedOptionText: { color: '#355BD6' },
  bottomArea: { width: '86%', paddingBottom: 22 },
  nextButton: { backgroundColor: '#5D7CE9', minHeight: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  nextButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  emptyArea: { flex: 1, width: '86%', justifyContent: 'center' },
  emptyTitle: { textAlign: 'center', fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 10 },
  emptyText: { textAlign: 'center', fontSize: 15, color: '#6B7280', lineHeight: 22, marginBottom: 24 },
});
