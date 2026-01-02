// Data Schema and Mock Data for Audience Builder

// Behavioral Data Schema
export const BEHAVIORAL_FILTERS = {
  searchKeywords: {
    name: '검색 키워드',
    type: 'multiselect',
    options: {
      regions: ['제주', '경주', '부산', '강릉', '여수', '속초', '전주', '대구'],
      accommodationTypes: ['풀빌라', '호캉스', '모텔', '비즈니스 호텔', '펜션', '리조트', '게스트하우스', '한옥'],
      themes: ['애견 동반', '키즈', '커플', '워케이션', '파티', '오션뷰', '마운틴뷰', '스파']
    }
  },
  viewedProducts: {
    name: '조회 상품군',
    type: 'select',
    options: ['프리미엄 라인 (블랙)', '가성비 모텔', '비즈니스 호텔', '펜션', '리조트', '게스트하우스', '전체']
  },
  cartWishlist: {
    name: '장바구니/찜 목록',
    type: 'boolean',
    options: ['있음', '없음']
  },
  recency: {
    name: '최근 접속일',
    type: 'range',
    unit: '일',
    min: 0,
    max: 365
  }
};

// Transactional Data Schema
export const TRANSACTIONAL_FILTERS = {
  paymentFrequency: {
    name: '결제 주기',
    type: 'range',
    unit: '회/년',
    min: 0,
    max: 50
  },
  aov: {
    name: '객단가 (AOV)',
    type: 'range',
    unit: '만원',
    min: 0,
    max: 200
  },
  preferredDays: {
    name: '선호 숙박 요일',
    type: 'multiselect',
    options: ['월', '화', '수', '목', '금', '토', '일']
  },
  leadTime: {
    name: '리드 타임',
    type: 'select',
    options: ['당일', '1-3일', '4-7일', '1-2주', '2주-1개월', '1개월 이상']
  }
};

// User Profile & Context Schema
export const PROFILE_FILTERS = {
  activeRegion: {
    name: '주 활동 지역',
    type: 'multiselect',
    options: ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']
  },
  membershipTier: {
    name: '멤버십 등급',
    type: 'select',
    options: ['일반', '실버', '골드', 'VIP', '블랙']
  },
  deviceType: {
    name: '접속 기기',
    type: 'select',
    options: ['iOS', 'Android', 'Web (Desktop)', 'Web (Mobile)', '전체']
  },
  lifeStage: {
    name: '라이프스테이지',
    type: 'multiselect',
    options: ['솔로', '커플', '신혼', '자녀 동반 가족', '반려동물 가족', '시니어']
  }
};

// Cross-Sell Data Schema
export const CROSS_SELL_FILTERS = {
  spaceRental: {
    name: '공간대여/레저 이용',
    type: 'boolean',
    options: ['있음', '없음']
  },
  internationalIntent: {
    name: '해외 여행 의도',
    type: 'boolean',
    options: ['있음', '없음']
  },
  transportation: {
    name: '렌터카/교통 예약',
    type: 'multiselect',
    options: ['렌터카', '기차', '항공', '버스', '없음']
  }
};

// Generate mock user data
export function generateMockUsers(count = 1000) {
  const users = [];
  
  for (let i = 0; i < count; i++) {
    users.push({
      id: `user_${i}`,
      // Behavioral
      searchKeywords: {
        regions: randomSelect(BEHAVIORAL_FILTERS.searchKeywords.options.regions, 0, 3),
        accommodationTypes: randomSelect(BEHAVIORAL_FILTERS.searchKeywords.options.accommodationTypes, 0, 2),
        themes: randomSelect(BEHAVIORAL_FILTERS.searchKeywords.options.themes, 0, 3)
      },
      viewedProducts: randomItem(BEHAVIORAL_FILTERS.viewedProducts.options),
      hasCartWishlist: Math.random() > 0.7,
      recency: Math.floor(Math.random() * 365),
      
      // Transactional
      paymentFrequency: Math.floor(Math.random() * 25),
      aov: Math.floor(Math.random() * 150) + 10,
      preferredDays: randomSelect(['월', '화', '수', '목', '금', '토', '일'], 1, 4),
      leadTime: randomItem(TRANSACTIONAL_FILTERS.leadTime.options),
      
      // Profile
      activeRegion: randomSelect(PROFILE_FILTERS.activeRegion.options, 1, 2),
      membershipTier: randomWeightedItem(['일반', '실버', '골드', 'VIP', '블랙'], [0.5, 0.25, 0.15, 0.07, 0.03]),
      deviceType: randomWeightedItem(['iOS', 'Android', 'Web (Desktop)', 'Web (Mobile)'], [0.35, 0.4, 0.15, 0.1]),
      lifeStage: randomSelect(PROFILE_FILTERS.lifeStage.options, 1, 2),
      
      // Cross-Sell
      hasSpaceRental: Math.random() > 0.85,
      hasInternationalIntent: Math.random() > 0.7,
      transportation: randomSelect(CROSS_SELL_FILTERS.transportation.options, 0, 2)
    });
  }
  
  return users;
}

// Helper functions
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSelect(arr, min, max) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomWeightedItem(items, weights) {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    if (random < weights[i]) {
      return items[i];
    }
    random -= weights[i];
  }
  
  return items[items.length - 1];
}
