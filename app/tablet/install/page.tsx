"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  mockInstallAssignments,
  INSTALL_STATUS_LABELS,
  INSTALL_STATUS_COLORS,
  type InstallStatus,
} from "@/lib/tablet-install-data";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Calendar, Zap, Sun } from "lucide-react";
import { POWER_TYPE_LABEL_KO } from "@/contracts/rms/device-power-type";

export default function InstallListPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return mockInstallAssignments.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !a.stationName.toLowerCase().includes(q) &&
          !a.terminalId.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [statusFilter, searchQuery]);

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-5">설치 구축 목록</h2>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-12 text-sm">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="ASSIGNED">배정됨</SelectItem>
            <SelectItem value="IN_PROGRESS">진행 중</SelectItem>
            <SelectItem value="PENDING_APPROVAL">승인 대기</SelectItem>
            <SelectItem value="APPROVED">승인 완료</SelectItem>
            <SelectItem value="REJECTED">반려</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="정류장 또는 단말 ID 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-sm"
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground mb-3">{filtered.length}건</p>

      {/* Card list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">조건에 맞는 설치 건이 없습니다.</p>
          </div>
        ) : (
          filtered.map((assignment) => (
            <Card
              key={assignment.id}
              className="cursor-pointer hover:border-foreground/20 transition-all active:scale-[0.995]"
              onClick={() => router.push(`/tablet/install/${assignment.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-bold">{assignment.stationName}</span>
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-medium px-2 py-0.5 ${
                          INSTALL_STATUS_COLORS[assignment.status]
                        }`}
                      >
                        {INSTALL_STATUS_LABELS[assignment.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-mono">{assignment.terminalId}</span>
                      <span>{assignment.customerName}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {assignment.powerType === "SOLAR" ? (
                          <Sun className="h-3 w-3" />
                        ) : (
                          <Zap className="h-3 w-3" />
                        )}
                        {POWER_TYPE_LABEL_KO[assignment.powerType]}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {assignment.scheduledDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {assignment.address.split(" ").slice(0, 3).join(" ")}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
