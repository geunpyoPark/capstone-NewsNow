import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log('일반 로그인');
  };

  const handleKakaoLogin = () => {
    console.log('카카오 로그인');
  };

  const handleGoogleLogin = () => {
    console.log('구글 로그인');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F9FF" />

      <View style={styles.container}>
        <View style={styles.topArea}>
          <Text style={styles.title}>로그인</Text>

          <View style={styles.illustrationCircle}>
            <View style={styles.cityWrap}>
              <View style={[styles.building, styles.b1]} />
              <View style={[styles.building, styles.b2]} />
              <View style={[styles.building, styles.b3]} />
              <View style={[styles.building, styles.b4]} />
              <View style={[styles.building, styles.b5]} />
            </View>
          </View>

          <Text style={styles.welcomeText}>뉴스나우에 오신 것을 환영합니다.</Text>
        </View>

        <View style={styles.formArea}>
          <View style={styles.inputBox}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput
              style={styles.input}
              placeholder="이메일 주소"
              placeholderTextColor="#9AA4B2"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputBox}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              placeholderTextColor="#9AA4B2"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>로그인</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.subText}>비밀번호를 잊으셨나요?</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>간편 로그인</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialCircle} onPress={handleKakaoLogin}>
              <Image
                source={require('../assets/images/kakao.png')}
                style={styles.socialIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialCircle} onPress={handleGoogleLogin}>
              <Image
                source={require('../assets/images/google.png')}
                style={styles.socialIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>계정이 없으신가요? </Text>
            <TouchableOpacity>
              <Text style={styles.signupLink}>회원가입</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  topArea: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1E2430',
    marginBottom: 28,
  },
  illustrationCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#EAF2FD',
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 20,
  },
  cityWrap: {
    width: '100%',
    height: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 18,
  },
  building: {
    backgroundColor: '#C8D8EE',
    borderRadius: 6,
  },
  b1: {
    width: 26,
    height: 46,
  },
  b2: {
    width: 34,
    height: 66,
  },
  b3: {
    width: 42,
    height: 82,
  },
  b4: {
    width: 34,
    height: 58,
  },
  b5: {
    width: 24,
    height: 40,
  },
  welcomeText: {
    fontSize: 18,
    color: '#4A5565',
    textAlign: 'center',
    lineHeight: 26,
  },
  formArea: {
    width: '100%',
  },
  inputBox: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCE6F2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E2430',
  },
  loginButton: {
    height: 58,
    borderRadius: 14,
    backgroundColor: '#4D7DF3',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  subText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#7D8794',
    marginBottom: 22,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E1E8F0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#7D8794',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    marginBottom: 24,
  },
  socialCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E1EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: {
    width: 30,
    height: 30,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 16,
    color: '#6B7684',
  },
  signupLink: {
    fontSize: 16,
    color: '#4D7DF3',
    fontWeight: '700',
  },
});