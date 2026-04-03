import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';

export default function LoginScreen() {
  const handleKakaoLogin = () => {
    console.log('카카오 로그인');
  };

  const handleGoogleLogin = () => {
    console.log('구글 로그인');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        {/* 위쪽 (로고 + 텍스트) */}
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

        {/* 아래 (간편 로그인) */}
        <View style={styles.bottomArea}>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>간편 로그인 및 회원가입</Text>
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
        </View>
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

  /* 위쪽 */
  topArea: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoImage: {
    width: 250,   // ← 동그라미 크기랑 동일
    height: 250,
    marginBottom: 1,
  },

  welcomeText: {
    fontSize: 20,
    color: '#6086E0',
    textAlign: 'center',
    fontWeight: '600',
  },

  /* 아래 */
  bottomArea: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 60,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '80%',
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },

  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#888888',
  },

  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },

  socialCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  socialIcon: {
    width: 36,
    height: 36,
  },
});