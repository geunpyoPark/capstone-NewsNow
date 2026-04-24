import React, { useEffect } from 'react';
import MainTabs from './MainTabs';
import { useAppContext } from '../context/AppContext';

// 온보딩에서 전달받은 route params(selectedCategories, userEmail)를
// AppContext에 저장한 뒤 MainTabs를 렌더링하는 얇은 래퍼.
// 기존 LevelResultScreen을 크게 고치지 않고도 온보딩 결과를 앱 전역 상태에 반영한다.
type Props = {
  route?: any;
};

export default function MainEntry({ route }: Props) {
  const { setUserEmail, setUserName, setSelectedCategories } = useAppContext();

  useEffect(() => {
    const params = route?.params ?? {};
    if (params.userEmail) setUserEmail(params.userEmail);
    if (typeof params.userName === 'string') setUserName(params.userName);
    if (Array.isArray(params.selectedCategories) && params.selectedCategories.length > 0) {
      setSelectedCategories(params.selectedCategories);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <MainTabs />;
}
