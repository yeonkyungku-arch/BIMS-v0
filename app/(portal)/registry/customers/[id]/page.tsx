"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Building2,
  MapPin,
  FolderTree,
  HardDrive,
  Wrench,
  Users,
  ScrollText,
  Link2,
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  MapPinned,
  ChevronRight,
  ExternalLink,
  Plus,
  X,
  AlertTriangle,
  Check,
  Clock,
} from "lucide-react";

import { useRBAC } from "@/contexts/rbac-context";
import { useScope } from "@/contexts/scope-context";
import { canPerformActions } from "@/lib/rbac";
import { canAccessCustomer, getAccessibleCustomerIds } from "@/lib/permission-helpers";
import {
  mockCustomerRecords,
  mockBusStops,
  mockBISGroups,
  mockDevices,
  mockMaintenanceLogs,
  mockPartners,
  mockVendorLinkLogs,
  type CustomerRecord,
  type PartnerRecord,
  type VendorLinkLog,
} from "@/lib/mock-data";
import { REGISTRY } from "@/contexts/scope-context";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Status helpers
const STATUS_LABEL: Record<string, string> = {
  active: "운영중",
  inactive: "비활성",
  onboarding: "설정중",
};

// ============================================================
// OVERVIEW TAB
// ============================================================

function OverviewTab({ customer }: { customer: CustomerRecord }) {
  const locations = mockBusStops.filter((l) => l.customerId === customer.id);
  const groups = mockBISGroups.filter((g) => g.customerId === customer.id);
  const devices = mockDevices.filter((d) => d.customerId === customer.id);
  const recentMaint = mockMaintenanceLogs
    .filter((m) => devices.some((d) => d.id === m.deviceId))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard icon={MapPin} label="등록 정류장" value={locations.length} href={`/registry/customers/${customer.id}?tab=locations`} />
        <SummaryCard icon={FolderTree} label="BIS 그룹" value={groups.length} href={`/registry/customers/${customer.id}?tab=groups`} />
        <SummaryCard icon={HardDrive} label="등록 BIS 단말" value={devices.length} href="/registry/devices" />
        <SummaryCard icon={Wrench} label="최근 유지보수" value={recentMaint.length > 0 ? recentMaint[0].timestamp.split(" ")[0] : "-"} href="/field-operations/work-orders" />
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">기본 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
            <InfoRow label="고객사명" value={customer.name} />
            <InfoRow label="유형" value={customer.type} />
            <InfoRow label="서비스 운영사" value={customer.serviceCompanyName} />
            <InfoRow label="상태" value={STATUS_LABEL[customer.status] || customer.status} />
            <InfoRow label="계약 기간" value={`${customer.contractStart} ~ ${customer.contractEnd}`} />
            <InfoRow label="등록일" value={customer.createdAt} />
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">연락처 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">담당자 1</h4>
              <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground w-20">성명</span>
                  <span>{customer.contactPerson1Name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground w-20">이메일</span>
                  <span>{customer.contactPerson1Email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground w-20">전화</span>
                  <span>{customer.contactPerson1Phone}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">담당자 2</h4>
              <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground w-20">성명</span>
                  <span>{customer.contactPerson2Name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground w-20">이메일</span>
                  <span>{customer.contactPerson2Email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground w-20">전화</span>
                  <span>{customer.contactPerson2Phone}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <MapPinned className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground w-20">주소</span>
              <span>{customer.address}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">관련 엔티티 바로가기</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <Link href="/registry/stops">
              <div className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50 transition-colors">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">정류장 관리</span>
                <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
              </div>
            </Link>
            <Link href="/registry/groups">
              <div className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50 transition-colors">
                <FolderTree className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">BIS 그룹 관리</span>
                <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
              </div>
            </Link>
            <Link href="/rms/devices">
              <div className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50 transition-colors">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">BIS 단말 모니터링</span>
                <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value: string | number; href: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-semibold text-lg">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground min-w-28">{label}</span>
      <span>{value}</span>
    </div>
  );
}

// ============================================================
// LINK MANAGEMENT TAB
// ============================================================

function LinkManagementTab({ customer, canEdit }: { customer: CustomerRecord; canEdit: boolean }) {
  const { currentRole } = useRBAC();
  const isCustomerUser = currentRole === "operator" || currentRole === "viewer";
  const isSuperAdmin = currentRole === "super_admin" || currentRole === "system_admin";

  const serviceCompany = mockPartners.find((s) => s.id === customer.serviceCompanyId);
  const linkedVendors = mockPartners.filter((s) => customer.linkedVendorIds.includes(s.id));
  const linkLogs = mockVendorLinkLogs
    .filter((l) => l.customerId === customer.id)
    .sort((a, b) => b.performedAt.localeCompare(a.performedAt));

  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState<string | null>(null);
  const [showChangeServiceCo, setShowChangeServiceCo] = useState(false);

  // Approved vendors not already linked
  const availableVendors = mockPartners.filter(
    (s) =>
      (s.type === "maintenance_contractor" || s.type === "installation_contractor") &&
      !customer.linkedVendorIds.includes(s.id)
  );
  // For customer users: filter to only show approved vendors
  const filteredAvailableVendors = isCustomerUser
    ? availableVendors.filter((v) => v.approvalStatus === "approved")
    : availableVendors;

  return (
    <div className="space-y-6">
      {/* Service Company Link */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">서비스 운영사 연결</CardTitle>
              <CardDescription>현재 고객사의 서비스 운영을 담당하는 회사</CardDescription>
            </div>
            {isSuperAdmin && (
              <Button variant="outline" size="sm" onClick={() => setShowChangeServiceCo(true)}>
                변경
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {serviceCompany ? (
            <div className="flex items-center gap-4 p-3 border rounded-md bg-muted/30">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{serviceCompany.name}</p>
                <p className="text-xs text-muted-foreground">
                  {serviceCompany.companyAddress} / {serviceCompany.contactPerson1Email}
                </p>
              </div>
              <Badge variant="default" className="text-xs">연결됨</Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">연결된 서비스 운영사가 없습니다.</p>
          )}
          {isCustomerUser && (
            <p className="text-xs text-muted-foreground mt-2">
              서비스 운영사 변경은 최고 관리자만 가능합니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Maintenance / Installation Vendor Links */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">유지보수 / 설치 업체 연결</CardTitle>
              <CardDescription>
                {isCustomerUser
                  ? "승인된 업체만 선택 가능합니다."
                  : "최고 관리자가 승인한 업체만 연결 가능합니다."}
              </CardDescription>
            </div>
            {(isSuperAdmin || (isCustomerUser && canEdit)) && (
              <Button size="sm" onClick={() => setShowAddVendor(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                업체 추가
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>업체명</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>지역</TableHead>
                <TableHead>능력</TableHead>
                <TableHead>승인 상태</TableHead>
                <TableHead>연결일</TableHead>
                {(isSuperAdmin || canEdit) && <TableHead className="w-20">작업</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {linkedVendors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    연결된 업체가 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {linkedVendors.map((vendor) => {
                const linkLog = linkLogs.find(
                  (l) => l.vendorId === vendor.id && l.action === "linked"
                );
                return (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {vendor.type === "maintenance_contractor" ? "유지보수" : "설치"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{vendor.region.join(", ")}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {vendor.capabilities.slice(0, 2).map((c) => (
                          <Badge key={c} variant="secondary" className="text-xs">
                            {c}
                          </Badge>
                        ))}
                        {vendor.capabilities.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{vendor.capabilities.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={vendor.approvalStatus === "approved" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {vendor.approvalStatus === "approved" ? "승인" : "중지"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {linkLog?.performedAt.split(" ")[0] || "-"}
                    </TableCell>
                    {(isSuperAdmin || canEdit) && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setShowUnlinkConfirm(vendor.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Traceability */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">연결 변경 이력</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>일시</TableHead>
                <TableHead>업체</TableHead>
                <TableHead>작업</TableHead>
                <TableHead>수행자</TableHead>
                <TableHead>사유</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linkLogs.slice(0, 10).map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">{log.performedAt}</TableCell>
                  <TableCell className="text-sm font-medium">{log.vendorName}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.action === "linked"
                          ? "default"
                          : log.action === "unlinked"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {log.action === "linked"
                        ? "연결"
                        : log.action === "unlinked"
                          ? "해제"
                          : log.action === "suspended"
                            ? "중지"
                            : "재활성화"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{log.performedBy}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.reason || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Vendor Dialog */}
      <Dialog open={showAddVendor} onOpenChange={setShowAddVendor}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>업체 연결 추가</DialogTitle>
            <DialogDescription>
              {isCustomerUser
                ? "승인된 업체 목록에서 선택하세요."
                : "허가된 업체 중 연결할 업체를 선택하세요."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredAvailableVendors.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                추가 가능한 업체가 없습니다.
              </p>
            )}
            {filteredAvailableVendors.map((v) => (
              <div
                key={v.id}
                className={`flex items-center gap-3 p-3 rounded-md border transition-colors ${
                  v.approvalStatus === "suspended"
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-muted/50 cursor-pointer"
                }`}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{v.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.type === "maintenance_contractor" ? "유지보수" : "설치"} / {v.region.join(", ")}
                  </p>
                </div>
                {v.approvalStatus === "suspended" ? (
                  <div className="text-xs text-muted-foreground">
                    <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
                    {v.suspendReason}
                  </div>
                ) : isCustomerUser ? (
                  <Button size="sm" variant="outline">요청 제출</Button>
                ) : (
                  <Button size="sm" onClick={() => setShowAddVendor(false)}>연결</Button>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddVendor(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlink Confirmation */}
      <AlertDialog open={!!showUnlinkConfirm} onOpenChange={() => setShowUnlinkConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>업체 연결 해제</AlertDialogTitle>
            <AlertDialogDescription>
              이 업체와의 연결을 해제하시겠습니까? 이 작업은 감사 로그에 기록됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowUnlinkConfirm(null)}>
              연결 해제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Service Company Dialog */}
      <Dialog open={showChangeServiceCo} onOpenChange={setShowChangeServiceCo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>서비스 운영사 변경</DialogTitle>
            <DialogDescription>새로운 서비스 운영사를 선택하세요.</DialogDescription>
          </DialogHeader>
          <Select defaultValue={customer.serviceCompanyId}>
            <SelectTrigger>
              <SelectValue placeholder="서비스 운영사 선택" />
            </SelectTrigger>
            <SelectContent>
              {mockStakeholders
                .filter((s) => s.type === "service_company")
                .map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangeServiceCo(false)}>
              취소
            </Button>
            <Button onClick={() => setShowChangeServiceCo(false)}>변경 저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// LOCATIONS TAB
// ============================================================

function LocationsTab({ customer }: { customer: CustomerRecord }) {
  const locations = mockBusStops.filter((l) => l.customerId === customer.id);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">등록 정류장 ({locations.length})</CardTitle>
            <CardDescription>이 고객사에 등록된 정류장 목록</CardDescription>
          </div>
          <Link href="/registry/stops">
            <Button variant="outline" size="sm">
              정류장 관리로 이동
              <ExternalLink className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>정류장 ID</TableHead>
              <TableHead>정류장명</TableHead>
              <TableHead>BIS API ID</TableHead>
              <TableHead>주소</TableHead>
              <TableHead>좌표</TableHead>
              <TableHead>등록일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((loc) => (
              <TableRow key={loc.id}>
                <TableCell className="font-mono text-xs">{loc.id}</TableCell>
                <TableCell className="font-medium text-sm">{loc.name}</TableCell>
                <TableCell className="font-mono text-xs">{loc.busStopId}</TableCell>
                <TableCell className="text-sm">{loc.address}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{loc.createdAt.split(" ")[0]}</TableCell>
              </TableRow>
            ))}
            {locations.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  등록된 정류장이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ============================================================
// BIS GROUPS TAB
// ============================================================

function GroupsTab({ customer }: { customer: CustomerRecord }) {
  const groups = mockBISGroups.filter((g) => g.customerId === customer.id);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">BIS 그룹 ({groups.length})</CardTitle>
            <CardDescription>이 고객사에 등록된 BIS 그룹 목록</CardDescription>
          </div>
          <Link href="/registry/groups">
            <Button variant="outline" size="sm">
              BIS 그룹 관리로 이동
              <ExternalLink className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>그룹 ID</TableHead>
              <TableHead>그룹명</TableHead>
              <TableHead>정류장</TableHead>
              <TableHead>BIS 단말 수</TableHead>
              <TableHead>주변기기</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>설치일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-mono text-xs">{g.id}</TableCell>
                <TableCell className="font-medium text-sm">{g.name}</TableCell>
                <TableCell className="text-sm">{g.locationName}</TableCell>
                <TableCell className="text-sm">{g.primaryDeviceIds.length}</TableCell>
                <TableCell className="text-sm">{g.peripherals.length}</TableCell>
                <TableCell>
                  <Badge variant={g.status === "active" ? "default" : "secondary"} className="text-xs">
                    {g.status === "active" ? "활성" : "비활성"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{g.installationDate}</TableCell>
              </TableRow>
            ))}
            {groups.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  등록된 BIS 그룹이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ============================================================
// USERS TAB (read-only summary)
// ============================================================

function UsersTab({ customer }: { customer: CustomerRecord }) {
  // Mock users associated with this customer
  const customerUsers = [
    { id: "U001", name: customer.contactPerson1Name, email: customer.contactPerson1Email, role: "고객 관리자", lastLogin: "2025-02-02 09:15" },
    { id: "U002", name: customer.contactPerson2Name, email: customer.contactPerson2Email, role: "운영자", lastLogin: "2025-02-01 18:30" },
  ];

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-base">소속 사용자 (읽기 전용)</CardTitle>
          <CardDescription>이 고객사에 소속된 사용자 목록입니다. 사용자 관리는 관리자 설정에서 수행하세요.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>마지막 로그인</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customerUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-sm">{u.name}</TableCell>
                <TableCell className="text-sm">{u.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{u.role}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.lastLogin}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ============================================================
// AUDIT TAB
// ============================================================

function AuditTab({ customer }: { customer: CustomerRecord }) {
  const auditEntries = [
    { id: "A001", action: "고객사 정보 수정", user: "최고관리자", timestamp: "2025-01-20 14:30", detail: "연락처 정보 변경" },
    { id: "A002", action: "업체 연결 추가", user: "최고관리자", timestamp: "2024-11-10 14:00", detail: "남부유지보수 연결 (CUS003)" },
    { id: "A003", action: "업체 연결 추가", user: "최고관리자", timestamp: "2024-11-05 10:00", detail: "스마트설치 연결 (CUS003)" },
    { id: "A004", action: "고객사 등록", user: "최고관리자", timestamp: customer.createdAt, detail: "신규 고객사 등록" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">감사 로그</CardTitle>
        <CardDescription>이 고객사에 대한 변경 이력</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>일시</TableHead>
              <TableHead>작업</TableHead>
              <TableHead>수행자</TableHead>
              <TableHead>상세</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-sm">{entry.timestamp}</TableCell>
                <TableCell className="font-medium text-sm">{entry.action}</TableCell>
                <TableCell className="text-sm">{entry.user}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{entry.detail}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ============================================================
// MAIN CUSTOMER DETAIL PAGE
// ============================================================

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentRole } = useRBAC();
  const canEdit = canPerformActions(currentRole, "registry");

  const customer = mockCustomerRecords.find((c) => c.id === id);

  // Permission check
  if (!customer || !canAccessCustomer(currentRole, customer.id)) {
    return (
      <div className="p-6">
        <PageHeader
          title="고객사 상세"
          description="고객사 마스터 정보 및 연결된 정류장·단말·파트너 현황"
          section="registry"
          breadcrumbs={[
            { label: "레지스트리", href: "/registry/customers" },
            { label: "고객사 관리", href: "/registry/customers" },
            { label: "접근 불가" },
          ]}
        />
        <Card>
          <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">해당 고객사에 대한 접근 권한이 없습니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="고객사 상세"
        description="고객사 마스터 정보 및 연결된 정류장·단말·파트너 현황"
        section="registry"
        breadcrumbs={[
          { label: "레지스트리", href: "/registry/customers" },
          { label: "고객사 관리", href: "/registry/customers" },
          { label: customer.name },
        ]}
      />

      {/* Header with customer name and status */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
          <Building2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">{customer.name}</h2>
            <Badge variant={customer.status === "active" ? "default" : "secondary"}>
              {STATUS_LABEL[customer.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {customer.type} / {customer.serviceCompanyName} / 계약: {customer.contractStart} ~ {customer.contractEnd}
          </p>
        </div>
        <Link href="/registry/customers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            목록으로
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="links">
            <Link2 className="h-3.5 w-3.5 mr-1" />
            연결 관리
          </TabsTrigger>
          <TabsTrigger value="locations">
            <MapPin className="h-3.5 w-3.5 mr-1" />
            정류장
          </TabsTrigger>
          <TabsTrigger value="groups">
            <FolderTree className="h-3.5 w-3.5 mr-1" />
            BIS 그룹
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-3.5 w-3.5 mr-1" />
            사용자
          </TabsTrigger>
          <TabsTrigger value="audit">
            <ScrollText className="h-3.5 w-3.5 mr-1" />
            감사 로그
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab customer={customer} />
        </TabsContent>

        <TabsContent value="links">
          <LinkManagementTab customer={customer} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="locations">
          <LocationsTab customer={customer} />
        </TabsContent>

        <TabsContent value="groups">
          <GroupsTab customer={customer} />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab customer={customer} />
        </TabsContent>

        <TabsContent value="audit">
          <AuditTab customer={customer} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
