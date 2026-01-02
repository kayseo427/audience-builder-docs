# Audience Builder - Production Architecture

## 전체 시스템 아키텍처 (System Architecture Overview)

```mermaid
graph TB
    subgraph "여기어때 운영 시스템 (Operational Systems)"
        UserDB[(Users DB<br/>PostgreSQL)]
        BookingDB[(Bookings DB<br/>PostgreSQL)]
        ProductDB[(Products DB<br/>MySQL)]
        PaymentDB[(Payments DB<br/>PostgreSQL)]
    end
    
    subgraph "Data Collection Layer"
        CDC[Change Data Capture<br/>Debezium]
        Kafka[Apache Kafka<br/>Message Queue]
    end
    
    subgraph "ETL & Data Warehouse"
        ETL[ETL Pipeline<br/>Apache Airflow]
        DWH[(Data Warehouse<br/>BigQuery/Redshift)]
        Cache[(Redis Cache<br/>Hot Data)]
    end
    
    subgraph "Audience Builder Server"
        API[REST API<br/>Node.js/FastAPI]
        Engine[Audience Engine<br/>Filter & Calculate]
        LLM[LLM Service<br/>Gemini API]
        Analytics[Analytics Service<br/>Segment Analysis]
    end
    
    subgraph "Frontend"
        Web[Web Application<br/>React/Vue]
    end
    
    UserDB -->|CDC| CDC
    BookingDB -->|CDC| CDC
    ProductDB -->|CDC| CDC
    PaymentDB -->|CDC| CDC
    
    CDC --> Kafka
    Kafka --> ETL
    ETL --> DWH
    DWH --> Cache
    
    Cache --> API
    DWH --> API
    API --> Engine
    API --> LLM
    API --> Analytics
    
    Engine --> Web
    LLM --> Web
    Analytics --> Web
    
    style UserDB fill:#e1f5ff
    style BookingDB fill:#e1f5ff
    style ProductDB fill:#e1f5ff
    style PaymentDB fill:#e1f5ff
    style DWH fill:#ffe1e1
    style Engine fill:#e1ffe1
    style LLM fill:#fff4e1
```

## 1. 데이터 수집 및 동기화 플로우 (Data Collection & Sync Flow)

```mermaid
sequenceDiagram
    participant UserDB as Users DB
    participant BookingDB as Bookings DB
    participant ProductDB as Products DB
    participant CDC as Change Data Capture
    participant Kafka as Kafka Queue
    participant ETL as ETL Pipeline
    participant DWH as Data Warehouse

    rect rgb(230, 240, 255)
        Note over UserDB,DWH: 실시간 데이터 스트리밍 (Real-time Streaming)
        
        UserDB->>CDC: User 생성/수정 이벤트
        Note over UserDB: INSERT/UPDATE<br/>user_id, name, email,<br/>membership_tier, device_type
        
        BookingDB->>CDC: Booking 생성 이벤트
        Note over BookingDB: INSERT<br/>booking_id, user_id,<br/>property_id, check_in,<br/>amount, status
        
        ProductDB->>CDC: Product 조회 이벤트 (Log)
        Note over ProductDB: Log Event<br/>user_id, product_id,<br/>category, timestamp
        
        CDC->>Kafka: Event Publishing
        Note over Kafka: Topic: user-events<br/>Topic: booking-events<br/>Topic: product-events
        
        Kafka->>ETL: Event Consumption (Batch)
        Note over ETL: 5분마다 배치 처리
        
        ETL->>ETL: 데이터 변환 및 정제 (Transform & Cleanse Data)
        Note over ETL: 중복 제거 (Dedup)<br/>스키마 통합 (Schema Unification)<br/>집계 계산 (Aggregation)
        
        ETL->>DWH: 데이터 적재 (Load Data)
        Note over DWH: fact_user_behavior<br/>fact_bookings<br/>dim_users<br/>dim_products
    end
```

## 2. Audience Builder Server 초기화 플로우 (Server Initialization)

```mermaid
sequenceDiagram
    participant Admin as 관리자
    participant API as Audience API
    participant DWH as Data Warehouse
    participant Cache as Redis Cache
    participant Engine as Audience Engine

    Admin->>API: 서버 시작 (Start Server)
    API->>DWH: Schema 검증
    DWH-->>API: Schema OK
    
    par 초기 데이터 로드 (Initial Data Loading)
        API->>DWH: SELECT 유저 통계
        DWH-->>API: 총 500만명
        
        API->>DWH: SELECT 최근 예약 통계
        DWH-->>API: 월 50만건
        
        API->>DWH: SELECT 상품 카탈로그
        DWH-->>API: 총 10만개 숙소
    end
    
    API->>Cache: Hot Data Preload
    Note over Cache: 최근 30일 활성 유저<br/>인기 검색 키워드<br/>멤버십 분포 (Membership Distribution)
    
    API->>Engine: Engine 초기화
    Engine->>Engine: Filter Rule 로드
    Engine->>Engine: Index 생성
    
    Engine-->>API: 준비 완료 (Ready)
    API-->>Admin: 서버 시작 완료 ✅
```

## 3. 실시간 Audience 조회 플로우 (Real-time Query Flow - Rule-Based)

```mermaid
sequenceDiagram
    actor User as 마케터
    participant Web as Web Client
    participant API as Audience API
    participant Cache as Redis Cache
    participant DWH as Data Warehouse
    participant Engine as Audience Engine

    User->>Web: Filter 선택<br/>(예: 제주 + VIP + 최근 30일)
    Web->>API: POST /api/audience/calculate
    Note over Web,API: Request Body:<br/>{<br/>  region: ["제주"],<br/>  membership: "VIP",<br/>  recency: 30<br/>}
    
    API->>Cache: Cache 조회 (Filter Hash)
    
    alt Cache HIT
        Cache-->>API: 캐시된 결과 (8,234명)
        Note over Cache: TTL: 5분
        API-->>Web: 즉시 응답 (~50ms)
    else Cache MISS
        API->>Engine: buildQuery(filters)
        Engine->>Engine: SQL Query 생성
        Note over Engine: SELECT user_id, name, email<br/>FROM user_behavior_mart<br/>WHERE region IN ('제주')<br/>AND membership = 'VIP'<br/>AND last_activity >= NOW() - INTERVAL 30 DAY
        
        Engine->>DWH: Query 실행
        DWH->>DWH: 분산 쿼리 처리 (Distributed Query)
        Note over DWH: Partition Scan<br/>Index 활용
        DWH-->>Engine: 결과 반환 (8,234건)
        
        Engine->>Engine: 결과 집계 및 분석 (Aggregation)
        Note over Engine: 총 인원, 비율,<br/>평균 AOV, 예상 매출
        
        Engine-->>API: Audience Data
        API->>Cache: 결과 캐싱 (TTL: 5분)
        API-->>Web: 응답 (~500ms)
    end
    
    Web-->>User: Audience 표시<br/>8,234명 (0.16%)
```

## 4. LLM 기반 자연어 쿼리 플로우 (LLM-based Natural Language Query)

```mermaid
sequenceDiagram
    actor User as 마케터
    participant Web as Web Client
    participant API as Audience API
    participant LLM as Gemini API
    participant Prompt as Prompt Engine
    participant Engine as Audience Engine
    participant DWH as Data Warehouse

    User->>Web: "제주도에서 풀빌라를<br/>자주 예약하는 VIP 고객"
    Web->>API: POST /api/llm/query
    Note over Web,API: Request Body:<br/>{<br/>  query: "제주도에서...",<br/>  context: current_filters<br/>}
    
    API->>Prompt: Prompt 생성
    Note over Prompt: System: 여기어때 Audience Builder<br/>Available Filters: 32종<br/>User Query: {query}
    
    Prompt->>LLM: Gemini API 호출
    Note over LLM: Model: gemini-1.5-pro<br/>Temperature: 0.1
    
    LLM->>LLM: 자연어 분석 (NLU)
    Note over LLM: Intent Recognition:<br/>- Location: 제주<br/>- Property Type: 풀빌라<br/>- Frequency: 자주 (≥3회/년)<br/>- Tier: VIP
    
    LLM-->>Prompt: Structured Output (JSON)
    Note over Prompt: {<br/>  "filters": {<br/>    "region": ["제주"],<br/>    "accommodation_type": ["풀빌라"],<br/>    "booking_frequency": 3,<br/>    "membership": "VIP"<br/>  },<br/>  "explanation": "..."<br/>}
    
    Prompt-->>API: 파싱된 Filter
    API->>Engine: calculateAudience(filters)
    Engine->>DWH: Query 실행
    
    DWH-->>Engine: 1,247명
    Engine-->>API: Audience + Metadata
    
    API-->>Web: Response:<br/>{<br/>  audience_size: 1247,<br/>  filters_applied: {...},<br/>  ai_explanation: "..."<br/>}
    
    Web-->>User: AI 응답 + Audience 결과
```

## 5. Audience 내보내기 및 Marketing Platform 연동

```mermaid
sequenceDiagram
    actor User as 마케터
    participant Web as Web Client
    participant API as Audience API
    participant Engine as Audience Engine
    participant DWH as Data Warehouse
    participant S3 as S3 Storage
    participant Marketing as Marketing Platform<br/>(Braze/Airbridge)

    User->>Web: "내보내기" 버튼 클릭
    Web->>API: POST /api/audience/export
    Note over API: Request:<br/>audience_id: abc-123<br/>format: csv<br/>destination: marketing_platform
    
    API->>Engine: getAudienceUsers(audience_id)
    Engine->>DWH: 전체 유저 정보 조회 (Full User Data Query)
    Note over DWH: SELECT user_id, email, phone,<br/>name, push_token, ad_id<br/>FROM audience_abc123
    
    DWH-->>Engine: 8,234건 (Full Data)
    
    Engine->>Engine: PII 마스킹 (옵션)
    Note over Engine: PII Encryption<br/>GDPR 준수 (Compliance)
    
    Engine->>S3: CSV 파일 저장
    Note over S3: s3://audience-exports/<br/>abc-123_20260102.csv
    
    S3-->>API: File URL
    
    par Marketing Platform 연동 (Integration)
        API->>Marketing: POST /segments/import
        Note over Marketing: Segment Name: "제주VIP고객"<br/>Users: 8,234명<br/>Source: S3 URL
        
        Marketing->>S3: 파일 다운로드 (Download File)
        S3-->>Marketing: CSV 데이터
        
        Marketing->>Marketing: Segment 생성
        Marketing->>Marketing: Push/Email 대상 등록
        Marketing-->>API: Import 완료 ✅
    end
    
    API-->>Web: Response:<br/>{<br/>  export_id: "exp-456",<br/>  file_url: "...",<br/>  marketing_segment_id: "seg-789"<br/>}
    
    Web-->>User: 내보내기 완료!<br/>Marketing Campaign 생성 가능
```

## 6. 실시간 데이터 업데이트 (WebSocket Real-time Updates)

```mermaid
sequenceDiagram
    participant User1 as 마케터 A
    participant User2 as 마케터 B
    participant Web as Web Clients
    participant WS as WebSocket Server
    participant API as Audience API
    participant DWH as Data Warehouse
    participant CDC as Change Data Capture

    User1->>Web: Audience Builder 접속
    Web->>WS: WebSocket Connection
    WS-->>Web: Connection Established
    
    Note over DWH,CDC: 실시간 예약 발생 (Real-time Booking Event)
    DWH->>CDC: 새 Booking Event
    Note over CDC: user_id: 12345<br/>region: 제주<br/>amount: 450,000원
    
    CDC->>API: Event 수신
    API->>API: 영향받는 Audience 확인 (Check Affected Audiences)
    Note over API: 현재 활성 Query:<br/>- "제주 VIP" (8,234→8,235명)<br/>- "고객단가 40만원 이상" (추가)
    
    API->>WS: Audience Update Push
    WS->>Web: Broadcast Update
    Note over Web: {<br/>  audience_id: "abc-123",<br/>  new_size: 8235,<br/>  delta: +1<br/>}
    
    Web-->>User1: 실시간 Count 업데이트
    Web-->>User2: 실시간 Count 업데이트
    
    Note over Web: 8,234명 → 8,235명 (+1)
```

## 7. Data Mart 구조 (Data Warehouse Schema)

```mermaid
erDiagram
    FACT_USER_BEHAVIOR ||--o{ DIM_USERS : "user_id"
    FACT_USER_BEHAVIOR ||--o{ DIM_PRODUCTS : "product_id"
    FACT_BOOKINGS ||--o{ DIM_USERS : "user_id"
    FACT_BOOKINGS ||--o{ DIM_PROPERTIES : "property_id"
    
    DIM_USERS {
        bigint user_id PK
        string email
        string name
        string membership_tier
        string device_type
        string[] active_regions
        timestamp created_at
        timestamp last_activity
    }
    
    FACT_USER_BEHAVIOR {
        bigint behavior_id PK
        bigint user_id FK
        bigint product_id FK
        string event_type
        string search_keyword
        string region
        string accommodation_type
        boolean has_cart
        timestamp event_time
    }
    
    FACT_BOOKINGS {
        bigint booking_id PK
        bigint user_id FK
        bigint property_id FK
        decimal amount
        date check_in
        date check_out
        int lead_time_days
        string[] days_of_week
        timestamp created_at
    }
    
    DIM_PRODUCTS {
        bigint product_id PK
        string name
        string category
        string region
        string[] themes
        decimal price_range
    }
    
    DIM_PROPERTIES {
        bigint property_id PK
        string name
        string property_type
        string region
        boolean pet_friendly
        boolean kids_friendly
    }
```

## 8. 성능 최적화 아키텍처 (Performance Optimization Architecture)

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Browser]
        CDN[CloudFront CDN]
    end
    
    subgraph "API Gateway"
        ALB[Application Load Balancer]
        RateLimit[Rate Limiter]
    end
    
    subgraph "Application Layer"
        API1[API Server 1]
        API2[API Server 2]
        API3[API Server 3]
    end
    
    subgraph "Cache Layer"
        Redis1[(Redis Primary)]
        Redis2[(Redis Replica)]
    end
    
    subgraph "Data Layer"
        DWH[(BigQuery<br/>Partitioned Tables)]
        Index[Materialized Views<br/>Pre-aggregated Data]
    end
    
    subgraph "Monitoring"
        Metrics[Prometheus]
        Logs[CloudWatch]
        Trace[Jaeger Tracing]
    end
    
    Browser --> CDN
    CDN --> ALB
    ALB --> RateLimit
    RateLimit --> API1
    RateLimit --> API2
    RateLimit --> API3
    
    API1 --> Redis1
    API2 --> Redis1
    API3 --> Redis1
    
    Redis1 -.->|Replication| Redis2
    
    API1 --> DWH
    API2 --> DWH
    API3 --> DWH
    
    DWH --> Index
    
    API1 --> Metrics
    API2 --> Metrics
    API3 --> Metrics
    
    API1 --> Logs
    API1 --> Trace
    
    style Redis1 fill:#ffe1e1
    style DWH fill:#e1f5ff
    style Index fill:#e1ffe1
```

## 주요 성능 지표 (Performance Metrics)

| Layer | Component | 평균 응답 시간 (Avg Latency) | 처리량 (Throughput/TPS) | SLA |
|-------|-----------|------------------------------|-------------------------|-----|
| CDN | CloudFront | 10-50ms | 10,000+ | 99.99% |
| API Gateway | Load Balancer | 5ms | 5,000 | 99.95% |
| Cache | Redis | 1-5ms | 100,000+ | 99.9% |
| Query | BigQuery (Cache HIT) | 50ms | 1,000 | 99.5% |
| Query | BigQuery (Cache MISS) | 500-2000ms | 200 | 99% |
| LLM | Gemini API | 1000-3000ms | 50 | 99% |

## Data Pipeline 처리 흐름 (Data Processing Pipeline)

```mermaid
graph LR
    A[Operational DB<br/>500만 유저] -->|CDC| B[Kafka<br/>초당 1만 Events]
    B -->|Streaming| C[Flink/Spark<br/>Real-time Processing]
    B -->|Batch| D[Airflow<br/>5분마다 실행]
    
    C --> E[Hot Storage<br/>Redis<br/>최근 30일 데이터]
    D --> F[Cold Storage<br/>BigQuery<br/>전체 이력 데이터]
    
    E --> G[Audience API<br/>초당 100 Requests]
    F --> G
    
    G --> H[마케터<br/>Real-time Query]
    
    style A fill:#e1f5ff
    style E fill:#ffe1e1
    style F fill:#e1f5ff
    style G fill:#e1ffe1
```

## 데이터 보안 및 Governance (Security & Data Governance)

```mermaid
sequenceDiagram
    participant User as 마케터
    participant Auth as Auth Service<br/>(OAuth 2.0)
    participant API as Audience API
    participant Audit as Audit Logger
    participant Encrypt as Encryption Service
    participant DWH as Data Warehouse

    User->>Auth: 로그인 (SSO)
    Auth->>Auth: 권한 확인 (Authorization Check)
    Note over Auth: Role: Marketing Manager<br/>Permissions: audience.read,<br/>audience.export
    Auth-->>User: Access Token (JWT)
    
    User->>API: Audience 조회 (with Token)
    API->>Auth: Token 검증
    Auth-->>API: Valid + Permissions
    
    API->>Audit: Log 기록
    Note over Audit: {<br/>  user_id: "user-123",<br/>  action: "audience.query",<br/>  filters: {...},<br/>  timestamp: "..."<br/>}
    
    API->>DWH: Query 실행
    DWH-->>API: PII 포함 데이터 (Personal Identifiable Information)
    
    API->>Encrypt: PII Masking
    Note over Encrypt: Email: a***@email.com<br/>Phone: 010-****-1234
    
    Encrypt-->>API: 마스킹된 데이터 (Masked Data)
    API-->>User: 안전한 결과 응답 (Secure Response)
```

---

## 전체 시스템 용량 및 확장성 (System Capacity & Scalability)

### 📊 시스템 규모 (System Scale)
- **총 유저 (Total Users)**: 500만명
- **일일 예약 (Daily Bookings)**: 50만건
- **실시간 이벤트 (Real-time Events)**: 초당 1만건
- **Audience 쿼리 (Query Rate)**: 초당 100회
- **동시 접속 마케터 (Concurrent Users)**: 200명

### 🗄️ 데이터 관리 (Data Management)
- **데이터 보관 기간 (Retention)**: 3년 (Partitioned Tables)
- **Backup**: 일 1회 (Daily Snapshot)
- **Disaster Recovery**: Multi-Region (서울 Primary, 도쿄 DR)

### ⚙️ Auto Scaling 정책 (Scaling Policy)
- **Application Server**: CPU 70% 기준 Scale Out
- **Redis Cache**: Memory 80% 기준 Replica 추가
- **BigQuery**: Concurrent Query 기준 Slot 자동 조정

### 🔐 보안 및 Compliance
- **Encryption**: AES-256 (Data at Rest), TLS 1.3 (Data in Transit)
- **PII Protection**: Field-level Encryption, Dynamic Masking
- **Compliance**: GDPR, CCPA, 개인정보보호법 준수
- **Access Control**: RBAC (Role-Based Access Control)
- **Audit Trail**: 모든 Query 및 Export 이력 기록
