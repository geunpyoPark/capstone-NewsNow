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
import { login as kakaoLogin } from '@react-native-kakao/user';
import { getOnboarded } from '../utils/onboarding';

GoogleSignin.configure({
  iosClientId:
    '901962887380-89qlr9pk1snulfok0cu45dpaleal5b5k.apps.googleusercontent.com',
  webClientId: '901962887380-7pvrduri2p8ph9es2fq7vtch3fcpc0lg.apps.googleusercontent.com',
});

const BACKEND_URL = 'http://192.168.35.87:8000';


export default function LoginScreen({ navigation }: { navigation: any }) {
  // 로그인 성공 후 분기: 이 이메일이 이미 온보딩을 마쳤으면 Main으로,
  // 처음이면 InterestSelect(관심 카테고리 선택 + 초기 퀴즈)로.
  const routeAfterLogin = async (email: string, name?: string) => {
    const onboarded = await getOnboarded(email);
    Alert.alert('로그인 성공!', `${name ?? email}님 환영해요!`, [
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
                    selectedCategories: onboarded.selectedCategories,
                  },
                },
              ],
            });
          } else {
            // 첫 로그인 → 기존 온보딩 플로우
            navigation.navigate('InterestSelect', { userEmail: email });
          }
        },
      },
    ]);
  };

  // 🟡 카카오 로그인
  const handleKakaoLogin = async () => {
    try {
      const token = await kakaoLogin();

      const res = await fetch(`${BACKEND_URL}/auth/kakao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.accessToken }),
      });

      const data = await res.json();
      console.log('카카오 로그인 성공:', data);

      await routeAfterLogin(data.email, data.name);
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

      const res = await fetch(`${BACKEND_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const text = await res.text();
      const data = JSON.parse(text);
      console.log('구글 로그인 성공:', data);

      await routeAfterLogin(data.email, data.name);
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
            source={require('../assets/images/nplogo.png')}
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
  welcomeText: { fontSize: 20, color: '#6086E0', textAlign: 'center', fontWeight: '600' },
  bottomArea: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 60 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, width: '80%' },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E5E5' },
  dividerText: { marginHorizontal: 12, fontSize: 14, color: '#888888' },
  socialRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 },
  socialCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5E5', justifyContent: 'center', alignItems: 'center' },
  socialIcon: { width: 36, height: 36 },
});
