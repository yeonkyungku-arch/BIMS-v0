"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Eye, Pencil, Copy, Archive, Clock, AlertTriangle, Check } from "lucide-react";

interface Template {
  id: string;
  name: string;
  displayProfile: "EPAPER_10_2" | "EPAPER_13_3" | "EPAPER_25";
  layoutType: "BIS_EPAPER_SMALL" | "BIS_EPAPER_STANDARD" | "BIS_EPAPER_LARGE";
  status: "활성" | "비활성" | "보관";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  description: string;
  maxRoutes: number;
  baseRows: number;
  maxRows: number;
  scrollAllowed: boolean;
  pagingAllowed: boolean;
  refreshPolicy: string;
}

interface TemplateDetailDrawerProps {
  isOpen: boolean;
  template: Template | null;
  onClose: () => void;
  isReadOnly?: boolean;
  canEdit?: boolean;
  canArchive?: boolean;
  onEdit?: () => void;
  onPreview?: () => void;
  onClone?: () => void;
  onArchive?: () => void;
}

export function TemplateDetailDrawer({
  isOpen,
  template,
  onClose,
  isReadOnly = false,
  canEdit = false,
  canArchive = false,
  onEdit,
  onPreview,
  onClone,
  onArchive,
}: TemplateDetailDrawerProps) {
  if (!isOpen || !template) return null;

  const statusColor: Record<string, string> = {
    "활성": "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400",
    "비활성": "bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-400",
    "보관": "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div
        className="fixed right-0 top-0 h-screen w-[520px] bg-background border-l border-border shadow-lg flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-card">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground">{template.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">ID: {template.id}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Read-only banner */}
        {isReadOnly && (
          <div className="px-6 py-2 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">읽기 전용 권한입니다.</p>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="info" className="w-full h-full">
            <TabsList className="w-full rounded-none border-b bg-muted/50 p-0 h-auto">
              <TabsTrigger value="info" className="rounded-none border-r text-xs">
                정보
              </TabsTrigger>
              <TabsTrigger value="layout" className="rounded-none border-r text-xs">
                레이아웃
              </TabsTrigger>
              <TabsTrigger value="usage" className="rounded-none text-xs">
                사용처
              </TabsTrigger>
            </TabsList>

            {/* Tab: 정보 */}
            <TabsContent value="info" className="p-6 space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">기본 정보</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">상태</span>
                    <Badge className={statusColor[template.status]}>{template.status}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">프로필</span>
                    <span className="font-mono text-xs">{template.displayProfile}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">레이아웃</span>
                    <span className="font-mono text-xs">{template.layoutType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">생성자</span>
                    <span className="text-xs">{template.createdBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">생성일시</span>
                    <span className="text-xs">{template.createdAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">수정자</span>
                    <span className="text-xs">{template.updatedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">수정일시</span>
                    <span className="text-xs">{template.updatedAt}</span>
                  </div>
                </div>
              </div>

              {template.description && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">설명</h4>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{template.description}</p>
                </div>
              )}
            </TabsContent>

            {/* Tab: 레이아웃 */}
            <TabsContent value="layout" className="p-6 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">최대 노선 수</span>
                  <span className="font-mono text-xs">{template.maxRoutes}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">기본 행 수</span>
                  <span className="font-mono text-xs">{template.baseRows}행</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">최대 행 수</span>
                  <span className="font-mono text-xs">{template.maxRows}행</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">스크롤 허용</span>
                  <span className="text-xs">{template.scrollAllowed ? "예" : "아니오"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">페이징 허용</span>
                  <span className="text-xs">{template.pagingAllowed ? "예" : "아니오"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">새로고침 정책</span>
                  <span className="font-mono text-xs">{template.refreshPolicy}</span>
                </div>
              </div>
            </TabsContent>

            {/* Tab: 사용처 */}
            <TabsContent value="usage" className="p-6 space-y-4">
              <div className="rounded-lg border bg-muted/50 p-3 text-center text-sm text-muted-foreground">
                배포된 정류장 정보가 없습니다.
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-card space-y-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs gap-1.5"
              disabled={isReadOnly}
              onClick={onPreview}
            >
              <Eye className="h-3.5 w-3.5" />
              미리보기
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs gap-1.5"
              disabled={isReadOnly}
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
              수정
            </Button>
          </div>

          {!isReadOnly && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs gap-1.5"
                onClick={onClone}
              >
                <Copy className="h-3.5 w-3.5" />
                복제
              </Button>
              {canArchive && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs gap-1.5 text-red-600 hover:text-red-700"
                  onClick={onArchive}
                >
                  <Archive className="h-3.5 w-3.5" />
                  보관
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
