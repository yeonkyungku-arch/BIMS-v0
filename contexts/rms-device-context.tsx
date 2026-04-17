"use client";

// ---------------------------------------------------------------------------
// RMS Device Context -- lightweight context for cross-component device info
// ---------------------------------------------------------------------------
// Used by the sidebar to hide/show battery menu based on selected device's
// powerType. RMS screens set this when a device is selected or when the
// device list loads (uses the first device's powerType as default).
// ---------------------------------------------------------------------------

import React, { createContext, useContext, useState, useCallback } from "react";
import type { DevicePowerType } from "@/contracts/rms/device-power-type";

interface RmsDeviceContextValue {
  /** powerType of the currently active/selected device, or null if none. */
  selectedPowerType: DevicePowerType | null;
  /** Whether any SOLAR device exists in the current device list. */
  hasSolarDevices: boolean;
  /** Set selected device power type (called by RMS screens). */
  setSelectedPowerType: (pt: DevicePowerType | null) => void;
  /** Set whether SOLAR devices exist (called when device list loads). */
  setHasSolarDevices: (v: boolean) => void;
}

const RmsDeviceContext = createContext<RmsDeviceContextValue>({
  selectedPowerType: null,
  hasSolarDevices: true, // default true = show battery menu until proven otherwise
  setSelectedPowerType: () => {},
  setHasSolarDevices: () => {},
});

export function RmsDeviceProvider({ children }: { children: React.ReactNode }) {
  const [selectedPowerType, setSelectedPowerType] = useState<DevicePowerType | null>(null);
  const [hasSolarDevices, setHasSolarDevicesState] = useState(true);

  const setHasSolarDevices = useCallback((v: boolean) => {
    setHasSolarDevicesState(v);
  }, []);

  return (
    <RmsDeviceContext.Provider
      value={{
        selectedPowerType,
        hasSolarDevices,
        setSelectedPowerType,
        setHasSolarDevices,
      }}
    >
      {children}
    </RmsDeviceContext.Provider>
  );
}

export function useRmsDevice() {
  return useContext(RmsDeviceContext);
}
