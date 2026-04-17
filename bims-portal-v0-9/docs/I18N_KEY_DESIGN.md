# i18n 키 설계서

> BIS Admin Portal 다국어 지원을 위한 키 구조 및 네이밍 규칙

---

## 1. 개요

### 1.1 목적

본 문서는 BIS Admin Portal의 다국어(i18n) 지원을 위한 키 구조, 네이밍 규칙, 파일 배치 원칙을 정의합니다.

### 1.2 지원 언어

| 코드 | 언어 | 우선순위 | 비고 |
|------|------|----------|------|
| `ko-KR` | 한국어 | Primary | 기본 언어 |
| `en-US` | 영어 | Secondary | 국제화 대응 |

### 1.3 현재 구현 상태

```
components/rms/battery/battery-i18n.ts      # 배터리 도메인 용어 사전
components/rms/shared/overall-state-i18n.ts # 상태 EN↔KR 매핑
```

---

## 2. 키 구조 설계

### 2.1 계층 구조

```
{domain}.{module}.{component}.{element}.{state?}
```

**예시:**
```
rms.monitoring.deviceList.status.normal
cms.contents.editor.toolbar.save
registry.customers.form.field.companyName
admin.accounts.drawer.action.approve
```

### 2.2 도메인 최상위 키

| 도메인 키 | 설명 | 예시 |
|-----------|------|------|
| `common` | 공통 UI 요소 | 버튼, 라벨, 상태 |
| `rms` | 원격 모니터링 | 장애, 배터리, 명령 |
| `cms` | 콘텐츠 관리 | 콘텐츠, 템플릿, 배포 |
| `registry` | 자산 등록 | 고객사, 파트너, 정류장 |
| `analysis` | 분석/리포트 | 이상탐지, 환경분석 |
| `fieldOps` | 현장 운영 | 작업지시, 보고서 |
| `admin` | 관리자 설정 | 계정, 역할, 위임 |
| `display` | 단말 디스플레이 | 상태, 비상모드 |
| `nav` | 내비게이션 | 사이드바, 브레드크럼 |
| `error` | 에러 메시지 | 유효성, API 오류 |

---

## 3. 상세 키 구조

### 3.1 common (공통)

```typescript
common: {
  action: {
    save: "저장",
    cancel: "취소",
    delete: "삭제",
    edit: "수정",
    create: "등록",
    search: "검색",
    filter: "필터",
    reset: "초기화",
    export: "내보내기",
    import: "불러오기",
    confirm: "확인",
    close: "닫기",
    back: "이전",
    next: "다음",
    apply: "적용",
    refresh: "새로고침",
  },
  status: {
    active: "활성",
    inactive: "비활성",
    pending: "대기",
    approved: "승인",
    rejected: "반려",
    draft: "초안",
    published: "게시됨",
  },
  label: {
    name: "이름",
    description: "설명",
    type: "유형",
    status: "상태",
    createdAt: "등록일시",
    updatedAt: "수정일시",
    createdBy: "등록자",
    region: "지역",
    customer: "고객사",
    partner: "파트너",
  },
  unit: {
    count: "개",
    percent: "%",
    device: "대",
    stop: "개소",
    hour: "시간",
    minute: "분",
    second: "초",
    day: "일",
  },
  empty: {
    noData: "데이터가 없습니다",
    noResult: "검색 결과가 없습니다",
    noSelection: "선택된 항목이 없습니다",
  },
  confirm: {
    delete: "정말 삭제하시겠습니까?",
    cancel: "변경 사항이 저장되지 않습니다. 취소하시겠습니까?",
    unsaved: "저장하지 않은 변경 사항이 있습니다.",
  },
}
```

### 3.2 rms (원격 모니터링)

```typescript
rms: {
  monitoring: {
    title: "통합 모니터링",
    kpi: {
      totalDevices: "전체 단말",
      normalDevices: "정상",
      faultDevices: "장애",
      offlineDevices: "오프라인",
    },
    deviceList: {
      title: "단말 목록",
      column: {
        deviceId: "단말 ID",
        stopName: "정류장명",
        status: "상태",
        lastSeen: "최종 통신",
        battery: "배터리",
        signal: "신호강도",
      },
      status: {
        normal: "정상",
        degraded: "성능저하",
        critical: "심각",
        offline: "오프라인",
        emergency: "비상",
      },
    },
    map: {
      title: "지도 보기",
      cluster: "클러스터",
      zoom: "확대/축소",
    },
  },
  battery: {
    title: "배터리 관리",
    glossary: {
      normal: "정상",
      caution: "주의",
      warning: "경고",
      replace: "교체권고",
      critical: "치명",
      offline: "오프라인",
    },
    policy: {
      title: "배터리 정책",
      lastUpdated: "최종 수정",
      changedBy: "수정자",
      scope: "적용 범위",
      scopeLabel: {
        global: "전사(공통)",
        group: "그룹",
        region: "지역",
      },
      applyProgress: "정책 적용 진행률",
      devicesApplied: "대 적용",
      stale: "지연",
      health: {
        ok: "정상",
        syncDelay: "동기화 지연",
        staleCluster: "지연 클러스터",
        versionConflict: "버전 충돌",
        policyError: "정책 오류",
      },
    },
    kpi: {
      avgLevel: "평균 잔량",
      lowBattery: "저전력 단말",
      charging: "충전 중",
      solarEfficiency: "태양광 효율",
    },
  },
  alerts: {
    title: "장애 관리",
    severity: {
      critical: "심각",
      major: "중요",
      minor: "경미",
      info: "정보",
    },
    status: {
      open: "미해결",
      inProgress: "처리중",
      resolved: "해결됨",
      closed: "종료",
    },
    type: {
      communication: "통신 장애",
      power: "전원 장애",
      display: "디스플레이 장애",
      sensor: "센서 장애",
      software: "소프트웨어 오류",
    },
  },
  commands: {
    title: "원격 제어",
    type: {
      reboot: "재부팅",
      refresh: "화면 갱신",
      screenshot: "스크린샷",
      logCollect: "로그 수집",
      configUpdate: "설정 업데이트",
    },
    status: {
      pending: "대기",
      approved: "승인",
      rejected: "반려",
      executing: "실행중",
      completed: "완료",
      failed: "실패",
      expired: "만료",
    },
  },
}
```

### 3.3 cms (콘텐츠 관리)

```typescript
cms: {
  contents: {
    title: "콘텐츠 관리",
    type: {
      notice: "공지사항",
      advertisement: "광고",
      emergency: "비상안내",
      schedule: "운행정보",
    },
    status: {
      draft: "초안",
      review: "검토중",
      approved: "승인",
      published: "게시중",
      expired: "만료",
      archived: "보관",
    },
    form: {
      title: "콘텐츠명",
      type: "유형",
      priority: "우선순위",
      scope: "배포 범위",
      startDate: "시작일",
      endDate: "종료일",
      message: "메시지 내용",
    },
  },
  templates: {
    title: "템플릿 관리",
    layout: {
      single: "단일 레이아웃",
      split: "분할 레이아웃",
      grid: "그리드 레이아웃",
    },
    profile: {
      "32inch": "32인치",
      "43inch": "43인치",
      "55inch": "55인치",
    },
  },
  deployments: {
    title: "배포 관리",
    status: {
      scheduled: "예약됨",
      deploying: "배포중",
      completed: "완료",
      failed: "실패",
      cancelled: "취소됨",
    },
    action: {
      schedule: "예약 배포",
      immediate: "즉시 배포",
      cancel: "배포 취소",
    },
  },
}
```

### 3.4 registry (자산 등록)

```typescript
registry: {
  customers: {
    title: "고객사 관리",
    type: {
      publicEnterprise: "공기업",
      localGovernment: "지자체",
      privateCompany: "민간기업",
    },
    status: {
      pending: "승인대기",
      approved: "승인",
      rejected: "반려",
      suspended: "정지",
    },
    form: {
      companyName: "회사명",
      businessNumber: "사업자등록번호",
      ceoName: "대표자명",
      contact: "담당자 연락처",
      address: "주소",
      contractPeriod: "계약기간",
    },
  },
  partners: {
    title: "파트너 관리",
    type: {
      integrator: "통합운영",
      installer: "설치",
      maintainer: "유지보수",
      supplier: "공급",
    },
  },
  stops: {
    title: "정류장 관리",
    status: {
      registrationPending: "등록대기",
      installationPending: "설치대기",
      operationPending: "운영대기",
      operating: "운영중",
      inactive: "비활성",
    },
    form: {
      stopName: "정류장명",
      stopId: "정류장 ID",
      address: "주소",
      coordinates: "좌표",
      linkedGroups: "소속 그룹",
    },
  },
  devices: {
    title: "BIS 단말 관리",
    type: {
      indoor: "실내형",
      outdoor: "실외형",
      shelter: "쉘터형",
    },
  },
  groups: {
    title: "BIS 그룹 관리",
    status: {
      active: "활성",
      configRequired: "구성필요",
      inactive: "비활성",
    },
  },
  relationships: {
    title: "운영 관계",
    type: {
      operation: "운영",
      installation: "설치",
      maintenance: "유지보수",
      integrated: "통합",
    },
    contractStatus: {
      active: "활성",
      reviewRequired: "계약검토필요",
      inactive: "비활성",
    },
  },
}
```

### 3.5 admin (관리자)

```typescript
admin: {
  accounts: {
    title: "계정 관리",
    role: {
      platformSuperAdmin: "플랫폼 최고 관리자",
      platformAdmin: "플랫폼 관리자",
      customerAdmin: "고객사 관리자",
      fieldOperator: "현장 유지보수 운영자",
      governmentViewer: "지자체 열람자",
      installOperator: "설치 운영자",
    },
    status: {
      active: "활성",
      inactive: "비활성",
      locked: "잠금",
      pendingApproval: "승인대기",
    },
    form: {
      userId: "사용자 ID",
      userName: "사용자명",
      email: "이메일",
      phone: "연락처",
      role: "역할",
      scope: "권한 범위",
    },
  },
  roles: {
    title: "역할 관리",
    permission: "권한",
    module: "모듈",
  },
  delegations: {
    title: "권한 위임",
    status: {
      active: "활성",
      expired: "만료",
      revoked: "취소됨",
    },
    form: {
      delegator: "위임자",
      delegatee: "수임자",
      delegatedRole: "위임 역할",
      scope: "범위",
      validPeriod: "유효기간",
    },
  },
  audit: {
    title: "감사 로그",
    action: {
      create: "생성",
      read: "조회",
      update: "수정",
      delete: "삭제",
      approve: "승인",
      reject: "반려",
      login: "로그인",
      logout: "로그아웃",
    },
  },
}
```

### 3.6 nav (내비게이션)

```typescript
nav: {
  sidebar: {
    dashboard: "대시보드",
    rms: {
      title: "원격 관리 (RMS)",
      monitoring: "통합 모니터링",
      alertCenter: "장애 관리",
      battery: "배터리 관리",
      commands: "원격 제어",
      ota: "OTA 관리",
      communication: "통신 상태",
    },
    cms: {
      title: "콘텐츠 관리 (CMS)",
      contents: "콘텐츠 관리",
      templates: "템플릿 관리",
      deployments: "배포 관리",
      displayPolicy: "표출 정책",
    },
    analysis: {
      title: "분석",
      anomaly: "이상 탐지",
      deviceHealth: "단말 건강도",
      environment: "환경 분석",
      lifecycle: "수명 주기",
      prediction: "예측 분석",
    },
    fieldOps: {
      title: "현장 운영",
      workOrders: "작업 지시",
      reports: "작업 보고서",
      analytics: "운영 분석",
    },
    registry: {
      title: "등록 관리",
      customers: "고객사",
      partners: "파트너사",
      stops: "정류장",
      devices: "BIS 단말",
      groups: "BIS 그룹",
      relationships: "운영 관계",
    },
    admin: {
      title: "관리자",
      accounts: "계정 관리",
      roles: "역할 관리",
      delegations: "권한 위임",
      scopes: "범위 관리",
      audit: "감사 로그",
      settings: "시스템 설정",
    },
  },
  breadcrumb: {
    home: "홈",
  },
}
```

### 3.7 display (단말 디스플레이)

```typescript
display: {
  state: {
    normal: "정상",
    degraded: "성능저하",
    critical: "심각",
    offline: "오프라인",
    emergency: "비상",
  },
  stateDescription: {
    normal: "모든 시스템이 정상 작동 중입니다",
    degraded: "일부 기능이 제한되어 있습니다",
    critical: "심각한 오류가 발생했습니다",
    offline: "단말과 연결이 끊어졌습니다",
    emergency: "비상 상황 모드입니다",
  },
  emergency: {
    title: "비상 안내",
    message: "비상 상황 발생",
    instruction: "안내에 따라 대피하세요",
    contact: "비상 연락처",
  },
}
```

### 3.8 error (에러 메시지)

```typescript
error: {
  validation: {
    required: "필수 입력 항목입니다",
    minLength: "{min}자 이상 입력해주세요",
    maxLength: "{max}자 이하로 입력해주세요",
    email: "올바른 이메일 형식이 아닙니다",
    phone: "올바른 전화번호 형식이 아닙니다",
    number: "숫자만 입력 가능합니다",
    date: "올바른 날짜 형식이 아닙니다",
    dateRange: "종료일은 시작일 이후여야 합니다",
    duplicate: "이미 존재하는 값입니다",
  },
  api: {
    network: "네트워크 연결을 확인해주세요",
    timeout: "요청 시간이 초과되었습니다",
    serverError: "서버 오류가 발생했습니다",
    unauthorized: "인증이 필요합니다",
    forbidden: "접근 권한이 없습니다",
    notFound: "요청한 리소스를 찾을 수 없습니다",
    conflict: "데이터 충돌이 발생했습니다",
  },
  permission: {
    accessDenied: "접근 권한이 없습니다",
    actionNotAllowed: "이 작업을 수행할 권한이 없습니다",
    scopeRestricted: "해당 범위에 대한 권한이 없습니다",
  },
}
```

---

## 4. 파일 구조

### 4.1 권장 디렉토리 구조

```
locales/
├── ko-KR/
│   ├── common.json          # 공통 UI
│   ├── rms.json              # RMS 도메인
│   ├── cms.json              # CMS 도메인
│   ├── registry.json         # Registry 도메인
│   ├── analysis.json         # Analysis 도메인
│   ├── fieldOps.json         # Field Operations 도메인
│   ├── admin.json            # Admin 도메인
│   ├── display.json          # Display 도메인
│   ├── nav.json              # 내비게이션
│   └── error.json            # 에러 메시지
├── en-US/
│   ├── common.json
│   ├── rms.json
│   ├── cms.json
│   └── ...
└── index.ts                  # 통합 export
```

### 4.2 도메인별 분리 파일 (현재 패턴)

```
components/
├── rms/
│   ├── battery/
│   │   └── battery-i18n.ts   # 배터리 전용
│   └── shared/
│       └── overall-state-i18n.ts  # RMS 공통 상태
├── cms/
│   └── cms-i18n.ts           # CMS 전용
└── registry/
    └── registry-i18n.ts      # Registry 전용
```

---

## 5. 네이밍 규칙

### 5.1 키 네이밍

| 규칙 | 예시 | 설명 |
|------|------|------|
| camelCase | `deviceList`, `lastUpdated` | 모든 키는 camelCase |
| 동사 우선 (액션) | `save`, `delete`, `confirm` | 버튼/액션은 동사로 시작 |
| 명사 (라벨) | `userName`, `deviceId` | 필드 라벨은 명사 |
| 형용사 (상태) | `active`, `pending`, `normal` | 상태는 형용사 |
| 복수형 (목록) | `devices`, `customers` | 목록은 복수형 |

### 5.2 금지 규칙

```typescript
// BAD - 숫자로 시작
"1stStep": "첫 번째 단계"

// BAD - 특수문자 포함
"device-id": "단말 ID"

// BAD - 너무 긴 키
"theButtonForSavingTheCurrentFormData": "저장"

// BAD - 하드코딩된 값 포함
"error404": "404 에러"

// GOOD
"firstStep": "첫 번째 단계"
"deviceId": "단말 ID"
"save": "저장"
"notFound": "페이지를 찾을 수 없습니다"
```

### 5.3 컨텍스트 분리

```typescript
// 같은 단어라도 컨텍스트에 따라 분리
{
  common: {
    status: {
      active: "활성"      // 일반적인 활성 상태
    }
  },
  rms: {
    monitoring: {
      status: {
        active: "정상 가동"  // RMS에서의 정상 가동
      }
    }
  },
  admin: {
    accounts: {
      status: {
        active: "계정 활성"  // 계정의 활성 상태
      }
    }
  }
}
```

---

## 6. 보간 (Interpolation)

### 6.1 변수 바인딩

```typescript
// 단순 변수
"welcome": "안녕하세요, {userName}님"

// 복수 처리
"deviceCount": "{count}대의 단말"

// 날짜/시간
"lastUpdated": "최종 수정: {date}"

// 조건부
"status": "{status, select, active {활성} inactive {비활성} other {알 수 없음}}"
```

### 6.2 사용 예시

```tsx
import { useTranslation } from 'next-i18next';

function DeviceCount({ count }: { count: number }) {
  const { t } = useTranslation('rms');
  
  return (
    <span>
      {t('monitoring.kpi.totalDevices')}: {t('common:unit.device', { count })}
    </span>
  );
}
```

---

## 7. 상태 코드 매핑

### 7.1 Display 상태 (EN → KR)

```typescript
export const DISPLAY_STATE_I18N: Record<DisplayState, string> = {
  NORMAL: "정상",
  DEGRADED: "성능저하",
  CRITICAL: "심각",
  OFFLINE: "오프라인",
  EMERGENCY: "비상",
};
```

### 7.2 배터리 상태 (EN → KR)

```typescript
export const BATTERY_STATE_I18N: Record<BatteryState, string> = {
  NORMAL: "정상",
  CAUTION: "주의",
  WARNING: "경고",
  REPLACE_RECOMMENDED: "교체권고",
  CRITICAL: "치명",
  OFFLINE: "오프라인",
};
```

### 7.3 장애 심각도 (EN → KR)

```typescript
export const SEVERITY_I18N: Record<Severity, string> = {
  CRITICAL: "심각",
  MAJOR: "중요",
  MINOR: "경미",
  INFO: "정보",
};
```

---

## 8. 구현 가이드

### 8.1 next-i18next 설정 예시

```typescript
// next-i18next.config.js
module.exports = {
  i18n: {
    defaultLocale: 'ko-KR',
    locales: ['ko-KR', 'en-US'],
    localeDetection: false,
  },
  localePath: './locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
```

### 8.2 컴포넌트 사용 예시

```tsx
'use client';

import { useTranslation } from 'next-i18next';

export function DeviceStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation('rms');
  
  return (
    <Badge variant={getVariant(status)}>
      {t(`monitoring.deviceList.status.${status}`)}
    </Badge>
  );
}
```

### 8.3 서버 컴포넌트 사용

```tsx
// app/(portal)/rms/monitoring/page.tsx
import { getTranslations } from 'next-intl/server';

export default async function MonitoringPage() {
  const t = await getTranslations('rms.monitoring');
  
  return (
    <PageHeader title={t('title')} />
  );
}
```

---

## 9. 마이그레이션 체크리스트

### 9.1 하드코딩 문자열 점검

```bash
# 한글 하드코딩 검색
grep -r "\"[가-힣]" --include="*.tsx" app/ components/
```

### 9.2 단계별 마이그레이션

| 단계 | 작업 | 우선순위 |
|------|------|----------|
| 1 | 공통 UI (버튼, 라벨, 상태) | High |
| 2 | 내비게이션 (사이드바, 브레드크럼) | High |
| 3 | RMS 도메인 | Medium |
| 4 | CMS 도메인 | Medium |
| 5 | Registry 도메인 | Medium |
| 6 | Admin 도메인 | Low |
| 7 | 에러 메시지 | Low |

---

## 10. 부록

### 10.1 참조 파일

| 파일 | 설명 |
|------|------|
| `/components/rms/battery/battery-i18n.ts` | 배터리 용어 사전 (SSOT) |
| `/components/rms/shared/overall-state-i18n.ts` | 상태 EN↔KR 매핑 |

### 10.2 관련 문서

| 문서 | 링크 |
|------|------|
| 디자인 시스템 가이드 | `/docs/DESIGN_SYSTEM_GUIDE.md` |
| 컴포넌트 카탈로그 | `/docs/COMPONENT_CATALOG.md` |
| IA 문서 | `/docs/INFORMATION_ARCHITECTURE.md` |

---

**문서 버전**: 1.0  
**최종 수정**: 2025-03-22  
**작성자**: BIS Admin Portal 개발팀
