"use client";

import { useState } from "react";
import {
  Search,
  Download,
  Upload,
  Rocket,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  X,
  FileUp,
  HardDrive,
  Calendar,
  Users,
} from "lucide-react";
import { useRBAC } from "@/contexts/rbac-context";
import { AccessDenied } from "@/components/access-denied";
import { PageHeader } from "@/components/page-header";
import { OTADrawer } from "@/components/ota-drawer";
import {
  mockDevices,
  mockTargetGroups,
  mockBISGroups,
} from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// Mock OTA data - status는 API에서 영문, UI에서 한글 표시
const otaData = [
  { id: "OTA-001", version: "2.5.1", deviceCount: 156, status: "completed", startedAt: "2026-03-10 09:00", completedAt: "2026-03-10 14:30", successRate: 98 },
  { id: "OTA-002", version: "2.5.2", deviceCount: 320, status: "in_progress", startedAt: "2026-03-12 10:00", completedAt: null, successRate: 65 },
  { id: "OTA-003", version: "2.4.8", deviceCount: 45, status: "scheduled", startedAt: "2026-03-15 08:00", completedAt: null, successRate: 0 },
  { id: "OTA-004", version: "2.5.0", deviceCount: 89, status: "failed", startedAt: "2026-03-08 11:00", completedAt: "2026-03-08 12:30", successRate: 23 },
  { id: "OTA-005", version: "2.4.5", deviceCount: 234, status: "completed", startedAt: "2026-03-01 09:00", completedAt: "2026-03-01 16:00", successRate: 100 },
];

// Mock firmware list
const firmwareList = [
  { id: "FW-001", version: "2.5.2", name: "BIS Terminal Firmware", uploadedAt: "2026-03-12", size: "12.5 MB" },
  { id: "FW-002", version: "2.5.1", name: "BIS Terminal Firmware", uploadedAt: "2026-03-10", size: "12.3 MB" },
  { id: "FW-003", version: "2.5.0", name: "BIS Terminal Firmware", uploadedAt: "2026-03-05", size: "12.1 MB" },
];

// Mock device groups
const deviceGroups = [
  { id: "GRP-001", name: "서울 전체", count: 156 },
  { id: "GRP-002", name: "서울 강남권", count: 45 },
  { id: "GRP-003", name: "서울 강북권", count: 38 },
  { id: "GRP-004", name: "경기도 전체", count: 89 },
  { id: "GRP-005", name: "부산 전체", count: 67 },
];

// Static customer list derived from mockDevices
const customerOptions = Array.from(
  new Map(mockDevices.map((d) => [d.customerId, d.customerId])).values()
).map((id) => ({ id, name: id === "CUS001" ? "서울교통공사" : id === "CUS002" ? "경기교통정보센터" : id }));

// Static region list
const regionOptions = Array.from(new Set(mockDevices.map((d) => d.region))).map((r) => ({ id: r, name: r }));

export default function OTAManagementPage() {
  const { can } = useRBAC();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOTA, setSelectedOTA] = useState<typeof otaData[0] | null>(null);
  
  // Dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deploySheetOpen, setDeploySheetOpen] = useState(false);
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    version: "",
    name: "BIS Terminal Firmware",
    releaseNotes: "",
    file: null as File | null,
  });
  
  // Deploy form state
  const [deployForm, setDeployForm] = useState({
    firmwareId: "",
    selectedCustomers: [] as string[],
    selectedRegions: [] as string[],
    selectedGroups: [] as string[],
    selectedDevices: [] as string[],
    scheduleType: "immediate" as "immediate" | "scheduled",
    scheduledDate: "",
    scheduledTime: "",
    rollbackEnabled: true,
  });

  if (!can("rms.device.control")) {
    return <AccessDenied />;
  }
  
  // Handle firmware upload
  const handleUpload = () => {
    // Production: API call to upload firmware
    setUploadDialogOpen(false);
    setUploadForm({ version: "", name: "BIS Terminal Firmware", releaseNotes: "", file: null });
  };
  
  // Handle new deployment
  const handleDeploy = () => {
    // Production: API call to create deployment
    setDeploySheetOpen(false);
    setDeployForm({
      firmwareId: "",
      selectedCustomers: [],
      selectedRegions: [],
      selectedGroups: [],
      selectedDevices: [],
      scheduleType: "immediate",
      scheduledDate: "",
      scheduledTime: "",
      rollbackEnabled: true,
    });
  };
  
  // Toggle selection helper
  const toggleSelection = (
    key: "selectedCustomers" | "selectedRegions" | "selectedGroups" | "selectedDevices",
    id: string
  ) => {
    setDeployForm(prev => ({
      ...prev,
      [key]: prev[key].includes(id)
        ? prev[key].filter((item: string) => item !== id)
        : [...prev[key], id]
    }));
  };
  
  // Get selected device count based on filters (cascading)
  const getSelectedDeviceCount = () => {
    let filtered = mockDevices;
    
    // Apply customer filter
    if (deployForm.selectedCustomers.length > 0) {
      filtered = filtered.filter(d => deployForm.selectedCustomers.includes(d.customerId));
    }
    
    // Apply region filter
    if (deployForm.selectedRegions.length > 0) {
      filtered = filtered.filter(d => deployForm.selectedRegions.includes(d.region));
    }
    
    // Apply group filter (using deviceGroups mock)
    if (deployForm.selectedGroups.length > 0) {
      const selectedGroup = deviceGroups.find(g => deployForm.selectedGroups.includes(g.id));
      if (selectedGroup) {
        return selectedGroup.count;
      }
    }
    
    // Apply device filter
    if (deployForm.selectedDevices.length > 0) {
      return deployForm.selectedDevices.length;
    }
    
    return filtered.length;
  };
  
  // Check if deploy is valid - always valid since "all" is default
  const isDeployValid = () => {
    return !!deployForm.firmwareId;
  };

  const filteredData = otaData.filter((item) => {
    const matchesSearch = item.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Helper functions for status display
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "in_progress": return "secondary";
      case "scheduled": return "outline";
      case "failed": return "destructive";
      default: return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in_progress": return <Clock className="h-4 w-4 text-blue-500" />;
      case "scheduled": return <Clock className="h-4 w-4 text-gray-400" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: "완료",
      in_progress: "진행 중",
      scheduled: "예정",
      failed: "실패",
    };
    return labels[status] || status;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <PageHeader
          title="OTA 관리"
          description="펌웨어 원격 업데이트 배포 및 모니터링"
          breadcrumbs={[
            { label: "원격 관리", href: "/rms/devices" },
            { label: "OTA 관리" },
          ]}
          section="rms"
        >
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-1.5 h-9 text-sm"
              onClick={() => setUploadDialogOpen(true)}
            >
              <Upload className="h-4 w-4" />
              펌웨어 업로드
            </Button>
            <Button 
              size="sm" 
              className="gap-1.5 h-9 text-sm"
              onClick={() => setDeploySheetOpen(true)}
            >
              <Rocket className="h-4 w-4" />
              새 배포
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Metrics Cards - Clickable */}
      <div className="px-6 py-3 border-b bg-background grid grid-cols-6 gap-3">
        <Card 
          className={cn("p-3 cursor-pointer transition-all hover:scale-[1.02]", statusFilter === "all" && "ring-2 ring-primary ring-offset-2")}
          onClick={() => setStatusFilter("all")}
        >
          <div className="text-xs text-muted-foreground font-medium">전체 배포</div>
          <div className="text-xl font-bold mt-1">156</div>
        </Card>
        <Card 
          className={cn("p-3 cursor-pointer transition-all hover:scale-[1.02] bg-green-50/50", statusFilter === "completed" && "ring-2 ring-primary ring-offset-2")}
          onClick={() => setStatusFilter("completed")}
        >
          <div className="text-xs text-green-700 font-medium">완료</div>
          <div className="text-xl font-bold mt-1 text-green-600">142</div>
        </Card>
        <Card 
          className={cn("p-3 cursor-pointer transition-all hover:scale-[1.02] bg-blue-50/50", statusFilter === "in_progress" && "ring-2 ring-primary ring-offset-2")}
          onClick={() => setStatusFilter("in_progress")}
        >
          <div className="text-xs text-blue-700 font-medium">진행 중</div>
          <div className="text-xl font-bold mt-1 text-blue-600">3</div>
        </Card>
        <Card 
          className={cn("p-3 cursor-pointer transition-all hover:scale-[1.02] bg-yellow-50/50", statusFilter === "scheduled" && "ring-2 ring-primary ring-offset-2")}
          onClick={() => setStatusFilter("scheduled")}
        >
          <div className="text-xs text-yellow-700 font-medium">예약됨</div>
          <div className="text-xl font-bold mt-1 text-yellow-600">5</div>
        </Card>
        <Card 
          className={cn("p-3 cursor-pointer transition-all hover:scale-[1.02] bg-red-50/50", statusFilter === "failed" && "ring-2 ring-primary ring-offset-2")}
          onClick={() => setStatusFilter("failed")}
        >
          <div className="text-xs text-red-700 font-medium">실패</div>
          <div className="text-xl font-bold mt-1 text-red-600">6</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground font-medium">평균 성공률</div>
          <div className="text-xl font-bold mt-1">96%</div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="배포 ID, 버전으로 검색..."
              className="pl-9 h-9 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="completed">완료</SelectItem>
              <SelectItem value="in_progress">진행 중</SelectItem>
              <SelectItem value="scheduled">예정</SelectItem>
              <SelectItem value="failed">실패</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <div className="rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 h-10">
              <TableRow>
                <TableHead className="text-xs font-semibold">배포 ID</TableHead>
                <TableHead className="text-xs font-semibold">버전</TableHead>
                <TableHead className="text-xs font-semibold">대상 단말</TableHead>
                <TableHead className="text-xs font-semibold">상태</TableHead>
                <TableHead className="text-xs font-semibold">시작 시간</TableHead>
                <TableHead className="text-xs font-semibold">완료 시간</TableHead>
                <TableHead className="text-xs font-semibold">성공률</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow
                  key={item.id}
                  className="h-10 cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedOTA(item)}
                >
                  <TableCell className="text-xs font-mono">{item.id}</TableCell>
                  <TableCell className="text-xs font-medium">{item.version}</TableCell>
                  <TableCell className="text-xs">{item.deviceCount}대</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(item.status)}
                      <Badge variant={getStatusBadgeVariant(item.status)} className="text-[10px]">
                        {getStatusLabel(item.status)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.startedAt}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.completedAt || "-"}</TableCell>
                  <TableCell className="text-xs">{item.successRate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Canonical OTA Drawer */}
      <OTADrawer
        open={!!selectedOTA}
        onOpenChange={(open) => !open && setSelectedOTA(null)}
        ota={selectedOTA}
      />

      {/* Firmware Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              펌웨어 업로드
            </DialogTitle>
            <DialogDescription>
              새 펌웨어 파일을 업로드합니다. 업로드 후 배포를 생성할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="version">버전</Label>
              <Input
                id="version"
                placeholder="예: 2.5.3"
                value={uploadForm.version}
                onChange={(e) => setUploadForm({ ...uploadForm, version: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">펌웨어 이름</Label>
              <Input
                id="name"
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file">펌웨어 파일</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                <input
                  type="file"
                  id="file"
                  className="hidden"
                  accept=".bin,.hex,.fw"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                />
                <label htmlFor="file" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {uploadForm.file ? uploadForm.file.name : "클릭하여 파일 선택 또는 드래그 앤 드롭"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">.bin, .hex, .fw 파일 지원</p>
                </label>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">릴리즈 노트</Label>
              <Textarea
                id="notes"
                placeholder="이 버전의 변경 사항을 입력하세요..."
                rows={3}
                value={uploadForm.releaseNotes}
                onChange={(e) => setUploadForm({ ...uploadForm, releaseNotes: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpload} disabled={!uploadForm.version || !uploadForm.file}>
              <Upload className="h-4 w-4 mr-2" />
              업로드
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Deployment Sheet */}
      <Sheet open={deploySheetOpen} onOpenChange={setDeploySheetOpen}>
        <SheetContent className="w-[480px] sm:max-w-[480px] flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              새 OTA 배포
            </SheetTitle>
            <SheetDescription>
              펌웨어를 선택하고 배포 대상을 지정합니다.
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto py-4 space-y-6">
            {/* Firmware Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                펌웨어 선택
              </Label>
              <Select
                value={deployForm.firmwareId}
                onValueChange={(v) => setDeployForm({ ...deployForm, firmwareId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="배포할 펌웨어를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {firmwareList.map((fw) => (
                    <SelectItem key={fw.id} value={fw.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{fw.version}</span>
                        <span className="text-muted-foreground text-xs">({fw.uploadedAt})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Target Selection - Filter Based */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                배포 대상
              </Label>
              
              {/* Filter Dropdowns */}
              <div className="grid grid-cols-2 gap-2">
                {/* Customer Filter */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">고객사</Label>
                  <Select
                    value={deployForm.selectedCustomers[0] || "all"}
                    onValueChange={(v) => setDeployForm({
                      ...deployForm,
                      selectedCustomers: v === "all" ? [] : [v],
                      selectedRegions: [],
                      selectedGroups: [],
                      selectedDevices: [],
                    })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {customerOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Region Filter */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">지역</Label>
                  <Select
                    value={deployForm.selectedRegions[0] || "all"}
                    onValueChange={(v) => setDeployForm({
                      ...deployForm,
                      selectedRegions: v === "all" ? [] : [v],
                      selectedGroups: [],
                      selectedDevices: [],
                    })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {regionOptions.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Group Filter */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">그룹</Label>
                  <Select
                    value={deployForm.selectedGroups[0] || "all"}
                    onValueChange={(v) => setDeployForm({
                      ...deployForm,
                      selectedGroups: v === "all" ? [] : [v],
                      selectedDevices: [],
                    })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {deviceGroups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Device Filter */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">단말</Label>
                  <Select
                    value={deployForm.selectedDevices[0] || "all"}
                    onValueChange={(v) => setDeployForm({
                      ...deployForm,
                      selectedDevices: v === "all" ? [] : [v],
                    })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {mockDevices.slice(0, 30).map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Selected count display */}
              <div className="p-3 border rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  배포 대상: <span className="font-medium text-foreground">{getSelectedDeviceCount()}대</span>
                </p>
              </div>
            </div>
            
            {/* Schedule */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                배포 일정
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={deployForm.scheduleType === "immediate" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setDeployForm({ ...deployForm, scheduleType: "immediate" })}
                >
                  즉시 배포
                </Button>
                <Button
                  type="button"
                  variant={deployForm.scheduleType === "scheduled" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setDeployForm({ ...deployForm, scheduleType: "scheduled" })}
                >
                  예약 배포
                </Button>
              </div>
              
              {deployForm.scheduleType === "scheduled" && (
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={deployForm.scheduledDate}
                    onChange={(e) => setDeployForm({ ...deployForm, scheduledDate: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    type="time"
                    value={deployForm.scheduledTime}
                    onChange={(e) => setDeployForm({ ...deployForm, scheduledTime: e.target.value })}
                    className="w-32"
                  />
                </div>
              )}
            </div>
            
            {/* Rollback Option */}
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <Checkbox
                id="rollback"
                checked={deployForm.rollbackEnabled}
                onCheckedChange={(checked) => 
                  setDeployForm({ ...deployForm, rollbackEnabled: checked as boolean })
                }
              />
              <div className="flex-1">
                <Label htmlFor="rollback" className="text-sm font-medium cursor-pointer">
                  자동 롤백 활성화
                </Label>
                <p className="text-xs text-muted-foreground">
                  배포 실패율 30% 초과 시 자동으로 이전 버전으로 롤백합니다.
                </p>
              </div>
            </div>
          </div>
          
          <SheetFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setDeploySheetOpen(false)}>
              취소
            </Button>
            <Button 
              onClick={handleDeploy}
              disabled={!isDeployValid()}
            >
              <Rocket className="h-4 w-4 mr-2" />
              {deployForm.scheduleType === "immediate" ? "배포 시작" : "배포 예약"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
