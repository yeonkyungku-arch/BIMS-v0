# 공통 컴포넌트 카탈로그

> **대상**: 개발자 / 디자이너  
> **기준**: shadcn/ui v2 (Tailwind CSS v4 기반), Radix UI 원시 컴포넌트  
> **경로**: `components/ui/` (56개 shadcn 컴포넌트) + `components/` (프로젝트 공통 컴포넌트)

---

## 목차

1. [컴포넌트 분류 체계](#1-컴포넌트-분류-체계)
2. [레이아웃 & 구조 컴포넌트](#2-레이아웃--구조-컴포넌트)
3. [폼 & 입력 컴포넌트](#3-폼--입력-컴포넌트)
4. [피드백 & 상태 컴포넌트](#4-피드백--상태-컴포넌트)
5. [내비게이션 컴포넌트](#5-내비게이션-컴포넌트)
6. [오버레이 & 팝업 컴포넌트](#6-오버레이--팝업-컴포넌트)
7. [데이터 표시 컴포넌트](#7-데이터-표시-컴포넌트)
8. [신규 shadcn 컴포넌트 (v2)](#8-신규-shadcn-컴포넌트-v2)
9. [프로젝트 공통 컴포넌트](#9-프로젝트-공통-컴포넌트)
10. [컴포넌트 사용 규칙](#10-컴포넌트-사용-규칙)

---

## 1. 컴포넌트 분류 체계

```
components/
├── ui/                          # shadcn/ui 기반 원자 컴포넌트 (56개)
│   ├── [레이아웃]               card, separator, resizable, aspect-ratio, scroll-area
│   ├── [폼/입력]                input, textarea, select, checkbox, radio-group, switch,
│   │                            slider, calendar, input-otp, form, label, field, input-group
│   ├── [피드백/상태]            badge, alert, progress, skeleton, spinner, toast, sonner, empty
│   ├── [내비게이션]             breadcrumb, navigation-menu, menubar, pagination, sidebar, tabs
│   ├── [오버레이/팝업]          dialog, sheet, drawer, popover, tooltip, hover-card,
│   │                            alert-dialog, dropdown-menu, context-menu, command
│   ├── [데이터 표시]            table, avatar, accordion, collapsible, carousel, chart
│   └── [유틸리티]               button, button-group, toggle, toggle-group, item, kbd,
│                                use-mobile
│
├── [RMS]                        monitoring, alerts, battery, maintenance, diagnosis, contract
├── [CMS]                        content-drawer, deployment-drawer, template-drawer
├── [Registry]                   customer, partner, stop, device, group, relationship drawers
├── [Display]                    DisplayRoot, DisplayRenderer, state screens
├── [Field Ops]                  work-order-drawer
└── [공통]                       PageHeader, AccessDenied, ScopeSwitcher, DevtoolsBanner
```

---

## 2. 레이아웃 & 구조 컴포넌트

### Card
> 콘텐츠 그룹화의 기본 컨테이너. 대부분의 섹션에서 사용.

```tsx
import { Card, CardHeader, CardTitle, CardDescription,
         CardContent, CardFooter, CardAction } from '@/components/ui/card'

// 기본 사용
<Card>
  <CardHeader>
    <CardTitle>카드 제목</CardTitle>
    <CardDescription>보조 설명</CardDescription>
    <CardAction>
      <Button size="sm">액션</Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    콘텐츠 영역
  </CardContent>
  <CardFooter>
    <Button>확인</Button>
  </CardFooter>
</Card>

// KPI 카드 패턴 (대시보드)
<Card>
  <CardHeader className="pb-2">
    <CardDescription>운영 중 단말</CardDescription>
    <CardTitle className="text-3xl font-bold">1,284</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-xs text-muted-foreground">전일 대비 +12</p>
  </CardContent>
</Card>
```

| Sub-component | 역할 |
|---|---|
| `CardHeader` | 제목/설명 영역, `flex flex-col gap-1.5` |
| `CardTitle` | 주제목, `font-semibold leading-none tracking-tight` |
| `CardDescription` | 부제목, `text-sm text-muted-foreground` |
| `CardAction` | 우측 액션 버튼 영역 (신규) |
| `CardContent` | 본문 콘텐츠 영역 |
| `CardFooter` | 하단 액션 영역 |

---

### Separator
> 시각적 구분선. 수평/수직 방향 지원.

```tsx
import { Separator } from '@/components/ui/separator'

<Separator />                          // 수평 구분선
<Separator orientation="vertical" className="h-4" />  // 수직 구분선
```

---

### ScrollArea
> 커스텀 스크롤바를 가진 스크롤 영역. Drawer 내부, 긴 목록에 사용.

```tsx
import { ScrollArea } from '@/components/ui/scroll-area'

<ScrollArea className="h-[400px]">
  <div className="p-4">
    {/* 긴 콘텐츠 */}
  </div>
</ScrollArea>
```

---

### ResizablePanel
> 드래그로 크기 조절 가능한 패널 레이아웃. 모니터링 화면 분할에 사용.

```tsx
import { ResizablePanelGroup, ResizablePanel,
         ResizableHandle } from '@/components/ui/resizable'

<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={60}>왼쪽 패널</ResizablePanel>
  <ResizableHandle />
  <ResizablePanel defaultSize={40}>오른쪽 패널</ResizablePanel>
</ResizablePanelGroup>
```

---

### AspectRatio
> 고정 비율을 유지하는 컨테이너. 지도, 이미지에 사용.

```tsx
import { AspectRatio } from '@/components/ui/aspect-ratio'

<AspectRatio ratio={16 / 9}>
  <img src="..." className="object-cover w-full h-full" />
</AspectRatio>
```

---

## 3. 폼 & 입력 컴포넌트

### Input
> 기본 텍스트 입력 필드.

```tsx
import { Input } from '@/components/ui/input'

<Input placeholder="검색어 입력..." />
<Input type="file" />
<Input disabled value="읽기 전용" />
```

---

### InputGroup + InputGroupAddon
> 아이콘, 버튼, 접두사를 가진 복합 입력 필드. 검색바, 단위 입력에 사용.

```tsx
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Search } from 'lucide-react'

// 검색 입력 (좌측 아이콘)
<InputGroup>
  <InputGroupAddon align="inline-start">
    <Search className="size-4" />
  </InputGroupAddon>
  <InputGroupInput placeholder="검색..." />
</InputGroup>

// 단위 접미사
<InputGroup>
  <InputGroupInput type="number" placeholder="0" />
  <InputGroupAddon align="inline-end">
    kWh
  </InputGroupAddon>
</InputGroup>
```

**규칙**: `InputGroupInput`은 반드시 `InputGroup` 내부에서 `Input` 대신 사용.

---

### Textarea
> 멀티라인 텍스트 입력.

```tsx
import { Textarea } from '@/components/ui/textarea'

<Textarea placeholder="설명 입력..." rows={4} />
```

---

### Select
> 드롭다운 선택 컴포넌트.

```tsx
import { Select, SelectTrigger, SelectValue,
         SelectContent, SelectItem, SelectGroup,
         SelectLabel, SelectSeparator } from '@/components/ui/select'

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="선택하세요" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>지역</SelectLabel>
      <SelectItem value="seoul">서울</SelectItem>
      <SelectItem value="gyeonggi">경기</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectItem value="all">전체</SelectItem>
  </SelectContent>
</Select>
```

---

### Checkbox
> 단일/다중 선택 체크박스.

```tsx
import { Checkbox } from '@/components/ui/checkbox'

// 기본
<Checkbox id="agree" />
<label htmlFor="agree">동의합니다</label>

// 중간 상태 (부분 선택)
<Checkbox checked="indeterminate" />
```

---

### Switch
> 토글 스위치. Boolean 상태 전환에 사용.

```tsx
import { Switch } from '@/components/ui/switch'

<div className="flex items-center gap-2">
  <Switch id="active" checked={active} onCheckedChange={setActive} />
  <label htmlFor="active">활성화</label>
</div>
```

---

### RadioGroup
> 라디오 버튼 그룹.

```tsx
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

<RadioGroup value={type} onValueChange={setType}>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="public" id="public" />
    <label htmlFor="public">공기업</label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="private" id="private" />
    <label htmlFor="private">민간기업</label>
  </div>
</RadioGroup>
```

---

### Slider
> 범위 값 선택 슬라이더.

```tsx
import { Slider } from '@/components/ui/slider'

<Slider
  min={0} max={100} step={1}
  value={[brightness]}
  onValueChange={([v]) => setBrightness(v)}
/>
```

---

### Calendar
> 날짜 선택 달력. DatePicker 구현에 사용.

```tsx
import { Calendar } from '@/components/ui/calendar'

<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  disabled={(d) => d < new Date()}
/>

// 범위 선택
<Calendar mode="range" selected={dateRange} onSelect={setDateRange} />
```

---

### InputOTP
> OTP/인증코드 입력 컴포넌트.

```tsx
import { InputOTP, InputOTPGroup, InputOTPSlot,
         InputOTPSeparator } from '@/components/ui/input-otp'

<InputOTP maxLength={6}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>
```

---

### Field + FieldGroup
> 폼 레이아웃을 위한 구조화 컴포넌트. 레이블-입력 쌍 배치에 사용.

```tsx
import { FieldGroup, Field, FieldLabel, FieldHint,
         FieldMessage, FieldSet, FieldLegend } from '@/components/ui/field'

// 기본 세로 배치
<FieldGroup>
  <Field>
    <FieldLabel htmlFor="name">그룹명 *</FieldLabel>
    <Input id="name" placeholder="예: 강남-운영대기-그룹A" />
    <FieldHint>50자 이내로 입력하세요</FieldHint>
  </Field>
  <Field>
    <FieldLabel htmlFor="desc">설명</FieldLabel>
    <Textarea id="desc" />
  </Field>
</FieldGroup>

// 수평 배치 (orientation="horizontal")
<Field orientation="horizontal">
  <FieldLabel>활성화</FieldLabel>
  <Switch />
</Field>

// 체크박스/라디오 그룹
<FieldSet>
  <FieldLegend>권한 유형</FieldLegend>
  <Field orientation="horizontal">
    <Checkbox id="read" />
    <FieldLabel htmlFor="read">읽기</FieldLabel>
  </Field>
  <Field orientation="horizontal">
    <Checkbox id="write" />
    <FieldLabel htmlFor="write">쓰기</FieldLabel>
  </Field>
</FieldSet>
```

| Sub-component | 역할 |
|---|---|
| `FieldGroup` | 여러 Field를 담는 컨테이너, `gap-7` |
| `Field` | 레이블+입력+힌트를 묶는 단위, orientation 지원 |
| `FieldLabel` | 접근성 레이블, `<label>` 렌더링 |
| `FieldHint` | 입력 도움말, `text-sm text-muted-foreground` |
| `FieldMessage` | 에러/검증 메시지, `text-destructive` |
| `FieldSet` | 체크박스/라디오 그룹 컨테이너, `<fieldset>` 렌더링 |
| `FieldLegend` | FieldSet의 제목, `<legend>` 렌더링 |

**규칙**: Drawer 폼 레이아웃은 반드시 `FieldGroup + Field` 사용. `div + space-y-*` 패턴 금지.

---

## 4. 피드백 & 상태 컴포넌트

### Badge
> 상태 태그, 카운트 표시.

```tsx
import { Badge } from '@/components/ui/badge'

// 기본 variant
<Badge>default</Badge>
<Badge variant="secondary">secondary</Badge>
<Badge variant="destructive">destructive</Badge>
<Badge variant="outline">outline</Badge>

// 프로젝트 상태 패턴 (className으로 커스텀)
<Badge className="bg-green-100 text-green-700 border-green-200">운영중</Badge>
<Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">운영대기</Badge>
<Badge className="bg-blue-100 text-blue-700 border-blue-200">설치대기</Badge>
<Badge className="bg-red-100 text-red-700 border-red-200">장애</Badge>
<Badge className="bg-gray-100 text-gray-500 border-gray-200">비활성</Badge>
```

**5종 상태 색상 매핑**:

| 상태 | className | 용도 |
|---|---|---|
| NORMAL | `bg-green-100 text-green-700` | 정상 운영 |
| DEGRADED | `bg-yellow-100 text-yellow-700` | 성능 저하 |
| CRITICAL | `bg-red-100 text-red-700` | 심각 장애 |
| OFFLINE | `bg-gray-100 text-gray-500` | 오프라인 |
| EMERGENCY | `bg-orange-100 text-orange-700` | 긴급 상황 |

---

### Alert
> 인라인 안내/경고 메시지.

```tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Info, CheckCircle } from 'lucide-react'

// 경고
<Alert variant="destructive">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>주의</AlertTitle>
  <AlertDescription>배터리 잔량이 15% 이하입니다.</AlertDescription>
</Alert>

// 정보
<Alert>
  <Info className="h-4 w-4" />
  <AlertTitle>안내</AlertTitle>
  <AlertDescription>작업이 완료되었습니다.</AlertDescription>
</Alert>
```

---

### Progress
> 진행률 표시 바.

```tsx
import { Progress } from '@/components/ui/progress'

<Progress value={75} className="h-2" />
<Progress value={battery} className="h-3 bg-muted" />
```

---

### Skeleton
> 로딩 중 콘텐츠 자리 표시자.

```tsx
import { Skeleton } from '@/components/ui/skeleton'

// 텍스트 스켈레톤
<Skeleton className="h-4 w-48" />

// 카드 스켈레톤
<div className="flex flex-col gap-3">
  <Skeleton className="h-8 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>

// 아바타 스켈레톤
<div className="flex items-center gap-4">
  <Skeleton className="h-10 w-10 rounded-full" />
  <div className="flex flex-col gap-2">
    <Skeleton className="h-4 w-32" />
    <Skeleton className="h-3 w-24" />
  </div>
</div>
```

---

### Spinner
> 로딩 인디케이터. 버튼 내부, 비동기 처리 중 표시.

```tsx
import { Spinner } from '@/components/ui/spinner'

// 인라인 스피너
<Spinner />
<Spinner className="size-6" />

// 로딩 버튼 패턴
<Button disabled={isLoading}>
  {isLoading && <Spinner />}
  {isLoading ? '처리 중...' : '등록'}
</Button>

// 전체 화면 로딩
<div className="flex items-center justify-center h-full">
  <Spinner className="size-8" />
</div>
```

---

### Empty
> 데이터 없음 상태 표시. 빈 목록, 검색 결과 없음에 사용.

```tsx
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle,
         EmptyDescription, EmptyActions } from '@/components/ui/empty'
import { Search } from 'lucide-react'

<Empty>
  <EmptyHeader>
    <EmptyMedia variant="icon">
      <Search />
    </EmptyMedia>
    <EmptyTitle>검색 결과 없음</EmptyTitle>
    <EmptyDescription>
      해당 조건의 정류장이 없습니다.
      조건을 변경하여 다시 검색해 보세요.
    </EmptyDescription>
  </EmptyHeader>
  <EmptyActions>
    <Button variant="outline" onClick={resetFilters}>필터 초기화</Button>
  </EmptyActions>
</Empty>
```

| Sub-component | 역할 |
|---|---|
| `Empty` | 최외곽 컨테이너, `border-dashed` |
| `EmptyHeader` | 아이콘+제목+설명 묶음 |
| `EmptyMedia` | 아이콘/이미지 영역, `variant="icon"` 권장 |
| `EmptyTitle` | 주 메시지 |
| `EmptyDescription` | 보조 설명 |
| `EmptyActions` | 버튼 영역 |

---

### Toast / Sonner
> 토스트 알림. 작업 완료/실패 피드백에 사용.

```tsx
import { useToast } from '@/hooks/use-toast'
import { toast } from 'sonner'

// useToast 패턴 (shadcn 기본)
const { toast } = useToast()
toast({ title: "저장 완료", description: "설정이 저장되었습니다." })
toast({ title: "오류", description: "저장에 실패했습니다.", variant: "destructive" })

// Sonner 패턴 (간편)
toast.success("등록이 완료되었습니다.")
toast.error("처리 중 오류가 발생했습니다.")
toast.warning("배터리 잔량이 부족합니다.")
toast.info("새로운 업데이트가 있습니다.")
```

---

## 5. 내비게이션 컴포넌트

### Tabs
> 탭 전환 UI. 상세 페이지, 설정 화면에 사용.

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">개요</TabsTrigger>
    <TabsTrigger value="devices">단말 목록</TabsTrigger>
    <TabsTrigger value="history">이력</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">개요 내용</TabsContent>
  <TabsContent value="devices">단말 목록 내용</TabsContent>
  <TabsContent value="history">이력 내용</TabsContent>
</Tabs>
```

---

### Breadcrumb
> 현재 위치 경로 표시. PageHeader 내부에서 사용.

```tsx
import { Breadcrumb, BreadcrumbList, BreadcrumbItem,
         BreadcrumbLink, BreadcrumbSeparator,
         BreadcrumbPage, BreadcrumbEllipsis } from '@/components/ui/breadcrumb'

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">홈</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/registry">레지스트리</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>정류장 관리</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

---

### Pagination
> 목록 페이지 전환 컨트롤.

```tsx
import { Pagination, PaginationContent, PaginationItem,
         PaginationLink, PaginationPrevious, PaginationNext,
         PaginationEllipsis } from '@/components/ui/pagination'

<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#" isActive>1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">2</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationEllipsis />
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

---

### Accordion
> 접고 펼칠 수 있는 콘텐츠 섹션. FAQ, 필터 패널에 사용.

```tsx
import { Accordion, AccordionItem, AccordionTrigger,
         AccordionContent } from '@/components/ui/accordion'

<Accordion type="single" collapsible>
  <AccordionItem value="filter-region">
    <AccordionTrigger>지역 필터</AccordionTrigger>
    <AccordionContent>
      {/* 체크박스 목록 */}
    </AccordionContent>
  </AccordionItem>
</Accordion>

// 다중 펼침
<Accordion type="multiple" defaultValue={["info", "devices"]}>
  ...
</Accordion>
```

---

## 6. 오버레이 & 팝업 컴포넌트

### Dialog
> 모달 다이얼로그. 확인/경고/입력 팝업에 사용.

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle,
         DialogDescription, DialogFooter, DialogTrigger,
         DialogClose } from '@/components/ui/dialog'

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>열기</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>단말 등록 확인</DialogTitle>
      <DialogDescription>
        선택한 단말을 등록하시겠습니까?
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      {/* 내용 */}
    </div>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">취소</Button>
      </DialogClose>
      <Button onClick={handleConfirm}>확인</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### AlertDialog
> 파괴적 액션(삭제, 비활성화) 전 확인 다이얼로그.

```tsx
import { AlertDialog, AlertDialogTrigger, AlertDialogContent,
         AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
         AlertDialogFooter, AlertDialogCancel,
         AlertDialogAction } from '@/components/ui/alert-dialog'

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">삭제</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
      <AlertDialogDescription>
        이 작업은 되돌릴 수 없습니다. 관련 데이터가 모두 삭제됩니다.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>취소</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>삭제 확인</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**규칙**: 삭제/비활성화/초기화 등 파괴적 액션은 반드시 `AlertDialog` 사용.

---

### Sheet
> 사이드 패널 (Drawer의 기반). 등록/상세 Drawer 구현에 사용.

```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle,
         SheetDescription, SheetFooter, SheetTrigger,
         SheetClose } from '@/components/ui/sheet'

<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent side="right" className="w-[520px] sm:max-w-[520px]">
    <SheetHeader>
      <SheetTitle>고객사 등록</SheetTitle>
      <SheetDescription>신규 고객사 정보를 입력하세요.</SheetDescription>
    </SheetHeader>
    <div className="flex-1 overflow-y-auto py-6">
      {/* 폼 콘텐츠 */}
    </div>
    <SheetFooter>
      <SheetClose asChild>
        <Button variant="outline">취소</Button>
      </SheetClose>
      <Button onClick={handleSave}>등록</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

**규칙**: Drawer 너비는 `w-[520px] sm:max-w-[520px]` 고정.

---

### Popover
> 클릭 시 떠오르는 팝오버. 필터, 날짜 선택에 사용.

```tsx
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">
      {date ? format(date, 'yyyy.MM.dd') : '날짜 선택'}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0">
    <Calendar mode="single" selected={date} onSelect={setDate} />
  </PopoverContent>
</Popover>
```

---

### Tooltip
> 호버 시 설명 툴팁.

```tsx
import { Tooltip, TooltipTrigger, TooltipContent,
         TooltipProvider } from '@/components/ui/tooltip'

// TooltipProvider는 최상위 layout에서 1회 선언
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon">
        <Info className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>BIS 그룹은 여러 정류장을 묶어 일괄 관리합니다.</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

### DropdownMenu
> 클릭 시 드롭다운 메뉴. 행 액션, 더보기 버튼에 사용.

```tsx
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
         DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
         DropdownMenuCheckboxItem, DropdownMenuSub,
         DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>작업</DropdownMenuLabel>
    <DropdownMenuItem onClick={handleEdit}>수정</DropdownMenuItem>
    <DropdownMenuItem onClick={handleCopy}>복사</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem
      className="text-destructive"
      onClick={handleDelete}
    >
      삭제
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Command
> 검색 기반 커맨드 팔레트. Combobox 패턴, 단말 선택에 사용.

```tsx
import { Command, CommandInput, CommandList, CommandEmpty,
         CommandGroup, CommandItem, CommandSeparator } from '@/components/ui/command'

<Command className="rounded-lg border shadow-md">
  <CommandInput placeholder="정류장 검색..." />
  <CommandList>
    <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
    <CommandGroup heading="서울">
      <CommandItem value="강남역" onSelect={handleSelect}>
        강남역 3번출구
      </CommandItem>
    </CommandGroup>
  </CommandList>
</Command>
```

---

## 7. 데이터 표시 컴포넌트

### Table
> 구조화된 데이터 테이블. 목록 페이지의 기본 레이아웃.

```tsx
import { Table, TableHeader, TableBody, TableRow,
         TableHead, TableCell, TableFooter,
         TableCaption } from '@/components/ui/table'

<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-[100px]">ID</TableHead>
      <TableHead>정류장명</TableHead>
      <TableHead>고객사</TableHead>
      <TableHead className="text-right">단말 수</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {stops.map(stop => (
      <TableRow key={stop.id} className="cursor-pointer hover:bg-muted/50">
        <TableCell className="font-mono text-xs">{stop.id}</TableCell>
        <TableCell className="font-medium">{stop.name}</TableCell>
        <TableCell>{stop.customerName}</TableCell>
        <TableCell className="text-right">{stop.deviceCount}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### Avatar
> 사용자/단체 아바타. 계정 표시, 배정자 표시에 사용.

```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

<Avatar>
  <AvatarImage src="/avatars/admin.png" alt="관리자" />
  <AvatarFallback>관리</AvatarFallback>
</Avatar>

// 크기 조정
<Avatar className="h-8 w-8">
  <AvatarFallback className="text-xs">KR</AvatarFallback>
</Avatar>
```

---

### Chart (Recharts 기반)
> 데이터 시각화 차트. Analysis 모듈에서 집중 사용.

```tsx
import { ChartContainer, ChartTooltip,
         ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid,
         ResponsiveContainer, BarChart, Bar } from 'recharts'

const chartConfig = {
  battery: { label: "배터리(%)", color: "hsl(var(--chart-1))" },
}

<ChartContainer config={chartConfig} className="h-[300px]">
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="time" />
    <YAxis />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Line type="monotone" dataKey="battery" stroke="var(--color-battery)" />
  </LineChart>
</ChartContainer>
```

---

### Carousel
> 슬라이더 형태의 카드 컨테이너.

```tsx
import { Carousel, CarouselContent, CarouselItem,
         CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

<Carousel>
  <CarouselContent>
    {items.map(item => (
      <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3">
        <Card>{item.name}</Card>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>
```

---

## 8. 신규 shadcn 컴포넌트 (v2)

> shadcn/ui v2에서 새로 추가된 컴포넌트. 기존 커스텀 구현 대신 이 컴포넌트 사용 권장.

### ButtonGroup
> 버튼들을 이어 붙이는 그룹 컨테이너. 액션 버튼 묶음에 사용.  
> **주의**: 상태 토글은 `ToggleGroup` 사용, 액션 묶음만 `ButtonGroup` 사용.

```tsx
import { ButtonGroup, ButtonGroupSeparator,
         ButtonGroupText } from '@/components/ui/button-group'

// 수평 버튼 그룹
<ButtonGroup>
  <Button variant="outline">내보내기</Button>
  <Button variant="outline">프린트</Button>
  <Button variant="outline">공유</Button>
</ButtonGroup>

// 텍스트 + 버튼 조합
<ButtonGroup>
  <ButtonGroupText>총 45개</ButtonGroupText>
  <Button variant="outline">전체 선택</Button>
  <Button variant="outline">전체 해제</Button>
</ButtonGroup>

// 수직 배치
<ButtonGroup orientation="vertical">
  <Button>위로</Button>
  <Button>아래로</Button>
</ButtonGroup>
```

---

### Empty
> 데이터 없음 상태 컴포넌트 (4항 참조).

---

### Field + FieldGroup
> 폼 레이아웃 컴포넌트 (3항 참조).

---

### InputGroup + InputGroupAddon
> 아이콘/접두사 복합 입력 컴포넌트 (3항 참조).

---

### Item + ItemGroup
> 리스트 아이템 컴포넌트. 설정 목록, 선택 가능한 항목에 사용.

```tsx
import { Item, ItemGroup, ItemSeparator,
         ItemContent, ItemTitle, ItemDescription,
         ItemIndicator, ItemActions } from '@/components/ui/item'

<ItemGroup>
  <Item asChild variant="outline">
    <button onClick={() => selectRole('admin')}>
      <ItemContent>
        <ItemTitle>플랫폼 최고 관리자</ItemTitle>
        <ItemDescription>전체 시스템 접근 권한</ItemDescription>
      </ItemContent>
      <ItemActions>
        <ItemIndicator>
          {currentRole === 'admin' && <Check className="h-4 w-4" />}
        </ItemIndicator>
      </ItemActions>
    </button>
  </Item>
  <ItemSeparator />
  <Item variant="muted">
    <ItemContent>
      <ItemTitle>현장 유지보수 운영자</ItemTitle>
    </ItemContent>
  </Item>
</ItemGroup>
```

---

### Kbd + KbdGroup
> 키보드 단축키 표시 컴포넌트.

```tsx
import { Kbd, KbdGroup } from '@/components/ui/kbd'

// 단일 키
<Kbd>Esc</Kbd>
<Kbd>Enter</Kbd>

// 조합 키
<KbdGroup>
  <Kbd>⌘</Kbd>
  <Kbd>K</Kbd>
</KbdGroup>

// 툴팁 내부
<TooltipContent>
  검색 열기 <Kbd>⌘K</Kbd>
</TooltipContent>
```

---

### Spinner
> 로딩 스피너 (4항 참조).

---

## 9. 프로젝트 공통 컴포넌트

> `components/ui/` 외부에 있는 프로젝트 전용 공통 컴포넌트.

### PageHeader
> 모든 페이지 상단의 공통 헤더. 브레드크럼, 제목, 역할 배지, 액션 버튼 포함.

```tsx
import { PageHeader } from '@/components/page-header'

// 기본 사용
<PageHeader
  title="정류장 관리"
  section="registry"
  breadcrumbs={[
    { label: "레지스트리", href: "/registry" },
    { label: "정류장 관리" }
  ]}
  description="BIS 단말이 설치된 정류장을 등록하고 관리합니다."
>
  {/* 우측 액션 버튼 */}
  <Button onClick={openRegister}>
    <Plus className="h-4 w-4" />
    정류장 등록
  </Button>
</PageHeader>
```

| Prop | 타입 | 필수 | 설명 |
|---|---|---|---|
| `title` | `string` | O | 페이지 제목 |
| `section` | `string` | - | RBAC readOnly 배지 표시용 섹션 |
| `breadcrumbs` | `BreadcrumbItem[]` | - | 경로 표시 |
| `description` | `string` | - | 부제목/설명 |
| `subtitle` | `string` | - | 제목 아래 소자막 |
| `children` | `ReactNode` | - | 우측 액션 영역 |

---

### AccessDenied
> 권한 없음 화면. 각 페이지 상단에서 RBAC 검사 후 렌더링.

```tsx
import { AccessDenied } from '@/components/access-denied'
import { useRBAC } from '@/contexts/rbac-context'

export default function ProtectedPage() {
  const { hasPermission } = useRBAC()

  if (!hasPermission('rms:view')) {
    return <AccessDenied />
  }

  return <div>...페이지 내용</div>
}
```

---

### ScopeSwitcher
> 헤더의 고객사/스코프 전환기. RBAC 역할에 따라 표시 범위 다름.

```tsx
import { ScopeSwitcher } from '@/components/scope-switcher'

// AppHeader에서 자동 렌더링, 별도 사용 불필요
<ScopeSwitcher />
```

---

### DevtoolsBanner
> 개발/테스트 환경에서만 표시되는 상단 배너.  
> 현재 역할, 스코프, 환경 표시.

```tsx
// layout.tsx에서 자동 조건부 렌더링
{process.env.NODE_ENV === 'development' && <DevtoolsBanner />}
```

---

## 10. 컴포넌트 사용 규칙

### 필수 규칙

| # | 규칙 | 올바른 예 | 잘못된 예 |
|---|---|---|---|
| 1 | 폼 레이아웃은 `FieldGroup + Field` | `<FieldGroup><Field>...</Field></FieldGroup>` | `<div className="space-y-4">` |
| 2 | 아이콘 입력은 `InputGroup + InputGroupAddon` | `<InputGroup><InputGroupAddon>...</InputGroupAddon>` | `<div className="relative"><Input /><Icon />` |
| 3 | 빈 상태는 `Empty` | `<Empty><EmptyHeader>...</EmptyHeader></Empty>` | `<div className="text-center">데이터 없음</div>` |
| 4 | 파괴적 액션은 `AlertDialog` | `<AlertDialog>...</AlertDialog>` | `window.confirm()` |
| 5 | Drawer 너비는 `w-[520px]` 고정 | `className="w-[520px] sm:max-w-[520px]"` | `className="w-96"` |
| 6 | 로딩 버튼은 `Spinner` | `<Button><Spinner />{label}</Button>` | `<Button disabled>로딩중...</Button>` |
| 7 | 액션 묶음은 `ButtonGroup` | `<ButtonGroup><Button/><Button/></ButtonGroup>` | `<div className="flex gap-2">` |

### Import 경로

```tsx
// UI 기본 컴포넌트
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// 신규 v2 컴포넌트
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { FieldGroup, Field, FieldLabel, FieldHint } from '@/components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { ButtonGroup } from '@/components/ui/button-group'
import { Item, ItemGroup, ItemContent, ItemTitle } from '@/components/ui/item'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Spinner } from '@/components/ui/spinner'

// 프로젝트 공통 컴포넌트
import { PageHeader } from '@/components/page-header'
import { AccessDenied } from '@/components/access-denied'
```

### 전체 컴포넌트 목록 요약

| 분류 | 컴포넌트 | 수 |
|---|---|---|
| 레이아웃 & 구조 | Card, Separator, ScrollArea, ResizablePanel, AspectRatio | 5 |
| 폼 & 입력 | Input, InputGroup, Textarea, Select, Checkbox, Switch, RadioGroup, Slider, Calendar, InputOTP, Field, Form, Label | 13 |
| 피드백 & 상태 | Badge, Alert, Progress, Skeleton, Spinner, Empty, Toast, Sonner | 8 |
| 내비게이션 | Tabs, Breadcrumb, Pagination, Accordion, NavigationMenu, Menubar, Sidebar | 7 |
| 오버레이 & 팝업 | Dialog, AlertDialog, Sheet, Drawer, Popover, Tooltip, HoverCard, DropdownMenu, ContextMenu, Command | 10 |
| 데이터 표시 | Table, Avatar, Chart, Carousel, Collapsible | 5 |
| 버튼 & 제어 | Button, ButtonGroup, Toggle, ToggleGroup, Item | 5 |
| 유틸리티 | Kbd, Spinner, use-mobile | 3 |
| 프로젝트 공통 | PageHeader, AccessDenied, ScopeSwitcher, DevtoolsBanner | 4 |
| **합계** | | **60** |
