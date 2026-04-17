"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, CheckCircle2, Clock, AlertTriangle, XCircle, Shield } from "lucide-react";
import { mockInstallations, type Installation, type InstallationStatus } from "@/lib/mock-data";

const statusConfig: Record<InstallationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "대기 중", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", icon: <Clock className="h-3 w-3" /> },
  in_progress: { label: "진행 중", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", icon: <Clock className="h-3 w-3" /> },
  completed: { label: "완료", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", icon: <CheckCircle2 className="h-3 w-3" /> },
  failed: { label: "실패", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", icon: <XCircle className="h-3 w-3" /> },
  verified: { label: "검증완료", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300", icon: <Shield className="h-3 w-3" /> },
};

export default function InstallationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verifyDialog, setVerifyDialog] = useState<Installation | null>(null);

  const filteredInstallations = useMemo(() => {
    return mockInstallations.filter((inst) => {
      const matchesSearch =
        inst.stopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.deviceSerialNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.technician.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || inst.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const statusCounts = useMemo(() => {
    return {
      pending: mockInstallations.filter((i) => i.status === "pending").length,
      in_progress: mockInstallations.filter((i) => i.status === "in_progress").length,
      completed: mockInstallations.filter((i) => i.status === "completed").length,
      failed: mockInstallations.filter((i) => i.status === "failed").length,
      verified: mockInstallations.filter((i) => i.status === "verified").length,
    };
  }, []);

  const handleVerify = (installation: Installation) => {
    setVerifyDialog(installation);
  };

  const confirmVerify = () => {
    if (verifyDialog) {
      // TODO: API call to verify installation
      setVerifyDialog(null);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      <PageHeader
        title="설치 관리"
        description="단말 설치 현황을 관리하고 검증합니다"
        breadcrumbs={[
          { label: "현장 운영", href: "/field-operations" },
          { label: "설치 관리" },
        ]}
      />

      {/* Status Summary */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-muted-foreground">대기 중</span>
            </div>
            <p className="text-2xl font-bold mt-1">{statusCounts.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">진행 중</span>
            </div>
            <p className="text-2xl font-bold mt-1">{statusCounts.in_progress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">완료</span>
            </div>
            <p className="text-2xl font-bold mt-1">{statusCounts.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">실패</span>
            </div>
            <p className="text-2xl font-bold mt-1">{statusCounts.failed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">검증완료</span>
            </div>
            <p className="text-2xl font-bold mt-1">{statusCounts.verified}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">설치 목록</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="정류장, 시리얼, 기사명 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="pending">대기 중</SelectItem>
                  <SelectItem value="in_progress">진행 중</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                  <SelectItem value="failed">실패</SelectItem>
                  <SelectItem value="verified">검증완료</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>설치 ID</TableHead>
                <TableHead>정류장</TableHead>
                <TableHead>단말 시리얼</TableHead>
                <TableHead>설치 기사</TableHead>
                <TableHead>파트너사</TableHead>
                <TableHead>설치일</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInstallations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    검색 결과가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                filteredInstallations.map((inst) => (
                  <TableRow key={inst.id}>
                    <TableCell className="font-mono text-xs">{inst.id}</TableCell>
                    <TableCell>{inst.stopName}</TableCell>
                    <TableCell className="font-mono text-xs">{inst.deviceSerialNo}</TableCell>
                    <TableCell>{inst.technician}</TableCell>
                    <TableCell>{inst.partnerName}</TableCell>
                    <TableCell>{inst.installationDate}</TableCell>
                    <TableCell>
                      <Badge className={`${statusConfig[inst.status].color} gap-1`}>
                        {statusConfig[inst.status].icon}
                        {statusConfig[inst.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {inst.status === "completed" && (
                        <Button size="sm" variant="outline" onClick={() => handleVerify(inst)}>
                          검증 승인
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Verify Dialog */}
      <AlertDialog open={!!verifyDialog} onOpenChange={() => setVerifyDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>설치 검증 승인</AlertDialogTitle>
            <AlertDialogDescription>
              {verifyDialog?.stopName}의 설치를 검증 완료 처리하시겠습니까?
              검증 완료된 단말은 정상 운영 상태로 전환됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmVerify}>검증 승인</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
