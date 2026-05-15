import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { login as kakaoLogin, me as kakaoMe } from '@react-native-kakao/user';
import { getOnboarded } from '../utils/onboarding';
import { useAppContext } from '../context/AppContext';
import { API_BASE_URL } from '../config/api';

GoogleSignin.configure({
  iosClientId:
    '901962887380-89qlr9pk1snulfok0cu45dpaleal5b5k.apps.googleusercontent.com',
  webClientId: '901962887380-7pvrduri2p8ph9es2fq7vtch3fcpc0lg.apps.googleusercontent.com',
});

export default function LoginScreen({ navigation }: { navigation: any }) {
  const { setUserEmail, setUserName } = useAppContext();

  // 로그인 성공 후 분기: 이 이메일이 이미 온보딩을 마쳤으면 Main으로,
  // 처음이면 InterestSelect(관심 카테고리 선택 + 초기 퀴즈)로.
  const routeAfterLogin = async (email: string, name?: string | null) => {
    const onboarded = await getOnboarded(email);
    // 이번 로그인에 이름이 없으면(이미 온보딩된 계정의 경우) 이전에 저장된 이름 사용
    const finalName = name ?? onboarded?.userName ?? null;

    // AppContext에 즉시 반영 → 홈 등 하위 화면에서 바로 사용 가능
    setUserEmail(email);
    setUserName(finalName);

    Alert.alert('로그인 성공!', `${finalName ?? email}님 환영해요!`, [
      {
        text: '확인',
        onPress: () => {
          if (onboarded) {
            // 이미 온보딩 완료 → 바로 홈
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: 'Main',
                  params: {
                    userEmail: email,
                    userName: finalName,
                    selectedCategories: onboarded.selectedCategories,
                  },
                },
              ],
            });
          } else {
            // 첫 로그인 → 기존 온보딩 플로우
            navigation.navigate('InterestSelect', {
              userEmail: email,
              userName: finalName,
            });
          }
        },
      },
    ]);
  };

  // 🟡 카카오 로그인
  const handleKakaoLogin = async () => {
    try {
      const token = await kakaoLogin();

      // 카카오 프로필에서 닉네임과 실제 이메일을 직접 가져온다.
      // (백엔드가 Kakao 숫자 ID를 email 필드로 내려주는 경우 대비)
      let kakaoNickname: string | null = null;
      let kakaoEmail: string | null = null;
      try {
        const profile: any = await kakaoMe();
        kakaoNickname =
          profile?.nickname ??
          profile?.profile?.nickname ??
          profile?.kakaoAccount?.profile?.nickname ??
          null;
        kakaoEmail =
          profile?.email ??
          profile?.kakaoAccount?.email ??
          null;
        console.log('카카오 프로필:', { kakaoNickname, kakaoEmail });
      } catch (e) {
        console.warn('카카오 프로필 조회 실패:', e);
      }

      const res = await fetch(`${API_BASE_URL}/auth/kakao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.accessToken }),
      });

      const raw = await res.text();
      if (!res.ok) {
        throw new Error(`Kakao auth failed (${res.status}): ${raw}`);
      }

      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(`Kakao auth returned non-JSON response: ${raw}`);
      }
      console.log('카카오 로그인 성공:', data);

      // 우선순위: 카카오 실제 이메일 → 백엔드 email → null
      const displayEmail = kakaoEmail ?? data.email ?? null;
      const displayName = kakaoNickname ?? data.name ?? null;
      if (!displayEmail) {
        Alert.alert('로그인 실패', '카카오 이메일 정보를 가져올 수 없어요.');
        return;
      }
      await routeAfterLogin(displayEmail, displayName);
    } catch (error) {
      console.error('카카오 로그인 실패:', error);
      Alert.alert('로그인 실패', '카카오 로그인에 실패했습니다.');
    }
  };

  // 🔵 구글 로그인
  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const token = userInfo.data?.idToken;
      if (!token) throw new Error('토큰 없음');

      // 구글 프로필에서 표시 이름 직접 획득
      const googleName =
        userInfo.data?.user?.name ??
        userInfo.data?.user?.givenName ??
        null;

      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(`Google auth failed (${res.status}): ${text}`);
      }

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Google auth returned non-JSON response: ${text}`);
      }
      console.log('구글 로그인 성공:', data);

      // 우선순위: 구글 프로필 name → 백엔드 name → null
      const displayName = googleName ?? data.name ?? null;
      await routeAfterLogin(data.email, displayName);
    } catch (error) {
      console.error('구글 로그인 실패:', error);
      Alert.alert('로그인 실패', '구글 로그인에 실패했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <View style={styles.topArea}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.welcomeText}>
            같은 뉴스,{'\n'}내 수준에 맞는 문장으로!
          </Text>
        </View>

        <View style={styles.bottomArea}>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>
              간편 로그인 및 회원가입
            </Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialCircle}
              onPress={handleKakaoLogin}
            >
              <Image
                source={require('../assets/images/kakao.png')}
                style={styles.socialIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialCircle}
              onPress={handleGoogleLogin}
            >
              <Image
                source={require('../assets/images/google.png')}
                style={styles.socialIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topArea: { flex: 3, justifyContent: 'center', alignItems: 'center' },
  logoImage: { width: 200, height: 200, marginBottom: 40 },
  welcomeText: { fontSize: 20, color: '#5D7CE9', textAlign: 'center', fontWeight: '600' },
  bottomArea: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 60 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, width: '80%' },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E5E5' },
  dividerText: { marginHorizontal: 12, fontSize: 14, color: '#888888' },
  socialRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 },
  socialCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5E5', justifyContent: 'center', alignItems: 'center' },
  socialIcon: { width: 36, height: 36 },
});
