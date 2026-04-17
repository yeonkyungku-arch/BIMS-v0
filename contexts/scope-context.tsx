"use client";

import { createContext, useContext, useState, useMemo, type ReactNode } from "react";
import type { Role } from "@/lib/rbac";

// --- Scope hierarchy types ---

export interface BIS {
  id: string;
  name: string;        // e.g. "강남역 1번출구"
  deviceId: string;    // linked device ID
}

export interface BISGroup {
  id: string;
  name: string;        // e.g. "강남구 그룹 A"
  bisList: BIS[];
}

export interface Customer {
  id: string;
  name: string;        // e.g. "서울교통공사"
  bisGroups: BISGroup[];
}

export interface Stakeholder {
  id: string;
  name: string;        // e.g. "E-paper BIS 서비스"
  customers: Customer[];
}

// --- Selected scope ---

export type ScopeLevel = "all" | "customer" | "bisGroup" | "bis";

export interface SelectedScope {
  level: ScopeLevel;
  stakeholderId?: string;
  customerId?: string;
  bisGroupId?: string;
  bisId?: string;
  label: string;       // human-readable label for the header
}

// --- Mock registry data ---

export const REGISTRY: Stakeholder = {
  id: "STK001",
  name: "E-paper BIS 서비스",
  customers: [
    {
      id: "CUS001",
      name: "서울교통공사",
      bisGroups: [
        {
          id: "GRP001",
          name: "강남구 그룹 A",
          bisList: [
            { id: "BIS001", name: "강남역 1번출구", deviceId: "DEV001" },
            { id: "BIS002", name: "역삼역 2번출구", deviceId: "DEV002" },
          ],
        },
        {
          id: "GRP002",
          name: "서초구 그룹 B",
          bisList: [
            { id: "BIS003", name: "서초역 3번출구", deviceId: "DEV003" },
            { id: "BIS004", name: "교대역 앞", deviceId: "DEV004" },
          ],
        },
      ],
    },
    {
      id: "CUS002",
      name: "경기교통정보센터",
      bisGroups: [
        {
          id: "GRP003",
          name: "성남시 그룹",
          bisList: [
            { id: "BIS005", name: "분당 정자역 앞", deviceId: "DEV005" },
            { id: "BIS006", name: "야탑역 1번출구", deviceId: "DEV006" },
          ],
        },
      ],
    },
    {
      id: "CUS003",
      name: "인천교통공사",
      bisGroups: [
        {
          id: "GRP004",
          name: "연수구 그룹",
          bisList: [
            { id: "BIS007", name: "연수구청역 앞", deviceId: "DEV007" },
          ],
        },
        {
          id: "GRP005",
          name: "남동구 그룹",
          bisList: [
            { id: "BIS008", name: "인천시청역 앞", deviceId: "DEV008" },
          ],
        },
      ],
    },
  ],
};

// Role-based access to customers
const ROLE_CUSTOMER_ACCESS: Record<Role, string[] | "all"> = {
  super_admin: "all",
  system_admin: "all",
  operator: ["CUS001"],          // only their own customer
  maintenance: ["CUS001", "CUS002"], // assigned customers
  viewer: ["CUS001"],
};

// --- Context ---

interface ScopeContextType {
  scope: SelectedScope;
  setScope: (scope: SelectedScope) => void;
  registry: Stakeholder;
  accessibleCustomers: Customer[];
  canSelectAll: boolean;
}

const ScopeContext = createContext<ScopeContextType | null>(null);

export function ScopeProvider({
  children,
  currentRole,
}: {
  children: ReactNode;
  currentRole: Role;
}) {
  const [scope, setScope] = useState<SelectedScope>({
    level: "all",
    label: "전체 고객사",
  });

  const accessibleCustomers = useMemo(() => {
    const access = ROLE_CUSTOMER_ACCESS[currentRole];
    if (access === "all") return REGISTRY.customers;
    return REGISTRY.customers.filter((c) => access.includes(c.id));
  }, [currentRole]);

  const canSelectAll = useMemo(() => {
    return currentRole === "super_admin" || currentRole === "system_admin";
  }, [currentRole]);

  // Reset scope if role changes and current scope is no longer accessible
  useMemo(() => {
    if (!canSelectAll && scope.level === "all") {
      if (accessibleCustomers.length === 1) {
        setScope({
          level: "customer",
          customerId: accessibleCustomers[0].id,
          label: accessibleCustomers[0].name,
        });
      }
    }
  }, [canSelectAll, accessibleCustomers, scope.level]);

  return (
    <ScopeContext.Provider
      value={{ scope, setScope, registry: REGISTRY, accessibleCustomers, canSelectAll }}
    >
      {children}
    </ScopeContext.Provider>
  );
}

export function useScope() {
  const context = useContext(ScopeContext);
  if (!context) {
    throw new Error("useScope must be used within a ScopeProvider");
  }
  return context;
}
