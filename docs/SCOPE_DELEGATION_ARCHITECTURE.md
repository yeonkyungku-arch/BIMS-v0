# Scope/Delegation 구조 문서

> 대상: 개발자  
> 버전: 1.0  
> 최종 수정: 2025-03-22

## 1. 개요

E-paper BIS Admin Portal의 Scope/Delegation 시스템은 **계층적 범위 모델**과 **권한 위임 메커니즘**을 통해 다중 테넌트 환경에서 세밀한 접근 제어를 제공합니다.

### 1.1 핵심 원칙

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCOPE/DELEGATION 원칙                         │
├─────────────────────────────────────────────────────────────────┤
│  1. 계층적 포함 관계 (Hierarchical Containment)                   │
│     - 상위 Scope는 하위 Scope를 포함                              │
│     - GLOBAL > CUSTOMER > GROUP > DEVICE                         │
│                                                                  │
│  2. 권한 하향 상속 (Downward Inheritance)                         │
│     - 상위 Scope 권한은 하위 Scope에 자동 적용                     │
│     - 명시적 하위 권한으로 Override 불가                           │
│                                                                  │
│  3. 위임 제약 (Delegation Constraints)                            │
│     - 자신이 보유한 권한만 위임 가능                               │
│     - 상위 역할로 위임 불가 (Role Escalation 방지)                 │
│     - Scope 확장 위임 불가 (Scope Expansion 방지)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Scope 계층 구조

### 2.1 4단계 Scope 계층

```
                          ┌─────────────┐
                          │   GLOBAL    │  Level 0
                          │  (전체)     │  - 플랫폼 전체 접근
                          └──────┬──────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
     ┌──────▼──────┐      ┌──────▼──────┐      ┌──────▼──────┐
     │  CUSTOMER   │      │  CUSTOMER   │      │  CUSTOMER   │  Level 1
     │ 서울교통공사 │      │ 경기교통센터 │      │ 인천교통공사 │  - 고객사 단위
     └──────┬──────┘      └──────┬──────┘      └──────┬──────┘
            │                    │                    │
     ┌──────┴──────┐      ┌──────┴──────┐      ┌──────┴──────┐
     │             │      │             │      │             │
  ┌──▼───┐     ┌───▼──┐  ┌▼────┐    ┌───▼──┐  ┌▼────┐    ┌───▼──┐
  │GROUP │     │GROUP │  │GROUP│    │GROUP │  │GROUP│    │GROUP │  Level 2
  │강남A │     │서초B │  │성남 │    │수원  │  │연수 │    │남동  │  - 그룹 단위
  └──┬───┘     └───┬──┘  └──┬──┘    └──┬───┘  └──┬──┘    └──┬───┘
     │             │        │          │         │          │
  ┌──┴──┐       ┌──┴──┐   ┌─┴─┐      ┌─┴─┐     ┌─┴─┐      ┌─┴─┐
  │DEV  │       │DEV  │   │DEV│      │DEV│     │DEV│      │DEV│     Level 3
  │001  │       │003  │   │005│      │008│     │007│      │010│     - 단말 단위
  └─────┘       └─────┘   └───┘      └───┘     └───┘      └───┘
```

### 2.2 Scope 타입 정의

| Scope Type | Level | 식별자 패턴 | 설명 | 포함 범위 |
|------------|-------|-------------|------|-----------|
| `platform` | 0 | `SCOPE-PLT-*` | 플랫폼 전체 | 모든 리소스 |
| `partner` | 0.5 | `SCOPE-PTN-*` | 파트너사 범위 | 파트너 담당 고객사 |
| `customer` | 1 | `SCOPE-CUS-*` | 고객사 범위 | 해당 고객사 전체 |
| `bis_group` | 2 | `SCOPE-GRP-*` | BIS 그룹 범위 | 그룹 내 단말 |
| `region` | 2 | `SCOPE-REG-*` | 지역 범위 | 지역 내 정류장/단말 |
| `stop_group` | 2.5 | `SCOPE-STG-*` | 정류장 그룹 | 정류장 그룹 내 단말 |

### 2.3 TypeScript 타입 정의

```typescript
// contexts/scope-context.tsx

// Scope 레벨 정의
export type ScopeLevel = "all" | "customer" | "bisGroup" | "bis";

// 선택된 Scope 인터페이스
export interface SelectedScope {
  level: ScopeLevel;
  stakeholderId?: string;    // 플랫폼/파트너 ID
  customerId?: string;       // 고객사 ID
  bisGroupId?: string;       // BIS 그룹 ID
  bisId?: string;            // 개별 BIS ID
  label: string;             // UI 표시용 레이블
}

// 계층 구조 인터페이스
export interface BIS {
  id: string;
  name: string;              // "강남역 1번출구"
  deviceId: string;          // 연결된 단말 ID
}

export interface BISGroup {
  id: string;
  name: string;              // "강남구 그룹 A"
  bisList: BIS[];
}

export interface Customer {
  id: string;
  name: string;              // "서울교통공사"
  bisGroups: BISGroup[];
}

export interface Stakeholder {
  id: string;
  name: string;              // "E-paper BIS 서비스"
  customers: Customer[];
}
```

---

## 3. Authorization Scope 관리

### 3.1 Scope 레코드 구조

```typescript
// lib/mock-data.tsx

export type AuthorizationScopeType = 
  | "platform"      // 플랫폼 전체
  | "partner"       // 파트너사
  | "customer"      // 고객사
  | "bis_group"     // BIS 그룹
  | "region";       // 지역

export interface AuthorizationScopeRecord {
  id: string;                        // SCOPE-001
  name: string;                      // "서울교통공사 전체"
  type: AuthorizationScopeType;      // "customer"
  description: string;               // 상세 설명
  
  // 계층 참조
  parentScopeId?: string;            // 상위 Scope ID
  partnerId?: string;                // 파트너 ID (type=partner인 경우)
  customerId?: string;               // 고객사 ID (type=customer인 경우)
  bisGroupId?: string;               // BIS 그룹 ID (type=bis_group인 경우)
  regionId?: string;                 // 지역 ID (type=region인 경우)
  
  // 통계
  assignedAccountCount: number;      // 할당된 계정 수
  childScopeCount: number;           // 하위 Scope 수
  
  // 메타데이터
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}
```

### 3.2 Scope 타입별 메타데이터

```typescript
export const AUTHORIZATION_SCOPE_TYPE_META: Record<
  AuthorizationScopeType, 
  { label: string; color: string; icon: string }
> = {
  platform:  { label: "플랫폼",   color: "purple", icon: "Globe" },
  partner:   { label: "파트너",   color: "blue",   icon: "Building2" },
  customer:  { label: "고객사",   color: "green",  icon: "Users" },
  bis_group: { label: "BIS그룹",  color: "amber",  icon: "Layers" },
  region:    { label: "지역",     color: "cyan",   icon: "MapPin" },
};
```

### 3.3 Scope 계층 검증 함수

```typescript
// Scope 포함 관계 검증
function isScopeContainedIn(
  childScope: AuthorizationScopeRecord, 
  parentScope: AuthorizationScopeRecord
): boolean {
  // 동일 Scope
  if (childScope.id === parentScope.id) return true;
  
  // 플랫폼 Scope는 모든 Scope를 포함
  if (parentScope.type === "platform") return true;
  
  // 파트너 Scope 체크
  if (parentScope.type === "partner") {
    if (childScope.type === "customer") {
      return childScope.partnerId === parentScope.partnerId;
    }
    if (childScope.type === "bis_group") {
      // 그룹의 고객사가 파트너 소속인지 확인
      const customer = getCustomerById(childScope.customerId);
      return customer?.partnerId === parentScope.partnerId;
    }
  }
  
  // 고객사 Scope 체크
  if (parentScope.type === "customer") {
    if (childScope.type === "bis_group") {
      return childScope.customerId === parentScope.customerId;
    }
  }
  
  return false;
}
```

---

## 4. Delegation (권한 위임) 시스템

### 4.1 Delegation 데이터 모델

```typescript
// lib/mock-data.tsx

export type DelegationLevel = "direct" | "cascading";
export type DelegationStatus = "active" | "revoked" | "pending";

export interface DelegationRecord {
  id: string;                        // DEL-001
  
  // 위임자 (Delegator) 정보
  delegatorId: string;               // 위임하는 사람
  delegatorName: string;
  delegatorEmail: string;
  delegatorRole: AccountRole;        // 위임자의 역할
  
  // 수임자 (Delegatee) 정보
  delegateeId: string;               // 위임받는 사람
  delegateeName: string;
  delegateeEmail: string;
  delegateeRole: AccountRole;        // 수임자의 역할
  
  // 위임 범위
  scopeId: string;                   // 위임되는 Scope ID
  scopeName: string;
  scopeType: AuthorizationScopeType;
  
  // 조직 컨텍스트
  partnerId?: string;
  partnerName?: string;
  customerId?: string;
  customerName?: string;
  
  // 위임 설정
  delegatedRole: AccountRole;        // 위임되는 역할
  canSubDelegate: boolean;           // 재위임 가능 여부
  expiresAt: string | null;          // 만료일 (null = 무기한)
  
  // 상태
  status: DelegationStatus;
  revokedAt?: string;
  revokedBy?: string;
  revokedReason?: string;
  
  // 감사
  createdAt: string;
  updatedAt: string;
}
```

### 4.2 Delegation 흐름도

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DELEGATION WORKFLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

 ┌───────────────┐
 │ Super Admin   │ ◄─── 플랫폼 전체 권한 (SCOPE-PLATFORM)
 │ (Level 5)     │
 └───────┬───────┘
         │ 위임 (DEL-001)
         │ - Role: platform_admin
         │ - Scope: platform
         │ - canSubDelegate: true
         ▼
 ┌───────────────┐
 │Platform Admin │ ◄─── 플랫폼 관리 권한
 │ (Level 4)     │
 └───────┬───────┘
         │ 위임 (DEL-002)
         │ - Role: partner_admin
         │ - Scope: partner (스마트시티 솔루션즈)
         │ - canSubDelegate: true
         ▼
 ┌───────────────┐
 │Partner Admin  │ ◄─── 파트너사 범위 권한
 │ (Level 3)     │
 └───────┬───────┘
         │ 위임 (DEL-003)
         │ - Role: customer_admin
         │ - Scope: customer (서울교통공사)
         │ - canSubDelegate: false
         ▼
 ┌───────────────┐
 │Customer Admin │ ◄─── 고객사 범위 권한 (재위임 불가)
 │ (Level 2)     │
 └───────────────┘
```

### 4.3 Delegation 검증 규칙

```typescript
// 역할 계층 정의 (숫자가 높을수록 상위 권한)
const ROLE_HIERARCHY: Record<AccountRole, number> = {
  viewer: 0,
  auditor: 0,
  operator: 1,
  customer_admin: 2,
  partner_admin: 3,
  platform_admin: 4,
  super_admin: 5,
};

// 규칙 1: Role Escalation 방지
function validateNoRoleEscalation(
  delegatorRole: AccountRole,
  delegatedRole: AccountRole
): boolean {
  const delegatorLevel = ROLE_HIERARCHY[delegatorRole];
  const delegatedLevel = ROLE_HIERARCHY[delegatedRole];
  
  // 위임되는 역할은 위임자 역할보다 같거나 낮아야 함
  return delegatedLevel <= delegatorLevel;
}

// 규칙 2: Scope Expansion 방지
function validateNoScopeExpansion(
  delegatorScope: AuthorizationScopeRecord,
  delegatedScope: AuthorizationScopeRecord
): boolean {
  // 위임되는 Scope는 위임자 Scope에 포함되어야 함
  return isScopeContainedIn(delegatedScope, delegatorScope);
}

// 규칙 3: 재위임 권한 검증
function validateSubDelegation(
  originalDelegation: DelegationRecord
): boolean {
  // 원본 위임에서 재위임이 허용된 경우에만 가능
  return originalDelegation.canSubDelegate === true;
}

// 통합 검증 함수
function validateDelegation(
  delegator: { role: AccountRole; scope: AuthorizationScopeRecord },
  delegation: { role: AccountRole; scope: AuthorizationScopeRecord },
  existingDelegation?: DelegationRecord
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Rule 1: Role Escalation
  if (!validateNoRoleEscalation(delegator.role, delegation.role)) {
    errors.push("위임자의 역할보다 상위 역할을 위임할 수 없습니다");
  }
  
  // Rule 2: Scope Expansion
  if (!validateNoScopeExpansion(delegator.scope, delegation.scope)) {
    errors.push("위임자의 범위를 초과하는 Scope를 위임할 수 없습니다");
  }
  
  // Rule 3: Sub-delegation
  if (existingDelegation && !validateSubDelegation(existingDelegation)) {
    errors.push("재위임이 허용되지 않은 권한입니다");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## 5. Role-Scope 매핑

### 5.1 역할별 기본 Scope 접근

```
┌──────────────────┬─────────────────┬────────────────────────────────┐
│      역할        │   기본 Scope    │          접근 범위              │
├──────────────────┼─────────────────┼────────────────────────────────┤
│ super_admin      │ platform        │ 전체 플랫폼                     │
│ platform_admin   │ platform        │ 전체 플랫폼 (설정 제외)          │
│ partner_admin    │ partner         │ 담당 파트너사 범위               │
│ customer_admin   │ customer        │ 소속 고객사 범위                 │
│ operator         │ customer/group  │ 할당된 고객사/그룹               │
│ viewer           │ customer        │ 소속 고객사 (읽기 전용)          │
│ auditor          │ platform        │ 전체 감사 로그 (읽기 전용)       │
└──────────────────┴─────────────────┴────────────────────────────────┘
```

### 5.2 Scope Provider 구현

```typescript
// contexts/scope-context.tsx

// 역할별 고객사 접근 권한 매핑
const ROLE_CUSTOMER_ACCESS: Record<Role, string[] | "all"> = {
  super_admin: "all",
  system_admin: "all",
  operator: ["CUS001"],              // 할당된 고객사만
  maintenance: ["CUS001", "CUS002"], // 복수 고객사 가능
  viewer: ["CUS001"],                // 소속 고객사만
};

export function ScopeProvider({
  children,
  currentRole,
}: {
  children: ReactNode;
  currentRole: Role;
}) {
  const [scope, setScope] = useState<SelectedScope>({
    level: "all",
    label: "전체 고객사",
  });

  // 역할 기반 접근 가능 고객사 계산
  const accessibleCustomers = useMemo(() => {
    const access = ROLE_CUSTOMER_ACCESS[currentRole];
    if (access === "all") return REGISTRY.customers;
    return REGISTRY.customers.filter((c) => access.includes(c.id));
  }, [currentRole]);

  // 전체 선택 가능 여부
  const canSelectAll = useMemo(() => {
    return currentRole === "super_admin" || currentRole === "system_admin";
  }, [currentRole]);

  // 역할 변경 시 Scope 자동 조정
  useEffect(() => {
    if (!canSelectAll && scope.level === "all") {
      if (accessibleCustomers.length === 1) {
        setScope({
          level: "customer",
          customerId: accessibleCustomers[0].id,
          label: accessibleCustomers[0].name,
        });
      }
    }
  }, [canSelectAll, accessibleCustomers, scope.level]);

  return (
    <ScopeContext.Provider
      value={{ 
        scope, 
        setScope, 
        registry: REGISTRY, 
        accessibleCustomers, 
        canSelectAll 
      }}
    >
      {children}
    </ScopeContext.Provider>
  );
}
```

---

## 6. Delegation 관리 UI

### 6.1 관리 페이지 구조

```
/admin/delegations
├── 필터 영역
│   ├── 검색 (위임자/수임자 이름)
│   ├── 역할 필터
│   ├── Scope 타입 필터
│   ├── 파트너 필터
│   └── 상태 필터
│
├── 테이블 영역
│   ├── 체크박스 (다중 선택)
│   ├── 위임자 정보
│   ├── 수임자 정보
│   ├── 위임 역할
│   ├── Scope
│   ├── 상태 배지
│   ├── 만료일
│   └── 액션 (조회/철회)
│
└── 상세 Drawer
    ├── 위임 정보 조회
    ├── 신규 위임 생성
    │   ├── 위임자 선택
    │   ├── 수임자 선택
    │   ├── 역할 선택 (검증)
    │   ├── Scope 선택 (검증)
    │   ├── 재위임 허용 여부
    │   └── 만료일 설정
    └── 위임 철회
```

### 6.2 Delegation 상태 흐름

```
     ┌─────────────────────────────────────────────────────┐
     │                                                     │
     ▼                                                     │
┌─────────┐    승인     ┌─────────┐    철회     ┌─────────┐
│ pending │ ─────────► │ active  │ ─────────► │ revoked │
│  (대기)  │            │  (활성)  │            │  (철회)  │
└─────────┘            └────┬────┘            └─────────┘
     │                      │
     │ 거부                  │ 만료
     ▼                      ▼
┌─────────┐            ┌─────────┐
│rejected │            │ expired │
│  (거부)  │            │  (만료)  │
└─────────┘            └─────────┘
```

---

## 7. Scope 필터링 적용

### 7.1 데이터 필터링 예시

```typescript
// 현재 Scope에 따른 단말 필터링
function filterDevicesByScope(
  devices: Device[],
  scope: SelectedScope
): Device[] {
  switch (scope.level) {
    case "all":
      return devices;
      
    case "customer":
      return devices.filter(d => d.customerId === scope.customerId);
      
    case "bisGroup":
      return devices.filter(d => d.bisGroupId === scope.bisGroupId);
      
    case "bis":
      return devices.filter(d => d.id === scope.bisId);
      
    default:
      return devices;
  }
}

// 사용 예시 (RMS 모니터링)
function MonitoringScreen() {
  const { scope } = useScope();
  const allDevices = useDevices();
  
  const filteredDevices = useMemo(
    () => filterDevicesByScope(allDevices, scope),
    [allDevices, scope]
  );
  
  return <DeviceList devices={filteredDevices} />;
}
```

### 7.2 API 요청에 Scope 적용

```typescript
// Scope를 포함한 API 요청
async function fetchIncidents(scope: SelectedScope): Promise<Incident[]> {
  const params = new URLSearchParams();
  
  if (scope.level !== "all") {
    if (scope.customerId) {
      params.append("customerId", scope.customerId);
    }
    if (scope.bisGroupId) {
      params.append("bisGroupId", scope.bisGroupId);
    }
    if (scope.bisId) {
      params.append("bisId", scope.bisId);
    }
  }
  
  const response = await fetch(`/api/incidents?${params}`);
  return response.json();
}
```

---

## 8. 보안 고려사항

### 8.1 Scope Validation 체크리스트

| 검증 항목 | 설명 | 구현 위치 |
|----------|------|----------|
| Scope 소유권 | 사용자가 해당 Scope에 접근 권한이 있는지 | `ScopeProvider` |
| 계층 유효성 | Scope 계층 구조가 올바른지 | `isScopeContainedIn()` |
| 위임 유효성 | 위임이 제약 조건을 만족하는지 | `validateDelegation()` |
| 만료 검사 | Delegation이 만료되지 않았는지 | 미들웨어/Provider |

### 8.2 감사 로그

```typescript
interface ScopeDelegationAuditEvent {
  eventType: 
    | "delegation.created"
    | "delegation.activated"
    | "delegation.revoked"
    | "delegation.expired"
    | "scope.accessed"
    | "scope.denied";
    
  actorId: string;
  actorRole: AccountRole;
  targetId: string;           // Delegation ID 또는 Scope ID
  scopeType: AuthorizationScopeType;
  scopeId: string;
  details: Record<string, unknown>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}
```

---

## 9. 파일 구조

```
/contexts
└── scope-context.tsx          # Scope Provider 및 Hook

/lib/mock-data.tsx             # Delegation/Scope Mock 데이터
├── AuthorizationScopeType
├── AuthorizationScopeRecord
├── DelegationRecord
├── mockDelegations
└── mockAuthorizationScopes

/app/(portal)/admin
├── delegations/page.tsx       # 위임 관리
└── scopes/page.tsx            # Scope 관리

/lib/rbac
├── action-catalog.ts          # admin.delegation.* 액션
└── role-templates.ts          # 역할별 Scope 접근 정의
```

---

## 10. 확장 가이드

### 10.1 새로운 Scope 타입 추가

1. `AuthorizationScopeType`에 새 타입 추가
2. `AUTHORIZATION_SCOPE_TYPE_META`에 메타데이터 추가
3. `isScopeContainedIn()` 함수에 포함 관계 로직 추가
4. 관련 UI 컴포넌트 업데이트

### 10.2 Delegation 규칙 추가

1. 새로운 검증 함수 작성
2. `validateDelegation()` 통합 함수에 추가
3. UI에 에러 메시지 표시 로직 추가
4. 감사 로그 이벤트 타입 추가

---

## 11. 참고 문서

- [RBAC 설계 명세서](./RBAC_SPECIFICATION.md)
- [데이터 흐름 아키텍처](./DATA_FLOW_ARCHITECTURE.md)
- [모듈 아키텍처](./MODULE_ARCHITECTURE.md)
