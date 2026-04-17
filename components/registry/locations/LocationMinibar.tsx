"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RegistryStatusBadge } from "@/components/registry/registry-shell";
import type { BusStopLocation } from "@/lib/mock-data";

interface LocationMinibarProps {
  location: BusStopLocation;
  onRestore: () => void;
  onClose: () => void;
}

export function LocationMinibar({ location, onRestore, onClose }: LocationMinibarProps) {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex h-[72px] w-[320px] items-center justify-between rounded-lg border bg-background px-4 shadow-lg">
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-sm font-semibold truncate">{location.name}</span>
        <RegistryStatusBadge status={location.status} />
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-3">
        <Button size="sm" className="h-7 text-xs" onClick={onRestore}>
          상세 열기
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">닫기</span>
        </Button>
      </div>
    </div>
  );
}
