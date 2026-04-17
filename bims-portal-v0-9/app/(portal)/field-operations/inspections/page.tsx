"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ClipboardCheck, AlertTriangle, Wrench } from "lucide-react";
import { mockInspections, type Inspection, type InspectionType } from "@/lib/mock-data";

const typeConfig: Record<InspectionType, { label: string; color: string; icon: React.ReactNode }> = {
  regular: { label: "정기 점검", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", icon: <ClipboardCheck className="h-3 w-3" /> },
  incident: { label: "장애 대응", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", icon: <AlertTriangle className="h-3 w-3" /> },
  maintenance: { label: "유지보수", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", icon: <Wrench className="h-3 w-3" /> },
};

export default function InspectionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredInspections = useMemo(() => {
    return mockInspections.filter((insp) => {
      const matchesSearch =
        insp.stopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insp.deviceSerialNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insp.inspector.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || insp.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [searchQuery, typeFilter]);

  const typeCounts = useMemo(() => {
    return {
      regular: mockInspections.filter((i) => i.type === "regular").length,
      incident: mockInspections.filter((i) => i.type === "incident").length,
      maintenance: mockInspections.filter((i) => i.type === "maintenance").length,
    };
  }, []);

  const issueCount = useMemo(() => {
    return mockInspections.filter((i) => i.maintenanceNeeded).length;
  }, []);

  return (
    <div className="flex-1 p-6 space-y-6">
      <PageHeader
        title="현장 점검"
        description="현장 점검 기록을 관리합니다"
        breadcrumbs={[
          { label: "현장 운영", href: "/field-operations" },
          { label: "현장 점검" },
        ]}
      />

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">정기 점검</span>
            </div>
            <p className="text-2xl font-bold mt-1">{typeCounts.regular}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">장애 대응</span>
            </div>
            <p className="text-2xl font-bold mt-1">{typeCounts.incident}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">유지보수</span>
            </div>
            <p className="text-2xl font-bold mt-1">{typeCounts.maintenance}</p>
          </CardContent>
        </Card>
        <Card className={issueCount > 0 ? "border-red-300 bg-red-50 dark:bg-red-950/20" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">조치 필요</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-red-600">{issueCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Inspections List */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">점검 기록</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="정류장, 시리얼, 점검자 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="유형" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="regular">정기 점검</SelectItem>
                  <SelectItem value="incident">장애 대응</SelectItem>
                  <SelectItem value="maintenance">유지보수</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>점검 ID</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>정류장</TableHead>
                <TableHead>단말 시리얼</TableHead>
                <TableHead>점검자</TableHead>
                <TableHead>점검일</TableHead>
                <TableHead>전원</TableHead>
                <TableHead>화면</TableHead>
                <TableHead>통신</TableHead>
                <TableHead>조치필요</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInspections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    검색 결과가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                filteredInspections.map((insp) => (
                  <TableRow key={insp.id}>
                    <TableCell className="font-mono text-xs">{insp.id}</TableCell>
                    <TableCell>
                      <Badge className={`${typeConfig[insp.type].color} gap-1`}>
                        {typeConfig[insp.type].icon}
                        {typeConfig[insp.type].label}
                      </Badge>
                    </TableCell>
                    <TableCell>{insp.stopName}</TableCell>
                    <TableCell className="font-mono text-xs">{insp.deviceSerialNo}</TableCell>
                    <TableCell>{insp.inspector}</TableCell>
                    <TableCell>{insp.inspectionDate}</TableCell>
                    <TableCell>
                      <Badge variant={insp.powerStatus === "on" ? "default" : "destructive"} className="text-[10px]">
                        {insp.powerStatus === "on" ? "정상" : insp.powerStatus === "off" ? "꺼짐" : "배터리 부족"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={insp.displayStatus === "normal" ? "default" : "destructive"} className="text-[10px]">
                        {insp.displayStatus === "normal" ? "정상" : insp.displayStatus === "dimmed" ? "어두움" : "미작동"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={insp.connectivity === "connected" ? "default" : "destructive"} className="text-[10px]">
                        {insp.connectivity === "connected" ? "정상" : insp.connectivity === "disconnected" ? "끊김" : "불안정"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {insp.maintenanceNeeded && (
                        <Badge variant="destructive" className="text-[10px]">필요</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
