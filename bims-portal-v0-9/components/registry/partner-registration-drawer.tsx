"use client";

import React, { useState } from "react";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type PartnerType = "platform_operator" | "service_operator" | "installation_contractor" | "maintenance_contractor" | "manufacturer" | "supplier";

interface PartnerRecord {
  id: string;
  name: string;
  type: PartnerType;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  businessRegNumber: string;
  notes: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

const PARTNER_TYPES: Array<{ value: PartnerType; label: string }> = [
  { value: "platform_operator", label: "플랫폼 운영사" },
  { value: "service_operator", label: "서비스 운영사" },
  { value: "installation_contractor", label: "설치 계약업체" },
  { value: "maintenance_contractor", label: "유지보수 계약업체" },
  { value: "manufacturer", label: "제조사" },
  { value: "supplier", label: "공급사" },
];

interface PartnerRegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  partner?: PartnerRecord | null;
}

export function PartnerRegistrationDrawer({
  isOpen,
  onClose,
  mode,
  partner,
}: PartnerRegistrationDrawerProps) {
  const [formData, setFormData] = useState<Partial<PartnerRecord>>(
    partner || {
      name: "",
      type: "platform_operator",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      businessRegNumber: "",
      notes: "",
      status: "active",
    }
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Production: API call to save partner
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="w-[480px] bg-background border-l shadow-lg flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {mode === "create" ? "파트너 추가" : "파트너 수정"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Partner Information */}
          <div>
            <h3 className="text-sm font-semibold mb-4">파트너 정보</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">
                  파트너명 *
                </Label>
                <Input
                  name="name"
                  placeholder="파트너명 입력"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">
                  파트너 유형 *
                </Label>
                <Select
                  value={formData.type || "platform_operator"}
                  onValueChange={(value) =>
                    handleSelectChange("type", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PARTNER_TYPES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold mb-4">연락처 정보</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">
                  담당자명
                </Label>
                <Input
                  name="contactPerson"
                  placeholder="담당자명 입력"
                  value={formData.contactPerson || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">
                  전화번호
                </Label>
                <Input
                  name="phone"
                  placeholder="010-0000-0000"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">
                  이메일
                </Label>
                <Input
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div>
            <h3 className="text-sm font-semibold mb-4">사업 정보</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">
                  주소
                </Label>
                <Input
                  name="address"
                  placeholder="사업장 주소 입력"
                  value={formData.address || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">
                  사업자등록번호
                </Label>
                <Input
                  name="businessRegNumber"
                  placeholder="000-00-00000"
                  value={formData.businessRegNumber || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Operational Notes */}
          <div>
            <h3 className="text-sm font-semibold mb-4">운영 정보</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">
                  상태
                </Label>
                <Select
                  value={formData.status || "active"}
                  onValueChange={(value) =>
                    handleSelectChange("status", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block">
                  비고
                </Label>
                <Textarea
                  name="notes"
                  placeholder="운영 관련 메모..."
                  className="min-h-[100px]"
                  value={formData.notes || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* System Fields (Read-only for edit mode) */}
          {mode === "edit" && (
            <div className="pt-4 border-t space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">등록일:</span>
                <span className="font-mono">{partner?.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">수정일:</span>
                <span className="font-mono">{partner?.updatedAt}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t p-4 flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 gap-1.5"
          >
            <Save className="h-4 w-4" />
            저장
          </Button>
        </div>
      </div>
    </div>
  );
}
