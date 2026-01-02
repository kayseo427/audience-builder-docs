// Main Application Controller

import { BEHAVIORAL_FILTERS, TRANSACTIONAL_FILTERS, PROFILE_FILTERS, CROSS_SELL_FILTERS } from './data-schema.js';
import { updateFilter, calculateAudience, clearAllFilters, exportFilters, importFilters, activeFilters, mockUserDatabase } from './rule-engine.js';
import { generateAIResponse } from './llm-interface.js';

// UI State
let currentMode = 'hybrid'; // 'hybrid', 'rules', 'llm'

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeFilters();
    initializeEventListeners();
    updateAudienceDisplay();
});

// Initialize all filter controls
function initializeFilters() {
    // Keyword Pills (Multi-category)
    initializeKeywordPills();

    // Preferred Days Pills
    initializePills('preferredDays', ['월', '화', '수', '목', '금', '토', '일']);

    // Active Region Pills
    initializePills('activeRegion', PROFILE_FILTERS.activeRegion.options);

    // Life Stage Pills
    initializePills('lifeStage', PROFILE_FILTERS.lifeStage.options);

    // Transportation Pills
    initializePills('transportation', ['렌터카', '기차', '항공', '버스']);

    // Range sliders
    initializeRangeSlider('recency', 365);
    initializeRangeSlider('paymentFreq', 50);
    initializeRangeSlider('aov', 200);
}

// Initialize keyword pills with category selection
function initializeKeywordPills() {
    const categorySelect = document.getElementById('keywordCategory');
    const pillsContainer = document.getElementById('keywordPills');

    categorySelect.addEventListener('change', (e) => {
        const category = e.target.value;
        if (!category) {
            pillsContainer.innerHTML = '';
            return;
        }

        const options = BEHAVIORAL_FILTERS.searchKeywords.options[category];
        pillsContainer.innerHTML = '';

        options.forEach(option => {
            const pill = createPill(option, () => {
                toggleArrayFilter(`searchKeywords.${category}`, option);
            });
            pillsContainer.appendChild(pill);
        });
    });
}

// Initialize multi-select pills
function initializePills(filterId, options) {
    const container = document.getElementById(`${filterId}Pills`);

    options.forEach(option => {
        const pill = createPill(option, () => {
            toggleArrayFilter(filterId, option);
        });
        container.appendChild(pill);
    });
}

// Create a pill element
function createPill(label, onClick) {
    const pill = document.createElement('div');
    pill.className = 'pill';
    pill.textContent = label;
    pill.addEventListener('click', () => {
        pill.classList.toggle('selected');
        onClick();
    });
    return pill;
}

// Toggle array filter (for multi-select)
function toggleArrayFilter(filterPath, value) {
    const parts = filterPath.split('.');
    let currentFilter;

    if (parts.length === 2) {
        currentFilter = activeFilters[parts[0]][parts[1]];
    } else {
        currentFilter = activeFilters[filterPath];
    }

    const index = currentFilter.indexOf(value);
    if (index > -1) {
        currentFilter.splice(index, 1);
    } else {
        currentFilter.push(value);
    }

    updateFilter(filterPath, currentFilter);
    updateAudienceDisplay();
}

// Initialize range slider
function initializeRangeSlider(id, max) {
    const slider = document.getElementById(`${id}Range`);
    const valueDisplay = document.getElementById(`${id}Value`);

    slider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        valueDisplay.textContent = value;

        // Map to filter names
        const filterMap = {
            'recency': 'recency',
            'paymentFreq': 'paymentFrequency',
            'aov': 'aov'
        };

        updateFilter(filterMap[id], value);
        updateAudienceDisplay();
    });
}

// Initialize all event listeners
function initializeEventListeners() {
    // Mode Switcher
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentMode = e.target.dataset.mode;
            updatePanelVisibility();
        });
    });

    // Select dropdowns
    document.getElementById('viewedProducts').addEventListener('change', (e) => {
        updateFilter('viewedProducts', e.target.value);
        updateAudienceDisplay();
    });

    document.getElementById('leadTime').addEventListener('change', (e) => {
        updateFilter('leadTime', e.target.value);
        updateAudienceDisplay();
    });

    document.getElementById('membershipTier').addEventListener('change', (e) => {
        updateFilter('membershipTier', e.target.value);
        updateAudienceDisplay();
    });

    document.getElementById('deviceType').addEventListener('change', (e) => {
        updateFilter('deviceType', e.target.value);
        updateAudienceDisplay();
    });

    // Toggle switches
    document.getElementById('hasCartWishlist').addEventListener('change', (e) => {
        updateFilter('hasCartWishlist', e.target.checked ? true : null);
        updateAudienceDisplay();
    });

    document.getElementById('hasSpaceRental').addEventListener('change', (e) => {
        updateFilter('hasSpaceRental', e.target.checked ? true : null);
        updateAudienceDisplay();
    });

    document.getElementById('hasInternationalIntent').addEventListener('change', (e) => {
        updateFilter('hasInternationalIntent', e.target.checked ? true : null);
        updateAudienceDisplay();
    });

    // Clear Filters Button
    document.getElementById('clearFiltersBtn').addEventListener('click', () => {
        clearAllFilters();
        resetUIFilters();
        updateAudienceDisplay();
    });

    // Chat Interface
    document.getElementById('sendChatBtn').addEventListener('click', sendChatMessage);
    document.getElementById('chatInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });

    // Suggested Queries
    document.querySelectorAll('.suggested-query').forEach(query => {
        query.addEventListener('click', (e) => {
            const queryText = e.target.dataset.query;
            document.getElementById('chatInput').value = queryText;
            sendChatMessage();
        });
    });

    // Save/Load Buttons
    document.getElementById('saveAudienceBtn').addEventListener('click', saveAudience);
    document.getElementById('loadAudienceBtn').addEventListener('click', loadAudience);

    // Export Button
    document.getElementById('exportAudienceBtn').addEventListener('click', exportAudience);
}

// Update panel visibility based on mode
function updatePanelVisibility() {
    const rulePanel = document.getElementById('rulePanel');
    const llmPanel = document.getElementById('llmPanel');
    const mainContent = document.getElementById('mainContent');

    if (currentMode === 'hybrid') {
        mainContent.style.gridTemplateColumns = '1fr 1fr';
        rulePanel.style.display = 'block';
        llmPanel.style.display = 'block';
    } else if (currentMode === 'rules') {
        mainContent.style.gridTemplateColumns = '1fr';
        rulePanel.style.display = 'block';
        llmPanel.style.display = 'none';
    } else if (currentMode === 'llm') {
        mainContent.style.gridTemplateColumns = '1fr';
        rulePanel.style.display = 'none';
        llmPanel.style.display = 'block';
    }
}

// Send chat message
function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    // Add user message to chat
    addChatMessage(message, 'user');

    // Clear input
    input.value = '';

    // Show loading
    const loadingId = addChatMessage('<div class="loading-dots"><span></span><span></span><span></span></div>', 'ai');

    // Simulate AI processing delay
    setTimeout(() => {
        const response = generateAIResponse(message);

        // Remove loading message
        document.getElementById(loadingId).remove();

        // Add AI response
        addChatMessage(response.message, 'ai');

        // Update audience display
        updateAudienceDisplay();
    }, 800);
}

// Add message to chat
function addChatMessage(message, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageId = `msg-${Date.now()}`;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.id = messageId;

    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${sender}`;
    avatar.textContent = sender === 'user' ? '👤' : '🤖';

    const content = document.createElement('div');
    content.className = `message-content ${sender}`;
    content.innerHTML = message;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return messageId;
}

// Update audience size display
function updateAudienceDisplay() {
    const audience = calculateAudience();
    const audienceSize = audience.length;
    const totalUsers = mockUserDatabase.length;
    const percentage = ((audienceSize / totalUsers) * 100).toFixed(1);

    document.getElementById('audienceSize').textContent = audienceSize.toLocaleString();
    document.getElementById('audiencePercentage').textContent = `전체 유저의 ${percentage}%`;
}

// Reset all UI filter controls
function resetUIFilters() {
    // Reset selects
    document.getElementById('viewedProducts').value = '';
    document.getElementById('leadTime').value = '';
    document.getElementById('membershipTier').value = '';
    document.getElementById('deviceType').value = '';
    document.getElementById('keywordCategory').value = '';

    // Reset toggles
    document.getElementById('hasCartWishlist').checked = false;
    document.getElementById('hasSpaceRental').checked = false;
    document.getElementById('hasInternationalIntent').checked = false;

    // Reset range sliders
    document.getElementById('recencyRange').value = 365;
    document.getElementById('recencyValue').textContent = 365;
    document.getElementById('paymentFreqRange').value = 0;
    document.getElementById('paymentFreqValue').textContent = 0;
    document.getElementById('aovRange').value = 0;
    document.getElementById('aovValue').textContent = 0;

    // Reset pills
    document.querySelectorAll('.pill.selected').forEach(pill => {
        pill.classList.remove('selected');
    });

    // Clear keyword pills
    document.getElementById('keywordPills').innerHTML = '';
}

// Save audience configuration
function saveAudience() {
    const config = exportFilters();
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audience-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    // Show feedback
    const btn = document.getElementById('saveAudienceBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '✅ 저장 완료!';
    setTimeout(() => {
        btn.innerHTML = originalText;
    }, 2000);
}

// Load audience configuration
function loadAudience() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
            const result = importFilters(event.target.result);
            if (result) {
                // TODO: Update UI to reflect loaded filters
                updateAudienceDisplay();

                // Show feedback
                const btn = document.getElementById('loadAudienceBtn');
                const originalText = btn.innerHTML;
                btn.innerHTML = '✅ 불러오기 완료!';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                }, 2000);
            }
        };

        reader.readAsText(file);
    };

    input.click();
}

// Export audience
function exportAudience() {
    const audience = calculateAudience();
    const exportData = {
        timestamp: new Date().toISOString(),
        audienceSize: audience.length,
        filters: activeFilters,
        users: audience.map(u => u.id)
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audience-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    // Show feedback
    const btn = document.getElementById('exportAudienceBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '✅ 내보내기 완료!';
    setTimeout(() => {
        btn.innerHTML = originalText;
    }, 2000);
}
