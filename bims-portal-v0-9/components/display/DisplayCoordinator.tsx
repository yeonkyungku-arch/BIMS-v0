"use client";

// ---------------------------------------------------------------------------
// DisplayCoordinator -- Pagination and bus slicing logic owner
// ---------------------------------------------------------------------------
//
// This component owns all pagination state and bus slicing logic.
// PowerProfile and StateScreen components must NOT perform these calculations.
//
// Responsibilities:
// - Pagination state (currentPage)
// - Bus slicing (startIdx, endIdx)
// - Page count calculation
// - Auto-paging timer (for solar mode)
//
// Expected hierarchy:
// DisplayRoot → DisplayCoordinator → PowerProfile → StateScreen → Renderer
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useCallback } from "react";
import {
  DEVICE_PROFILES,
  POWER_PROFILES,
  getBusesForPage,
  calculateTotalPages,
  type DeviceSize,
  type PowerMode,
} from "@/lib/display/device-profiles";

interface BusArrival {
  routeNo: string;
  destination: string;
  eta: string;
  stopsAway: string;
}

interface DisplayCoordinatorProps {
  /** All bus arrivals (unsliced) */
  buses: BusArrival[];
  /** Device size determines rows per page */
  deviceSize: DeviceSize;
  /** Power mode determines refresh strategy */
  powerMode: PowerMode;
  /** Render function receiving sliced buses and pagination info */
  children: (props: {
    displayedBuses: BusArrival[];
    currentPage: number;
    totalPages: number;
    rowsPerPage: number;
    onNextPage: () => void;
    onPrevPage: () => void;
  }) => React.ReactNode;
}

/**
 * DisplayCoordinator
 * 
 * Owns pagination logic and provides sliced bus data to child components.
 * This ensures PowerProfile and StateScreen components remain stateless
 * with respect to pagination.
 */
export default function DisplayCoordinator({
  buses,
  deviceSize,
  powerMode,
  children,
}: DisplayCoordinatorProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const deviceProfile = DEVICE_PROFILES[deviceSize];
  const powerProfile = POWER_PROFILES[powerMode];
  const totalPages = calculateTotalPages(buses.length, deviceSize);

  // Reset to page 0 if buses change and current page would be out of bounds
  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(0);
    }
  }, [buses.length, totalPages, currentPage]);

  // Auto-paging for solar mode (paging refresh strategy)
  useEffect(() => {
    if (powerProfile.refreshStrategy !== "paging" || totalPages <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, powerProfile.pageCycleInterval * 1000);

    return () => clearInterval(interval);
  }, [powerProfile.refreshStrategy, powerProfile.pageCycleInterval, totalPages]);

  const displayedBuses = getBusesForPage(buses, currentPage, deviceSize);

  const onNextPage = useCallback(() => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  }, [totalPages]);

  const onPrevPage = useCallback(() => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  }, [totalPages]);

  return (
    <>
      {children({
        displayedBuses,
        currentPage,
        totalPages,
        rowsPerPage: deviceProfile.rows,
        onNextPage,
        onPrevPage,
      })}
    </>
  );
}
