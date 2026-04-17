# E-Paper BIS Admin Portal - 디자인 시스템 가이드

> **대상**: 디자이너, 프론트엔드 개발자  
> **버전**: 1.0.0  
> **최종 수정**: 2025-03-22

---

## 1. 개요

E-Paper BIS Admin Portal은 shadcn/ui 기반의 일관된 디자인 시스템을 사용합니다. 이 문서는 색상 토큰, 상태 색상, 타이포그래피, 그리고 핵심 컴포넌트에 대한 가이드를 제공합니다.

### 1.1 디자인 원칙

| 원칙 | 설명 |
|------|------|
| **일관성** | 동일한 컴포넌트는 동일한 스타일을 유지 |
| **접근성** | WCAG 2.1 AA 기준 준수 (대비율 4.5:1 이상) |
| **반응성** | 모바일-퍼스트 설계, 모든 해상도 지원 |
| **명확성** | 상태 변화는 색상과 아이콘으로 명확히 표현 |

---

## 2. 색상 시스템

### 2.1 기본 색상 토큰

색상은 CSS 변수로 정의되며, OKLCH 색상 공간을 사용합니다.

#### 라이트 모드 (Light Mode)

| 토큰 | OKLCH 값 | 용도 |
|------|----------|------|
| `--background` | `oklch(1 0 0)` | 페이지 배경 |
| `--foreground` | `oklch(0.145 0 0)` | 기본 텍스트 |
| `--card` | `oklch(1 0 0)` | 카드 배경 |
| `--card-foreground` | `oklch(0.145 0 0)` | 카드 텍스트 |
| `--primary` | `oklch(0.205 0 0)` | 주요 액션 버튼 |
| `--primary-foreground` | `oklch(0.985 0 0)` | 주요 버튼 텍스트 |
| `--secondary` | `oklch(0.97 0 0)` | 보조 버튼 배경 |
| `--secondary-foreground` | `oklch(0.205 0 0)` | 보조 버튼 텍스트 |
| `--muted` | `oklch(0.97 0 0)` | 비활성 배경 |
| `--muted-foreground` | `oklch(0.556 0 0)` | 비활성 텍스트 |
| `--accent` | `oklch(0.97 0 0)` | 강조 배경 |
| `--accent-foreground` | `oklch(0.205 0 0)` | 강조 텍스트 |
| `--destructive` | `oklch(0.577 0.245 27.325)` | 위험/삭제 액션 |
| `--border` | `oklch(0.922 0 0)` | 테두리 |
| `--input` | `oklch(0.922 0 0)` | 입력 필드 테두리 |
| `--ring` | `oklch(0.708 0 0)` | 포커스 링 |

#### 다크 모드 (Dark Mode)

| 토큰 | OKLCH 값 | 용도 |
|------|----------|------|
| `--background` | `oklch(0.145 0 0)` | 페이지 배경 |
| `--foreground` | `oklch(0.985 0 0)` | 기본 텍스트 |
| `--card` | `oklch(0.145 0 0)` | 카드 배경 |
| `--card-foreground` | `oklch(0.985 0 0)` | 카드 텍스트 |
| `--primary` | `oklch(0.985 0 0)` | 주요 액션 버튼 |
| `--primary-foreground` | `oklch(0.205 0 0)` | 주요 버튼 텍스트 |
| `--secondary` | `oklch(0.269 0 0)` | 보조 버튼 배경 |
| `--muted` | `oklch(0.269 0 0)` | 비활성 배경 |
| `--muted-foreground` | `oklch(0.708 0 0)` | 비활성 텍스트 |
| `--border` | `oklch(0.269 0 0)` | 테두리 |

#### 사이드바 색상

| 토큰 | 라이트 모드 | 다크 모드 |
|------|------------|----------|
| `--sidebar` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` |
| `--sidebar-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--sidebar-primary` | `oklch(0.205 0 0)` | `oklch(0.488 0.243 264.376)` |
| `--sidebar-accent` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| `--sidebar-border` | `oklch(0.922 0 0)` | `oklch(0.269 0 0)` |

### 2.2 차트 색상 (5종)

데이터 시각화를 위한 차트 전용 색상입니다.

| 토큰 | 라이트 모드 | 다크 모드 | 용도 |
|------|------------|----------|------|
| `--chart-1` | `oklch(0.646 0.222 41.116)` | `oklch(0.488 0.243 264.376)` | 주요 데이터 |
| `--chart-2` | `oklch(0.6 0.118 184.704)` | `oklch(0.696 0.17 162.48)` | 보조 데이터 |
| `--chart-3` | `oklch(0.398 0.07 227.392)` | `oklch(0.769 0.188 70.08)` | 3차 데이터 |
| `--chart-4` | `oklch(0.828 0.189 84.429)` | `oklch(0.627 0.265 303.9)` | 4차 데이터 |
| `--chart-5` | `oklch(0.769 0.188 70.08)` | `oklch(0.645 0.246 16.439)` | 5차 데이터 |

---

## 3. 상태 색상 (5종)

BIS 단말 및 시스템 상태를 표현하는 전용 색상입니다.

### 3.1 상태 색상 정의

| 상태 | CSS 변수 | 라이트 모드 | 다크 모드 | Tailwind 클래스 |
|------|----------|------------|----------|----------------|
| **정상 (Normal)** | `--state-normal` | `#22c55e` | `#4ade80` | `text-state-normal`, `bg-state-normal` |
| **성능저하 (Degraded)** | `--state-degraded` | `#eab308` | `#facc15` | `text-state-degraded`, `bg-state-degraded` |
| **심각 (Critical)** | `--state-critical` | `#ef4444` | `#f87171` | `text-state-critical`, `bg-state-critical` |
| **오프라인 (Offline)** | `--state-offline` | `#6b7280` | `#9ca3af` | `text-state-offline`, `bg-state-offline` |
| **비상 (Emergency)** | `--state-emergency` | `#e11d48` | `#fb7185` | `text-state-emergency`, `bg-state-emergency` |

### 3.2 상태별 사용 가이드

```
┌─────────────────────────────────────────────────────────────────┐
│                        상태 색상 스펙트럼                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  정상        성능저하       심각         오프라인      비상       │
│  ████        ████          ████         ████         ████       │
│  #22c55e    #eab308       #ef4444      #6b7280      #e11d48    │
│                                                                 │
│  ▲ 운영 양호                                    ▲ 즉시 대응 필요  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 상태별 적용 시나리오

| 상태 | 단말 상태 | 배터리 상태 | 통신 상태 | 장애 레벨 |
|------|----------|------------|----------|----------|
| **정상** | 정상 운영 중 | 50% 이상 | 연결됨 | - |
| **성능저하** | 일부 기능 저하 | 20~50% | 지연 발생 | Warning |
| **심각** | 기능 장애 발생 | 20% 미만 | 불안정 | Error |
| **오프라인** | 전원 꺼짐 | 방전 | 연결 끊김 | - |
| **비상** | 비상 모드 | - | - | Critical |

### 3.3 상태 색상 사용 예시

```tsx
// 상태 배지
<Badge className="bg-state-normal text-white">정상</Badge>
<Badge className="bg-state-degraded text-black">성능저하</Badge>
<Badge className="bg-state-critical text-white">심각</Badge>
<Badge className="bg-state-offline text-white">오프라인</Badge>
<Badge className="bg-state-emergency text-white">비상</Badge>

// 상태 아이콘 색상
<Circle className="h-3 w-3 fill-state-normal text-state-normal" />
<Circle className="h-3 w-3 fill-state-critical text-state-critical" />

// 배경 투명도 적용
<div className="bg-state-normal/10 border-state-normal">
  정상 상태 카드
</div>
```

---

## 4. 타이포그래피

### 4.1 폰트 패밀리

| 용도 | 폰트 | CSS 변수 | Tailwind 클래스 |
|------|------|----------|----------------|
| **본문** | Noto Sans KR | `--font-sans` | `font-sans` |
| **코드** | Geist Mono | `--font-mono` | `font-mono` |

### 4.2 폰트 사이즈 스케일

Tailwind CSS 기본 스케일을 사용합니다.

| 클래스 | 크기 | Line Height | 용도 |
|--------|------|-------------|------|
| `text-xs` | 12px | 16px | 레이블, 힌트 텍스트 |
| `text-sm` | 14px | 20px | 본문, 버튼, 입력 필드 |
| `text-base` | 16px | 24px | 강조 본문 |
| `text-lg` | 18px | 28px | 서브타이틀 |
| `text-xl` | 20px | 28px | 섹션 제목 |
| `text-2xl` | 24px | 32px | 페이지 제목 |
| `text-3xl` | 30px | 36px | 대시보드 헤더 |
| `text-4xl` | 36px | 40px | 대형 숫자 |

### 4.3 폰트 굵기

| 클래스 | 굵기 | 용도 |
|--------|------|------|
| `font-normal` | 400 | 본문 |
| `font-medium` | 500 | 버튼, 레이블 |
| `font-semibold` | 600 | 제목, 강조 |
| `font-bold` | 700 | 헤딩, 중요 숫자 |

### 4.4 타이포그래피 계층 구조

```
┌─────────────────────────────────────────────────────────────┐
│ Page Title (text-2xl font-semibold)                         │
├─────────────────────────────────────────────────────────────┤
│ Section Title (text-lg font-semibold)                       │
│ ─────────────────────────────────────────                   │
│ Card Title (text-base font-medium)                          │
│                                                             │
│ Body text (text-sm font-normal)                             │
│ Secondary text (text-sm text-muted-foreground)              │
│                                                             │
│ Label (text-xs font-medium)                                 │
│ Hint (text-xs text-muted-foreground)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 레이아웃 시스템

### 5.1 간격 (Spacing)

Tailwind CSS 4px 단위 스케일을 사용합니다.

| 토큰 | 크기 | 용도 |
|------|------|------|
| `gap-1` / `p-1` | 4px | 아이콘-텍스트 간격 |
| `gap-2` / `p-2` | 8px | 인라인 요소 간격 |
| `gap-3` / `p-3` | 12px | 작은 컴포넌트 내부 패딩 |
| `gap-4` / `p-4` | 16px | 카드 내부 패딩 |
| `gap-6` / `p-6` | 24px | 섹션 간격 |
| `gap-8` / `p-8` | 32px | 큰 섹션 간격 |

### 5.2 모서리 둥글기 (Border Radius)

| 토큰 | 크기 | Tailwind 클래스 | 용도 |
|------|------|----------------|------|
| `--radius-sm` | 0.375rem (6px) | `rounded-sm` | 작은 요소 |
| `--radius-md` | 0.5rem (8px) | `rounded-md` | 버튼, 입력 필드 |
| `--radius-lg` | 0.625rem (10px) | `rounded-lg` | 카드 |
| `--radius-xl` | 1rem (16px) | `rounded-xl` | 대형 카드 |

---

## 6. 핵심 컴포넌트

### 6.1 Button

```tsx
import { Button } from "@/components/ui/button"

// Variants
<Button variant="default">기본</Button>
<Button variant="secondary">보조</Button>
<Button variant="outline">아웃라인</Button>
<Button variant="ghost">고스트</Button>
<Button variant="destructive">삭제</Button>
<Button variant="link">링크</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Plus /></Button>
```

#### Button Variants 스펙

| Variant | 배경 | 텍스트 | 용도 |
|---------|------|--------|------|
| `default` | `bg-primary` | `text-primary-foreground` | 주요 액션 |
| `secondary` | `bg-secondary` | `text-secondary-foreground` | 보조 액션 |
| `outline` | `bg-background` + border | `text-foreground` | 취소, 닫기 |
| `ghost` | transparent | `text-foreground` | 아이콘 버튼 |
| `destructive` | `bg-destructive` | `text-white` | 삭제, 경고 |
| `link` | transparent | `text-primary` | 텍스트 링크 |

### 6.2 Badge

```tsx
import { Badge } from "@/components/ui/badge"

// Variants
<Badge variant="default">기본</Badge>
<Badge variant="secondary">보조</Badge>
<Badge variant="outline">아웃라인</Badge>
<Badge variant="destructive">경고</Badge>

// 상태 색상 적용
<Badge className="bg-state-normal text-white border-0">정상</Badge>
<Badge className="bg-state-critical text-white border-0">심각</Badge>
```

### 6.3 Card

```tsx
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  CardAction 
} from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>카드 제목</CardTitle>
    <CardDescription>카드 설명</CardDescription>
    <CardAction>
      <Button size="sm">액션</Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    카드 내용
  </CardContent>
  <CardFooter>
    푸터 영역
  </CardFooter>
</Card>
```

### 6.4 Input & Field

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"

// 기본 입력
<div className="space-y-1.5">
  <Label htmlFor="email">이메일</Label>
  <Input id="email" type="email" placeholder="이메일 입력" />
</div>

// Field 컴포넌트 사용 (권장)
<FieldGroup>
  <Field>
    <FieldLabel>이름</FieldLabel>
    <Input placeholder="이름 입력" />
  </Field>
  <Field>
    <FieldLabel>이메일</FieldLabel>
    <Input type="email" placeholder="이메일 입력" />
  </Field>
</FieldGroup>
```

### 6.5 Select

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="선택하세요" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="seoul">서울</SelectItem>
    <SelectItem value="gyeonggi">경기</SelectItem>
    <SelectItem value="busan">부산</SelectItem>
  </SelectContent>
</Select>
```

### 6.6 Table

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>이름</TableHead>
      <TableHead>상태</TableHead>
      <TableHead className="text-right">작업</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>홍길동</TableCell>
      <TableCell>
        <Badge className="bg-state-normal text-white">정상</Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button size="sm" variant="ghost">편집</Button>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### 6.7 Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>다이얼로그 열기</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>제목</DialogTitle>
      <DialogDescription>
        다이얼로그 설명 텍스트
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      내용
    </div>
    <DialogFooter>
      <Button variant="outline">취소</Button>
      <Button>확인</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 6.8 Tabs

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="overview" className="w-full">
  <TabsList>
    <TabsTrigger value="overview">개요</TabsTrigger>
    <TabsTrigger value="details">상세</TabsTrigger>
    <TabsTrigger value="settings">설정</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">개요 내용</TabsContent>
  <TabsContent value="details">상세 내용</TabsContent>
  <TabsContent value="settings">설정 내용</TabsContent>
</Tabs>
```

---

## 7. 아이콘 시스템

### 7.1 아이콘 라이브러리

Lucide React를 사용합니다.

```tsx
import { 
  Monitor, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Settings,
  User,
  // ...
} from "lucide-react"
```

### 7.2 아이콘 크기

| 용도 | 클래스 | 크기 |
|------|--------|------|
| 인라인 텍스트 | `h-3 w-3` | 12px |
| 버튼 내부 | `h-4 w-4` | 16px |
| 독립 아이콘 | `h-5 w-5` | 20px |
| 대형 아이콘 | `h-6 w-6` | 24px |
| 히어로 아이콘 | `h-8 w-8` 이상 | 32px+ |

### 7.3 상태별 아이콘 매핑

| 상태 | 아이콘 | 색상 |
|------|--------|------|
| 정상 | `CheckCircle` | `text-state-normal` |
| 성능저하 | `AlertTriangle` | `text-state-degraded` |
| 심각 | `XCircle` | `text-state-critical` |
| 오프라인 | `PowerOff` | `text-state-offline` |
| 비상 | `Siren` | `text-state-emergency` |

---

## 8. 반응형 디자인

### 8.1 브레이크포인트

| 접두사 | 최소 너비 | 용도 |
|--------|----------|------|
| `sm:` | 640px | 모바일 랜드스케이프 |
| `md:` | 768px | 태블릿 |
| `lg:` | 1024px | 작은 데스크탑 |
| `xl:` | 1280px | 데스크탑 |
| `2xl:` | 1536px | 대형 모니터 |

### 8.2 반응형 패턴

```tsx
// 그리드 레이아웃
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* 카드들 */}
</div>

// 숨김/표시
<div className="hidden md:block">데스크탑에서만 보임</div>
<div className="md:hidden">모바일에서만 보임</div>

// 사이즈 변경
<Button size="sm" className="md:size-default">
  반응형 버튼
</Button>
```

---

## 9. 접근성 가이드라인

### 9.1 색상 대비

- 텍스트: 최소 4.5:1 대비율 (AA 기준)
- 대형 텍스트 (18px+): 최소 3:1 대비율
- UI 컴포넌트: 최소 3:1 대비율

### 9.2 포커스 표시

```tsx
// 기본 포커스 링
<Button className="focus-visible:ring-2 focus-visible:ring-ring">
  포커스 버튼
</Button>

// 커스텀 포커스
<Input className="focus-visible:ring-2 focus-visible:ring-primary" />
```

### 9.3 스크린 리더

```tsx
// 숨김 텍스트
<span className="sr-only">스크린 리더 전용 텍스트</span>

// 아이콘 버튼 접근성
<Button size="icon" aria-label="설정 열기">
  <Settings className="h-4 w-4" />
</Button>
```

---

## 10. 다크 모드

### 10.1 토글 방법

```tsx
// HTML 클래스 토글
document.documentElement.classList.toggle('dark')
```

### 10.2 다크 모드 스타일링

```tsx
// 조건부 스타일
<div className="bg-white dark:bg-gray-900">
  라이트/다크 모드 지원
</div>

// 상태 색상은 자동 전환
<Badge className="bg-state-normal">
  자동으로 다크 모드 색상 적용
</Badge>
```

---

## 11. 컴포넌트 목록

### 11.1 기본 UI 컴포넌트 (55개)

| 카테고리 | 컴포넌트 |
|----------|----------|
| **레이아웃** | Card, Sidebar, Separator, Resizable, AspectRatio |
| **내비게이션** | Tabs, Breadcrumb, NavigationMenu, Pagination, Menubar |
| **입력** | Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider |
| **피드백** | Alert, Badge, Progress, Spinner, Skeleton, Toast, Sonner |
| **오버레이** | Dialog, Drawer, Sheet, Popover, Tooltip, HoverCard, ContextMenu, DropdownMenu |
| **데이터 표시** | Table, Avatar, Calendar, Carousel, Chart |
| **폼** | Form, Field, FieldGroup, InputGroup, Label |
| **기타** | Accordion, Collapsible, Command, ScrollArea, ToggleGroup, Empty, Kbd |

### 11.2 비즈니스 컴포넌트

| 모듈 | 컴포넌트 |
|------|----------|
| **RMS** | MonitoringScreen, DeviceDrawer, FaultDetailPanel, BatteryDetailDrawer |
| **CMS** | ContentRegistrationDrawer, TemplateRegistrationDrawer, DeploymentCard |
| **Registry** | RegistryShell, StopDrawer, PartnerRegistrationDrawer |
| **Common** | AppSidebar, AppHeader, PageHeader, AccessDenied, DevRoleSwitcher |

---

## 부록: CSS 변수 전체 목록

```css
:root {
  /* 기본 색상 */
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  
  /* 차트 색상 */
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  
  /* 상태 색상 */
  --state-normal: #22c55e;
  --state-degraded: #eab308;
  --state-critical: #ef4444;
  --state-offline: #6b7280;
  --state-emergency: #e11d48;
  
  /* 사이드바 */
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-border: oklch(0.922 0 0);
  
  /* 둥글기 */
  --radius: 0.625rem;
}
```

---

**문서 끝**
