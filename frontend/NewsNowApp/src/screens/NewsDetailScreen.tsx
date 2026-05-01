import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { colors, categoryColor } from '../theme';
import { useAppContext, FONT_SCALE_MULTIPLIER } from '../context/AppContext';
import LevelBadge from '../components/LevelBadge';
import { formatNewsDate } from '../utils/date';

const BASE_URL = 'https://mainrepo-production-4ca1.up.railway.app';

type Props = {
  navigation: any;
  route: any;
};

export default function NewsDetailScreen({ navigation, route }: Props) {
  const { newsId, level } = route.params;
  const {
    markRead,
    toggleScrap,
    isScrapped,
    scrapWord,
    isWordScrapped,
    addQuizResult,
    solvedQuizIds,
    fontScale,
    userEmail,
  } = useAppContext();

  const fontMul = FONT_SCALE_MULTIPLIER[fontScale];

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [xpDelta, setXpDelta] = useState(0);
  const [selectedHighlight, setSelectedHighlight] = useState<{ word: string; definition: string } | null>(null);
  const alreadySolved = solvedQuizIds.includes(String(newsId));

  useEffect(() => {
    const loadDetail = async () => {
      try {
        let levelNum = 1;
        if (userEmail) {
          const levelRes = await fetch(`${BASE_URL}/quiz/level/${userEmail}`);
          const levelData = await levelRes.json();
          levelNum = levelData.overall_level ?? 1;
        }
        const res = await fetch(`${BASE_URL}/news/${newsId}?level=${levelNum}`);
        const data = await res.json();
        setItem(data);
        markRead(String(newsId));
        await fetch(`${BASE_URL}/news/${newsId}/view`, { method: 'PATCH' });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [newsId, userEmail, markRead]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text>뉴스를 찾을 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const color = categoryColor(item.category);
  const quiz = item.quizzes?.[0] ?? null;
  const scrapped = isScrapped(String(newsId));
  const highlights = Array.isArray(item.highlights) ? item.highlights : [];

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const renderHighlightedContent = () => {
    const content = item.content ?? '';
    if (!content || highlights.length === 0) {
      return (
        <Text style={[styles.paragraph, { fontSize: 15 * fontMul, lineHeight: 24 * fontMul }]}>
          {content}
        </Text>
      );
    }

    const uniqueHighlights = highlights
      .filter((entry: any) => entry?.word && content.includes(entry.word))
      .sort((a: any, b: any) => b.word.length - a.word.length);

    if (uniqueHighlights.length === 0) {
      return (
        <Text style={[styles.paragraph, { fontSize: 15 * fontMul, lineHeight: 24 * fontMul }]}>
          {content}
        </Text>
      );
    }

    const regex = new RegExp(`(${uniqueHighlights.map((entry: any) => escapeRegExp(entry.word)).join('|')})`, 'g');
    const segments = content.split(regex).filter(Boolean);
    const definitions = new Map<string, string>(
      uniqueHighlights
        .filter((entry: any) => typeof entry.definition === 'string' && entry.definition.length > 0)
        .map((entry: any) => [entry.word, entry.definition]),
    );
    const highlightedOnce = new Set<string>();

    return (
      <Text style={[styles.paragraph, { fontSize: 15 * fontMul, lineHeight: 24 * fontMul }]}>
        {segments.map((segment: string, index: number) => {
          const definition = definitions.get(segment);
          if (!definition || highlightedOnce.has(segment)) {
            return <Text key={`${segment}-${index}`}>{segment}</Text>;
          }
          highlightedOnce.add(segment);
          return (
            <Text
              key={`${segment}-${index}`}
              style={styles.highlightedWord}
              onPress={() => setSelectedHighlight({ word: segment, definition })}
            >
              {segment}
            </Text>
          );
        })}
      </Text>
    );
  };

  const handleScrapWord = async () => {
    if (!selectedHighlight) return;
    const result = await scrapWord(selectedHighlight.word, selectedHighlight.definition, Number(newsId));
    Alert.alert(result.ok ? '단어 저장' : '저장 실패', result.message);
  };

  const handleSubmitQuiz = () => {
    if (selectedOption === null || !quiz) return;
    const correct = selectedOption === quiz.answer;
    const { firstAttempt, delta } = addQuizResult(String(newsId), item.category, correct);
    setShowResult(true);
    setXpDelta(firstAttempt ? delta : 0);

    if (correct && firstAttempt) {
      Alert.alert('정답!', `+30 XP 획득했어요 🎉`);
    } else if (!correct && firstAttempt) {
      Alert.alert('아쉬워요', `-10 XP 차감됐어요. 설명을 확인해 보세요.`);
    }
  };

  const isCorrect = showResult && selectedOption === quiz?.answer;
  const xpSignedText = xpDelta > 0 ? `+${xpDelta}` : xpDelta < 0 ? `${xpDelta}` : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>뉴스 상세</Text>
        <TouchableOpacity onPress={() => toggleScrap(String(newsId))} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.scrapIcon, scrapped && styles.scrapOn]}>
            {scrapped ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.catRow}>
          <View style={[styles.catPill, { backgroundColor: color }]}>
            <Text style={styles.catPillText}>{item.category}</Text>
          </View>
          <LevelBadge level={level ?? item.level ?? '중'} />
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>{formatNewsDate(item.pub_date)}</Text>

        <View style={styles.body}>
          {renderHighlightedContent()}
        </View>

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
              {quiz.question}
            </Text>

            <View style={styles.options}>
              {quiz.options.map((opt: string, idx: number) => {
                const isSelected = selectedOption === idx;
                const isAnswer = idx === quiz.answer;
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
                    key={idx}
                    style={style}
                    onPress={() => !showResult && setSelectedOption(idx)}
                    disabled={showResult}
                    activeOpacity={0.8}
                  >
                    <Text style={textStyle}>
                      {String.fromCharCode(65 + idx)}. {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {!showResult ? (
              <TouchableOpacity
                style={[styles.submitBtn, selectedOption === null && styles.submitBtnDisabled]}
                onPress={handleSubmitQuiz}
                disabled={selectedOption === null}
                activeOpacity={0.85}
              >
                <Text style={styles.submitText}>답 확인하기</Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.resultBox}>
                  <Text style={styles.resultTitle}>
                    {isCorrect ? '✅ 정답이에요!' : '❌ 오답이에요'}
                  </Text>
                  <Text style={styles.explain}>{quiz.explanation}</Text>
                </View>
                <View style={styles.completePanel}>
                  <Text style={styles.completeTitle}>퀴즈 완료! 🎉</Text>
                  <Text style={styles.completeSub}>
                    {isCorrect ? 1 : 0}/1 정답
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

      <Modal
        visible={!!selectedHighlight}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedHighlight(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedHighlight(null)}>
          <Pressable style={styles.tooltipCard} onPress={e => e.stopPropagation()}>
            <Text style={styles.tooltipWord}>{selectedHighlight?.word}</Text>
            <Text style={styles.tooltipDefinition}>{selectedHighlight?.definition}</Text>
            <View style={styles.tooltipActions}>
              <TouchableOpacity
                style={styles.tooltipGhostBtn}
                onPress={() => setSelectedHighlight(null)}
                activeOpacity={0.85}
              >
                <Text style={styles.tooltipGhostText}>닫기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tooltipPrimaryBtn,
                  selectedHighlight &&
                    isWordScrapped(selectedHighlight.word, Number(newsId)) &&
                    styles.tooltipPrimaryBtnDisabled,
                ]}
                onPress={handleScrapWord}
                activeOpacity={0.85}
                disabled={!!(selectedHighlight && isWordScrapped(selectedHighlight.word, Number(newsId)))}
              >
                <Text style={styles.tooltipPrimaryText}>
                  {selectedHighlight && isWordScrapped(selectedHighlight.word, Number(newsId)) ? '저장됨' : '단어 스크랩'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  catPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  catPillText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, lineHeight: 30, marginBottom: 8 },
  meta: { fontSize: 12, color: colors.textMuted, marginBottom: 20 },
  body: { marginBottom: 24 },
  paragraph: { fontSize: 15, lineHeight: 24, color: colors.textPrimary, marginBottom: 14 },
  highlightedWord: {
    backgroundColor: '#FFF1A8',
    color: colors.textPrimary,
    fontWeight: '700',
    borderRadius: 4,
  },
  quizBox: { backgroundColor: colors.white, borderWidth: 2, borderRadius: 18, padding: 18 },
  quizHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  quizLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  solvedChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.divider },
  solvedText: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
  quizQ: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 14, lineHeight: 22 },
  options: { marginBottom: 14 },
  option: { padding: 14, borderRadius: 12, borderWidth: 2, borderColor: colors.borderSoft, backgroundColor: colors.white, marginBottom: 8 },
  optionCorrect: { borderColor: colors.accentGreen, backgroundColor: '#ECFDF3' },
  optionWrong: { borderColor: colors.accentRed, backgroundColor: '#FEF2F2' },
  optionText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  optionTextCorrect: { color: '#059669', fontWeight: '600' },
  optionTextWrong: { color: '#DC2626', fontWeight: '600' },
  submitBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: colors.textSubtle },
  submitText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  resultBox: { backgroundColor: colors.primaryLight, borderRadius: 12, padding: 14, marginBottom: 12 },
  resultTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  explain: { fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  completePanel: { backgroundColor: colors.primary, borderRadius: 20, padding: 20 },
  completeTitle: { fontSize: 18, fontWeight: '800', color: colors.white, marginBottom: 6 },
  completeSub: { fontSize: 13, fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: 16 },
  completeBar: { height: 6, borderRadius: 999, backgroundColor: 'rgba(255, 255, 255, 0.25)', overflow: 'hidden', marginBottom: 16 },
  completeBarFill: { height: '100%', width: '100%', backgroundColor: colors.white, borderRadius: 999 },
  completeBtn: { backgroundColor: 'rgba(255, 255, 255, 0.18)', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  completeBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.38)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  tooltipCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
  },
  tooltipWord: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 10 },
  tooltipDefinition: { fontSize: 15, lineHeight: 23, color: colors.textSecondary, marginBottom: 18 },
  tooltipActions: { flexDirection: 'row', gap: 10 },
  tooltipGhostBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tooltipGhostText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  tooltipPrimaryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  tooltipPrimaryBtnDisabled: {
    backgroundColor: colors.textSubtle,
  },
  tooltipPrimaryText: { fontSize: 14, fontWeight: '700', color: colors.white },
});
