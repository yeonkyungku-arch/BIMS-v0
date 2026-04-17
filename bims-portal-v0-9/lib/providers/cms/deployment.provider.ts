// ---------------------------------------------------------------------------
// Deployment Provider (Mock)
// ---------------------------------------------------------------------------
// In-memory deployment store for development/preview.
// On deploy: validates content lifecycle === "APPROVED", creates Deployment
// record, transitions content lifecycle -> "ACTIVE".
// ---------------------------------------------------------------------------

import type {
  Deployment,
  DeploymentStatus,
} from "@/contracts/cms/deployment";
import type { ContentScope, ScopeLevel } from "@/contracts/cms/scope";

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

let deployments: Deployment[] = [];
let nextId = 1;

function genId(): string {
  return `deploy-${String(nextId++).padStart(4, "0")}`;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export interface CreateDeploymentInput {
  contentId: string;
  contentVersion: number;
  scope: ContentScope;
  priority: number;
  requestedBy: string;
  approvedAt?: string;
}

/**
 * Create a new deployment record.
 * Caller is responsible for validating content.lifecycle === "APPROVED"
 * before calling this function.
 *
 * Returns the created Deployment.
 */
export function createDeployment(input: CreateDeploymentInput): Deployment {
  const now = new Date().toISOString();
  const deployment: Deployment = {
    id: genId(),
    contentId: input.contentId,
    contentVersion: input.contentVersion,
    scope: input.scope,
    status: "QUEUED",
    priority: input.priority,
    requestedBy: input.requestedBy,
    requestedAt: now,
    approvedAt: input.approvedAt,
    retryCount: 0,
  };
  deployments.push(deployment);
  return deployment;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** List deployments filtered by scope level. */
export function listByScope(
  scopeLevel?: ScopeLevel,
  statuses?: DeploymentStatus[]
): Deployment[] {
  return deployments.filter((d) => {
    if (scopeLevel && d.scope.level !== scopeLevel) return false;
    if (statuses && statuses.length > 0 && !statuses.includes(d.status)) return false;
    return true;
  });
}

/** List deployments for a specific content. */
export function listByContent(contentId: string): Deployment[] {
  return deployments.filter((d) => d.contentId === contentId);
}

/** List all active (QUEUED | SENT | ACKED) deployments matching device criteria. */
export function listActiveForDevice(
  deviceId: string,
  groupId?: string,
  customerId?: string,
): Deployment[] {
  const activeStatuses: DeploymentStatus[] = ["QUEUED", "SENT", "ACKED"];
  return deployments.filter((d) => {
    if (!activeStatuses.includes(d.status)) return false;
    switch (d.scope.level) {
      case "DEVICE":
        return d.scope.targetId === deviceId;
      case "GROUP":
        return groupId ? d.scope.targetId === groupId : false;
      case "CUSTOMER":
        return customerId ? d.scope.targetId === customerId : false;
      case "GLOBAL":
        return true;
      default:
        return false;
    }
  });
}

// ---------------------------------------------------------------------------
// Status transitions
// ---------------------------------------------------------------------------

/** Mark deployment as ACKED (device confirmed receipt). */
export function markAcked(deploymentId: string): Deployment | null {
  const d = deployments.find((x) => x.id === deploymentId);
  if (!d || !["QUEUED", "SENT"].includes(d.status)) return null;
  d.status = "ACKED";
  return d;
}

/** Mark deployment as SENT (gateway confirmed transmission). */
export function markSent(deploymentId: string): Deployment | null {
  const d = deployments.find((x) => x.id === deploymentId);
  if (!d || d.status !== "QUEUED") return null;
  d.status = "SENT";
  return d;
}

/** Mark deployment as FAILED with error message. */
export function markFailed(
  deploymentId: string,
  error: string
): Deployment | null {
  const d = deployments.find((x) => x.id === deploymentId);
  if (!d || !["QUEUED", "SENT"].includes(d.status)) return null;
  d.status = "FAILED";
  d.lastError = error;
  d.retryCount = (d.retryCount ?? 0) + 1;
  return d;
}

/** Cancel a deployment (only QUEUED or SENT). */
export function cancelDeployment(deploymentId: string): Deployment | null {
  const d = deployments.find((x) => x.id === deploymentId);
  if (!d || !["QUEUED", "SENT"].includes(d.status)) return null;
  d.status = "CANCELED";
  return d;
}

// ---------------------------------------------------------------------------
// Seed data (for development preview)
// ---------------------------------------------------------------------------

export function seedDeployments(seed: Deployment[]): void {
  deployments = [...seed];
  nextId = seed.length + 1;
}

/** Get all deployments (debug). */
export function getAllDeployments(): Deployment[] {
  return [...deployments];
}
