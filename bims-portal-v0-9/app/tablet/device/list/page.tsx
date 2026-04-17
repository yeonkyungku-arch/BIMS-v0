"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Smartphone,
  MapPin,
  Zap,
  Sun,
  AlertCircle,
  Search,
  RefreshCw,
} from "lucide-react";

// Mock device data for field engineers
const MOCK_DEVICES = [
  {
    id: "TERM-001",
    name: "강남역 1번 정류장",
    location: "강남역 1번 출구 앞",
    status: "활성",
    battery: 92,
    signal: 4,
    lastSync: "2분 전",
    powerType: "grid",
    hasFault: false,
  },
  {
    id: "TERM-002",
    name: "강남역 2번 정류장",
    location: "강남역 2번 출구 앞",
    status: "활성",
    battery: 78,
    signal: 3,
    lastSync: "5분 전",
    powerType: "solar",
    hasFault: false,
  },
  {
    id: "TERM-003",
    name: "서초역 정류장",
    location: "서초역 1번 출구 앞",
    status: "오프라인",
    battery: 15,
    signal: 0,
    lastSync: "2시간 전",
    powerType: "solar",
    hasFault: true,
  },
  {
    id: "TERM-004",
    name: "교대역 정류장",
    location: "교대역 3번 출구 앞",
    status: "활성",
    battery: 88,
    signal: 4,
    lastSync: "1분 전",
    powerType: "grid",
    hasFault: false,
  },
  {
    id: "TERM-005",
    name: "남부터미널 정류장",
    location: "남부터미널 앞",
    status: "주의",
    battery: 25,
    signal: 2,
    lastSync: "3분 전",
    powerType: "solar",
    hasFault: false,
  },
];

export default function DeviceListPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return MOCK_DEVICES.filter((device) => {
      if (statusFilter !== "all" && device.status !== statusFilter)
        return false;
      if (
        searchQuery &&
        !device.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !device.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [statusFilter, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "활성":
        return "bg-green-100 text-green-800";
      case "주의":
        return "bg-yellow-100 text-yellow-800";
      case "오프라인":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSignalBars = (signal: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-3 w-1 rounded-sm ${
              i <= signal ? "bg-blue-600" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold">단말 관리</h2>
        <Button
          size="lg"
          variant="outline"
          className="h-12 px-6"
          onClick={() => window.location.reload()}
          title="현황 새로고침"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          새로고침
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48 h-12 text-base">
            <SelectValue placeholder="상태 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 상태</SelectItem>
            <SelectItem value="활성">활성</SelectItem>
            <SelectItem value="주의">주의</SelectItem>
            <SelectItem value="오프라인">오프라인</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="단말명 또는 ID 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">
        {filtered.length}개 단말 발견
      </p>

      {/* Device cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <p className="text-lg text-muted-foreground">
              조건에 맞는 단말이 없습니다.
            </p>
          </div>
        ) : (
          filtered.map((device) => (
            <Card
              key={device.id}
              className="cursor-pointer hover:shadow-lg transition-all active:scale-[0.97]"
              onClick={() => router.push(`/tablet/device/${device.id}`)}
            >
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base truncate">
                      {device.name}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {device.location}
                    </p>
                  </div>
                  <Badge className={`text-xs font-semibold whitespace-nowrap ${getStatusColor(device.status)}`}>
                    {device.status}
                  </Badge>
                </div>

                {/* Device ID */}
                <div className="text-xs font-mono text-muted-foreground bg-muted/50 p-2 rounded">
                  ID: {device.id}
                </div>

                {/* Status indicators */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {/* Battery */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      배터리
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            device.battery > 50
                              ? "bg-green-500"
                              : device.battery > 20
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${device.battery}%` }}
                        />
                      </div>
                      <span className="font-semibold text-xs w-8">
                        {device.battery}%
                      </span>
                    </div>
                  </div>

                  {/* Signal */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      신호 강도
                    </div>
                    <div className="flex items-center gap-1">
                      {getSignalBars(device.signal)}
                      <span className="text-xs text-muted-foreground ml-1">
                        {device.signal}/4
                      </span>
                    </div>
                  </div>
                </div>

                {/* Power type and sync info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-muted">
                  <div className="flex items-center gap-1">
                    {device.powerType === "solar" ? (
                      <>
                        <Sun className="h-4 w-4" />
                        태양광
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        상용전
                      </>
                    )}
                  </div>
                  <span>동기: {device.lastSync}</span>
                </div>

                {/* Fault indicator */}
                {device.hasFault && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-red-700">
                      장애 발생 - 긴급 점검 필요
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
