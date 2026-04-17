/**
 * Incident to IncidentVM Mapper
 *
 * Single transformation layer from domain model to screen view model.
 * All formatting and display logic is applied once here.
 * Components receive pre-formatted data only.
 */

import { formatDistanceToNow } from "date-fns";
import type { IncidentRecord, IncidentStatusType, IncidentPriority, SlaStatusType } from "./incident-management-types";
import { INCIDENT_STATUS_META, INCIDENT_PRIORITY_META, SLA_STATUS_META } from "./incident-management-types";
import type { IncidentVM, SeverityTone } from "./incident-vm";

function getPrioritySeverity(priority: IncidentPriority): { label: string; tone: SeverityTone; bg: string; text: string } {
  switch (priority) {
    case "HIGH":
      return { label: "높음", tone: "danger", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" };
    case "MEDIUM":
      return { label: "중간", tone: "warning", bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" };
    case "LOW":
      return { label: "낮음", tone: "muted", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" };
  }
}

function getSlaStatusTone(slaStatus?: SlaStatusType): SeverityTone {
  if (!slaStatus) return "muted";
  if (slaStatus === "Overdue") return "danger";
  if (slaStatus === "At Risk") return "warning";
  return "info";
}

export function toIncidentVM(incident: IncidentRecord): IncidentVM {
  const statusMeta = INCIDENT_STATUS_META[incident.incidentStatus];
  const priorityMeta = getPrioritySeverity(incident.priority);
  const slaStatus = incident.slaStatus || "On Time";
  const slaStatusMeta = SLA_STATUS_META[slaStatus];

  const occurredAt = new Date(incident.createdAt);
  const updatedAt = new Date(incident.updatedAt);

  return {
    // Domain identifiers
    incidentId: incident.incidentId,
    deviceId: incident.deviceId,
    customerId: incident.customer,

    // Display information
    deviceName: incident.deviceId,
    stopName: incident.busStop,
    customerName: incident.customer,
    incidentType: incident.incidentType,

    // Status display
    statusLabel: statusMeta.label,
    statusLabelKo: statusMeta.labelKo,
    statusBadgeBg: statusMeta.badgeBg,
    statusBadgeText: statusMeta.badgeText,
    statusBadgeBorder: statusMeta.badgeBorder,

    // Severity display (from priority)
    severityLabel: priorityMeta.label,
    severityTone: priorityMeta.tone,
    severityBadgeBg: priorityMeta.bg,
    severityBadgeText: priorityMeta.text,

    // Assignment
    assignedToName: incident.assignee,
    assignedToEmail: undefined,

    // SLA display
    slaStatus: slaStatus,
    slaStatusLabel: slaStatusMeta.labelKo,
    slaStatusTone: getSlaStatusTone(slaStatus),

    // Timestamps (formatted for display)
    occurredAtDisplay: formatDistanceToNow(occurredAt, { addSuffix: true, locale: undefined }),
    occurredAtRaw: incident.createdAt,
    updatedAtDisplay: formatDistanceToNow(updatedAt, { addSuffix: true, locale: undefined }),
    updatedAtRaw: incident.updatedAt,

    // Summary and description
    summary: incident.summary,
    description: incident.title,

    // Resolution info
    resolvedBy: incident.resolvedBy,
    resolutionNotes: undefined,
  };
}

export function toIncidentVMs(incidents: IncidentRecord[]): IncidentVM[] {
  return incidents.map(toIncidentVM);
}
