"use client";

// ---------------------------------------------------------------------------
// Battery Page Guard -- blocks GRID devices from accessing battery UI
// ---------------------------------------------------------------------------
// Shows a brief "SOLAR only" message then auto-redirects to /rms/devices.
// No battery provider calls are made if guard triggers.
// ---------------------------------------------------------------------------

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Battery, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRmsDevice } from "@/contexts/rms-device-context";

const REDIRECT_DELAY_MS = 1200;

export function BatteryGuard({ children }: { children: React.ReactNode }) {
  const { hasSolarDevices } = useRmsDevice();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  // If no SOLAR devices, auto-redirect after a short delay
  useEffect(() => {
    if (hasSolarDevices) return;

    if (process.env.NODE_ENV === "development") {
      console.log("[battery-ui] hidden (GRID/unknown) -- redirecting to /rms/devices");
    }

    const timer = setTimeout(() => {
      setRedirecting(true);
      router.replace("/rms/devices");
    }, REDIRECT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [hasSolarDevices, router]);

  // Guard: no SOLAR devices -> show empty state
  if (!hasSolarDevices) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Battery className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            {"SOLAR 전용 기능"}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            {"배터리 관리는 태양광(SOLAR) 단말에서만 제공됩니다."}
            <br />
            {"전력형(GRID) 단말에는 배터리가 없으므로 이 페이지를 사용할 수 없습니다."}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/rms/devices")}
          disabled={redirecting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {redirecting ? "이동 중..." : "모니터링으로 이동"}
        </Button>
        {!redirecting && (
          <p className="text-xs text-muted-foreground animate-pulse">
            {"잠시 후 자동으로 이동합니다..."}
          </p>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
