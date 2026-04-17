'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface OperationalRelationship {
  id: string;
  customerId: string;
  customerName: string;
  serviceOperatorId: string;
  serviceOperatorName: string;
  installationContractorId: string;
  installationContractorName: string;
  maintenanceContractorId: string;
  maintenanceContractorName: string;
  relatedStopsCount: number;
  relatedDevicesCount: number;
  region: string;
  status: 'active' | 'inactive';
  updatedAt: string;
}

interface OperationalRelationshipDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  relationship: OperationalRelationship;
  mode: 'view' | 'edit';
}

export function OperationalRelationshipDrawer({
  isOpen,
  onClose,
  relationship,
  mode,
}: OperationalRelationshipDrawerProps) {
  const [editData, setEditData] = useState(relationship);

  if (!isOpen) return null;

  const handleSave = () => {
    // API call to save changes
    console.log('Saving relationship:', editData);
    onClose();
  };

  const isEditing = mode === 'edit';

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-background border-l shadow-lg z-50 flex flex-col">
      {/* Drawer Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">
          {isEditing ? '운영 관계 편집' : '관계 상세정보'}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Relationship Summary */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            관계 요약
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">고객사:</span>
              <span className="font-medium">{editData.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">상태:</span>
              <span className={editData.status === 'active' ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
                {editData.status === 'active' ? '활성' : '비활성'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">지역:</span>
              <span className="font-medium">{editData.region}</span>
            </div>
          </div>
        </div>

        {/* Organization Roles */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            조직 역할
          </h4>
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-muted-foreground text-xs">고객사 (Customer)</label>
              <div className="mt-1 p-2 bg-muted rounded text-sm font-medium">
                {editData.customerId}: {editData.customerName}
              </div>
            </div>
            <div>
              <label className="text-muted-foreground text-xs">서비스 운영사 (Service Operator)</label>
              <div className="mt-1 p-2 bg-muted rounded text-sm font-medium">
                {editData.serviceOperatorId}: {editData.serviceOperatorName}
              </div>
            </div>
            <div>
              <label className="text-muted-foreground text-xs">설치 계약업체 (Installation Contractor)</label>
              <div className="mt-1 p-2 bg-muted rounded text-sm font-medium">
                {editData.installationContractorId}: {editData.installationContractorName}
              </div>
            </div>
            <div>
              <label className="text-muted-foreground text-xs">유지보수 계약업체 (Maintenance Contractor)</label>
              <div className="mt-1 p-2 bg-muted rounded text-sm font-medium">
                {editData.maintenanceContractorId}: {editData.maintenanceContractorName}
              </div>
            </div>
          </div>
        </div>

        {/* Related Assets */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            연결된 자산
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">정류장 수:</span>
              <span className="font-mono font-medium">{editData.relatedStopsCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">BIS 단말 수:</span>
              <span className="font-mono font-medium">{editData.relatedDevicesCount}</span>
            </div>
          </div>
        </div>

        {/* System Fields */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            시스템 정보
          </h4>
          <div className="space-y-2 text-xs text-muted-foreground font-mono">
            <div>
              <label>관계 ID:</label>
              <div>{editData.id}</div>
            </div>
            <div>
              <label>마지막 업데이트:</label>
              <div>{editData.updatedAt}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Actions */}
      <div className="border-t p-4 flex gap-2">
        {isEditing ? (
          <>
            <Button size="sm" variant="outline" className="flex-1" onClick={onClose}>
              취소
            </Button>
            <Button size="sm" className="flex-1" onClick={handleSave}>
              변경 저장
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => {
              // Switch to edit mode logic
              onClose();
            }}>
              편집
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={onClose}>
              닫기
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
