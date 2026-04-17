"use client";

import { Bell, ChevronDown, Search, User, LogOut, Key, AlertTriangle, WifiOff } from "lucide-react";

import { useRBAC } from "@/contexts/rbac-context";
import { EnvironmentSwitcher } from "@/components/dev/EnvironmentSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ScopeSwitcher } from "@/components/scope-switcher";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// System status indicator showing CRITICAL and OFFLINE device counts
function SystemStatusIndicator() {
  // Mock data - in production, this would come from a real-time context/API
  const criticalCount = 2;
  const offlineCount = 5;

  if (criticalCount === 0 && offlineCount === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-state-normal/10 text-state-normal text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-state-normal" />
              정상 운영
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>모든 장치가 정상 운영 중입니다</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted text-xs font-medium">
            {criticalCount > 0 && (
              <span className="flex items-center gap-1 text-state-critical">
                <AlertTriangle className="h-3.5 w-3.5" />
                {criticalCount}
              </span>
            )}
            {offlineCount > 0 && (
              <span className="flex items-center gap-1 text-state-offline">
                <WifiOff className="h-3.5 w-3.5" />
                {offlineCount}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>CRITICAL: {criticalCount}대 / OFFLINE: {offlineCount}대</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function AppHeader() {
  const { currentRole, setCurrentRole, roleLabel } = useRBAC();

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4">
      <SidebarTrigger />

      {/* Scope Switcher */}
      <ScopeSwitcher />

      {/* Global Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="정류장/BIS 단말/노선 검색..."
          className="pl-8 h-9"
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* System Status Indicator */}
        <SystemStatusIndicator />
        
        {/* Environment Switcher (DEV only) */}
        <EnvironmentSwitcher />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs">
                3
              </span>
              <span className="sr-only">알림</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>알림</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-2 text-sm text-muted-foreground">
              <div className="mb-2 p-2 rounded-md bg-muted">
                <p className="font-medium text-foreground">장치 오프라인 알림</p>
                <p className="text-xs">정류장-004 연결 끊김 (2시간 전)</p>
              </div>
              <div className="mb-2 p-2 rounded-md bg-muted">
                <p className="font-medium text-foreground">배터리 경고</p>
                <p className="text-xs">정류장-003 배터리 23% (1시간 전)</p>
              </div>
              <div className="p-2 rounded-md bg-muted">
                <p className="font-medium text-foreground">배포 완료</p>
                <p className="text-xs">설 연휴 콘텐츠 업데이트 ���료 (3시간 전)</p>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col items-start text-xs">
                <span className="font-medium">관리자</span>
                <span className="text-muted-foreground">{roleLabel}</span>
              </div>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>내 계정</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              프로필
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Key className="mr-2 h-4 w-4" />
              비밀번호 변경
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
