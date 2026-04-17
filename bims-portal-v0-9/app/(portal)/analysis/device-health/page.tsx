"use client";

import { useState } from "react";
import {
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Battery,
  Thermometer,
  BarChart3,
  PieChart,
} from "lucide-react";
import { useRBAC } from "@/contexts/rbac-context";
import { AccessDenied } from "@/components/access-denied";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// Mock data for analysis summary
const analysisSummary = [
  { id: "DEV-001", deviceName: "BIS-SOLAR-001", customer: "서울시", health: "양호", anomalyCount: 0, prediction: "안정", trend: "up" },
  { id: "DEV-002", deviceName: "BIS-SOLAR-002", customer: "서울시", health: "경고", anomalyCount: 2, prediction: "주의", trend: "down" },
  { id: "DEV-003", deviceName: "BIS-GRID-001", customer: "부산시", health: "위험", anomalyCount: 5, prediction: "위험", trend: "down" },
  { id: "DEV-004", deviceName: "BIS-SOLAR-003", customer: "대전시", health: "양호", anomalyCount: 0, prediction: "안정", trend: "stable" },
  { id: "DEV-005", deviceName: "BIS-GRID-002", customer: "인천시", health: "양호", anomalyCount: 1, prediction: "안정", trend: "up" },
];

export default function AnalysisDashboardPage() {
  const { can } = useRBAC();
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [selectedDevice, setSelectedDevice] = useState<typeof analysisSummary[0] | null>(null);

  if (!can("analysis.dashboard.read")) {
    return <AccessDenied />;
  }

  const filteredData = analysisSummary.filter((item) => {
    const matchesSearch = item.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCustomer = customerFilter === "all" || item.customer === customerFilter;
    return matchesSearch && matchesCustomer;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <PageHeader
          title="분석 대시보드"
          description="단말 분석 종합 현황 및 예측 요약"
          breadcrumbs={[
            { label: "단말 분석", href: "/analysis/dashboard" },
            { label: "분석 대시보드" },
          ]}
          section="analysis"
        >
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 h-9 text-sm">
              <Download className="h-4 w-4" />
              내보내기
            </Button>
          </div>
        </PageHeader>
      </div>

      {/* Metrics Cards */}
      <div className="px-6 py-3 border-b bg-background grid grid-cols-6 gap-3">
        <Card className="p-3">
          <div className="text-xs text-muted-foreground font-medium">전체 단말</div>
          <div className="text-xl font-bold mt-1">1,248</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground font-medium">정상</div>
          <div className="text-xl font-bold mt-1 text-green-600">1,180</div>
        </Card>
        <Card className="p-3 bg-amber-50/50">
          <div className="text-xs text-amber-700 font-medium">주의</div>
          <div className="text-xl font-bold mt-1 text-amber-600">52</div>
        </Card>
        <Card className="p-3 bg-red-50/50">
          <div className="text-xs text-red-700 font-medium">위험</div>
          <div className="text-xl font-bold mt-1 text-red-600">16</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground font-medium">이상 탐지</div>
          <div className="text-xl font-bold mt-1">38</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground font-medium">예측 경고</div>
          <div className="text-xl font-bold mt-1">12</div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="단말명, 고객사로 검색..."
              className="pl-9 h-9 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-32 h-9 text-sm">
              <SelectValue placeholder="고객사" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="서울시">서울시</SelectItem>
              <SelectItem value="부산시">부산시</SelectItem>
              <SelectItem value="대전시">대전시</SelectItem>
              <SelectItem value="인천시">인천시</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 px-6 py-3 overflow-y-auto">
        <div className="rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 h-10">
              <TableRow>
                <TableHead className="text-xs font-semibold">단말 ID</TableHead>
                <TableHead className="text-xs font-semibold">단말명</TableHead>
                <TableHead className="text-xs font-semibold">고객사</TableHead>
                <TableHead className="text-xs font-semibold">상태</TableHead>
                <TableHead className="text-xs font-semibold">이상 횟수</TableHead>
                <TableHead className="text-xs font-semibold">예측</TableHead>
                <TableHead className="text-xs font-semibold">추세</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow
                  key={item.id}
                  className="h-10 cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedDevice(item)}
                >
                  <TableCell className="text-xs font-mono">{item.id}</TableCell>
                  <TableCell className="text-xs font-medium">{item.deviceName}</TableCell>
                  <TableCell className="text-xs">{item.customer}</TableCell>
                  <TableCell>
                    <Badge
                      variant={item.health === "Good" ? "default" : item.health === "Warning" ? "secondary" : "destructive"}
                      className="text-[10px]"
                    >
                      {item.health}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{item.anomalyCount}</TableCell>
                  <TableCell className="text-xs">{item.prediction}</TableCell>
                  <TableCell>
                    {item.trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {item.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                    {item.trend === "stable" && <Activity className="h-4 w-4 text-gray-400" />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Right Drawer */}
      <Sheet open={!!selectedDevice} onOpenChange={(open) => !open && setSelectedDevice(null)}>
        <SheetContent className="w-[520px] sm:max-w-[520px] p-0 flex flex-col">
          <SheetHeader className="p-4 border-b sticky top-0 bg-background z-10">
            <SheetTitle>단말 분석 상세</SheetTitle>
          </SheetHeader>
          {selectedDevice && (
            <div className="flex-1 overflow-y-auto p-4 space-y-6 text-sm">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">기본 정보</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">단말 ID:</span> {selectedDevice.id}</div>
                  <div><span className="text-muted-foreground">단말명:</span> {selectedDevice.deviceName}</div>
                  <div><span className="text-muted-foreground">고객사:</span> {selectedDevice.customer}</div>
                  <div><span className="text-muted-foreground">상태:</span> {selectedDevice.health}</div>
                </div>
              </div>
              <div className="space-y-3 pt-3 border-t">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">분석 요약</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">이상 횟수:</span> {selectedDevice.anomalyCount}</div>
                  <div><span className="text-muted-foreground">예측:</span> {selectedDevice.prediction}</div>
                </div>
              </div>
              <div className="space-y-3 pt-3 border-t">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">관련 기능</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8">
                    텔레메트리 분석 열기
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8">
                    장애 예측 열기
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs gap-2 h-8">
                    라이프사이클 분석 열기
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
