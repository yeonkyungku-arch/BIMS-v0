// ---------------------------------------------------------------------------
// Display Profile Policy -- Mock in-memory provider (v1.0)
// ---------------------------------------------------------------------------

import type {
  DisplayProfilePolicy,
  DisplayProfileKey,
  DeviceProfile,
  Orientation,
  PolicyStatus,
} from "@/contracts/admin/display-profile-policy";
import { policyKeyString } from "@/contracts/admin/display-profile-policy";

// ---------------------------------------------------------------------------
// System guardrails
// ---------------------------------------------------------------------------

function systemRows(_sizeInch: number): { minRows: number; maxRows: number } {
  // v1.0: uniform regardless of size; extend later
  return { minRows: 2, maxRows: 5 };
}

// ---------------------------------------------------------------------------
// Provider Interface
// ---------------------------------------------------------------------------

export interface IDisplayProfilePolicyProvider {
  list(params?: { deviceProfile?: DeviceProfile; orientation?: Orientation }): Promise<DisplayProfilePolicy[]>;
  get(id: string): Promise<DisplayProfilePolicy>;
  create(policy: Omit<DisplayProfilePolicy, "id" | "updatedAt" | "updatedBy">): Promise<DisplayProfilePolicy>;
  update(id: string, patch: Partial<Pick<DisplayProfilePolicy, "baseRows" | "note">>): Promise<DisplayProfilePolicy>;
  setActive(id: string): Promise<DisplayProfilePolicy>;
  setInactive(id: string): Promise<DisplayProfilePolicy>;
  getActiveByKey(key: DisplayProfileKey): Promise<DisplayProfilePolicy | null>;
  getDefault(): Promise<DisplayProfilePolicy>;
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const now = () => new Date().toISOString();

function makeSeed(): DisplayProfilePolicy[] {
  const { minRows, maxRows } = systemRows(13.3);
  return [
    {
      id: "dpp-default-grid",
      key: { sizeInch: 13.3, orientation: "PORTRAIT", deviceProfile: "GRID" },
      baseRows: 4,
      minRows,
      maxRows,
      status: "ACTIVE",
      updatedAt: "2026-01-01T00:00:00Z",
      updatedBy: "system",
      note: "DEFAULT",
    },
    {
      id: "dpp-default-solar",
      key: { sizeInch: 13.3, orientation: "PORTRAIT", deviceProfile: "SOLAR" },
      baseRows: 4,
      minRows,
      maxRows,
      status: "ACTIVE",
      updatedAt: "2026-01-01T00:00:00Z",
      updatedBy: "system",
      note: "DEFAULT",
    },
  ];
}

// ---------------------------------------------------------------------------
// Mock Implementation
// ---------------------------------------------------------------------------

let idCounter = 100;

class MockDisplayProfilePolicyProvider implements IDisplayProfilePolicyProvider {
  private store: DisplayProfilePolicy[];

  constructor() {
    this.store = makeSeed();
  }

  async list(params?: { deviceProfile?: DeviceProfile; orientation?: Orientation }): Promise<DisplayProfilePolicy[]> {
    let result = [...this.store];
    if (params?.deviceProfile) result = result.filter((p) => p.key.deviceProfile === params.deviceProfile);
    if (params?.orientation) result = result.filter((p) => p.key.orientation === params.orientation);
    return result.sort((a, b) => a.updatedAt < b.updatedAt ? 1 : -1);
  }

  async get(id: string): Promise<DisplayProfilePolicy> {
    const found = this.store.find((p) => p.id === id);
    if (!found) throw new Error(`Policy not found: ${id}`);
    return { ...found };
  }

  async create(input: Omit<DisplayProfilePolicy, "id" | "updatedAt" | "updatedBy">): Promise<DisplayProfilePolicy> {
    const { minRows, maxRows } = systemRows(input.key.sizeInch);
    const policy: DisplayProfilePolicy = {
      ...input,
      id: `dpp-${++idCounter}`,
      minRows,
      maxRows,
      updatedAt: now(),
      updatedBy: "admin",
    };
    this.store.push(policy);
    return { ...policy };
  }

  async update(id: string, patch: Partial<Pick<DisplayProfilePolicy, "baseRows" | "note">>): Promise<DisplayProfilePolicy> {
    const idx = this.store.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Policy not found: ${id}`);
    this.store[idx] = { ...this.store[idx], ...patch, updatedAt: now() };
    return { ...this.store[idx] };
  }

  async setActive(id: string): Promise<DisplayProfilePolicy> {
    const target = this.store.find((p) => p.id === id);
    if (!target) throw new Error(`Policy not found: ${id}`);
    // Enforce unique ACTIVE per key
    const keyStr = policyKeyString(target.key);
    const existing = this.store.find(
      (p) => p.id !== id && p.status === "ACTIVE" && policyKeyString(p.key) === keyStr
    );
    if (existing) {
      throw new Error(
        `동일 키에 이미 활성 정책이 존재합니다 (${existing.id}). 먼저 비활성화하세요.`
      );
    }
    target.status = "ACTIVE";
    target.updatedAt = now();
    return { ...target };
  }

  async setInactive(id: string): Promise<DisplayProfilePolicy> {
    const target = this.store.find((p) => p.id === id);
    if (!target) throw new Error(`Policy not found: ${id}`);
    target.status = "INACTIVE";
    target.updatedAt = now();
    return { ...target };
  }

  async getActiveByKey(key: DisplayProfileKey): Promise<DisplayProfilePolicy | null> {
    const keyStr = policyKeyString(key);
    return this.store.find((p) => p.status === "ACTIVE" && policyKeyString(p.key) === keyStr) ?? null;
  }

  async getDefault(): Promise<DisplayProfilePolicy> {
    // Fallback: first seeded GRID ACTIVE policy
    const fallback = this.store.find((p) => p.note === "DEFAULT" && p.status === "ACTIVE");
    if (fallback) return { ...fallback };
    // Ultimate fallback
    const { minRows, maxRows } = systemRows(13.3);
    return {
      id: "dpp-fallback",
      key: { sizeInch: 13.3, orientation: "PORTRAIT", deviceProfile: "GRID" },
      baseRows: 4,
      minRows,
      maxRows,
      status: "ACTIVE",
      updatedAt: now(),
      updatedBy: "system",
      note: "FALLBACK",
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _instance: IDisplayProfilePolicyProvider | null = null;

export function getDisplayProfilePolicyProvider(): IDisplayProfilePolicyProvider {
  if (!_instance) _instance = new MockDisplayProfilePolicyProvider();
  return _instance;
}
