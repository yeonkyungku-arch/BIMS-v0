# E-paper BIS Admin Portal - 데이터 흐름 아키텍처

> **대상**: 개발자  
> **버전**: 1.0  
> **최종 수정**: 2026-03-22

---

## 1. 아키텍처 개요

본 시스템은 **Provider/Contract/ViewModel** 패턴을 기반으로 데이터 흐름을 관리합니다.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │    Page     │    │    Page     │    │    Page     │    │    Page     │  │
│  │  Component  │    │  Component  │    │  Component  │    │  Component  │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                  │                  │          │
│         ▼                  ▼                  ▼                  ▼          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        VIEW MODEL LAYER                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ useTerminals │  │useOperation  │  │ useMemo/     │              │   │
│  │  │              │  │Tasks         │  │ useState     │              │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │   │
│  └─────────┼─────────────────┼─────────────────┼────────────────────────┘   │
│            │                 │                 │                            │
│            ▼                 ▼                 ▼                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        CONTRACT LAYER                                │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                    TypeScript Interfaces                      │   │   │
│  │  │  • OperationTask      • EnrichedTerminal   • BatteryView     │   │   │
│  │  │  • OverallState       • Fault              • WorkOrder       │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                           PROVIDER LAYER                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ RBACProvider │  │ScopeProvider │  │ Emergency    │  │ RmsDevice    │    │
│  │              │  │              │  │ Provider     │  │ Provider     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
├─────────────────────────────────────────────────────────────────────────────┤
│                           DATA SOURCE LAYER                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         Mock Data (lib/mock-data.tsx)                 │   │
│  │  mockDevices, mockBusStops, mockFaults, mockWorkOrders, ...          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 패턴 정의

### 2.1 Provider Pattern

**역할**: 전역 상태 및 컨텍스트를 하위 컴포넌트 트리에 주입

```typescript
// contexts/rbac-context.tsx
interface RBACContextType {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  roleLabel: string;
  can: (action: ActionId) => boolean;
  canAll: (actions: ActionId[]) => boolean;
  canAny: (actions: ActionId[]) => boolean;
  devScopeType: DevScopeType;
  devScopeId: string;
  devRoleKey: string;
  userActions: readonly ActionId[];
}

export function RBACProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role>("super_admin");
  // ... state management logic
  
  return (
    <RBACContext.Provider value={{ ... }}>
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (!context) throw new Error("useRBAC must be used within RBACProvider");
  return context;
}
```

### 2.2 Contract Pattern

**역할**: 데이터 구조와 인터페이스를 명시적으로 정의하여 타입 안전성 보장

```typescript
// Contract: 운영 작업 타입 정의
export type WorkflowStatus = "ASSIGNED" | "IN_PROGRESS" | "TX_PENDING";
export type OverallSeverity = "NORMAL" | "WARNING" | "CRITICAL" | "OFFLINE";

export interface OperationTask {
  id: string;
  workOrderId?: string;
  workflowStatus: WorkflowStatus;
  overallSeverity: OverallSeverity;
  deviceId: string;
  stationName: string;
  reason?: string;
  vendor?: string;
  assignedTo?: string;
  workType?: string;
  description?: string;
  priority?: string;
}

// Contract: 터미널 상태 인터페이스
export interface EnrichedTerminal {
  terminal: BisTerminal;
  deviceId: string | null;
  overallState: OverallState;
  overallReason: string | null;
  workflowHint: string | null;
  incidentStatus: IncidentStatus;
  incidentId: string | null;
  incidentCount: number;
  isProvisioningPending: boolean;
}
```

### 2.3 ViewModel Pattern

**역할**: 데이터 변환, 파생 상태 계산, 비즈니스 로직 캡슐화

```typescript
// hooks/useOperationTasks.ts - ViewModel Hook
export function useOperationTasks() {
  // 데이터 소스에서 가공
  const tasks = useMemo(() => buildTasks(), []);
  
  // 파생 상태 계산
  const cards = useMemo(() => buildCardData(tasks), [tasks]);

  return { tasks, cards };
}

// hooks/useTerminals.ts - ViewModel Hook
export function useTerminals() {
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<Error | null>(null);
  const [data, setData] = useState<EnrichedTerminal[]>([]);

  const fetchData = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setData(enrichTerminals(mockBisTerminals));
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => fetchData(), [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
```

---

## 3. 데이터 흐름 다이어그램

### 3.1 단방향 데이터 흐름 (Unidirectional Data Flow)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   ┌──────────────┐                                                     │
│   │  User Action │ ◄───────────────────────────────────────────────┐   │
│   │  (Click/Input│                                                  │   │
│   └───────┬──────┘                                                  │   │
│           │                                                         │   │
│           ▼                                                         │   │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐       │   │
│   │   Event      │────▶│   Action     │────▶│   Reducer/   │       │   │
│   │   Handler    │     │   Dispatch   │     │   setState   │       │   │
│   └──────────────┘     └──────────────┘     └───────┬──────┘       │   │
│                                                      │              │   │
│                                                      ▼              │   │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐       │   │
│   │   UI Update  │◄────│   Re-render  │◄────│   New State  │       │   │
│   │              │     │              │     │              │       │   │
│   └──────────────┘     └──────────────┘     └──────────────┘       │   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Provider 계층 구조

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Root Layout                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      DevUserProvider                               │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │                    RBACProvider                              │  │  │
│  │  │  ┌───────────────────────────────────────────────────────┐  │  │  │
│  │  │  │                ScopeProvider                           │  │  │  │
│  │  │  │  ┌─────────────────────────────────────────────────┐  │  │  │  │
│  │  │  │  │             EmergencyProvider                    │  │  │  │  │
│  │  │  │  │  ┌───────────────────────────────────────────┐  │  │  │  │  │
│  │  │  │  │  │           RmsDeviceProvider               │  │  │  │  │  │
│  │  │  │  │  │  ┌─────────────────────────────────────┐  │  │  │  │  │  │
│  │  │  │  │  │  │         Page Components             │  │  │  │  │  │  │
│  │  │  │  │  │  │                                     │  │  │  │  │  │  │
│  │  │  │  │  │  └─────────────────────────────────────┘  │  │  │  │  │  │
│  │  │  │  │  └───────────────────────────────────────────┘  │  │  │  │  │
│  │  │  │  └─────────────────────────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 페이지 컴포넌트 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Page Component (예: RMS Alert Center)               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         IMPORTS                                  │   │
│  │  • useRBAC()          - 권한 확인                                │   │
│  │  • mockFaults         - 장애 데이터                              │   │
│  │  • mockDevices        - 단말 데이터                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      LOCAL STATE (useState)                      │   │
│  │  • selectedAlert      - 선택된 장애                              │   │
│  │  • searchQuery        - 검색어                                   │   │
│  │  • filters            - 필터 상태 (severity, customer, region)   │   │
│  │  • drawerOpen         - Drawer 열림 상태                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    DERIVED STATE (useMemo)                       │   │
│  │  • filteredAlerts     - 필터링된 장애 목록                       │   │
│  │  • stats              - 통계 데이터 (치명, 경고, 주의 카운트)     │   │
│  │  • uniqueCustomers    - 고유 고객사 목록                         │   │
│  │  • uniqueRegions      - 고유 지역 목록                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         UI RENDERING                             │   │
│  │  • Header + Filters                                              │   │
│  │  • Stats Cards                                                   │   │
│  │  • Alert Table                                                   │   │
│  │  • Detail Drawer                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Provider 상세 설명

### 4.1 RBACProvider (권한 관리)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          RBACProvider                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐     ┌─────────────────────────────────────────────┐   │
│  │ DevUser     │────▶│  effectiveRole = TEMPLATE_TO_ROLE[roleKey]  │   │
│  │ (from dev   │     │                                             │   │
│  │  context)   │     │  effectiveActions = devUser.actions         │   │
│  └─────────────┘     └──────────────────────┬──────────────────────┘   │
│                                              │                          │
│                                              ▼                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Authorization Functions                       │   │
│  │  • can(action)     - 단일 액션 권한 확인                         │   │
│  │  • canAll(actions) - 모든 액션 권한 확인                         │   │
│  │  • canAny(actions) - 하나 이상 액션 권한 확인                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                              │                          │
│                                              ▼                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       Context Value                              │   │
│  │  {                                                               │   │
│  │    currentRole,      // 현재 역할                                │   │
│  │    setCurrentRole,   // 역할 변경                                │   │
│  │    roleLabel,        // 역할 레이블 (한글)                       │   │
│  │    can,              // 권한 확인 함수                           │   │
│  │    canAll,                                                       │   │
│  │    canAny,                                                       │   │
│  │    devScopeType,     // 개발 모드 스코프 타입                    │   │
│  │    devScopeId,       // 개발 모드 스코프 ID                      │   │
│  │    devRoleKey,       // 개발 모드 역할 키                        │   │
│  │    userActions,      // 허용된 액션 목록                         │   │
│  │  }                                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 ScopeProvider (범위 관리)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ScopeProvider                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       Registry Hierarchy                         │   │
│  │                                                                  │   │
│  │   Stakeholder (E-paper BIS 서비스)                               │   │
│  │       │                                                          │   │
│  │       ├── Customer (서울교통공사)                                │   │
│  │       │       ├── BISGroup (강남구 그룹 A)                       │   │
│  │       │       │       ├── BIS (강남역 1번출구)                   │   │
│  │       │       │       └── BIS (역삼역 2번출구)                   │   │
│  │       │       └── BISGroup (서초구 그룹 B)                       │   │
│  │       │               └── BIS (서초역 3번출구)                   │   │
│  │       │                                                          │   │
│  │       └── Customer (경기교통정보센터)                            │   │
│  │               └── BISGroup (성남시 그룹)                         │   │
│  │                       └── BIS (분당 정자역 앞)                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                              │                          │
│                                              ▼                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   Role-based Access Control                      │   │
│  │                                                                  │   │
│  │  ROLE_CUSTOMER_ACCESS = {                                        │   │
│  │    super_admin: "all",                                           │   │
│  │    system_admin: "all",                                          │   │
│  │    operator: ["CUS001"],         // 자신의 고객사만              │   │
│  │    maintenance: ["CUS001", "CUS002"],  // 배정된 고객사          │   │
│  │    viewer: ["CUS001"],                                           │   │
│  │  }                                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                              │                          │
│                                              ▼                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       Context Value                              │   │
│  │  {                                                               │   │
│  │    scope: SelectedScope,         // 현재 선택된 범위             │   │
│  │    setScope,                     // 범위 변경                    │   │
│  │    registry: Stakeholder,        // 전체 레지스트리              │   │
│  │    accessibleCustomers,          // 접근 가능한 고객사 목록      │   │
│  │    canSelectAll,                 // 전체 선택 가능 여부          │   │
│  │  }                                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 EmergencyProvider (긴급 상황 관리)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        EmergencyProvider                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         State                                    │   │
│  │  • isActive: boolean            - 긴급 모드 활성화 상태          │   │
│  │  • message: string              - 긴급 메시지 내용               │   │
│  │  • targetScope: string[]        - 대상 범위 (그룹/정류장)        │   │
│  │  • activatedAt: Date | null     - 활성화 시간                    │   │
│  │  • activatedBy: string | null   - 활성화 담당자                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                              │                          │
│                                              ▼                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        Actions                                   │   │
│  │  • activateEmergency(message, scope)  - 긴급 모드 활성화         │   │
│  │  • deactivateEmergency()              - 긴급 모드 비활성화       │   │
│  │  • updateMessage(message)             - 메시지 업데이트          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.4 RmsDeviceProvider (단말 정보 공유)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RmsDeviceProvider                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         State                                    │   │
│  │  • selectedDeviceId: string | null  - 선택된 단말 ID             │   │
│  │  • drawerOpen: boolean              - Drawer 열림 상태           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                              │                          │
│                                              ▼                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        Actions                                   │   │
│  │  • selectDevice(deviceId)    - 단말 선택                         │   │
│  │  • clearDevice()             - 선택 해제                         │   │
│  │  • openDrawer()              - Drawer 열기                       │   │
│  │  • closeDrawer()             - Drawer 닫기                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  사용 예시:                                                             │
│  - RMS 모니터링 페이지에서 단말 클릭 시 Drawer 열기                    │
│  - 장애 상세 패널에서 단말 정보 조회 시 사용                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. ViewModel Hook 상세

### 5.1 useOperationTasks

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       useOperationTasks()                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Data Sources                                │   │
│  │  • getAllTabletWorkOrders()     - 통합 작업 지시 데이터          │   │
│  │  • mockOutboxItems              - 전송 대기 항목                 │   │
│  │  • getOverallSnapshot(devId)    - 단말 상태 스냅샷               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Transformation Logic                          │   │
│  │                                                                  │   │
│  │  function buildTasks(): OperationTask[] {                        │   │
│  │    // 1. Work Orders -> ASSIGNED / IN_PROGRESS 태스크            │   │
│  │    // 2. Outbox Items -> TX_PENDING 태스크                       │   │
│  │    // 3. Overall State 조회 및 Severity 매핑                     │   │
│  │  }                                                               │   │
│  │                                                                  │   │
│  │  function buildCardData(tasks): WorkflowCardData[] {             │   │
│  │    // 워크플로우 상태별 카드 데이터 집계                         │   │
│  │    // - 배정 대기 (ASSIGNED)                                     │   │
│  │    // - 진행 중 (IN_PROGRESS)                                    │   │
│  │    // - 전송 대기 (TX_PENDING)                                   │   │
│  │  }                                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       Return Value                               │   │
│  │  {                                                               │   │
│  │    tasks: OperationTask[],      // 전체 작업 목록                │   │
│  │    cards: WorkflowCardData[],   // 워크플로우 카드 데이터        │   │
│  │  }                                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 useTerminals

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         useTerminals()                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Data Sources                                │   │
│  │  • mockBisTerminals            - BIS 터미널 목록                 │   │
│  │  • getOverallSnapshot()        - 단말 상태 스냅샷                │   │
│  │  • mockFaults                  - 장애 데이터                     │   │
│  │  • tabletToMonitoringId()      - 터미널 → 단말 ID 매핑           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   Enrichment Logic                               │   │
│  │                                                                  │   │
│  │  function enrichTerminals(terminals): EnrichedTerminal[] {       │   │
│  │    for each terminal:                                            │   │
│  │      1. Get device ID from tabletToMonitoringId()                │   │
│  │      2. Get overall snapshot (state, reason, workflow)           │   │
│  │      3. Get active faults for incident status                    │   │
│  │      4. Build EnrichedTerminal object                            │   │
│  │  }                                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       Return Value                               │   │
│  │  {                                                               │   │
│  │    data: EnrichedTerminal[],    // 보강된 터미널 목록            │   │
│  │    isLoading: boolean,          // 로딩 상태                     │   │
│  │    error: Error | null,         // 에러 상태                     │   │
│  │    refetch: () => void,         // 재조회 함수                   │   │
│  │  }                                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. 데이터 변환 흐름

### 6.1 장애 처리 흐름

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Fault Processing Flow                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  mockFaults (Raw Data)                                                  │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Filter & Transform                                              │   │
│  │  • status === "active" 필터링                                    │   │
│  │  • severity 기준 정렬                                            │   │
│  │  • workflow 상태 매핑 (OPEN → IN_PROGRESS → COMPLETED)           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Enrichment                                                      │   │
│  │  • Device 정보 조인 (mockDevices)                                │   │
│  │  • Customer/Region 정보 추가                                     │   │
│  │  • Overall State 조회                                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Aggregation                                                     │   │
│  │  • 심각도별 카운트 (치명, 경고, 주의)                            │   │
│  │  • 고객사별 그룹핑                                               │   │
│  │  • 지역별 그룹핑                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│       │                                                                 │
│       ▼                                                                 │
│  Alert Center Page (UI Rendering)                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 배터리 상태 처리 흐름

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Battery Status Flow                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  mockDevices (Raw Data)                                                 │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  buildBatteryViews(devices)                                      │   │
│  │  • SOC 계산 (현재 잔량 %)                                        │   │
│  │  • SOH 계산 (배터리 건강도 %)                                    │   │
│  │  • 교체 예측 일자 계산                                           │   │
│  │  • 위험 등급 분류 (LOW_RISK, MEDIUM_RISK, HIGH_RISK)             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  BatteryView[]                                                   │   │
│  │  {                                                               │   │
│  │    device: Device,                                               │   │
│  │    soc: number,              // State of Charge                  │   │
│  │    soh: number,              // State of Health                  │   │
│  │    estimatedReplaceDate: string,                                 │   │
│  │    replacementRisk: "LOW" | "MEDIUM" | "HIGH",                   │   │
│  │    cycleCount: number,                                           │   │
│  │    lastChargeDate: string,                                       │   │
│  │  }                                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│       │                                                                 │
│       ▼                                                                 │
│  Battery Management Page (UI Rendering)                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. 상태 관리 패턴

### 7.1 Local State (페이지 단위)

```typescript
// 페이지 컴포넌트 내 로컬 상태 관리
export default function AlertCenterPage() {
  // UI 상태
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // 필터 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  
  // 파생 상태 (useMemo)
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (severityFilter !== "all" && alert.severity !== severityFilter) return false;
      if (customerFilter !== "all" && alert.customerName !== customerFilter) return false;
      if (searchQuery && !alert.description.includes(searchQuery)) return false;
      return true;
    });
  }, [alerts, severityFilter, customerFilter, searchQuery]);
  
  return (/* UI */)
}
```

### 7.2 Global State (Context)

```typescript
// 전역 상태 접근
function SomeComponent() {
  // RBAC 컨텍스트
  const { can, currentRole, roleLabel } = useRBAC();
  
  // 범위 컨텍스트
  const { scope, accessibleCustomers } = useScope();
  
  // 긴급 상황 컨텍스트
  const { isActive: isEmergency, message } = useEmergency();
  
  // 권한 기반 조건부 렌더링
  if (!can("rms:alert:view")) {
    return <AccessDenied />;
  }
  
  return (/* UI */)
}
```

### 7.3 Derived State (useMemo)

```typescript
// 파생 상태 계산 패턴
const stats = useMemo(() => ({
  critical: alerts.filter(a => a.severity === "치명").length,
  warning: alerts.filter(a => a.severity === "경고").length,
  caution: alerts.filter(a => a.severity === "주의").length,
  total: alerts.length,
}), [alerts]);

const uniqueCustomers = useMemo(() => 
  Array.from(new Set(alerts.map(a => a.customerName))).sort()
, [alerts]);
```

---

## 8. API 준비 패턴

현재 시스템은 Mock 데이터를 사용하지만, 실제 API 연동 시 다음 패턴을 따릅니다:

### 8.1 Hook 기반 API 추상화

```typescript
// 현재 (Mock)
export function useTerminals() {
  const [data, setData] = useState<EnrichedTerminal[]>([]);
  
  useEffect(() => {
    // Mock 데이터 로드
    setData(enrichTerminals(mockBisTerminals));
  }, []);
  
  return { data, isLoading, error, refetch };
}

// 실제 API 연동 시 (Future)
export function useTerminals() {
  const [data, setData] = useState<EnrichedTerminal[]>([]);
  
  useEffect(() => {
    fetch('/api/terminals')
      .then(res => res.json())
      .then(terminals => setData(enrichTerminals(terminals)));
  }, []);
  
  return { data, isLoading, error, refetch };
}
```

### 8.2 SWR 패턴 (권장)

```typescript
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useTerminals() {
  const { data, error, isLoading, mutate } = useSWR('/api/terminals', fetcher);
  
  const enrichedData = useMemo(() => 
    data ? enrichTerminals(data) : []
  , [data]);
  
  return {
    data: enrichedData,
    isLoading,
    error,
    refetch: mutate,
  };
}
```

---

## 9. 파일 구조

```
/
├── contexts/                          # Provider 레이어
│   ├── rbac-context.tsx              # 권한 관리 Provider
│   ├── scope-context.tsx             # 범위 관리 Provider
│   ├── emergency-context.tsx         # 긴급 상황 Provider
│   └── rms-device-context.tsx        # 단말 정보 Provider
│
├── hooks/                             # ViewModel 레이어 (Custom Hooks)
│   ├── useOperationTasks.ts          # 운영 작업 ViewModel
│   ├── useTerminals.ts               # 터미널 상태 ViewModel
│   ├── use-mobile.ts                 # 모바일 감지
│   └── use-toast.ts                  # 토스트 알림
│
├── lib/                               # Contract 및 Data 레이어
│   ├── mock-data.tsx                 # Mock 데이터 (SSOT)
│   ├── rbac/                         # RBAC 관련 타입 및 유틸
│   │   ├── action-catalog.ts         # 액션 카탈로그
│   │   ├── permissions.ts            # 권한 로직
│   │   └── devUserContext.ts         # 개발 모드 사용자
│   ├── unified-work-order.ts         # 통합 작업 지시 로직
│   └── rms-device-map.ts             # 단말 매핑 (SSOT)
│
└── app/(portal)/                      # View 레이어 (Pages)
    ├── page.tsx                       # 대시보드
    ├── rms/                           # RMS 모듈
    ├── cms/                           # CMS 모듈
    ├── registry/                      # Registry 모듈
    ├── analysis/                      # Analysis 모듈
    └── field-operations/              # Field Operations 모듈
```

---

## 10. 요약

| 레이어 | 역할 | 주요 파일 |
|--------|------|-----------|
| **Provider** | 전역 상태 관리, 컨텍스트 주입 | `contexts/*.tsx` |
| **Contract** | 타입 정의, 인터페이스 명세 | `lib/*.ts`, 각 모듈의 타입 정의 |
| **ViewModel** | 데이터 변환, 파생 상태 계산 | `hooks/*.ts`, 페이지 내 `useMemo` |
| **View** | UI 렌더링, 사용자 상호작용 | `app/(portal)/**/*.tsx` |
| **Data Source** | Mock 데이터, API 엔드포인트 | `lib/mock-data.tsx` |

이 아키텍처는 관심사 분리(Separation of Concerns)를 통해 유지보수성과 테스트 용이성을 높이며, 실제 API 연동 시 최소한의 변경으로 전환할 수 있도록 설계되었습니다.
