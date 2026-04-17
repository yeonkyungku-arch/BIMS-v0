// ---------------------------------------------------------------------------
// Gateway Provider Interface -- pull-based command delivery
// ---------------------------------------------------------------------------
// Gateway only transports/enforces/blocks. It is NOT a decision maker.
// Devices PULL commands. Portal UI only views and retries.
// ---------------------------------------------------------------------------

import type { GatewayCommand, GatewayCommandStatus } from "@/contracts/cms/gateway";
import type { ContentScope } from "@/contracts/cms/scope";

// ---------------------------------------------------------------------------
// Query types
// ---------------------------------------------------------------------------

export interface GatewayCommandQuery {
  page?: number;
  pageSize?: number;
  status?: GatewayCommandStatus;
  contentId?: string;
  targetDeviceId?: string;
  scope?: ContentScope;
  sortBy?: "createdAt" | "status" | "priority";
  sortDir?: "asc" | "desc";
}

export interface GatewayStats {
  total: number;
  pending: number;
  sent: number;
  acked: number;
  failed: number;
  expired: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

export interface GatewayProvider {
  /** List commands with filters and pagination. */
  listCommands(params: GatewayCommandQuery): Promise<Paginated<GatewayCommand>>;

  /** Get a single command by ID. */
  getCommand(commandId: string): Promise<GatewayCommand>;

  /** Create a new command (called internally when content is deployed). */
  createCommand(input: {
    contentId: string;
    contentName: string;
    contentVersion: number;
    targetDeviceId: string;
    targetDeviceName: string;
    scope: ContentScope;
    priority: number;
    validUntil: string;
  }): Promise<GatewayCommand>;

  /** Retry a FAILED command (resets to PENDING, increments retryCount). */
  retryCommand(commandId: string): Promise<GatewayCommand>;

  /** Expire all commands past validUntil (background sweep). */
  expireStaleCommands(): Promise<number>;

  /** Get stats summary. */
  getStats(): Promise<GatewayStats>;

  /**
   * Get the latest ACKED or SENT command for a device.
   * Used by ViewModel resolver to determine what content is active for a device.
   */
  getActiveCommandForDevice(deviceId: string): Promise<GatewayCommand | null>;

  /**
   * Get all active commands matching a scope (for scope-based resolution).
   * Returns commands in priority order (lower priority number = higher priority).
   */
  getCommandsByScope(scope: ContentScope): Promise<GatewayCommand[]>;
}
