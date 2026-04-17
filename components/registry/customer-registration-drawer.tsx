"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
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

interface Customer {
  id: string;
  name: string;
  serviceOperatorId: string;
  serviceOperatorName: string;
  region: string;
  contactPerson: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
  stopsCount: number;
  devicesCount: number;
  createdAt: string;
}

interface Partner {
  id: string;
  name: string;
}

interface CustomerRegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  customer?: Customer | null;
  partners: Partner[];
}

export function CustomerRegistrationDrawer({
  isOpen,
  onClose,
  mode,
  customer,
  partners,
}: CustomerRegistrationDrawerProps) {
  const [formData, setFormData] = useState({
    name: customer?.name || "",
    serviceOperatorId: customer?.serviceOperatorId || "",
    region: customer?.region || "",
    contactPerson: customer?.contactPerson || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
    serviceStartDate: "",
    serviceEndDate: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log("Submitting customer:", formData);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleCancel}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[480px] bg-background border-l shadow-lg z-50 flex flex-col">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-lg">
            {mode === "create" ? "고객사 등록" : "고객사 편집"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              고객사 정보
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">고객사명*</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="고객사명 입력"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">서비스 운영사*</label>
                <Select
                  value={formData.serviceOperatorId}
                  onValueChange={(value) => handleSelectChange("serviceOperatorId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="서비스 운영사 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">지역</label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => handleSelectChange("region", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="지역 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="서울">서울</SelectItem>
                    <SelectItem value="경기">경기</SelectItem>
                    <SelectItem value="인천">인천</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              연락처 정보
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">담당자</label>
                <Input
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="담당자명 입력"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">전화번호</label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="전화번호 입력"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">이메일</label>
                <Input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="이메일 주소 입력"
                  type="email"
                />
              </div>
            </div>
          </div>

          {/* Service Scope */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              서비스 범위
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">서비스 시작일</label>
                <Input
                  name="serviceStartDate"
                  value={formData.serviceStartDate}
                  onChange={handleChange}
                  type="date"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">서비스 종료일</label>
                <Input
                  name="serviceEndDate"
                  value={formData.serviceEndDate}
                  onChange={handleChange}
                  type="date"
                />
              </div>
            </div>
          </div>

          {/* Operational Notes */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              운영 메모
            </h3>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="운영 메모 입력..."
              className="min-h-24"
            />
          </div>

          {/* System Fields (read-only on edit) */}
          {mode === "edit" && customer && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                시스템 정보
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 px-3 bg-muted/50 rounded">
                  <span className="text-muted-foreground">등록일</span>
                  <span className="font-mono">{customer.createdAt}</span>
                </div>
                <div className="flex justify-between py-2 px-3 bg-muted/50 rounded">
                  <span className="text-muted-foreground">수정일</span>
                  <span className="font-mono">2025-01-20</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Actions */}
        <div className="border-t p-4 flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={handleCancel}>
            취소
          </Button>
          <Button size="sm" className="flex-1" onClick={handleSubmit}>
            고객사 저장
          </Button>
        </div>
      </div>
    </>
  );
}
