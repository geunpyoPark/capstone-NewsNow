import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, categoryColor } from '../theme';
import { NEWS_DATA, NEWS_QUIZZES, XP_CORRECT, XP_WRONG } from '../data/news';
import { useAppContext, FONT_SCALE_MULTIPLIER } from '../context/AppContext';
import LevelBadge from '../components/LevelBadge';

type Props = {
  navigation: any;
  route: any;
};

export default function NewsDetailScreen({ navigation, route }: Props) {
  const { newsId } = route.params;
  const {
    markRead,
    toggleScrap,
    isScrapped,
    addQuizResult,
    solvedQuizIds,
    fontScale,
  } = useAppContext();

  // 홈 상단의 "가" 버튼에서 고른 글자 크기 배수 (본문/퀴즈 질문에 적용)
  const fontMul = FONT_SCALE_MULTIPLIER[fontScale];

  const item = useMemo(() => NEWS_DATA.find(n => n.id === newsId), [newsId]);
  const quiz = NEWS_QUIZZES[newsId];

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [xpDelta, setXpDelta] = useState<number>(0);
  const alreadySolved = solvedQuizIds.includes(newsId);

  useEffect(() => {
    if (item) markRead(item.id);
  }, [item?.id]);

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text>뉴스를 찾을 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const color = categoryColor(item.cat);

  const handleSubmitQuiz = () => {
    if (!selectedOption || !quiz) return;
    const correct = selectedOption === quiz.answer;
    const { firstAttempt, delta } = addQuizResult(item.id, item.cat, correct);
    setShowResult(true);
    setXpDelta(firstAttempt ? delta : 0);

    if (correct && firstAttempt) {
      Alert.alert('정답!', `+${XP_CORRECT} XP 획득했어요 🎉`);
    } else if (!correct && firstAttempt) {
      Alert.alert('아쉬워요', `${XP_WRONG} XP 차감됐어요. 설명을 확인해 보세요.`);
    }
  };

  const scrapped = isScrapped(item.id);
  const isCorrect = showResult && selectedOption === quiz?.answer;
  const correctCount = isCorrect ? 1 : 0;
  const xpSignedText =
    xpDelta > 0 ? `+${xpDelta}` : xpDelta < 0 ? `${xpDelta}` : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>뉴스 상세</Text>
        <TouchableOpacity onPress={() => toggleScrap(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.scrapIcon, scrapped && styles.scrapOn]}>
            {scrapped ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 카테고리 배지 */}
        <View style={styles.catRow}>
          <View style={[styles.catPill, { backgroundColor: color }]}>
            <Text style={styles.catPillText}>{item.cat}</Text>
          </View>
          <LevelBadge level={item.level} />
        </View>

        {/* 타이틀 */}
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>
          {item.time} · 조회 {item.views.toLocaleString()}
        </Text>

        {/* 본문 (글자 크기 설정 반영) */}
        <View style={styles.body}>
          {item.body.map((p, i) => (
            <Text
              key={i}
              style={[
                styles.paragraph,
                { fontSize: 15 * fontMul, lineHeight: 24 * fontMul },
              ]}
            >
              {p}
            </Text>
          ))}
        </View>

        {/* 퀴즈 섹션 */}
        {quiz && (
          <View style={[styles.quizBox, { borderColor: color }]}>
            <View style={styles.quizHead}>
              <Text style={styles.quizLabel}>🧠 오늘의 퀴즈</Text>
              {alreadySolved && (
                <View style={styles.solvedChip}>
                  <Text style={styles.solvedText}>이미 푼 퀴즈</Text>
                </View>
              )}
            </View>
            <Text style={[styles.quizQ, { fontSize: 16 * fontMul, lineHeight: 22 * fontMul }]}>
              {quiz.q}
            </Text>

            <View style={styles.options}>
              {quiz.options.map(opt => {
                const isSelected = selectedOption === opt.id;
                const isAnswer = opt.id === quiz.answer;
                let style: any = styles.option;
                let textStyle: any = styles.optionText;
                if (showResult) {
                  if (isAnswer) {
                    style = [styles.option, styles.optionCorrect];
                    textStyle = [styles.optionText, styles.optionTextCorrect];
                  } else if (isSelected && !isAnswer) {
                    style = [styles.option, styles.optionWrong];
                    textStyle = [styles.optionText, styles.optionTextWrong];
                  }
                } else if (isSelected) {
                  style = [styles.option, { borderColor: color, backgroundColor: colors.primaryLight }];
                }

                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={style}
                    onPress={() => !showResult && setSelectedOption(opt.id)}
                    disabled={showResult}
                    activeOpacity={0.8}
                  >
                    <Text style={textStyle}>
                      {opt.id.toUpperCase()}. {opt.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {!showResult ? (
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  !selectedOption && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmitQuiz}
                disabled={!selectedOption}
                activeOpacity={0.85}
              >
                <Text style={styles.submitText}>답 확인하기</Text>
              </TouchableOpacity>
            ) : (
              <>
                {/* 정답 해설 */}
                <View style={styles.resultBox}>
                  <Text style={styles.resultTitle}>
                    {isCorrect ? '✅ 정답이에요!' : '❌ 오답이에요'}
                  </Text>
                  <Text style={styles.explain}>{quiz.explain}</Text>
                </View>

                {/* 퀴즈 완료 패널 */}
                <View style={styles.completePanel}>
                  <Text style={styles.completeTitle}>퀴즈 완료! 🎉</Text>
                  <Text style={styles.completeSub}>
                    {correctCount}/1 정답
                    {xpSignedText ? ` · XP ${xpSignedText}` : ''}
                  </Text>
                  <View style={styles.completeBar}>
                    <View style={styles.completeBarFill} />
                  </View>
                  <TouchableOpacity
                    style={styles.completeBtn}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.completeBtnText}>닫기</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
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
  scrapIcon: { fontSize: 22, color: colors.textSubtle, width: 32, textAlign: 'right' },
  scrapOn: { color: colors.accentYellow },

  content: { padding: 20, paddingBottom: 40 },

  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  catPillText: { color: colors.white, fontWeight: '700', fontSize: 12 },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 30,
    marginBottom: 8,
  },
  meta: { fontSize: 12, color: colors.textMuted, marginBottom: 20 },

  body: { marginBottom: 24 },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textPrimary,
    marginBottom: 14,
  },

  quizBox: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderRadius: 18,
    padding: 18,
  },
  quizHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quizLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  solvedChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.divider,
  },
  solvedText: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
  quizQ: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 14, lineHeight: 22 },

  options: { marginBottom: 14 },
  option: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderSoft,
    backgroundColor: colors.white,
    marginBottom: 8,
  },
  optionCorrect: {
    borderColor: colors.accentGreen,
    backgroundColor: '#ECFDF3',
  },
  optionWrong: {
    borderColor: colors.accentRed,
    backgroundColor: '#FEF2F2',
  },
  optionText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  optionTextCorrect: { color: '#059669', fontWeight: '600' },
  optionTextWrong: { color: '#DC2626', fontWeight: '600' },

  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: colors.textSubtle },
  submitText: { color: colors.white, fontSize: 15, fontWeight: '700' },

  resultBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  explain: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  // 퀴즈 완료 패널 (보라 배경 + 닫기 버튼)
  completePanel: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
  },
  completeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 6,
  },
  completeSub: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  completeBar: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  completeBarFill: {
    height: '100%',
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 999,
  },
  completeBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  completeBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
