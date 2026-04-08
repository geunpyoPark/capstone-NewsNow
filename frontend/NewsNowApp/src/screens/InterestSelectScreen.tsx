import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';

const categories = [
  { name: '정치', icon: require('../assets/images/political_icon.png') },
  { name: '경제', icon: require('../assets/images/economic_icon.png') },
  { name: '사회', icon: require('../assets/images/social_icon.png') },
  { name: 'IT/과학', icon: require('../assets/images/it_icon.png') },
];

type Props = {
  navigation: any;
  route: any;
};

export default function InterestSelectScreen({ navigation, route }: Props) {
  const { userEmail } = route.params;
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelect = (item: string) => {
    if (selected.includes(item)) {
      setSelected(selected.filter((v) => v !== item));
    } else {
      if (selected.length < 2) {
        setSelected([...selected, item]);
      } else {
        Alert.alert('알림', '2개까지만 선택할 수 있습니다.');
      }
    }
  };

  const handleNext = () => {
    if (selected.length !== 2) {
      Alert.alert('알림', '관심 카테고리 2개 선택해주세요.');
      return;
    }

    navigation.navigate('Quiz', {
      selectedCategories: selected,
      currentCategoryIndex: 0,
      categoryScores: {},
      userEmail, // 이메일 넘기기
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>관심 카테고리 선택</Text>
      <Text style={styles.subtitle}>2개를 선택해주세요</Text>

      <View style={styles.centerArea}>
        <View style={styles.grid}>
          {categories.map((item) => {
            const isSelected = selected.includes(item.name);

            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.card, isSelected && styles.selectedCard]}
                onPress={() => handleSelect(item.name)}
                activeOpacity={0.8}
              >
                <View style={styles.iconArea}>
                  <Image source={item.icon} style={styles.icon} />
                </View>

                <View style={styles.textArea}>
                  <Text style={[styles.cardText, isSelected && styles.selectedText]}>
                    {item.name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.bottomArea}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>다음</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FF', paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginTop: 60, color: '#111827' },
  subtitle: { textAlign: 'center', color: '#6B7280', marginTop: 12, fontSize: 14 },
  centerArea: { flex: 1, justifyContent: 'center', paddingTop: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  card: { width: '43%', aspectRatio: 0.8, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 2, borderColor: '#E0E7FF', overflow: 'hidden' },
  selectedCard: { borderColor: '#5D7CE9', backgroundColor: '#EEF2FF' },
  iconArea: { flex: 3, justifyContent: 'center', alignItems: 'center' },
  textArea: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingBottom: 10 },
  icon: { width: 85, height: 85, resizeMode: 'contain' },
  cardText: { fontSize: 15, fontWeight: '600', color: '#111827' },
  selectedText: { color: '#5D7CE9' },
  bottomArea: { paddingBottom: 24 },
  nextButton: { backgroundColor: '#5D7CE9', paddingVertical: 18, borderRadius: 15, alignItems: 'center', width: '80%', alignSelf: 'center' },
  nextButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});