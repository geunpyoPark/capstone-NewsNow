// 뉴픽 컨텐츠 데이터
// 뉴픽.html 프로토타입에서 포팅. 기존 앱과 맞추기 위해 'IT·과학' → 'IT/과학'.

export type Level = '하' | '중' | '상';

export interface Category {
  key: string;      // 'politics', 'economy', ...
  name: string;     // 한글명
  color: string;
  emoji: string;
}

export interface NewsItem {
  id: string;
  title: string;
  cat: string;         // 카테고리명 (한글)
  summary: string;     // 한 줄 요약
  body: string[];      // 본문 (단락 배열)
  views: number;
  time: string;        // '3시간 전'
  level: Level;        // 난이도
  color: string;       // 카테고리 컬러 (사이드바)
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface NewsQuiz {
  q: string;
  options: QuizOption[];
  answer: string;     // option id
  explain: string;
}

export interface FourCutPanel {
  title: string;
  body: string;
}

export interface FourCutItem {
  id: string;
  cat: string;
  title: string;
  subtitle: string;
  panels: FourCutPanel[];
  views: number;
  time: string;
  // Cloudinary(또는 외부 CDN)에서 불러올 2048×2048 네컷 이미지 URL
  // 비어 있으면 로컬 데모 이미지(assets/images/fourcut_demo.png)로 폴백
  imageUrl?: string;
}

export interface ScrapFolder {
  id: string;
  name: string;
  emoji: string;
  kind?: 'news' | 'word';
  // 이 폴더에 속하는 카테고리들. 뉴스의 cat이 여기 하나라도 포함되면 이 폴더에 속함.
  categories: string[];
}

export const CATEGORIES: Category[] = [
  { key: 'politics', name: '정치', color: '#FF4757', emoji: '🏛️' },
  { key: 'economy', name: '경제', color: '#5D7CE9', emoji: '💰' },
  { key: 'society', name: '사회', color: '#FFA502', emoji: '🏙️' },
  { key: 'culture', name: '문화', color: '#A259FF', emoji: '🎭' },
  { key: 'sports', name: '스포츠', color: '#2ECC71', emoji: '⚽' },
  { key: 'it', name: 'IT/과학', color: '#00C2D1', emoji: '🔬' },
  { key: 'world', name: '세계', color: '#5D7CE9', emoji: '🌍' },
  { key: 'entertainment', name: '연예', color: '#FF6B9D', emoji: '🎬' },
];

// 메인 관심 카테고리 (기존 InterestSelect 4개와 동일)
export const MAIN_CATEGORIES = ['정치', '경제', '사회', 'IT/과학'];

// 뉴스목록 필터
export const CAT_FILTERS = ['전체', '정치', '경제', '사회', 'IT/과학'];

export const NEWS_DATA: NewsItem[] = [
  {
    id: 'n1',
    title: '한국은행 기준금리 3.25%로 동결 결정',
    cat: '경제',
    summary: '한국은행 금융통화위원회가 기준금리를 연 3.25%로 유지하기로 결정했다.',
    body: [
      '한국은행 금융통화위원회는 오늘 열린 통화정책방향 회의에서 기준금리를 연 3.25%로 동결하기로 결정했다. 이는 물가 안정과 경제 성장 사이의 균형을 고려한 조치로 풀이된다.',
      '이창용 총재는 기자간담회에서 "최근 소비자물가 상승률이 목표 수준인 2%에 근접하고 있으나 변동성이 여전히 크다"며 "당분간 현재 수준에서 상황을 면밀히 관찰할 것"이라고 밝혔다.',
      '시장에서는 연내 1~2회 추가 인하 가능성도 거론되고 있으나, 미국 연준의 정책 방향과 환율 추이가 주요 변수로 작용할 전망이다.',
    ],
    views: 15234,
    time: '3시간 전',
    level: '중',
    color: '#5D7CE9',
  },
  {
    id: 'n2',
    title: '국회 본회의, 예산안 처리 극적 합의',
    cat: '정치',
    summary: '여야가 막판 협상 끝에 내년도 예산안 처리에 합의했다.',
    body: [
      '여야가 내년도 정부 예산안 처리에 극적으로 합의했다. 법정 시한을 앞두고 밤샘 협상을 이어간 끝에 총규모 677조원 규모로 가닥이 잡혔다.',
      '핵심 쟁점이었던 R&D 예산과 청년 주거 지원 예산이 일부 증액되는 대신, 일부 SOC 사업은 삭감됐다.',
      '본회의는 오늘 오후 열릴 예정이며, 예산안과 관련 부수법안이 함께 처리된다.',
    ],
    views: 8721,
    time: '5시간 전',
    level: '상',
    color: '#FF4757',
  },
  {
    id: 'n3',
    title: 'AI 스타트업 투자 올해 역대 최고치 경신',
    cat: 'IT/과학',
    summary: '국내 AI 스타트업 투자 규모가 3조원을 돌파하며 역대 최고를 기록했다.',
    body: [
      '올해 국내 AI 스타트업에 대한 투자 규모가 3조 2천억원을 넘어서며 역대 최고치를 경신했다. 생성형 AI 붐을 타고 관련 기업에 투자가 집중된 결과다.',
      '특히 LLM 기반 B2B 솔루션과 AI 반도체 분야가 전체 투자의 60% 이상을 차지했다. 후속 라운드 규모가 커지면서 유니콘 탄생도 잇따르고 있다.',
      '업계에서는 내년에도 이 흐름이 이어질 것으로 전망하지만, 실질적 매출 성장 여부가 옥석을 가를 것이라는 분석도 있다.',
    ],
    views: 12987,
    time: '2시간 전',
    level: '중',
    color: '#00C2D1',
  },
  {
    id: 'n4',
    title: '청년 주거급여 지원 대상 확대',
    cat: '사회',
    summary: '내년부터 청년 주거급여 지원 대상이 확대된다.',
    body: [
      '내년 1월부터 만 19세 이상 34세 이하 저소득 청년을 대상으로 한 주거급여 지원 대상이 대폭 확대된다. 기준 중위소득 46% 이하에서 48% 이하로 완화된다.',
      '지원 금액 또한 1급지 기준 월 최대 35만원까지 인상된다. 정부는 약 15만명의 청년이 추가로 혜택을 볼 것으로 예상했다.',
      '신청은 주소지 관할 주민센터 또는 복지로 홈페이지에서 가능하다.',
    ],
    views: 6543,
    time: '6시간 전',
    level: '하',
    color: '#FFA502',
  },
  {
    id: 'n5',
    title: '삼성전자 3분기 영업이익 9조원 돌파',
    cat: '경제',
    summary: '삼성전자가 3분기 영업이익 9조 1천억원을 기록하며 실적 회복세를 이어갔다.',
    body: [
      '삼성전자가 올해 3분기 연결 기준 영업이익 9조 1천억원, 매출 79조원을 기록했다고 공시했다. 전년 동기 대비 각각 277%, 17% 증가한 수치다.',
      '메모리 반도체 가격 상승과 HBM 수요 확대가 주효했다. 특히 AI 서버용 HBM3E 출하가 본격화되며 반도체 부문 영업이익이 크게 개선됐다.',
      '다만 4분기에는 수요 둔화 우려가 있어 회복 속도가 완만해질 가능성도 제기된다.',
    ],
    views: 21043,
    time: '1시간 전',
    level: '상',
    color: '#5D7CE9',
  },
  {
    id: 'n6',
    title: '전국 초미세먼지 농도 "나쁨" 수준',
    cat: '사회',
    summary: '오늘 전국 대부분 지역의 초미세먼지 농도가 나쁨 수준을 보이고 있다.',
    body: [
      '환경부 국가대기질정보에 따르면 오늘 전국 대부분 지역에서 초미세먼지(PM2.5) 농도가 "나쁨" 수준을 보이고 있다.',
      '대기 정체와 국외 유입이 겹친 결과로, 수도권의 경우 일평균 농도가 50㎍/㎥을 넘길 가능성이 있다.',
      '노약자와 호흡기 질환자는 외출을 자제하고, 외출 시 KF94 이상의 마스크 착용이 권고된다.',
    ],
    views: 4521,
    time: '4시간 전',
    level: '하',
    color: '#FFA502',
  },
  {
    id: 'n7',
    title: '정부, 반도체 특별법 국회 제출',
    cat: '정치',
    summary: '반도체 산업 지원을 위한 특별법안이 국회에 제출됐다.',
    body: [
      '정부는 반도체 산업의 글로벌 경쟁력 강화를 위한 "반도체 특별법" 제정안을 국회에 제출했다.',
      '주요 내용은 반도체 클러스터 인프라 신속 구축, 세액공제 확대, 인재 양성 지원 등이다.',
      '여야 모두 산업 경쟁력 측면에서 공감대를 형성하고 있으나, 세부 조항을 놓고 이견이 있어 심의 과정에서 조정이 예상된다.',
    ],
    views: 7892,
    time: '7시간 전',
    level: '상',
    color: '#FF4757',
  },
  {
    id: 'n8',
    title: '챗GPT, 실시간 검색 기능 공개',
    cat: 'IT/과학',
    summary: 'OpenAI가 챗GPT에 실시간 웹 검색 기능을 공개했다.',
    body: [
      'OpenAI는 유료 구독자를 대상으로 챗GPT의 실시간 웹 검색 기능을 공개했다. 이를 통해 최신 뉴스, 스포츠 결과, 주가 등 실시간 정보를 대화 중 바로 조회할 수 있다.',
      '검색 결과에는 출처 링크가 함께 표시돼 정보 검증이 한결 쉬워졌다.',
      '검색 엔진과 챗봇의 경계가 허물어지면서 기존 검색 시장의 판도 변화가 예상된다.',
    ],
    views: 18765,
    time: '30분 전',
    level: '중',
    color: '#00C2D1',
  },
  {
    id: 'n9',
    title: 'KB국민은행, 청년 적금 신규 출시',
    cat: '경제',
    summary: 'KB국민은행이 연 최고 7% 금리의 청년 적금을 출시했다.',
    body: [
      'KB국민은행은 만 19~34세 청년을 대상으로 연 최고 7%(우대금리 포함) 금리를 제공하는 "KB청년도약적금"을 출시했다.',
      '기본금리 4%에 자동이체, 급여이체, 마케팅 동의 등 조건 충족 시 최대 3%p의 우대금리가 적용된다. 월 납입 한도는 50만원이다.',
      '시중 적금 금리가 3% 초중반인 상황에서 파격적인 조건이라는 평가가 나온다.',
    ],
    views: 9821,
    time: '8시간 전',
    level: '하',
    color: '#5D7CE9',
  },
  {
    id: 'n10',
    title: '5G 28GHz 주파수 재할당 경쟁 본격화',
    cat: 'IT/과학',
    summary: '이통3사의 5G 28GHz 주파수 재할당 경쟁이 본격화됐다.',
    body: [
      '과학기술정보통신부가 5G 28GHz 주파수 재할당을 추진하면서 이통3사의 경쟁이 본격화됐다.',
      '기존 할당 기업이 구축 의무를 채우지 못해 취소된 대역으로, 재할당 입찰 조건과 투자 이행 담보 방식이 쟁점으로 떠올랐다.',
      '정부는 소비자 체감 효용을 높이기 위해 민간 투자 활성화 방안도 병행 검토하고 있다.',
    ],
    views: 3241,
    time: '10시간 전',
    level: '상',
    color: '#00C2D1',
  },
  {
    id: 'n11',
    title: '대법원, 노동시간 산정 기준 변경',
    cat: '사회',
    summary: '대법원이 휴게시간 중 대기 상태에 대한 새로운 판단을 내렸다.',
    body: [
      '대법원 전원합의체는 휴게시간 중이라도 실질적으로 업무에서 완전히 벗어나지 못했다면 근로시간으로 봐야 한다는 판결을 내렸다.',
      '해당 판결은 편의점, 요양시설 등 24시간 근로 현장에서 광범위한 영향을 미칠 것으로 보인다.',
      '사용자 측은 인건비 부담 증가를, 노동계는 실질적 근로시간 보호 강화를 주장하며 판결의 의미를 서로 다르게 해석하고 있다.',
    ],
    views: 11432,
    time: '12시간 전',
    level: '상',
    color: '#FFA502',
  },
  {
    id: 'n12',
    title: '총선 여론조사, 수도권 경합 지역 늘어',
    cat: '정치',
    summary: '최신 총선 여론조사에서 수도권 경합 지역이 늘어난 것으로 나타났다.',
    body: [
      '최근 발표된 복수 여론조사 결과, 수도권에서 5%p 이내 접전을 벌이는 지역구가 지난달 대비 늘어난 것으로 나타났다.',
      '중도·무당층의 투표 의향이 변수로 꼽히며, 경제 이슈와 정책 공약이 표심을 좌우할 가능성이 크다는 분석이다.',
      '각 당은 경합지 중심 유세와 정책 토론회 확대에 나서고 있다.',
    ],
    views: 8123,
    time: '5시간 전',
    level: '중',
    color: '#FF4757',
  },
];

export const NEWS_QUIZZES: Record<string, NewsQuiz> = {
  n1: {
    q: '한국은행이 기준금리를 동결한 주요 이유는 무엇인가요?',
    options: [
      { id: 'a', text: '경제 성장률이 크게 하락했기 때문' },
      { id: 'b', text: '물가 안정과 경제 성장 사이의 균형을 위해' },
      { id: 'c', text: '미국 연준이 금리를 인상했기 때문' },
      { id: 'd', text: '정부의 요청이 있었기 때문' },
    ],
    answer: 'b',
    explain: '한국은행은 물가 상승률이 목표에 근접하고 있으나 변동성이 크다는 점을 고려해 금리를 유지했습니다.',
  },
  n2: {
    q: '내년도 예산안의 총규모는 얼마인가요?',
    options: [
      { id: 'a', text: '약 600조원' },
      { id: 'b', text: '약 677조원' },
      { id: 'c', text: '약 700조원' },
      { id: 'd', text: '약 750조원' },
    ],
    answer: 'b',
    explain: '여야 합의로 총규모 약 677조원 규모의 예산안이 처리됩니다.',
  },
  n3: {
    q: 'AI 스타트업 투자에서 가장 큰 비중을 차지한 분야는?',
    options: [
      { id: 'a', text: '이미지 생성 AI' },
      { id: 'b', text: 'AI 로봇' },
      { id: 'c', text: 'LLM B2B 솔루션과 AI 반도체' },
      { id: 'd', text: '자율주행' },
    ],
    answer: 'c',
    explain: 'LLM 기반 B2B 솔루션과 AI 반도체 분야가 전체 투자의 60% 이상을 차지했습니다.',
  },
  n4: {
    q: '주거급여 기준 중위소득이 어떻게 조정되었나요?',
    options: [
      { id: 'a', text: '46% → 48%로 완화' },
      { id: 'b', text: '48% → 46%로 강화' },
      { id: 'c', text: '50% → 52%로 완화' },
      { id: 'd', text: '변경 없음' },
    ],
    answer: 'a',
    explain: '기준 중위소득 46% 이하에서 48% 이하로 대상 기준이 완화됩니다.',
  },
  n5: {
    q: '삼성전자 3분기 영업이익 증가의 주요 요인은?',
    options: [
      { id: 'a', text: '스마트폰 판매 증가' },
      { id: 'b', text: '가전 수출 확대' },
      { id: 'c', text: '메모리 반도체 가격 상승과 HBM 수요' },
      { id: 'd', text: '디스플레이 사업 개선' },
    ],
    answer: 'c',
    explain: 'HBM을 중심으로 한 메모리 반도체 수요 확대가 실적 개선을 이끌었습니다.',
  },
  n6: {
    q: '초미세먼지 나쁨 상황에서 권고되는 행동은?',
    options: [
      { id: 'a', text: '평소처럼 외출' },
      { id: 'b', text: '창문을 활짝 열기' },
      { id: 'c', text: 'KF94 이상 마스크 착용 및 외출 자제' },
      { id: 'd', text: '운동장에서 운동' },
    ],
    answer: 'c',
    explain: '노약자와 호흡기 질환자는 외출을 자제하고 고성능 마스크를 써야 합니다.',
  },
  n7: {
    q: '반도체 특별법의 주요 내용이 아닌 것은?',
    options: [
      { id: 'a', text: '반도체 클러스터 인프라 신속 구축' },
      { id: 'b', text: '세액공제 확대' },
      { id: 'c', text: '인재 양성 지원' },
      { id: 'd', text: '반도체 수입 금지' },
    ],
    answer: 'd',
    explain: '수입 금지는 포함되지 않으며, 산업 경쟁력 강화가 핵심입니다.',
  },
  n8: {
    q: '챗GPT의 실시간 검색 기능이 주는 가장 큰 변화는?',
    options: [
      { id: 'a', text: '검색 결과에 출처 링크가 포함되지 않음' },
      { id: 'b', text: '검색 엔진과 챗봇의 경계가 허물어짐' },
      { id: 'c', text: '유료 기능에서만 사용 불가' },
      { id: 'd', text: '영어로만 사용 가능' },
    ],
    answer: 'b',
    explain: '실시간 검색으로 기존 검색 시장 판도 변화가 예상됩니다.',
  },
  n9: {
    q: 'KB청년도약적금의 최고 금리 조건은?',
    options: [
      { id: 'a', text: '연 4%' },
      { id: 'b', text: '연 5%' },
      { id: 'c', text: '연 7% (우대금리 포함)' },
      { id: 'd', text: '연 10%' },
    ],
    answer: 'c',
    explain: '기본 4%에 우대금리 3%p를 더해 최고 7%입니다.',
  },
  n10: {
    q: '5G 28GHz 재할당에서 쟁점이 된 것은?',
    options: [
      { id: 'a', text: '주파수 대역 축소' },
      { id: 'b', text: '재할당 입찰 조건과 투자 이행 담보 방식' },
      { id: 'c', text: '요금 인하' },
      { id: 'd', text: '해외 기업 참여' },
    ],
    answer: 'b',
    explain: '과거 구축 의무 미이행 사례가 있어 이행 담보 방식이 쟁점입니다.',
  },
  n11: {
    q: '대법원은 어떤 경우에 휴게시간도 근로시간으로 보았나요?',
    options: [
      { id: 'a', text: '모든 휴게시간' },
      { id: 'b', text: '실질적으로 업무에서 벗어나지 못한 경우' },
      { id: 'c', text: '1시간 미만 휴게시간' },
      { id: 'd', text: '야간 휴게시간만' },
    ],
    answer: 'b',
    explain: '실질적으로 업무에서 완전히 벗어나지 못했다면 근로시간으로 봐야 한다는 취지입니다.',
  },
  n12: {
    q: '수도권 접전 지역에서 중요한 변수로 꼽힌 것은?',
    options: [
      { id: 'a', text: '해외 유권자' },
      { id: 'b', text: '중도·무당층의 투표 의향' },
      { id: 'c', text: '예비 경선 결과' },
      { id: 'd', text: '후보 학력' },
    ],
    answer: 'b',
    explain: '중도·무당층의 표심이 5%p 이내 접전의 승부를 가를 것으로 분석됩니다.',
  },
};

export const FOURCUT_ALL: FourCutItem[] = [
  {
    id: 'f1',
    cat: '경제',
    title: '기준금리 동결, 뭐가 중요할까?',
    subtitle: '4컷으로 정리하는 한국은행 금통위 결정',
    panels: [
      { title: '1️⃣ 결정', body: '한국은행이 기준금리를 연 3.25%로 동결했어요.' },
      { title: '2️⃣ 이유', body: '물가 안정과 경제 성장의 균형을 위해서예요.' },
      { title: '3️⃣ 영향', body: '대출·예금 금리에 당분간 큰 변화 없을 가능성.' },
      { title: '4️⃣ 전망', body: '연내 1~2회 추가 인하 가능성도 거론돼요.' },
    ],
    views: 8421,
    time: '2시간 전',
  },
  {
    id: 'f2',
    cat: '정치',
    title: '예산안 처리 드라마, 4컷 요약',
    subtitle: '밤샘 협상 끝 극적 합의',
    panels: [
      { title: '1️⃣ 규모', body: '내년 예산 677조원으로 확정됐어요.' },
      { title: '2️⃣ 쟁점', body: 'R&D와 청년 주거 예산이 핵심 이슈.' },
      { title: '3️⃣ 조정', body: '일부 SOC 예산이 삭감됐어요.' },
      { title: '4️⃣ 의미', body: '법정 시한 임박해서 극적으로 처리.' },
    ],
    views: 5312,
    time: '4시간 전',
  },
  {
    id: 'f3',
    cat: 'IT/과학',
    title: 'AI 스타트업 돈이 몰린다',
    subtitle: '역대 최고 투자 규모',
    panels: [
      { title: '1️⃣ 규모', body: '국내 AI 투자 3.2조원 돌파!' },
      { title: '2️⃣ 주인공', body: 'LLM B2B 솔루션, AI 반도체가 주도.' },
      { title: '3️⃣ 결과', body: '후속 투자 커지며 유니콘 탄생 가속.' },
      { title: '4️⃣ 변수', body: '실제 매출이 옥석을 가를 거예요.' },
    ],
    views: 7102,
    time: '3시간 전',
  },
  {
    id: 'f4',
    cat: '사회',
    title: '청년 주거급여, 이렇게 바뀐다',
    subtitle: '지원 대상과 금액 대폭 확대',
    panels: [
      { title: '1️⃣ 대상', body: '중위소득 46% → 48%로 완화.' },
      { title: '2️⃣ 금액', body: '1급지 월 최대 35만원까지 인상.' },
      { title: '3️⃣ 규모', body: '청년 15만명 추가 혜택 예상.' },
      { title: '4️⃣ 신청', body: '주민센터 또는 복지로에서 가능.' },
    ],
    views: 4321,
    time: '6시간 전',
  },
  {
    id: 'f5',
    cat: '경제',
    title: '삼성전자 어닝 서프라이즈',
    subtitle: 'HBM이 이끈 반도체 회복',
    panels: [
      { title: '1️⃣ 실적', body: '3분기 영업이익 9.1조원 기록.' },
      { title: '2️⃣ 주역', body: 'HBM3E 출하 본격화가 핵심.' },
      { title: '3️⃣ 환경', body: 'AI 서버 수요가 메모리 시장 견인.' },
      { title: '4️⃣ 주의', body: '4분기엔 수요 둔화 우려 존재.' },
    ],
    views: 9876,
    time: '1시간 전',
  },
  {
    id: 'f6',
    cat: 'IT/과학',
    title: '챗GPT가 검색까지 한다고?',
    subtitle: 'OpenAI 실시간 웹 검색 공개',
    panels: [
      { title: '1️⃣ 기능', body: '챗GPT가 실시간 웹 검색을 시작.' },
      { title: '2️⃣ 대상', body: '유료 구독자부터 순차 개방.' },
      { title: '3️⃣ 장점', body: '최신 뉴스·주가·스포츠 결과 조회.' },
      { title: '4️⃣ 파장', body: '검색 엔진 시장 판도 변화 예상.' },
    ],
    views: 11234,
    time: '30분 전',
  },
  {
    id: 'f7',
    cat: '정치',
    title: '반도체 특별법, 뭐가 담겼나',
    subtitle: '산업 경쟁력 강화 패키지',
    panels: [
      { title: '1️⃣ 목적', body: '반도체 글로벌 경쟁력 강화.' },
      { title: '2️⃣ 내용', body: '클러스터 인프라 신속 구축.' },
      { title: '3️⃣ 혜택', body: '세액공제 확대, 인재 양성 지원.' },
      { title: '4️⃣ 과제', body: '세부 조항 놓고 여야 조율 필요.' },
    ],
    views: 4567,
    time: '7시간 전',
  },
  {
    id: 'f8',
    cat: '사회',
    title: '휴게시간 판결, 어떤 의미?',
    subtitle: '대법원 전원합의체 결정',
    panels: [
      { title: '1️⃣ 판결', body: '실질적 대기 상태는 근로시간 해당.' },
      { title: '2️⃣ 대상', body: '편의점, 요양시설 등 광범위 영향.' },
      { title: '3️⃣ 사용자', body: '인건비 부담 증가 우려.' },
      { title: '4️⃣ 노동계', body: '실질적 보호 강화 환영.' },
    ],
    views: 6543,
    time: '12시간 전',
  },
];

export const SCRAP_FOLDERS: ScrapFolder[] = [
  { id: 'f_economy', name: '경제', emoji: '💰', categories: ['경제'] },
  { id: 'f_tech', name: 'IT/과학', emoji: '🔬', categories: ['IT/과학'] },
  { id: 'f_politics', name: '정치', emoji: '🏛️', categories: ['정치'] },
  { id: 'f_social', name: '사회', emoji: '👫', categories: ['사회'] },
  { id: 'f_word', name: '단어', emoji: '📝', kind: 'word', categories: [] },
];

// 레벨별 XP 규칙
export const XP_CORRECT = 10;
export const XP_WRONG = -5;
export const XP_PER_LEVEL = 100;
