# 상태 관리 패턴 (State Management Pattern)

> **버전**: 1.0  
> **최종 수정**: 2026-03-22  
> **대상**: 개발자

---

## 1. 개요

BIMS 콘솔은 3가지 상태 관리 전략을 계층적으로 사용합니다:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        상태 관리 계층 구조                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Layer 1: Global Context (React Context API)                │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  • 인증/권한 상태 (RBAC)                                     │   │
│  │  • Scope 선택 상태                                          │   │
│  │  • 비상 모드 상태                                            │   │
│  │  • RMS 장치 상태                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Layer 2: Server State (SWR / ViewModel Hooks)              │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  • API 응답 캐싱                                             │   │
│  │  • 데이터 변환 (ViewModel)                                   │   │
│  │  • 재검증 / 폴링                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Layer 3: Local UI State (useState/useReducer)              │   │
│  │  ─────────────────────────────────────────────────────────  │   │
│  │  • 폼 입력 상태                                              │   │
│  │  • 모달/Drawer 열림 상태                                     │   │
│  │  • 선택/필터 상태                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Layer 1: Global Context (React Context API)

### 2.1 Context 목록

| Context | 파일 | 용도 | 상태 범위 |
|---------|------|------|-----------|
| `RBACContext` | `/contexts/rbac-context.tsx` | 역할/권한 관리 | 전역 |
| `ScopeContext` | `/contexts/scope-context.tsx` | 고객사/그룹 범위 | 전역 |
| `EmergencyContext` | `/contexts/emergency-context.tsx` | 비상 모드 | 전역 |
| `RmsDeviceContext` | `/contexts/rms-device-context.tsx` | RMS 장치 상태 | RMS 모듈 |

### 2.2 RBACContext

**역할**: 사용자 권한 및 역할 관리

```typescript
// contexts/rbac-context.tsx

interface RBACContextType {
  // 현재 역할
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  roleLabel: string;
  
  // Action 기반 권한 검사
  can: (action: ActionId) => boolean;
  canAll: (actions: ActionId[]) => boolean;
  canAny: (actions: ActionId[]) => boolean;
  
  // Dev-mode scope 정보
  devScopeType: DevScopeType;
  devScopeId: string;
  devRoleKey: string;
  
  // 허용된 Action 목록
  userActions: readonly ActionId[];
}
```

**사용 패턴**:

```tsx
"use client";

import { useRBAC } from "@/contexts/rbac-context";

function MyComponent() {
  const { can, canAny, currentRole } = useRBAC();
  
  // 단일 Action 검사
  if (!can("rms:device:read")) {
    return <AccessDenied />;
  }
  
  // 복수 Action 검사 (OR)
  const canEditOrDelete = canAny(["registry:customer:update", "registry:customer:delete"]);
  
  return (
    <div>
      <h1>현재 역할: {currentRole}</h1>
      {canEditOrDelete && <Button>편집/삭제</Button>}
    </div>
  );
}
```

### 2.3 ScopeContext

**역할**: 데이터 범위 필터링 (전체/고객사/그룹/BIS)

```typescript
// contexts/scope-context.tsx

export type ScopeLevel = "all" | "customer" | "bisGroup" | "bis";

export interface SelectedScope {
  level: ScopeLevel;
  stakeholderId?: string;
  customerId?: string;
  bisGroupId?: string;
  bisId?: string;
  label: string;
}

interface ScopeContextType {
  scope: SelectedScope;
  setScope: (scope: SelectedScope) => void;
  registry: Stakeholder;
  accessibleCustomers: Customer[];
  canSelectAll: boolean;
}
```

**사용 패턴**:

```tsx
"use client";

import { useScope } from "@/contexts/scope-context";

function DeviceList() {
  const { scope, accessibleCustomers } = useScope();
  
  // scope에 따라 데이터 필터링
  const filteredDevices = useMemo(() => {
    if (scope.level === "all") return allDevices;
    if (scope.level === "customer") {
      return allDevices.filter(d => d.customerId === scope.customerId);
    }
    if (scope.level === "bisGroup") {
      return allDevices.filter(d => d.groupId === scope.bisGroupId);
    }
    return allDevices.filter(d => d.bisId === scope.bisId);
  }, [scope, allDevices]);
  
  return <Table data={filteredDevices} />;
}
```

### 2.4 EmergencyContext

**역할**: 비상 모드 상태 및 워크플로우 관리

```typescript
// contexts/emergency-context.tsx

interface EmergencyContextValue {
  emergencyState: EmergencyModeState;
  auditLog: EmergencyAuditEntry[];
  
  // 비상 모드 워크플로우
  requestEmergency: (messageId: string, reason: string, requestedBy: string) => void;
  approveEmergency: (approvedBy: string) => void;
  deactivateEmergency: (deactivatedBy: string, reason: string) => void;
  
  // 파생 상태
  isEmergencyActive: boolean;
  isEmergencyRequested: boolean;
}
```

**사용 패턴**:

```tsx
"use client";

import { useEmergency } from "@/contexts/emergency-context";

function EmergencyBanner() {
  const { isEmergencyActive, emergencyState } = useEmergency();
  
  if (!isEmergencyActive) return null;
  
  return (
    <Alert variant="destructive">
      비상 모드 활성화됨: {emergencyState.reason}
    </Alert>
  );
}

function EmergencyControl() {
  const { requestEmergency, approveEmergency, isEmergencyRequested } = useEmergency();
  
  const handleRequest = () => {
    requestEmergency("MSG001", "긴급 공지 필요", "admin@example.com");
  };
  
  return (
    <div>
      <Button onClick={handleRequest}>비상 모드 요청</Button>
      {isEmergencyRequested && (
        <Button onClick={() => approveEmergency("super_admin@example.com")}>
          승인
        </Button>
      )}
    </div>
  );
}
```

### 2.5 RmsDeviceContext

**역할**: RMS 모듈 내 장치 선택 상태 공유

```typescript
// contexts/rms-device-context.tsx

interface RmsDeviceContextValue {
  selectedPowerType: DevicePowerType | null;
  hasSolarDevices: boolean;
  setSelectedPowerType: (pt: DevicePowerType | null) => void;
  setHasSolarDevices: (v: boolean) => void;
}
```

**사용 패턴**:

```tsx
"use client";

import { useRmsDevice } from "@/contexts/rms-device-context";

// 사이드바: 배터리 메뉴 가시성 제어
function Sidebar() {
  const { hasSolarDevices } = useRmsDevice();
  
  return (
    <nav>
      <NavItem href="/rms/monitoring">모니터링</NavItem>
      {hasSolarDevices && (
        <NavItem href="/rms/battery">배터리 관리</NavItem>
      )}
    </nav>
  );
}

// RMS 화면: 장치 선택 시 상태 업데이트
function DeviceList() {
  const { setSelectedPowerType, setHasSolarDevices } = useRmsDevice();
  
  useEffect(() => {
    const hasSolar = devices.some(d => d.powerType === "SOLAR");
    setHasSolarDevices(hasSolar);
  }, [devices]);
  
  const handleSelect = (device: Device) => {
    setSelectedPowerType(device.powerType);
  };
  
  return <List onSelect={handleSelect} />;
}
```

### 2.6 Context Provider 구성

```tsx
// app/(portal)/layout.tsx

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <RBACProvider>
      <ScopeProviderWrapper>
        <EmergencyProvider>
          <RmsDeviceProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </RmsDeviceProvider>
        </EmergencyProvider>
      </ScopeProviderWrapper>
    </RBACProvider>
  );
}

// ScopeProvider는 RBAC의 currentRole을 필요로 함
function ScopeProviderWrapper({ children }: { children: ReactNode }) {
  const { currentRole } = useRBAC();
  return (
    <ScopeProvider currentRole={currentRole}>
      {children}
    </ScopeProvider>
  );
}
```

---

## 3. Layer 2: Server State (SWR / ViewModel Hooks)

### 3.1 SWR 기본 패턴

```typescript
// SWR 기본 사용
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

function DeviceList() {
  const { data, error, isLoading, mutate } = useSWR('/api/devices', fetcher);
  
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <Table data={data} />;
}
```

### 3.2 ViewModel Hook 패턴

프로젝트에서는 SWR 대신 **ViewModel Hook 패턴**을 사용하여 Mock 데이터를 ViewModel로 변환합니다:

```typescript
// hooks/useTerminals.ts

export function useTerminals() {
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<Error | null>(null);
  const [data, setData] = useState<EnrichedTerminal[]>([]);

  const fetchData = useCallback(() => {
    setIsLoading(true);
    // Simulate network latency
    const timer = setTimeout(() => {
      setData(enrichTerminals(mockBisTerminals));
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return fetchData();
  }, [fetchData]);

  // 파생 상태 (useMemo로 계산)
  const summary = useMemo(() => ({
    total: data.length,
    normal: data.filter(d => d.overallState === "정상").length,
    warning: data.filter(d => d.overallState === "경고").length,
    critical: data.filter(d => d.overallState === "치명").length,
    offline: data.filter(d => d.overallState === "오프라인").length,
  }), [data]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    summary,
  };
}
```

### 3.3 useOperationTasks Hook

```typescript
// hooks/useOperationTasks.ts

export function useOperationTasks() {
  // useMemo로 Mock 데이터 변환 (API 대체)
  const tasks = useMemo(() => buildTasks(), []);
  const cards = useMemo(() => buildCardData(tasks), [tasks]);

  return { tasks, cards };
}

// 사용 예
function OperationDashboard() {
  const { tasks, cards } = useOperationTasks();
  
  return (
    <div>
      <WorkflowCards cards={cards} />
      <TaskList tasks={tasks} />
    </div>
  );
}
```

### 3.4 SWR 전환 가이드

Mock에서 실제 API로 전환 시:

```typescript
// Before (Mock)
export function useTerminals() {
  const [data, setData] = useState<EnrichedTerminal[]>([]);
  useEffect(() => {
    setData(enrichTerminals(mockBisTerminals));
  }, []);
  return { data };
}

// After (SWR)
import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const raw = await res.json();
  return enrichTerminals(raw); // 동일한 변환 로직 적용
};

export function useTerminals() {
  const { data, error, isLoading, mutate } = useSWR<EnrichedTerminal[]>(
    '/api/terminals',
    fetcher,
    {
      refreshInterval: 30000, // 30초마다 갱신
      revalidateOnFocus: true,
    }
  );
  
  return {
    data: data ?? [],
    isLoading,
    error,
    refetch: mutate,
  };
}
```

### 3.5 SWR 설정 옵션

```typescript
// lib/swr-config.ts

import { SWRConfiguration } from 'swr';

export const swrConfig: SWRConfiguration = {
  // 전역 설정
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshInterval: 0, // 기본 비활성화, 필요한 곳에서 활성화
  dedupingInterval: 2000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  
  // 전역 fetcher
  fetcher: async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
      const error = new Error('API Error');
      throw error;
    }
    return res.json();
  },
};

// app/providers.tsx
import { SWRConfig } from 'swr';
import { swrConfig } from '@/lib/swr-config';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  );
}
```

---

## 4. Layer 3: Local UI State

### 4.1 useState 패턴

```tsx
// 단순 UI 상태
function FilterPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    region: "all",
    dateRange: null,
  });
  
  return (
    <div>
      <Button onClick={() => setIsOpen(!isOpen)}>필터</Button>
      {isOpen && (
        <FilterForm
          filters={filters}
          onChange={setFilters}
        />
      )}
    </div>
  );
}
```

### 4.2 useReducer 패턴

복잡한 상태 로직:

```tsx
// 폼 상태 관리
type FormState = {
  values: Record<string, string>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
};

type FormAction =
  | { type: 'SET_VALUE'; field: string; value: string }
  | { type: 'SET_ERROR'; field: string; error: string }
  | { type: 'TOUCH'; field: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_END' }
  | { type: 'RESET' };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_VALUE':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: '' },
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.error },
      };
    case 'TOUCH':
      return {
        ...state,
        touched: { ...state.touched, [action.field]: true },
      };
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true };
    case 'SUBMIT_END':
      return { ...state, isSubmitting: false };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

function RegistrationForm() {
  const [state, dispatch] = useReducer(formReducer, initialState);
  
  const handleChange = (field: string, value: string) => {
    dispatch({ type: 'SET_VALUE', field, value });
  };
  
  const handleSubmit = async () => {
    dispatch({ type: 'SUBMIT_START' });
    try {
      await submitForm(state.values);
    } finally {
      dispatch({ type: 'SUBMIT_END' });
    }
  };
  
  return <Form state={state} onChange={handleChange} onSubmit={handleSubmit} />;
}
```

### 4.3 Drawer/Modal 상태 패턴

```tsx
// 상세/등록 Drawer 상태
function CustomerPage() {
  // Drawer 상태
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"view" | "edit" | "create">("view");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // 편의 함수
  const openCreate = () => {
    setSelectedId(null);
    setDrawerMode("create");
    setDrawerOpen(true);
  };
  
  const openView = (id: string) => {
    setSelectedId(id);
    setDrawerMode("view");
    setDrawerOpen(true);
  };
  
  const openEdit = (id: string) => {
    setSelectedId(id);
    setDrawerMode("edit");
    setDrawerOpen(true);
  };
  
  const closeDrawer = () => {
    setDrawerOpen(false);
    // 딜레이 후 상태 초기화 (애니메이션 완료 대기)
    setTimeout(() => {
      setSelectedId(null);
      setDrawerMode("view");
    }, 300);
  };
  
  return (
    <>
      <CustomerTable onRowClick={openView} />
      <Button onClick={openCreate}>신규 등록</Button>
      
      <CustomerDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        customerId={selectedId}
        onClose={closeDrawer}
        onSwitchToEdit={() => setDrawerMode("edit")}
      />
    </>
  );
}
```

---

## 5. 상태 선택 가이드

### 5.1 결정 트리

```
새로운 상태가 필요함
         │
         ▼
┌─────────────────────┐
│ 다른 컴포넌트에서   │──No──▶ useState/useReducer
│ 이 상태가 필요한가? │
└─────────────────────┘
         │Yes
         ▼
┌─────────────────────┐
│ 서버에서 가져온    │──Yes──▶ SWR / ViewModel Hook
│ 데이터인가?        │
└─────────────────────┘
         │No
         ▼
┌─────────────────────┐
│ 앱 전역에서        │──Yes──▶ Context API
│ 필요한 상태인가?   │
└─────────────────────┘
         │No
         ▼
┌─────────────────────┐
│ 부모→자식으로      │──Yes──▶ Props Drilling
│ 전달 가능한가?     │
└─────────────────────┘
         │No
         ▼
    Context API
```

### 5.2 상태 유형별 권장 패턴

| 상태 유형 | 권장 패턴 | 예시 |
|-----------|-----------|------|
| 인증/권한 | Context | `RBACContext` |
| 데이터 범위 | Context | `ScopeContext` |
| 서버 데이터 | SWR / Hook | `useTerminals()` |
| 폼 입력 | useState | `const [name, setName] = useState("")` |
| 복잡한 폼 | useReducer | 다단계 폼, 유효성 검사 |
| 모달/Drawer | useState | `const [open, setOpen] = useState(false)` |
| 테이블 선택 | useState | `const [selected, setSelected] = useState<string[]>([])` |
| 필터/정렬 | useState + useMemo | 파생 데이터 계산 |

---

## 6. 안티패턴

### 6.1 피해야 할 패턴

```tsx
// ❌ BAD: useEffect에서 fetch
function BadComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);
  
  return <div>{data}</div>;
}

// ✅ GOOD: SWR 또는 ViewModel Hook 사용
function GoodComponent() {
  const { data } = useSWR('/api/data', fetcher);
  return <div>{data}</div>;
}
```

```tsx
// ❌ BAD: Props Drilling (3단계 이상)
function GrandParent() {
  const [user, setUser] = useState(null);
  return <Parent user={user} setUser={setUser} />;
}

function Parent({ user, setUser }) {
  return <Child user={user} setUser={setUser} />;
}

function Child({ user, setUser }) {
  return <GrandChild user={user} setUser={setUser} />;
}

// ✅ GOOD: Context 사용
function GoodGrandParent() {
  return (
    <UserProvider>
      <Parent />
    </UserProvider>
  );
}
```

```tsx
// ❌ BAD: Context에 자주 변경되는 값
const BadContext = createContext({
  mousePosition: { x: 0, y: 0 }, // 매 프레임 변경됨
  // ...
});

// ✅ GOOD: 자주 변경되는 값은 별도 Context 또는 ref 사용
const StableContext = createContext({ /* 안정적인 값 */ });
const FrequentContext = createContext({ /* 자주 변경되는 값 */ });
```

---

## 7. 테스트 가이드

### 7.1 Context 테스트

```tsx
// __tests__/rbac-context.test.tsx
import { renderHook } from '@testing-library/react';
import { RBACProvider, useRBAC } from '@/contexts/rbac-context';

describe('RBACContext', () => {
  it('should provide can() function', () => {
    const wrapper = ({ children }) => (
      <RBACProvider>{children}</RBACProvider>
    );
    
    const { result } = renderHook(() => useRBAC(), { wrapper });
    
    expect(result.current.can).toBeDefined();
    expect(typeof result.current.can).toBe('function');
  });
});
```

### 7.2 ViewModel Hook 테스트

```tsx
// __tests__/useTerminals.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useTerminals } from '@/hooks/useTerminals';

describe('useTerminals', () => {
  it('should return enriched terminals', async () => {
    const { result } = renderHook(() => useTerminals());
    
    // 초기 로딩 상태
    expect(result.current.isLoading).toBe(true);
    
    // 데이터 로드 완료 대기
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.data.length).toBeGreaterThan(0);
    expect(result.current.data[0]).toHaveProperty('overallState');
  });
});
```

---

## 8. 마이그레이션 체크리스트

### Mock → API 전환 시

- [ ] ViewModel Hook을 SWR 기반으로 변경
- [ ] fetcher 함수에 인증 헤더 추가
- [ ] 에러 처리 로직 추가
- [ ] 로딩/에러 UI 확인
- [ ] refreshInterval 설정 (필요한 경우)
- [ ] mutate 호출로 낙관적 업데이트 구현
- [ ] 테스트 코드 업데이트

---

## 9. 파일 구조

```
/
├── contexts/                    # Global Context
│   ├── rbac-context.tsx        # 권한 관리
│   ├── scope-context.tsx       # Scope 관리
│   ├── emergency-context.tsx   # 비상 모드
│   └── rms-device-context.tsx  # RMS 장치 상태
│
├── hooks/                       # ViewModel Hooks
│   ├── useTerminals.ts         # 터미널 데이터
│   ├── useOperationTasks.ts    # 운영 작업
│   └── use-mobile.ts           # 반응형 감지
│
└── lib/
    └── swr-config.ts           # SWR 전역 설정 (예정)
```

---

**문서 끝**
