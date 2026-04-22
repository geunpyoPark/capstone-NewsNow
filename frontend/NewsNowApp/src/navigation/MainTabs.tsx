import React from 'react';
import { View, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../theme';

import HomeScreen from '../screens/HomeScreen';
import NewsListScreen from '../screens/NewsListScreen';
import FourCutScreen from '../screens/FourCutScreen';
import MyPageScreen from '../screens/MyPageScreen';

const Tab = createBottomTabNavigator();

// 이미지 에셋 기반 탭 아이콘
// tintColor로 포커스 여부에 따라 색상 자동 반영
function TabIcon({
  source,
  focused,
}: {
  source: ImageSourcePropType;
  focused: boolean;
}) {
  return (
    <View style={styles.iconWrap}>
      <Image
        source={source}
        resizeMode="contain"
        style={[
          styles.icon,
          {
            tintColor: focused ? colors.primary : colors.textSecondary,
            opacity: focused ? 1 : 0.7,
          },
        ]}
      />
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: '홈',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require('../assets/images/home.png')}
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="NewsList"
        component={NewsListScreen}
        options={{
          tabBarLabel: '뉴스목록',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require('../assets/images/news_list.png')}
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="FourCut"
        component={FourCutScreen}
        options={{
          tabBarLabel: '네컷뉴스',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require('../assets/images/news_cartoon.png')}
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="MyPage"
        component={MyPageScreen}
        options={{
          tabBarLabel: '마이',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require('../assets/images/my_page.png')}
              focused={focused}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
});
