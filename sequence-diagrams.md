# 오디언스 빌더 - 시퀀스 다이어그램

## 1. 룰 기반 필터링 플로우

```mermaid
sequenceDiagram
    actor User as 마케터
    participant UI as UI Controller
    participant Filter as Filter UI
    participant Engine as Rule Engine
    participant Data as Mock Database
    participant Display as Audience Display

    User->>UI: 앱 로딩
    UI->>Filter: 필터 컨트롤 초기화
    UI->>Engine: 초기 오디언스 계산
    Engine->>Data: 전체 유저 조회
    Data-->>Engine: 1000명 반환
    Engine-->>Display: 오디언스 업데이트 (1000명)
    
    User->>Filter: 필터 선택 (예: 제주 선택)
    Filter->>Engine: updateFilter("regions", ["제주"])
    Engine->>Data: 필터 조건 적용
    Data-->>Engine: 매칭된 유저 반환
    Engine->>Engine: calculateAudience()
    Engine-->>Display: 오디언스 업데이트 (87명)
    Display-->>User: 실시간 카운트 표시
    
    User->>Filter: 추가 필터 (예: VIP 회원)
    Filter->>Engine: updateFilter("membershipTier", "VIP")
    Engine->>Data: AND 조건 적용
    Data-->>Engine: 매칭된 유저 반환 (31명)
    Engine-->>Display: 오디언스 업데이트 (31명)
    Display-->>User: 최종 결과 표시
```

## 2. LLM 자연어 쿼리 플로우

```mermaid
sequenceDiagram
    actor User as 마케터
    participant Chat as Chat UI
    participant LLM as LLM Interface
    participant Parser as Query Parser
    participant Engine as Rule Engine
    participant Display as Audience Display

    User->>Chat: "제주도 프리미엄 숙박을 찾는 고객" 입력
    Chat->>Chat: 유저 메시지 추가
    Chat->>LLM: generateAIResponse(query)
    
    LLM->>Parser: processQuery(query)
    Parser->>Parser: 패턴 매칭
    Note over Parser: "제주" 인식 → regions<br/>"프리미엄" 인식 → product tier
    
    Parser->>Engine: updateFilter("regions", ["제주"])
    Parser->>Engine: updateFilter("viewedProducts", "프리미엄 라인")
    Engine->>Engine: calculateAudience()
    Engine-->>Parser: 87명 매칭
    
    Parser-->>LLM: 매칭 결과 + 적용된 필터
    LLM->>LLM: AI 응답 생성
    LLM-->>Chat: 응답 메시지 반환
    
    Chat->>Chat: AI 메시지 추가
    Chat->>Display: 오디언스 업데이트 (87명)
    Display-->>User: 결과 표시
    
    Note over User,Display: 필터가 자동으로<br/>UI에 반영됨
```

## 3. 하이브리드 모드 플로우

```mermaid
sequenceDiagram
    actor User as 마케터
    participant Mode as Mode Switcher
    participant RulePanel as Rule Panel
    participant ChatPanel as Chat Panel
    participant Engine as Rule Engine
    participant Display as Audience Display

    User->>Mode: "하이브리드" 모드 선택
    Mode->>RulePanel: 패널 표시
    Mode->>ChatPanel: 패널 표시
    Note over RulePanel,ChatPanel: 양쪽 패널 동시 활성화

    User->>ChatPanel: "주말 호캉스 고객" 쿼리
    ChatPanel->>Engine: 필터 자동 생성
    Engine-->>RulePanel: 필터 UI 동기화
    Note over RulePanel: "토", "일" 필 자동 선택됨
    Engine-->>Display: 오디언스 업데이트 (156명)

    User->>RulePanel: 수동으로 "VIP" 추가
    RulePanel->>Engine: updateFilter("membershipTier", "VIP")
    Engine->>Engine: 기존 필터 + 새 필터 AND 연산
    Engine-->>Display: 오디언스 업데이트 (42명)
    
    Note over User,Display: 룰 기반 + LLM<br/>양방향 동기화
```

## 4. 오디언스 저장/내보내기 플로우

```mermaid
sequenceDiagram
    actor User as 마케터
    participant UI as UI Controller
    participant Engine as Rule Engine
    participant File as File System

    rect rgb(200, 220, 250)
        Note over User,File: 저장 플로우
        User->>UI: "저장하기" 버튼 클릭
        UI->>Engine: exportFilters()
        Engine->>Engine: activeFilters를 JSON으로 직렬화
        Engine-->>UI: JSON 문자열 반환
        UI->>File: Blob 생성 및 다운로드
        File-->>User: audience-[timestamp].json
    end

    rect rgb(250, 220, 200)
        Note over User,File: 불러오기 플로우
        User->>UI: "불러오기" 버튼 클릭
        UI->>UI: 파일 선택 다이얼로그 표시
        User->>File: JSON 파일 선택
        File-->>UI: 파일 내용 읽기
        UI->>Engine: importFilters(jsonString)
        Engine->>Engine: JSON 파싱 및 필터 복원
        Engine->>Engine: calculateAudience()
        Engine-->>UI: 복원된 오디언스
        UI-->>User: UI 업데이트 완료
    end

    rect rgb(220, 250, 220)
        Note over User,File: 내보내기 플로우
        User->>UI: "내보내기" 버튼 클릭
        UI->>Engine: calculateAudience()
        Engine-->>UI: 매칭된 유저 목록
        UI->>UI: 메타데이터 포함 JSON 생성
        Note over UI: timestamp, audienceSize,<br/>filters, user IDs
        UI->>File: 다운로드
        File-->>User: audience-export-[timestamp].json
    end
```

## 5. 전체 시스템 아키텍처 플로우

```mermaid
sequenceDiagram
    actor User as 마케터
    participant Browser as Browser
    participant HTML as index.html
    participant App as app.js
    participant Rules as rule-engine.js
    participant LLM as llm-interface.js
    participant Schema as data-schema.js

    User->>Browser: http://localhost:8080 접속
    Browser->>HTML: 페이지 로드
    HTML->>App: DOMContentLoaded 이벤트
    
    App->>Schema: generateMockUsers(1000)
    Schema-->>App: 1000명의 목업 유저 반환
    
    App->>Rules: 초기화 (mockUserDatabase 설정)
    App->>App: initializeFilters()
    App->>App: initializeEventListeners()
    
    par 룰 기반 입력
        User->>App: 필터 조작
        App->>Rules: updateFilter()
        Rules->>Rules: calculateAudience()
        Rules-->>App: 필터링된 유저 목록
    and LLM 입력
        User->>App: 채팅 쿼리 입력
        App->>LLM: generateAIResponse()
        LLM->>Rules: updateFilter() (자동)
        Rules->>Rules: calculateAudience()
        Rules-->>LLM: 필터링된 유저 목록
        LLM-->>App: AI 응답 메시지
    end
    
    App->>Browser: UI 업데이트
    Browser-->>User: 실시간 피드백
```

## 6. 필터 초기화 플로우

```mermaid
sequenceDiagram
    actor User as 마케터
    participant UI as UI Controller
    participant Controls as Filter Controls
    participant Engine as Rule Engine
    participant Display as Audience Display

    User->>UI: "초기화" 버튼 클릭
    
    UI->>Engine: clearAllFilters()
    Engine->>Engine: activeFilters 초기 상태로 리셋
    Note over Engine: 모든 배열 [], 모든 값 기본값
    Engine->>Engine: calculateAudience()
    Engine-->>Display: 전체 유저 (1000명)
    
    par UI 요소 초기화
        UI->>Controls: 모든 select 값 ""로 리셋
        UI->>Controls: 모든 toggle false로 리셋
        UI->>Controls: 모든 slider 기본값으로 리셋
        UI->>Controls: 선택된 pill 클래스 제거
        UI->>Controls: 키워드 pill 컨테이너 비우기
    end
    
    Controls-->>User: 깨끗한 초기 상태 표시
```

## 핵심 컴포넌트 간 관계

```mermaid
graph TB
    A[User Input] --> B{Input Type}
    B -->|Manual Filter| C[Filter UI Controls]
    B -->|Natural Language| D[Chat Interface]
    
    C --> E[Rule Engine]
    D --> F[LLM Interface]
    F --> E
    
    E --> G[Mock Database]
    G --> H[Calculate Audience]
    H --> I[Update Display]
    
    I --> J[Audience Size]
    I --> K[Filter Summary]
    I --> L[Export Data]
    
    style A fill:#e1f5ff
    style E fill:#ffe1e1
    style F fill:#fff4e1
    style H fill:#e1ffe1
```

## 주요 데이터 흐름

| 단계 | 컴포넌트 | 입력 | 출력 | 처리 시간 |
|------|----------|------|------|-----------|
| 1 | UI Event | 유저 액션 | Filter 변경 이벤트 | ~0ms |
| 2 | Rule Engine | Filter 조건 | AND 연산 적용 | ~5ms |
| 3 | Mock DB | 1000 유저 순회 | 필터링된 배열 | ~10ms |
| 4 | Calculate | 필터링된 배열 | 카운트 + 메타데이터 | ~2ms |
| 5 | UI Update | 오디언스 데이터 | DOM 렌더링 | ~5ms |
| **합계** | - | - | - | **~22ms** |

모든 필터링이 **실시간(< 25ms)**으로 처리됩니다! ⚡
