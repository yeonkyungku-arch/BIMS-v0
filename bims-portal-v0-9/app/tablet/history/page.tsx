"use client";

import { useRouter } from "next/navigation";
import { useRBAC } from "@/contexts/rbac-context";
import { hasAccess, getPermission } from "@/lib/rbac";
import { mockMaintenanceLogs, getBisDeviceId } from "@/lib/mock-data";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShieldX, CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react";

export default function TabletHistoryPage() {
  const { currentRole, roleLabel } = useRBAC();
  const router = useRouter();

  const canAccess = hasAccess(currentRole, "tablet");

  // Filter logs to show only current user's work (mocked as "박유지" for maintenance role)
  const userLogs = mockMaintenanceLogs.filter(
    (log) => log.type === "onsite_action" || log.type === "inspection"
  );

  // Access denied screen
  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl">접근 권한 없음</CardTitle>
            <CardDescription>
              태블릿 현장 작업 화면은 현장 유지보수 담당자만 사용할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              현재 역할: <Badge variant="outline">{roleLabel}</Badge>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-amber-600" />;
      case "partial":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getResultLabel = (result: string) => {
    switch (result) {
      case "success":
        return "성공";
      case "pending":
        return "진행중";
      case "partial":
        return "부분";
      case "failed":
        return "실패";
      default:
        return result;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/tablet")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">작업 이력</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">최근 작업 기록</CardTitle>
            <CardDescription>제출한 점검 및 조치 이력입니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {userLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                작업 기록이 없습니다.
              </p>
            ) : (
              userLogs.map((log) => (
                <Card key={log.id} className="bg-muted/30">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {getResultIcon(log.result)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium font-mono">{getBisDeviceId(log.deviceId)}</span>
                          <Badge variant="outline" className="text-xs">
                            {log.type === "inspection" ? "점검" : "현장 조치"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{log.deviceName}</p>
                        <p className="text-sm mt-1">{log.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{log.timestamp}</span>
                          <Badge
                            variant={
                              log.result === "success"
                                ? "default"
                                : log.result === "failed"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {getResultLabel(log.result)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
