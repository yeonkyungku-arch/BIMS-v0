/**
 * RMS Incident Management View Model
 *
 * Screen-specific view model for incident management UI.
 * All formatting and display logic is applied once during transformation.
 * Components receive pre-formatted data only.
 */

import type { IncidentStatusType, IncidentType, IncidentPriority, SlaStatusType } from "./incident-management-types";

export type SeverityTone = "danger" | "warning" | "muted" | "info";

export interface IncidentVM {
  // Domain identifiers
  incidentId: string;
  deviceId: string;
  customerId: string;

  // Display information
  deviceName: string;
  stopName: string;
  customerName: string;
  incidentType: IncidentType;

  // Status display
  statusLabel: string;
  statusLabelKo: string;
  statusBadgeBg: string;
  statusBadgeText: string;
  statusBadgeBorder: string;

  // Severity display
  severityLabel: string;
  severityTone: SeverityTone;
  severityBadgeBg: string;
  severityBadgeText: string;

  // Assignment
  assignedToName?: string;
  assignedToEmail?: string;

  // SLA display
  slaStatus: SlaStatusType;
  slaStatusLabel: string;
  slaStatusTone: SeverityTone;

  // Timestamps (formatted for display)
  occurredAtDisplay: string;
  occurredAtRaw: string;
  updatedAtDisplay: string;
  updatedAtRaw: string;

  // Summary and description
  summary: string;
  description?: string;
  
  // Device state (from monitoring)
  displayState?: string;

  // RMS operational fields
  socStatus?: string;
  communicationStatus?: string;
  remoteControlResult?: string;
  fieldWorkNeeded?: boolean;

  // Resolution info
  resolvedBy?: string;
  resolutionNotes?: string;
}

import type { IncidentRecord } from "./incident-management-types";
import { INCIDENT_STATUS_META, INCIDENT_PRIORITY_META, SLA_STATUS_META } from "./incident-management-types";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export function toIncidentVM(incident: IncidentRecord): IncidentVM {
  const statusMeta = INCIDENT_STATUS_META[incident.incidentStatus];
  const priorityMeta = INCIDENT_PRIORITY_META[incident.priority];
  const slaMeta = incident.slaStatus ? SLA_STATUS_META[incident.slaStatus] : null;

  const occurredDate = new Date(incident.createdAt);
  const updatedDate = new Date(incident.updatedAt);

  return {
    incidentId: incident.incidentId,
    deviceId: incident.deviceId,
    customerId: incident.customer,
    deviceName: incident.deviceId,
    stopName: incident.busStop,
    customerName: incident.customerName || incident.customer,
    incidentType: incident.incidentType,
    statusLabel: statusMeta.labelKo,
    statusLabelKo: statusMeta.labelKo,
    statusBadgeBg: statusMeta.badgeBg,
    statusBadgeText: statusMeta.badgeText,
    statusBadgeBorder: "",
    severityLabel: priorityMeta.labelKo,
    severityTone: priorityMeta.badgeText.includes("destructive") ? "danger" : priorityMeta.badgeText.includes("warning") ? "warning" : "muted",
    severityBadgeBg: priorityMeta.badgeBg,
    severityBadgeText: priorityMeta.badgeText,
    assignedToName: incident.assignee,
    slaStatus: incident.slaStatus || "COMPLIANT",
    slaStatusLabel: slaMeta?.labelKo || "정상",
    slaStatusTone: slaMeta?.badgeText.includes("destructive") ? "danger" : "muted",
    occurredAtDisplay: formatDistanceToNow(occurredDate, { addSuffix: true, locale: ko }),
    occurredAtRaw: incident.createdAt,
    updatedAtDisplay: formatDistanceToNow(updatedDate, { addSuffix: true, locale: ko }),
    updatedAtRaw: incident.updatedAt,
    summary: incident.summary,
    description: incident.title,
    displayState: incident.displayState,
    socStatus: incident.socStatus || "정상",
    communicationStatus: incident.communicationStatus || "정상",
    remoteControlResult: incident.remoteControlResult || "-",
    fieldWorkNeeded: incident.fieldWorkNeeded || false,
  };
}
