// LLM Interface - Natural Language Query Processing

import { updateFilter, activeFilters, calculateAudience } from './rule-engine.js';

// Simulated LLM responses with intelligent query parsing
export const queryPatterns = [
    {
        patterns: ['제주', '제주도'],
        action: () => updateFilter('searchKeywords.regions', ['제주'])
    },
    {
        patterns: ['경주'],
        action: () => updateFilter('searchKeywords.regions', ['경주'])
    },
    {
        patterns: ['부산'],
        action: () => updateFilter('searchKeywords.regions', ['부산'])
    },
    {
        patterns: ['강릉'],
        action: () => updateFilter('searchKeywords.regions', ['강릉'])
    },
    {
        patterns: ['프리미엄', '블랙', '고급'],
        action: () => updateFilter('viewedProducts', '프리미엄 라인 (블랙)')
    },
    {
        patterns: ['풀빌라', 'pool villa'],
        action: () => updateFilter('searchKeywords.accommodationTypes', ['풀빌라'])
    },
    {
        patterns: ['호캉스', '호텔'],
        action: () => updateFilter('searchKeywords.accommodationTypes', ['호캉스'])
    },
    {
        patterns: ['펜션'],
        action: () => updateFilter('searchKeywords.accommodationTypes', ['펜션'])
    },
    {
        patterns: ['애견', '반려동물', '강아지'],
        action: () => updateFilter('searchKeywords.themes', ['애견 동반'])
    },
    {
        patterns: ['키즈', '어린이', '아이'],
        action: () => updateFilter('searchKeywords.themes', ['키즈'])
    },
    {
        patterns: ['커플'],
        action: () => {
            updateFilter('searchKeywords.themes', ['커플']);
            updateFilter('lifeStage', ['커플']);
        }
    },
    {
        patterns: ['VIP', 'vip', '블랙'],
        action: () => updateFilter('membershipTier', 'VIP')
    },
    {
        patterns: ['골드'],
        action: () => updateFilter('membershipTier', '골드')
    },
    {
        patterns: ['30일', '한달'],
        action: () => updateFilter('recency', 30)
    },
    {
        patterns: ['7일', '일주일'],
        action: () => updateFilter('recency', 7)
    },
    {
        patterns: ['14일', '2주'],
        action: () => updateFilter('recency', 14)
    },
    {
        patterns: ['주말'],
        action: () => updateFilter('preferredDays', ['토', '일'])
    },
    {
        patterns: ['평일'],
        action: () => updateFilter('preferredDays', ['월', '화', '수', '목', '금'])
    },
    {
        patterns: ['20만원', '20만'],
        action: () => updateFilter('aov', 20)
    },
    {
        patterns: ['30만원', '30만'],
        action: () => updateFilter('aov', 30)
    },
    {
        patterns: ['50만원', '50만'],
        action: () => updateFilter('aov', 50)
    },
    {
        patterns: ['iOS', '아이폰', '아이패드'],
        action: () => updateFilter('deviceType', 'iOS')
    },
    {
        patterns: ['Android', '안드로이드'],
        action: () => updateFilter('deviceType', 'Android')
    },
    {
        patterns: ['해외', '국외', '외국'],
        action: () => updateFilter('hasInternationalIntent', true)
    },
    {
        patterns: ['렌터카', '렌트카'],
        action: () => updateFilter('transportation', ['렌터카'])
    },
    {
        patterns: ['자주', '반복', '단골'],
        action: () => updateFilter('paymentFrequency', 5)
    }
];

// Process natural language query
export function processQuery(query) {
    const lowerQuery = query.toLowerCase();
    const appliedRules = [];

    // Match patterns and apply filters
    queryPatterns.forEach(({ patterns, action }) => {
        if (patterns.some(pattern => lowerQuery.includes(pattern.toLowerCase()))) {
            action();
            appliedRules.push(patterns[0]);
        }
    });

    return {
        understood: appliedRules.length > 0,
        matchedPatterns: appliedRules,
        audience: calculateAudience()
    };
}

// Generate AI response based on query
export function generateAIResponse(query) {
    const result = processQuery(query);

    if (!result.understood) {
        return {
            message: `질문을 이해하지 못했습니다. 😅<br><br>다음과 같은 방식으로 질문해주세요:<br>
        • "제주도 프리미엄 숙박을 찾는 고객"<br>
        • "최근 30일 내 VIP 고객"<br>
        • "주말 호캉스 선호 고객"`,
            filters: []
        };
    }

    const filterDesc = getActiveFiltersSummary();

    return {
        message: `네, 이해했습니다! 🎯<br><br>
      다음 조건으로 오디언스를 생성했습니다:<br>
      ${filterDesc}<br><br>
      총 <strong style="color: var(--primary-light)">${result.audience.length}명</strong>의 고객이 매칭되었습니다.`,
        filters: filterDesc,
        audienceSize: result.audience.length
    };
}

// Get summary of active filters for AI response
function getActiveFiltersSummary() {
    const summaries = [];

    if (activeFilters.searchKeywords.regions.length > 0) {
        summaries.push(`• 검색 지역: ${activeFilters.searchKeywords.regions.join(', ')}`);
    }

    if (activeFilters.searchKeywords.accommodationTypes.length > 0) {
        summaries.push(`• 숙박 유형: ${activeFilters.searchKeywords.accommodationTypes.join(', ')}`);
    }

    if (activeFilters.searchKeywords.themes.length > 0) {
        summaries.push(`• 테마: ${activeFilters.searchKeywords.themes.join(', ')}`);
    }

    if (activeFilters.viewedProducts) {
        summaries.push(`• 조회 상품: ${activeFilters.viewedProducts}`);
    }

    if (activeFilters.hasCartWishlist !== null) {
        summaries.push(`• 장바구니/찜: ${activeFilters.hasCartWishlist ? '있음' : '없음'}`);
    }

    if (activeFilters.recency < 365) {
        summaries.push(`• 최근 접속: ${activeFilters.recency}일 이내`);
    }

    if (activeFilters.paymentFrequency > 0) {
        summaries.push(`• 연간 결제: ${activeFilters.paymentFrequency}회 이상`);
    }

    if (activeFilters.aov > 0) {
        summaries.push(`• 객단가: ${activeFilters.aov}만원 이상`);
    }

    if (activeFilters.preferredDays.length > 0) {
        summaries.push(`• 선호 요일: ${activeFilters.preferredDays.join(', ')}`);
    }

    if (activeFilters.leadTime) {
        summaries.push(`• 리드 타임: ${activeFilters.leadTime}`);
    }

    if (activeFilters.activeRegion.length > 0) {
        summaries.push(`• 활동 지역: ${activeFilters.activeRegion.join(', ')}`);
    }

    if (activeFilters.membershipTier) {
        summaries.push(`• 멤버십: ${activeFilters.membershipTier}`);
    }

    if (activeFilters.deviceType) {
        summaries.push(`• 기기: ${activeFilters.deviceType}`);
    }

    if (activeFilters.lifeStage.length > 0) {
        summaries.push(`• 라이프스테이지: ${activeFilters.lifeStage.join(', ')}`);
    }

    if (activeFilters.hasSpaceRental !== null) {
        summaries.push(`• 공간대여/레저: ${activeFilters.hasSpaceRental ? '있음' : '없음'}`);
    }

    if (activeFilters.hasInternationalIntent !== null) {
        summaries.push(`• 해외 여행 의도: ${activeFilters.hasInternationalIntent ? '있음' : '없음'}`);
    }

    if (activeFilters.transportation.length > 0) {
        summaries.push(`• 교통 수단: ${activeFilters.transportation.join(', ')}`);
    }

    return summaries.join('<br>');
}

// Suggested queries
export const suggestedQueries = [
    "제주도 프리미엄 숙박을 찾는 고객",
    "최근 30일 내 구매이력이 있는 VIP 고객",
    "애견 동반 가능한 숙소를 자주 찾는 사용자",
    "주말 호캉스 선호하며 평균 20만원 이상 지불",
    "iOS 사용자 중 해외 여행 의도가 있는 고객",
    "경주에서 커플 숙소를 찾는 골드 회원",
    "풀빌라를 반복 구매하는 단골 고객",
    "키즈 펜션을 평일에 예약하는 가족 고객"
];
