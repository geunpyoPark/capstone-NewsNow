import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import InterestSelectScreen from './src/screens/InterestSelectScreen';
import QuizScreen from './src/screens/QuizScreen';
import LevelResultScreen from './src/screens/LevelResultScreen';

import MainEntry from './src/navigation/MainEntry';
import NewsDetailScreen from './src/screens/NewsDetailScreen';
import FourCutDetailScreen from './src/screens/FourCutDetailScreen';
import ScrapFolderScreen from './src/screens/ScrapFolderScreen';

import { AppProvider } from './src/context/AppContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* 온보딩 (기존 구현 - 건드리지 않음) */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="InterestSelect" component={InterestSelectScreen} />
          <Stack.Screen name="Quiz" component={QuizScreen} />
          <Stack.Screen name="LevelResult" component={LevelResultScreen} />

          {/* 메인 앱 (탭 네비게이터) */}
          <Stack.Screen name="Main" component={MainEntry} />

          {/* 상세 화면 */}
          <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
          <Stack.Screen name="FourCutDetail" component={FourCutDetailScreen} />
          <Stack.Screen name="ScrapFolder" component={ScrapFolderScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
