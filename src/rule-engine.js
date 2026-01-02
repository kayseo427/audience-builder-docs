// Rule Engine - Audience Filtering Logic

import { BEHAVIORAL_FILTERS, TRANSACTIONAL_FILTERS, PROFILE_FILTERS, CROSS_SELL_FILTERS, generateMockUsers } from './data-schema.js';

// Generate mock user database
export const mockUserDatabase = generateMockUsers(1000);

// Active filter state
export let activeFilters = {
    // Behavioral
    searchKeywords: { regions: [], accommodationTypes: [], themes: [] },
    viewedProducts: '',
    hasCartWishlist: null,
    recency: 365,

    // Transactional
    paymentFrequency: 0,
    aov: 0,
    preferredDays: [],
    leadTime: '',

    // Profile
    activeRegion: [],
    membershipTier: '',
    deviceType: '',
    lifeStage: [],

    // Cross-Sell
    hasSpaceRental: null,
    hasInternationalIntent: null,
    transportation: []
};

// Apply all active filters to user database
export function calculateAudience() {
    let filteredUsers = mockUserDatabase;

    // Behavioral Filters
    if (activeFilters.searchKeywords.regions.length > 0) {
        filteredUsers = filteredUsers.filter(user =>
            activeFilters.searchKeywords.regions.some(region =>
                user.searchKeywords.regions.includes(region)
            )
        );
    }

    if (activeFilters.searchKeywords.accommodationTypes.length > 0) {
        filteredUsers = filteredUsers.filter(user =>
            activeFilters.searchKeywords.accommodationTypes.some(type =>
                user.searchKeywords.accommodationTypes.includes(type)
            )
        );
    }

    if (activeFilters.searchKeywords.themes.length > 0) {
        filteredUsers = filteredUsers.filter(user =>
            activeFilters.searchKeywords.themes.some(theme =>
                user.searchKeywords.themes.includes(theme)
            )
        );
    }

    if (activeFilters.viewedProducts) {
        filteredUsers = filteredUsers.filter(user =>
            user.viewedProducts === activeFilters.viewedProducts
        );
    }

    if (activeFilters.hasCartWishlist !== null) {
        filteredUsers = filteredUsers.filter(user =>
            user.hasCartWishlist === activeFilters.hasCartWishlist
        );
    }

    if (activeFilters.recency < 365) {
        filteredUsers = filteredUsers.filter(user =>
            user.recency <= activeFilters.recency
        );
    }

    // Transactional Filters
    if (activeFilters.paymentFrequency > 0) {
        filteredUsers = filteredUsers.filter(user =>
            user.paymentFrequency >= activeFilters.paymentFrequency
        );
    }

    if (activeFilters.aov > 0) {
        filteredUsers = filteredUsers.filter(user =>
            user.aov >= activeFilters.aov
        );
    }

    if (activeFilters.preferredDays.length > 0) {
        filteredUsers = filteredUsers.filter(user =>
            activeFilters.preferredDays.some(day =>
                user.preferredDays.includes(day)
            )
        );
    }

    if (activeFilters.leadTime) {
        filteredUsers = filteredUsers.filter(user =>
            user.leadTime === activeFilters.leadTime
        );
    }

    // Profile Filters
    if (activeFilters.activeRegion.length > 0) {
        filteredUsers = filteredUsers.filter(user =>
            activeFilters.activeRegion.some(region =>
                user.activeRegion.includes(region)
            )
        );
    }

    if (activeFilters.membershipTier) {
        filteredUsers = filteredUsers.filter(user =>
            user.membershipTier === activeFilters.membershipTier
        );
    }

    if (activeFilters.deviceType) {
        filteredUsers = filteredUsers.filter(user =>
            user.deviceType === activeFilters.deviceType
        );
    }

    if (activeFilters.lifeStage.length > 0) {
        filteredUsers = filteredUsers.filter(user =>
            activeFilters.lifeStage.some(stage =>
                user.lifeStage.includes(stage)
            )
        );
    }

    // Cross-Sell Filters
    if (activeFilters.hasSpaceRental !== null) {
        filteredUsers = filteredUsers.filter(user =>
            user.hasSpaceRental === activeFilters.hasSpaceRental
        );
    }

    if (activeFilters.hasInternationalIntent !== null) {
        filteredUsers = filteredUsers.filter(user =>
            user.hasInternationalIntent === activeFilters.hasInternationalIntent
        );
    }

    if (activeFilters.transportation.length > 0) {
        filteredUsers = filteredUsers.filter(user =>
            activeFilters.transportation.some(transport =>
                user.transportation.includes(transport)
            )
        );
    }

    return filteredUsers;
}

// Update a specific filter
export function updateFilter(filterName, value) {
    // Handle nested filter paths (e.g., 'searchKeywords.regions')
    const parts = filterName.split('.');

    if (parts.length === 2) {
        activeFilters[parts[0]][parts[1]] = value;
    } else {
        activeFilters[filterName] = value;
    }

    return calculateAudience();
}

// Clear all filters
export function clearAllFilters() {
    activeFilters = {
        searchKeywords: { regions: [], accommodationTypes: [], themes: [] },
        viewedProducts: '',
        hasCartWishlist: null,
        recency: 365,
        paymentFrequency: 0,
        aov: 0,
        preferredDays: [],
        leadTime: '',
        activeRegion: [],
        membershipTier: '',
        deviceType: '',
        lifeStage: [],
        hasSpaceRental: null,
        hasInternationalIntent: null,
        transportation: []
    };

    return calculateAudience();
}

// Get human-readable description of active filters
export function getFilterDescription() {
    const descriptions = [];

    // Count active filters
    let activeCount = 0;

    if (activeFilters.searchKeywords.regions.length > 0) {
        descriptions.push(`지역: ${activeFilters.searchKeywords.regions.join(', ')}`);
        activeCount++;
    }

    if (activeFilters.searchKeywords.accommodationTypes.length > 0) {
        descriptions.push(`숙박 유형: ${activeFilters.searchKeywords.accommodationTypes.join(', ')}`);
        activeCount++;
    }

    if (activeFilters.searchKeywords.themes.length > 0) {
        descriptions.push(`테마: ${activeFilters.searchKeywords.themes.join(', ')}`);
        activeCount++;
    }

    if (activeFilters.viewedProducts) {
        descriptions.push(`조회 상품: ${activeFilters.viewedProducts}`);
        activeCount++;
    }

    if (activeFilters.hasCartWishlist !== null) {
        descriptions.push(`장바구니/찜: ${activeFilters.hasCartWishlist ? '있음' : '없음'}`);
        activeCount++;
    }

    if (activeFilters.recency < 365) {
        descriptions.push(`최근 접속: ${activeFilters.recency}일 이내`);
        activeCount++;
    }

    if (activeFilters.paymentFrequency > 0) {
        descriptions.push(`연간 결제: ${activeFilters.paymentFrequency}회 이상`);
        activeCount++;
    }

    if (activeFilters.aov > 0) {
        descriptions.push(`객단가: ${activeFilters.aov}만원 이상`);
        activeCount++;
    }

    if (activeFilters.preferredDays.length > 0) {
        descriptions.push(`선호 요일: ${activeFilters.preferredDays.join(', ')}`);
        activeCount++;
    }

    if (activeFilters.leadTime) {
        descriptions.push(`리드 타임: ${activeFilters.leadTime}`);
        activeCount++;
    }

    if (activeFilters.activeRegion.length > 0) {
        descriptions.push(`활동 지역: ${activeFilters.activeRegion.join(', ')}`);
        activeCount++;
    }

    if (activeFilters.membershipTier) {
        descriptions.push(`멤버십: ${activeFilters.membershipTier}`);
        activeCount++;
    }

    if (activeFilters.deviceType) {
        descriptions.push(`기기: ${activeFilters.deviceType}`);
        activeCount++;
    }

    if (activeFilters.lifeStage.length > 0) {
        descriptions.push(`라이프스테이지: ${activeFilters.lifeStage.join(', ')}`);
        activeCount++;
    }

    if (activeFilters.hasSpaceRental !== null) {
        descriptions.push(`공간대여/레저: ${activeFilters.hasSpaceRental ? '있음' : '없음'}`);
        activeCount++;
    }

    if (activeFilters.hasInternationalIntent !== null) {
        descriptions.push(`해외 여행 의도: ${activeFilters.hasInternationalIntent ? '있음' : '없음'}`);
        activeCount++;
    }

    if (activeFilters.transportation.length > 0) {
        descriptions.push(`교통 수단: ${activeFilters.transportation.join(', ')}`);
        activeCount++;
    }

    return {
        count: activeCount,
        descriptions: descriptions
    };
}

// Export filter state for saving
export function exportFilters() {
    return JSON.stringify(activeFilters, null, 2);
}

// Import filter state
export function importFilters(filtersJSON) {
    try {
        const imported = JSON.parse(filtersJSON);
        activeFilters = imported;
        return calculateAudience();
    } catch (e) {
        console.error('Failed to import filters:', e);
        return null;
    }
}
