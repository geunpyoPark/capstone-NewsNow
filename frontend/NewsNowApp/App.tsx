import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import InterestSelectScreen from './src/screens/InterestSelectScreen';
import QuizScreen from './src/screens/QuizScreen';
import LevelResultScreen from './src/screens/LevelResultScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="InterestSelect" component={InterestSelectScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="LevelResult" component={LevelResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}