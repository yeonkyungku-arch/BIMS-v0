// ---------------------------------------------------------------------------
// Content Runtime -- Integration hook for Display Resolver
// ---------------------------------------------------------------------------
// Resolves which CMS content a device should render by:
//   1) Collecting all ACTIVE deployments relevant to the device
//   2) Building a candidate list
//   3) Running selectWinningContent (DEVICE > GROUP > CUSTOMER > GLOBAL)
//   4) Returning the winning CmsContent or null
//
// This module does NOT modify DisplayRenderer.
// It only prepares data for the shared display resolver.
// ---------------------------------------------------------------------------

import {
  selectWinningContent,
  type ContentCandidate,
} from "@/lib/cms/content-selection";
import { listActiveForDevice } from "@/lib/providers/cms/deployment.provider";
import type { CmsContent } from "@/contracts/cms/content";

// ---------------------------------------------------------------------------
// Device metadata input (from RMS or device registry)
// ---------------------------------------------------------------------------

export interface DeviceMeta {
  /** Unique device identifier. */
  deviceId: string;
  /** Group this device belongs to (optional). */
  groupId?: string;
  /** Customer this device belongs to (optional). */
  customerId?: string;
}

// ---------------------------------------------------------------------------
// Content store interface -- abstract over mock/real provider
// ---------------------------------------------------------------------------

export interface ContentStore {
  getById(contentId: string): Promise<CmsContent | null>;
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Get the active CMS content for a device.
 *
 * Flow:
 *   1) Query all active deployments matching the device's scopes
 *      (DEVICE id, GROUP id, CUSTOMER id, GLOBAL)
 *   2) Build candidate list from deployments
 *   3) Run scope-priority selection engine
 *   4) Fetch and return the winning content
 *
 * Returns null if no active deployment exists.
 */
export async function getActiveContentForDevice(
  deviceMeta: DeviceMeta,
  contentStore: ContentStore,
): Promise<CmsContent | null> {
  // 1) Get all ACTIVE deployments relevant to this device
  const deployments = listActiveForDevice(
    deviceMeta.deviceId,
    deviceMeta.groupId,
    deviceMeta.customerId,
  );

  if (deployments.length === 0) return null;

  // 2) Build candidate list
  const candidates: ContentCandidate[] = deployments.map((d) => ({
    contentId: d.contentId,
    contentVersion: d.contentVersion,
    scopeLevel: d.scope.level,
    priority: d.priority,
    approvedAt: d.approvedAt ?? d.requestedAt,
  }));

  // 3) Run scope-priority selection
  const winner = selectWinningContent(candidates);
  if (!winner) return null;

  // 4) Fetch the winning content
  const content = await contentStore.getById(winner.contentId);
  return content;
}
