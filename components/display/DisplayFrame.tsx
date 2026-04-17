"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminModeOverlay } from "@/components/display/admin-mode-overlay";

interface DisplayFrameProps {
  children: React.ReactNode;
  /** Explicit deviceId override (e.g. from route param). Falls back to ?deviceId= query param, then "DEV001". */
  deviceId?: string;
}

/** Inner component that uses useSearchParams (requires Suspense) */
function DisplayFrameInner({ children, deviceId }: DisplayFrameProps) {
  const searchParams = useSearchParams();
  const resolvedId = deviceId || searchParams.get("deviceId") || "DEV001";

  return (
    <div className="min-h-screen w-full bg-white text-black font-sans relative">
      {children}
      <AdminModeOverlay deviceId={resolvedId} />
    </div>
  );
}

export default function DisplayFrame(props: DisplayFrameProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-white text-black font-sans relative">
          {props.children}
        </div>
      }
    >
      <DisplayFrameInner {...props} />
    </Suspense>
  );
}
