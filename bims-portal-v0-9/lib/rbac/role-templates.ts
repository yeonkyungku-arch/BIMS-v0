// ---------------------------------------------------------------------------
// Role Templates -- Built-in stakeholder role templates + base roles
// ---------------------------------------------------------------------------
import type { ActionId } from "./action-catalog";
import type { ScopeLevel } from "@/contracts/cms/scope";

// ---------------------------------------------------------------------------
// Base Roles (general mapping)
// ---------------------------------------------------------------------------
export type BaseRole = "Viewer" | "Operator" | "Admin";

export const BASE_ROLE_LABEL: Record<BaseRole, string> = {
  Viewer:   "열람자",
  Operator: "운영자",
  Admin:    "관리자",
};

// ---------------------------------------------------------------------------
// Role Template
// ---------------------------------------------------------------------------
export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  baseRole: BaseRole;
  allowedScopes: ScopeLevel[];
  actions: ActionId[];
  builtIn: true;
}

// ---------------------------------------------------------------------------
// Built-in Templates
// ---------------------------------------------------------------------------
export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: "tpl_platform_super_admin",
    name: "플랫폼 최고 관리자",
    description: "전체 시스템에 대한 완전한 접근 권한. 모든 관리자/정책/감사 기능 사용 가능.",
    baseRole: "Admin",
    allowedScopes: ["GLOBAL"],
    builtIn: true,
    actions: [
      // admin.user
      "admin.user.read", "admin.user.create", "admin.user.update", "admin.user.disable", "admin.user.reset_password",
      // admin.role
      "admin.role.read", "admin.role.create", "admin.role.update",
      // admin.permission
      "admin.permission.read",
      // admin.binding
      "admin.binding.assign_role", "admin.binding.revoke_role",
      // admin.scope
      "admin.scope.read", "admin.scope.create", "admin.scope.update", "admin.scope.assign", "admin.scope.revoke",
      // admin.delegation
      "admin.delegation.read", "admin.delegation.create", "admin.delegation.revoke",
      // admin.settings
      "admin.settings.read", "admin.settings.update",
      // admin.audit
      "admin.audit.read", "admin.audit.export",
      // policy.*
      "policy.security.read", "policy.security.update",
      "policy.content_ops.read", "policy.content_ops.update",
      "policy.display_profile.read", "policy.display_profile.create", "policy.display_profile.update", "policy.display_profile.publish",
      "policy.change.request.create", "policy.change.request.read", "policy.change.request.cancel",
      "policy.change.approve", "policy.change.reject",
      "policy.security.apply", "policy.content_ops.apply", "policy.display_profile.apply",
      // cms.*
      "cms.content.read", "cms.content.create", "cms.content.deploy", "cms.content.approve", "cms.content.activate", "cms.content.rollback",
      "cms.template.read", "cms.template.create", "cms.template.update", "cms.template.approve", "cms.template.activate",
      "cms.policy.read", "cms.policy.update",
      // rms.*
      "rms.device.read", "rms.device.control", "rms.device.command",
      "rms.alert.read", "rms.alert.update", "rms.alert.close",
      "rms.command.create", "rms.command.approve",
      "rms.battery.read", "rms.communication.read",
      // registry.*
      "registry.device.read", "registry.device.create", "registry.device.update",
      "registry.customer.read", "registry.customer.create", "registry.customer.update",
      "registry.group.read", "registry.group.create", "registry.group.update",
      "registry.partner.read", "registry.partner.create", "registry.partner.update",
      "registry.relationship.read", "registry.relationship.create", "registry.relationship.update",
      // analysis.*
      "analysis.dashboard.read", "analysis.telemetry.read", "analysis.prediction.read", "analysis.lifecycle.read", "analysis.environment.read", "analysis.export",
      // field_ops.*
      "field_ops.work_order.read", "field_ops.work_order.create", "field_ops.work_order.update", "field_ops.work_order.assign", "field_ops.work_order.approve", "field_ops.work_order.submit_completion", "field_ops.work_order.close",
      "field_ops.maintenance_report.read", "field_ops.maintenance_report.create", "field_ops.analytics.read", "field_ops.analytics.export",
    ],
  },
  {
    id: "tpl_platform_admin",
    name: "플랫폼 관리자",
    description: "사용자/역할 관리 및 감사 로그 조회. 정책 변경 승인/반려 및 적용 가능. 시스템 설정, 위임, CMS 정책 관리.",
    baseRole: "Admin",
    allowedScopes: ["GLOBAL", "CUSTOMER"],
    builtIn: true,
    actions: [
      "admin.user.read", "admin.user.create", "admin.user.update", "admin.user.disable",
      "admin.role.read",
      "admin.permission.read",
      "admin.binding.assign_role",
      "admin.scope.read",
      // admin.settings (NEW)
      "admin.settings.read",
      // admin.delegation (NEW)
      "admin.delegation.read", "admin.delegation.create",
      "admin.audit.read",
      "policy.security.read",
      "policy.content_ops.read",
      "policy.display_profile.read",
      "policy.change.request.read", "policy.change.approve", "policy.change.reject",
      "policy.content_ops.apply", "policy.display_profile.apply",
      "cms.content.read", "cms.content.create", "cms.content.deploy", "cms.content.approve", "cms.content.activate", "cms.content.rollback",
      "cms.template.read", "cms.template.create", "cms.template.approve", "cms.template.activate",
      // cms.policy (NEW)
      "cms.policy.read",
      "rms.device.read", "rms.device.command", "rms.device.control",
      "rms.alert.read", "rms.alert.update",
      "rms.command.create",
      "rms.battery.read", "rms.communication.read",
      "registry.device.read", "registry.device.update",
      "registry.customer.read", "registry.customer.update",
      "registry.group.read", "registry.group.update",
      "registry.partner.read", "registry.partner.update",
      "registry.relationship.read", "registry.relationship.update",
      "registry.relationship.read", "registry.relationship.update",
      // analysis.*
      "analysis.dashboard.read", "analysis.telemetry.read", "analysis.prediction.read", "analysis.lifecycle.read", "analysis.environment.read", "analysis.export",
      // field_ops.*
      "field_ops.work_order.read", "field_ops.work_order.create", "field_ops.work_order.update", "field_ops.work_order.assign", "field_ops.work_order.approve", "field_ops.work_order.submit_completion", "field_ops.work_order.close",
      "field_ops.maintenance_report.read", "field_ops.maintenance_report.create", "field_ops.analytics.read", "field_ops.analytics.export",
    ],
  },
  {
    id: "tpl_customer_admin",
    name: "고객사 관리자",
    description: "소속 고객사 범위 내 사용자/역할 관리 및 콘텐츠 운영 정책 변경 요청. 위임 및 CMS 정책 관리.",
    baseRole: "Admin",
    allowedScopes: ["CUSTOMER"],
    builtIn: true,
    actions: [
      "admin.user.read", "admin.user.create", "admin.user.update",
      "admin.binding.assign_role",
      "admin.scope.read", "admin.scope.assign",
      // admin.delegation (NEW)
      "admin.delegation.read", "admin.delegation.create",
      "admin.audit.read",
      "policy.content_ops.read", "policy.content_ops.update",
      "policy.display_profile.read",
      "policy.change.request.create", "policy.change.request.read", "policy.change.request.cancel",
      "cms.content.read", "cms.content.create", "cms.content.deploy", "cms.content.approve", "cms.content.activate",
      "cms.template.read", "cms.template.create", "cms.template.approve",
      // cms.policy (NEW)
      "cms.policy.read", "cms.policy.update",
      "rms.device.read",
      "rms.alert.read", "rms.alert.update",
      "rms.command.create",
      "rms.battery.read", "rms.communication.read",
      "registry.device.read",
      "registry.customer.read",
      "registry.group.read",
      // analysis.* (read only)
      "analysis.dashboard.read", "analysis.telemetry.read", "analysis.prediction.read", "analysis.lifecycle.read", "analysis.environment.read",
      // field_ops.* (partial - can view and create work orders, but not approve/close)
      "field_ops.work_order.read", "field_ops.work_order.create", "field_ops.work_order.update",
      "field_ops.maintenance_report.read", "field_ops.maintenance_report.create", "field_ops.analytics.read",
    ],
  },
  {
    id: "tpl_maintenance_operator",
    name: "현장 유지보수 운영자",
    description: "할당된 그룹/디바이스 범위 내 RMS 운영 및 현장 작업.",
    baseRole: "Operator",
    allowedScopes: ["GROUP", "DEVICE"],
    builtIn: true,
    actions: [
      "rms.device.read", "rms.device.control", "rms.device.command",
      "rms.alert.read", "rms.alert.update",
      "rms.command.create",
      "rms.battery.read", "rms.communication.read",
      "cms.template.read",
      "admin.audit.read",
      "registry.device.read",
      "registry.customer.read",
      "registry.group.read",
      "registry.partner.read",
      "registry.relationship.read",
      // analysis.* (read only for diagnostics)
      "analysis.dashboard.read", "analysis.telemetry.read", "analysis.lifecycle.read",
      // field_ops.* (field work - can submit completion but not close)
      "field_ops.work_order.read", "field_ops.work_order.create", "field_ops.work_order.update", "field_ops.work_order.submit_completion",
      "field_ops.maintenance_report.read", "field_ops.maintenance_report.create", "field_ops.analytics.read",
    ],
  },
  {
    id: "tpl_municipality_viewer",
    name: "지자체 열람자",
    description: "읽기 전용. 정책 변경 요청 조회 가능.",
    baseRole: "Viewer",
    allowedScopes: ["CUSTOMER", "GROUP", "DEVICE"],
    builtIn: true,
    actions: [
      "admin.user.read",
      "admin.role.read",
      "admin.permission.read",
      "admin.scope.read",
      "admin.audit.read",
      "policy.security.read",
      "policy.content_ops.read",
      "policy.display_profile.read",
      "policy.change.request.read",
      "cms.content.read",
      "cms.template.read",
      "rms.device.read",
      "rms.alert.read",
      "rms.battery.read", "rms.communication.read",
      "registry.device.read",
      "registry.customer.read",
      "registry.group.read",
      "registry.partner.read",
      // analysis.* (read only)
      "analysis.dashboard.read", "analysis.telemetry.read", "analysis.prediction.read", "analysis.lifecycle.read", "analysis.environment.read",
      // field_ops.* (read only)
      "field_ops.work_order.read", "field_ops.maintenance_report.read", "field_ops.analytics.read",
    ],
  },
  {
    id: "tpl_installer_operator",
    name: "설치 운영자",
    description: "디바이스 설치/등록 작업.",
    baseRole: "Operator",
    allowedScopes: ["DEVICE", "CUSTOMER"],
    builtIn: true,
    actions: [
      "registry.device.read", "registry.device.create",
      "rms.device.read",
      "rms.battery.read", "rms.communication.read",
      "cms.template.read",
      "admin.audit.read",
      // field_ops.* (limited - can create work orders and reports for installation)
      "field_ops.work_order.read", "field_ops.work_order.create",
      "field_ops.maintenance_report.read", "field_ops.maintenance_report.create",
    ],
  },
];

/** Find a template by id */
export function getTemplateById(id: string): RoleTemplate | undefined {
  return ROLE_TEMPLATES.find((t) => t.id === id);
}
