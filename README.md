# Audience Builder - 여기어때 오디언스 빌더

> Rule-based + LLM 하이브리드 고객 세그먼트 생성 시스템

## 📋 프로젝트 개요 (Project Overview)

여기어때 마케터들이 사용하는 Audience Builder의 Production-level 아키텍처 및 구현 문서입니다.

**핵심 기능 (Key Features)**:
- 🎯 Rule-based 필터링 (32개 필터)
- 🤖 LLM 기반 자연어 쿼리 (Gemini API)
- 🔀 하이브리드 모드 (양방향 동기화)
- 📊 실시간 Audience 계산
- 📤 Marketing Platform 연동 (Braze/Airbridge)

## 📚 문서 구조 (Documentation Structure)

### 1. [Production Architecture](./production-architecture.md)
실제 프로덕션 환경의 전체 시스템 아키텍처

**포함 내용**:
- 전체 시스템 아키텍처 (Data Pipeline, API Server, Frontend)
- CDC → Kafka → ETL → Data Warehouse 플로우
- Real-time Query 처리 (Redis Cache + BigQuery)
- LLM 자연어 쿼리 처리 (Gemini API)
- WebSocket 실시간 업데이트
- Data Mart ERD (5개 테이블)
- 보안 및 Governance (OAuth 2.0, PII Masking)
- 성능 최적화 아키텍처

**주요 기술 스택**:
- **Data Collection**: Debezium CDC, Apache Kafka
- **ETL**: Apache Airflow, Spark/Flink
- **Data Warehouse**: BigQuery/Redshift
- **Cache**: Redis (Primary + Replica)
- **API**: Node.js/FastAPI
- **LLM**: Gemini 1.5 Pro
- **Frontend**: React/Vue

### 2. [Sequence Diagrams](./sequence-diagrams.md)
주요 기능별 시퀀스 다이어그램 (Mock 환경)

**포함 내용**:
- Rule-based 필터링 플로우
- LLM 자연어 쿼리 플로우
- 하이브리드 모드 동작
- Audience 저장/내보내기
- 전체 시스템 초기화
- 필터 초기화 플로우

### 3. [Walkthrough](./walkthrough.md)
구현된 애플리케이션 기능 설명 및 사용 가이드

**포함 내용**:
- 기능 상세 설명
- 데이터 필터 카테고리 (4개)
- LLM Query 패턴
- 기술 구현 상세
- 검증 결과

## 🎨 데이터 필터 카테고리 (Data Filter Categories)

### 1. Behavioral Data (행동 및 여정 데이터)
- 검색 키워드 (지역, 숙박 유형, 테마)
- 조회 상품군
- 장바구니/찜 목록
- 최근 접속일 (Recency)

### 2. Transactional Data (결제 및 이용 특성)
- 결제 주기 (Payment Frequency)
- 객단가 (AOV - Average Order Value)
- 선호 숙박 요일
- 리드 타임 (Lead Time)

### 3. User Profile (유저 프로필 및 컨텍스트)
- 주 활동 지역
- 멤버십 등급
- 접속 기기 (Device Type)
- 라이프스테이지

### 4. Cross-Sell Data (서비스 확장형 데이터)
- 공간대여/레저 이용
- 해외 여행 의도
- 렌터카/교통 예약

## ⚡ 성능 지표 (Performance Metrics)

| Component | Latency | Throughput | SLA |
|-----------|---------|------------|-----|
| CDN | 10-50ms | 10,000+ TPS | 99.99% |
| Redis Cache | 1-5ms | 100,000+ TPS | 99.9% |
| BigQuery (Cache HIT) | 50ms | 1,000 TPS | 99.5% |
| BigQuery (Cache MISS) | 500-2000ms | 200 TPS | 99% |
| Gemini API | 1-3s | 50 TPS | 99% |

## 📊 시스템 규모 (System Scale)

- **총 유저 (Total Users)**: 500만명
- **일일 예약 (Daily Bookings)**: 50만건
- **실시간 이벤트 (Events/sec)**: 10,000건
- **Audience 쿼리 (Queries/sec)**: 100회
- **데이터 보관 (Retention)**: 3년

## 🔐 보안 및 Compliance

- **Encryption**: AES-256 (at rest), TLS 1.3 (in transit)
- **PII Protection**: Field-level encryption, Dynamic masking
- **Access Control**: RBAC (Role-Based Access Control)
- **Compliance**: GDPR, CCPA, 개인정보보호법
- **Audit Trail**: 모든 Query 및 Export 이력 기록

## 🏗️ Architecture Highlights

```
Operational DBs → CDC → Kafka → ETL → Data Warehouse
                                         ↓
                                    Redis Cache
                                         ↓
                                   Audience API
                                    ↙    ↓    ↘
                            Engine  LLM  Analytics
                                    ↓
                              Web Application
```

## 🚀 주요 특징 (Key Features)

### Real-time Processing
- CDC를 통한 실시간 데이터 수집
- Kafka 기반 Event Streaming (초당 10,000 이벤트)
- WebSocket을 통한 실시간 Audience 업데이트

### Intelligent Query
- Gemini API를 활용한 자연어 이해
- 32개 필터 자동 매핑
- Structured Output (JSON) 생성

### Performance Optimization
- Redis 기반 Multi-layer Caching (TTL: 5분)
- BigQuery Partitioned Tables
- Materialized Views (사전 집계)
- Auto Scaling (CPU 70% 기준)

### Marketing Integration
- Braze/Airbridge 자동 연동
- CSV/JSON Export
- Segment 자동 생성
- Push/Email Campaign 연동

## 📖 문서 보는 방법 (How to Read)

1. **아키텍처 이해**: `production-architecture.md` 먼저 읽기
2. **상세 플로우**: `sequence-diagrams.md`에서 각 기능별 흐름 확인
3. **구현 상세**: `walkthrough.md`에서 실제 구현 내용 확인

## 🔗 관련 리소스 (Related Resources)

- **실제 구현 코드**: `/Users/kay_seo/.gemini/antigravity/scratch/audience-builder/`
- **Local Demo**: `http://localhost:8080`

## 📝 문서 작성 기준 (Documentation Standards)

- **언어**: 한글 설명 + 영어 전문 용어
- **다이어그램**: Mermaid 형식 (GitHub/GitLab 자동 렌더링)
- **코드**: Syntax highlighting 적용

## 🤝 기여 및 피드백 (Contribution)

이 문서는 여기어때 Audience Builder의 아키텍처 설계 문서입니다.
피드백이나 개선 사항이 있다면 이슈를 생성해주세요.

---

**Created**: 2026-01-02  
**Version**: 1.0  
**Author**: Audience Builder Team
