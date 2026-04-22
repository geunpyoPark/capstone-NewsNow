// 온보딩(관심 카테고리 선택 + 초기 퀴즈) 완료 상태를 이메일별로 저장.
// AppContext와는 별도 키를 사용해서 로그아웃해도 남아있다. (재로그인 시 퀴즈 스킵 용도)
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@newspick/onboarded/v1';

type OnboardedRecord = {
  selectedCategories: string[];
  completedAt: number; // epoch ms
};

type OnboardedMap = Record<string, OnboardedRecord>;

async function readMap(): Promise<OnboardedMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeMap(map: OnboardedMap): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/** 해당 이메일이 이미 온보딩을 완료했는지 조회 */
export async function getOnboarded(email: string | null | undefined): Promise<OnboardedRecord | null> {
  if (!email) return null;
  const map = await readMap();
  return map[email] ?? null;
}

/** 온보딩 완료 기록 */
export async function markOnboarded(email: string, selectedCategories: string[]): Promise<void> {
  if (!email) return;
  const map = await readMap();
  map[email] = {
    selectedCategories,
    completedAt: Date.now(),
  };
  await writeMap(map);
}

/** 테스트/리셋용 — 특정 이메일의 온보딩 기록 삭제 */
export async function clearOnboarded(email: string): Promise<void> {
  if (!email) return;
  const map = await readMap();
  delete map[email];
  await writeMap(map);
}
