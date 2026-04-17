# Drawer/Panel 설계 패턴

> E-paper BIS Admin Portal의 Drawer와 Panel 컴포넌트 설계 패턴 및 레이아웃 규칙

---

## 1. 개요

### 1.1 Drawer vs Panel 구분

| 구분 | Drawer | Panel |
|------|--------|-------|
| **위치** | 화면 우측에서 슬라이드 인 | 페이지 내 인라인 또는 사이드 영역 |
| **오버레이** | 반투명 백드롭 (black/20 ~ black/50) | 없음 |
| **용도** | 등록/수정/상세 조회 | 목록 필터, 빠른 액션, 상세 정보 |
| **닫기 방식** | X 버튼만 (ESC/외부 클릭 차단) | 토글/탭 전환 |
| **z-index** | z-50 | z-0 ~ z-10 |

### 1.2 컴포넌트 계층

```
┌─────────────────────────────────────────────────────────────────┐
│ Drawer Components (24개)                                        │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│ │ Registration    │  │ Detail          │  │ Action          │  │
│ │ Drawers (12개)  │  │ Drawers (8개)   │  │ Drawers (4개)   │  │
│ └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Panel Components (10개)                                         │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│ │ Detail Panels   │  │ Filter Panels   │  │ Action Panels   │  │
│ │ (5개)           │  │ (2개)           │  │ (3개)           │  │
│ └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Drawer 설계 패턴

### 2.1 기본 구조

```
┌──────────────────────────────────────┐
│ ┌──────────────────────────────────┐ │
│ │ HEADER (Sticky)                  │ │  ← 64px 고정
│ │ - 제목, 부제목, 배지             │ │
│ │ - X 닫기 버튼 (우상단)           │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ │ CONTENT (Scrollable)             │ │  ← flex-1, overflow-y-auto
│ │ - 섹션별 구분                    │ │
│ │ - 폼 필드 또는 상세 정보         │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ FOOTER (Sticky, Optional)        │ │  ← 64px 고정
│ │ - 취소/저장 버튼                 │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
       │
       └── 520px 고정 너비
```

### 2.2 너비 규격

| 용도 | 너비 | 클래스 |
|------|------|--------|
| **표준** | 520px | `w-[520px]` |
| **확장** | 640px | `w-[640px]` (미리보기 포함 시) |
| **최소** | 400px | `w-[400px]` (단순 폼) |

### 2.3 Drawer 종류별 패턴

#### A. Registration Drawer (등록용)

```tsx
// 파일 위치: components/{module}/{entity}-registration-drawer.tsx

interface RegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: FormData) => void;
}

// 구조
<Drawer>
  <Header>
    <Title>{엔티티}명 등록</Title>
    <CloseButton />
  </Header>
  
  <Content className="p-6 space-y-6">
    <Section title="기본 정보">
      <FormFields />
    </Section>
    <Section title="상세 설정">
      <FormFields />
    </Section>
  </Content>
  
  <Footer className="border-t px-6 py-4">
    <Button variant="outline" onClick={onClose}>취소</Button>
    <Button onClick={handleSubmit} disabled={!isValid}>등록</Button>
  </Footer>
</Drawer>
```

**등록 Drawer 목록 (12개):**
| 컴포넌트 | 경로 | 용도 |
|----------|------|------|
| `ContentRegistrationDrawer` | `/components/cms/` | CMS 콘텐츠 등록 |
| `DeploymentRegistrationDrawer` | `/components/cms/` | CMS 배포 등록 |
| `TemplateRegistrationDrawer` | `/components/cms/` | CMS 템플릿 등록 |
| `CustomerRegistrationDrawer` | `/components/registry/` | 고객사 등록 |
| `PartnerRegistrationDrawer` | `/components/registry/` | 파트너 등록 |
| `StopRegistrationDrawer` | `/components/registry/` | 정류장 등록 |
| `BisDeviceRegistrationDrawer` | `/components/registry/` | BIS 단말 등록 |
| `BisGroupRegistrationDrawer` | `/components/registry/` | BIS 그룹 등록 |
| `OperationalRelationshipDrawer` | `/components/registry/` | 운영 관계 등록 |
| `IncidentDrawer` | `/components/` | 장애 수동 등록 |
| `WorkOrderDrawer` | `/components/` | 작업 지시 등록 |
| `OtaDrawer` | `/components/` | OTA 펌웨어 등록 |

#### B. Detail Drawer (상세 조회용)

```tsx
// 파일 위치: components/{module}/{entity}-detail-drawer.tsx

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string | null;
  onEdit?: () => void;  // 수정 모드 전환
}

// 구조
<Drawer>
  <Header>
    <Title>{엔티티} 상세</Title>
    <Badges status={entity.status} />
    <EditButton onClick={onEdit} />  {/* 권한 있을 때만 */}
    <CloseButton />
  </Header>
  
  <Content className="p-6 space-y-6">
    <InfoSection title="기본 정보">
      <InfoRow label="이름" value={entity.name} />
      <InfoRow label="상태" value={<StatusBadge />} />
    </InfoSection>
    
    <InfoSection title="연관 데이터">
      <LinkedList items={entity.linkedItems} />
    </InfoSection>
    
    <InfoSection title="이력">
      <Timeline events={entity.history} />
    </InfoSection>
  </Content>
  
  {/* Detail 모드에서는 Footer 없음 */}
</Drawer>
```

**상세 Drawer 목록 (8개):**
| 컴포넌트 | 경로 | 용도 |
|----------|------|------|
| `TemplateDetailDrawer` | `/components/cms/` | 템플릿 상세 |
| `DeploymentDrawer` | `/components/` | 배포 상세 |
| `DeviceDrawer` | `/components/` | 단말 상세 |
| `StopDrawer` | `/components/` | 정류장 상세 |
| `BatteryDetailDrawer` | `/components/rms/battery/` | 배터리 상세 |
| `BisDeviceDrawer` | `/components/rms/monitoring/` | BIS 단말 상세 |
| `CommandDetailDrawer` | `/components/rms/monitoring/` | 명령 상세 |
| `DrilldownDrawer` | `/components/rms/diagnosis/` | 진단 드릴다운 |

#### C. RegistryDrawer (범용 Base Component)

```tsx
// 파일: components/registry/registry-drawer.tsx

export type DrawerMode = "read" | "edit" | "create" | "closed";

interface RegistryDrawerProps {
  mode: DrawerMode;
  onClose: () => void;
  
  // Header
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  badges?: DrawerHeaderBadge[];
  
  // Content
  children: React.ReactNode;
  
  // Footer (edit/create 모드)
  showFooter?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  headerActions?: React.ReactNode;
}
```

---

## 3. Panel 설계 패턴

### 3.1 기본 구조

```
┌─────────────────────────────────────────────────┐
│ PANEL                                           │
│ ┌─────────────────────────────────────────────┐ │
│ │ Header (Optional)                           │ │
│ │ - 제목, 접기/펼치기 버튼                    │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Content                                     │ │
│ │ - 필터, 액션 버튼, 정보 표시                │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 3.2 Panel 종류별 패턴

#### A. Detail Panel (상세 정보)

```tsx
// 인라인 상세 정보 패널 (테이블 행 확장 등)

interface DetailPanelProps {
  data: EntityData;
  onAction?: (action: string) => void;
}

<Panel className="border rounded-lg p-4 bg-muted/30">
  <PanelHeader>
    <Title>상세 정보</Title>
    <ActionButtons />
  </PanelHeader>
  <PanelContent className="grid grid-cols-2 gap-4">
    <InfoField label="필드1" value={data.field1} />
    <InfoField label="필드2" value={data.field2} />
  </PanelContent>
</Panel>
```

**상세 Panel 목록 (5개):**
| 컴포넌트 | 경로 | 용도 |
|----------|------|------|
| `FaultDetailPanel` | `/components/rms/alerts/` | 장애 상세 |
| `MaintenanceDetailPanel` | `/components/rms/maintenance/` | 유지보수 상세 |
| `MaintenanceEntryPanel` | `/components/rms/maintenance/` | 유지보수 입력 |
| `ApprovalDetailPanel` | `/components/rms/maintenance/` | 승인 상세 |
| `ContractPanel` | `/components/rms/contract/` | 계약 정보 |

#### B. Filter Panel (필터)

```tsx
// 사이드 필터 패널

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

<Panel className="w-64 border-r p-4 space-y-4">
  <PanelHeader>
    <Title>필터</Title>
    <ResetButton onClick={onReset} />
  </PanelHeader>
  <FilterGroup label="상태">
    <CheckboxList items={statusOptions} />
  </FilterGroup>
  <FilterGroup label="지역">
    <SelectDropdown options={regionOptions} />
  </FilterGroup>
</Panel>
```

**필터 Panel 목록 (2개):**
| 컴포넌트 | 경로 | 용도 |
|----------|------|------|
| `MapFilterPanel` | `/components/rms/monitoring/` | 지도 필터 |
| `DeviceListPanel` | `/components/rms/monitoring/` | 단말 목록 필터 |

#### C. Action Panel (빠른 액션)

```tsx
// 빠른 액션 패널

interface ActionPanelProps {
  selectedItems: string[];
  onAction: (action: ActionType) => void;
}

<Panel className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-3">
  <div className="flex items-center gap-2">
    <span className="text-sm">{selectedItems.length}개 선택</span>
    <Separator orientation="vertical" />
    <Button size="sm" onClick={() => onAction('restart')}>재시작</Button>
    <Button size="sm" onClick={() => onAction('update')}>업데이트</Button>
  </div>
</Panel>
```

**액션 Panel 목록 (3개):**
| 컴포넌트 | 경로 | 용도 |
|----------|------|------|
| `QuickActionsPanel` | `/components/rms/operator/` | 빠른 액션 |
| `DeviceAlertPanel` | `/components/rms/monitoring/` | 단말 알림 |
| `ManualIncidentPanel` | `/components/rms/alerts/` | 수동 장애 등록 |

---

## 4. 레이아웃 규칙

### 4.1 Drawer Header 규칙

```tsx
// 높이: 64px (py-4 + 내용)
// 패딩: px-6 py-4

<div className="flex items-start gap-3 px-6 py-4 border-b bg-background shrink-0">
  {/* 좌측: 아이콘 + 제목 + 배지 */}
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
      <h2 className="text-base font-semibold truncate">{title}</h2>
    </div>
    {subtitle && (
      <p className="text-xs text-muted-foreground font-mono mt-0.5 ml-7">
        {subtitle}
      </p>
    )}
    {badges && (
      <div className="flex gap-1.5 mt-1.5 ml-7">
        {badges.map(b => <Badge key={b.label} variant={b.variant} />)}
      </div>
    )}
  </div>
  
  {/* 우측: 액션 버튼 + 닫기 */}
  <div className="flex items-center gap-2 shrink-0">
    {headerActions}
    <Button variant="ghost" size="icon" onClick={onClose}>
      <X className="h-4 w-4" />
    </Button>
  </div>
</div>
```

### 4.2 Drawer Content 규칙

```tsx
// 스크롤 영역
// 패딩: p-6
// 섹션 간격: space-y-6

<div className="flex-1 overflow-y-auto p-6 space-y-6">
  {/* 섹션 헤더 */}
  <div>
    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
      기본 정보
    </h4>
    
    {/* 폼 필드 그룹 */}
    <div className="space-y-4">
      <FormField />
      <FormField />
    </div>
  </div>
  
  {/* 구분선 (선택적) */}
  <Separator />
  
  {/* 다음 섹션 */}
  <div>
    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
      상세 설정
    </h4>
    <div className="space-y-4">
      <FormField />
    </div>
  </div>
</div>
```

### 4.3 Drawer Footer 규칙

```tsx
// 높이: 64px (py-4 + 버튼)
// 패딩: px-6 py-4
// 버튼 정렬: 우측 정렬

<div className="flex justify-end gap-2 px-6 py-4 border-t bg-background shrink-0">
  <Button variant="outline" onClick={onCancel}>
    취소
  </Button>
  <Button onClick={onSave} disabled={saveDisabled}>
    {saveLabel || "저장"}
  </Button>
</div>
```

### 4.4 폼 필드 레이아웃

```tsx
// 단일 컬럼 (기본)
<div className="space-y-4">
  <div>
    <Label className="text-sm font-medium mb-2 block">
      필드명 <span className="text-destructive">*</span>
    </Label>
    <Input placeholder="입력하세요" />
  </div>
</div>

// 2컬럼 레이아웃
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label>필드 A</Label>
    <Input />
  </div>
  <div>
    <Label>필드 B</Label>
    <Input />
  </div>
</div>

// 인라인 라디오/체크박스
<div className="space-y-2">
  <Label>옵션 선택</Label>
  <RadioGroup className="flex gap-4">
    <RadioGroupItem value="a" /> 옵션 A
    <RadioGroupItem value="b" /> 옵션 B
  </RadioGroup>
</div>
```

---

## 5. 동작 규칙

### 5.1 열기/닫기

```tsx
// 열기: isOpen 또는 mode !== "closed"
// 닫기: X 버튼 클릭만 허용

// ESC 키 차단
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  
  if (isOpen) {
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }
}, [isOpen]);

// 외부 클릭 차단
<div 
  className="fixed inset-0 z-40 bg-black/20"
  onClick={(e) => e.stopPropagation()}  // 클릭 이벤트 차단
  aria-hidden="true"
/>
```

### 5.2 애니메이션

```tsx
// 슬라이드 인/아웃 (우측)
<div
  className={cn(
    "fixed top-0 right-0 z-50 h-full transition-transform duration-200 ease-out",
    isOpen ? "translate-x-0" : "translate-x-full"
  )}
>
```

### 5.3 포커스 관리

```tsx
// Drawer 열릴 때 첫 번째 입력 필드로 포커스
useEffect(() => {
  if (isOpen) {
    const firstInput = drawerRef.current?.querySelector('input, textarea, select');
    if (firstInput) {
      (firstInput as HTMLElement).focus();
    }
  }
}, [isOpen]);
```

### 5.4 폼 상태 관리

```tsx
// 임시 저장 (Draft)
const handleTempSave = () => {
  const draft = { ...formData, savedAt: new Date().toISOString() };
  localStorage.setItem(`${entityType}_draft`, JSON.stringify(draft));
};

// 폼 초기화
const resetForm = () => {
  setFormData(initialState);
  localStorage.removeItem(`${entityType}_draft`);
};

// 닫기 시 폼 초기화
const handleClose = () => {
  resetForm();
  onClose();
};
```

---

## 6. 접근성 가이드

### 6.1 ARIA 속성

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-label={title}
  aria-describedby="drawer-description"
>
  <div id="drawer-description" className="sr-only">
    {description}
  </div>
</div>
```

### 6.2 키보드 네비게이션

| 키 | 동작 |
|----|------|
| Tab | 다음 포커스 가능 요소로 이동 |
| Shift+Tab | 이전 포커스 가능 요소로 이동 |
| Enter | 폼 제출 (마지막 필드에서) |
| ESC | 차단됨 (X 버튼으로만 닫기) |

### 6.3 닫기 버튼 최소 크기

```tsx
// 최소 44x44px 터치 영역 (WCAG 2.1)
<Button 
  variant="ghost" 
  size="icon"
  className="h-11 w-11"  // 44px
>
  <X className="h-4 w-4" />
  <span className="sr-only">닫기</span>
</Button>
```

---

## 7. 컴포넌트 체크리스트

### 7.1 새 Drawer 생성 시

- [ ] 너비 520px 준수 (`w-[520px]`)
- [ ] Header/Content/Footer 3영역 구조
- [ ] ESC 키 닫기 차단
- [ ] 외부 클릭 닫기 차단
- [ ] X 버튼 44x44px 터치 영역
- [ ] `role="dialog"`, `aria-modal="true"` 설정
- [ ] 폼 초기화 로직 구현
- [ ] 필수 필드 `*` 표시
- [ ] 저장 버튼 비활성화 조건 구현

### 7.2 코드 리뷰 체크리스트

```
□ Props 인터페이스 정의 완료
□ isOpen/onClose 패턴 준수
□ 섹션 구분 (h4 + space-y-4)
□ 버튼 variant 적절 (primary/outline/ghost)
□ 로딩 상태 처리
□ 에러 상태 처리
□ 권한 체크 (RBAC)
```

---

## 8. 파일 구조 규칙

```
components/
├── ui/
│   ├── sheet.tsx         # Base Sheet (Radix)
│   └── drawer.tsx        # Base Drawer (Vaul)
│
├── cms/
│   ├── content-registration-drawer.tsx
│   ├── deployment-registration-drawer.tsx
│   ├── template-registration-drawer.tsx
│   └── template-detail-drawer.tsx
│
├── registry/
│   ├── registry-drawer.tsx              # Base Component
│   ├── customer-registration-drawer.tsx
│   ├── partner-registration-drawer.tsx
│   ├── stop-registration-drawer.tsx
│   ├── bis-device-registration-drawer.tsx
│   ├── bis-group-registration-drawer.tsx
│   └── operational-relationship-drawer.tsx
│
├── rms/
│   ├── alerts/
│   │   ├── fault-detail-panel.tsx
│   │   └── manual-incident-panel.tsx
│   ├── battery/
│   │   └── battery-detail-drawer.tsx
│   ├── maintenance/
│   │   ├── maintenance-detail-panel.tsx
│   │   ├── maintenance-entry-panel.tsx
│   │   └── approval-detail-panel.tsx
│   └── monitoring/
│       ├── bis-device-drawer.tsx
│       ├── device-drawer-content.tsx
│       ├── command-detail-drawer.tsx
│       ├── device-alert-panel.tsx
│       ├── device-list-panel.tsx
│       └── map-filter-panel.tsx
│
├── device-drawer.tsx
├── stop-drawer.tsx
├── incident-drawer.tsx
├── work-order-drawer.tsx
├── deployment-drawer.tsx
└── ota-drawer.tsx
```

---

## 9. 관련 문서

- [디자인 시스템 가이드](/docs/DESIGN_SYSTEM_GUIDE.md)
- [데이터 흐름 아키텍처](/docs/DATA_FLOW_ARCHITECTURE.md)
- [RBAC 설계 명세서](/docs/RBAC_SPECIFICATION.md)

---

*최종 업데이트: 2025년 3월*
