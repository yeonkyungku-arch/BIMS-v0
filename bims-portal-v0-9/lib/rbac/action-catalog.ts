// ---------------------------------------------------------------------------
// Action Catalog -- SSOT for all permission actions
// ---------------------------------------------------------------------------
// Naming: {domain}.{resource}.{verb}
// Domains: admin, policy, cms, rms, registry
// ---------------------------------------------------------------------------

export const ACTION_CATALOG = {
  // admin.user
  "admin.user.read":           { domain: "admin", resource: "user", verb: "read",           label: "계정 조회" },
  "admin.user.create":         { domain: "admin", resource: "user", verb: "create",         label: "계정 생성" },
  "admin.user.update":         { domain: "admin", resource: "user", verb: "update",         label: "계정 수정" },
  "admin.user.disable":        { domain: "admin", resource: "user", verb: "disable",        label: "계정 비활성화" },
  "admin.user.reset_password": { domain: "admin", resource: "user", verb: "reset_password", label: "비밀번호 초기화" },
  // admin.role
  "admin.role.read":           { domain: "admin", resource: "role", verb: "read",   label: "역할 조회" },
  "admin.role.create":         { domain: "admin", resource: "role", verb: "create", label: "역할 생성" },
  "admin.role.update":         { domain: "admin", resource: "role", verb: "update", label: "역할 수정" },
  // admin.permission
  "admin.permission.read":     { domain: "admin", resource: "permission", verb: "read", label: "권한 조회" },
  // admin.binding
  "admin.binding.assign_role": { domain: "admin", resource: "binding", verb: "assign_role", label: "역할 할당" },
  "admin.binding.revoke_role": { domain: "admin", resource: "binding", verb: "revoke_role", label: "역할 해제" },
  // admin.scope
  "admin.scope.read":          { domain: "admin", resource: "scope", verb: "read",   label: "범위 조회" },
  "admin.scope.create":        { domain: "admin", resource: "scope", verb: "create", label: "범위 생성" },
  "admin.scope.update":        { domain: "admin", resource: "scope", verb: "update", label: "범위 수정" },
  "admin.scope.assign":        { domain: "admin", resource: "scope", verb: "assign", label: "범위 할당" },
  "admin.scope.revoke":        { domain: "admin", resource: "scope", verb: "revoke", label: "범위 해제" },
  // admin.delegation
  "admin.delegation.read":     { domain: "admin", resource: "delegation", verb: "read",   label: "위임 조회" },
  "admin.delegation.create":   { domain: "admin", resource: "delegation", verb: "create", label: "위임 생성" },
  "admin.delegation.revoke":   { domain: "admin", resource: "delegation", verb: "revoke", label: "위임 취소" },
  // admin.settings
  "admin.settings.read":       { domain: "admin", resource: "settings", verb: "read",   label: "시스템 설정 조회" },
  "admin.settings.update":     { domain: "admin", resource: "settings", verb: "update", label: "시스템 설정 수정" },
  // policy.security
  "policy.security.read":      { domain: "policy", resource: "security", verb: "read",   label: "보안 정책 조회" },
  "policy.security.update":    { domain: "policy", resource: "security", verb: "update", label: "보안 정책 수정" },
  // policy.content_ops
  "policy.content_ops.read":   { domain: "policy", resource: "content_ops", verb: "read",   label: "콘텐츠 운영 정책 조회" },
  "policy.content_ops.update": { domain: "policy", resource: "content_ops", verb: "update", label: "콘텐츠 운영 정책 수정" },
  // policy.display_profile
  "policy.display_profile.read":    { domain: "policy", resource: "display_profile", verb: "read",    label: "디스플레이 프로필 조회" },
  "policy.display_profile.create":  { domain: "policy", resource: "display_profile", verb: "create",  label: "디스플레이 프로필 생성" },
  "policy.display_profile.update":  { domain: "policy", resource: "display_profile", verb: "update",  label: "디스플레이 프로필 수정" },
  "policy.display_profile.publish": { domain: "policy", resource: "display_profile", verb: "publish", label: "디스플레이 프로필 게시" },
  // policy.change (4-eyes workflow)
  "policy.change.request.create":   { domain: "policy", resource: "change", verb: "create",  label: "정책 변경 요청 생성" },
  "policy.change.request.read":     { domain: "policy", resource: "change", verb: "read",    label: "정책 변경 요청 조회" },
  "policy.change.request.cancel":   { domain: "policy", resource: "change", verb: "cancel",  label: "정책 변경 요청 취소" },
  "policy.change.approve":          { domain: "policy", resource: "change", verb: "approve", label: "정책 변경 승인" },
  "policy.change.reject":           { domain: "policy", resource: "change", verb: "reject",  label: "정책 변경 반려" },
  // policy.*.apply (domain-specific publish/apply)
  "policy.security.apply":          { domain: "policy", resource: "security", verb: "apply",      label: "보안 정책 적용" },
  "policy.content_ops.apply":       { domain: "policy", resource: "content_ops", verb: "apply",   label: "콘텐츠 운영 정책 적용" },
  "policy.display_profile.apply":   { domain: "policy", resource: "display_profile", verb: "apply", label: "디스플레이 프로필 정책 적용" },
  // authorization (audit-only internal)
  "authorization.denied":           { domain: "admin", resource: "authorization", verb: "denied", label: "권한 거부 (감사용)" },
  // admin.audit
  "admin.audit.read":          { domain: "admin", resource: "audit", verb: "read",   label: "감사 로그 조회" },
  "admin.audit.export":        { domain: "admin", resource: "audit", verb: "export", label: "감사 로그 내보내기" },
  // cms (placeholders for sidebar gating)
  "cms.content.read":          { domain: "cms", resource: "content", verb: "read",    label: "콘텐츠 조회" },
  "cms.content.create":        { domain: "cms", resource: "content", verb: "create",  label: "콘텐츠 생성" },
  "cms.content.deploy":        { domain: "cms", resource: "content", verb: "deploy",  label: "콘텐츠 배포" },
  "cms.content.approve":       { domain: "cms", resource: "content", verb: "approve",  label: "콘텐츠 승인" },
  "cms.content.activate":      { domain: "cms", resource: "content", verb: "activate", label: "콘텐츠 활성화" },
  "cms.content.rollback":      { domain: "cms", resource: "content", verb: "rollback", label: "콘텐츠 롤백" },
  // cms.template
  "cms.template.read":         { domain: "cms", resource: "template", verb: "read",    label: "템플릿 조회" },
  "cms.template.create":       { domain: "cms", resource: "template", verb: "create",  label: "템플릿 생성" },
  "cms.template.update":       { domain: "cms", resource: "template", verb: "update",  label: "템플릿 수정" },
  "cms.template.approve":      { domain: "cms", resource: "template", verb: "approve", label: "템플릿 승인" },
  "cms.template.activate":     { domain: "cms", resource: "template", verb: "activate", label: "템플릿 활성화" },
  // cms.policy (CMS 콘텐츠 정책)
  "cms.policy.read":           { domain: "cms", resource: "policy", verb: "read",   label: "콘텐츠 정책 조회" },
  "cms.policy.update":         { domain: "cms", resource: "policy", verb: "update", label: "콘텐츠 정책 수정" },
  // rms.device
  "rms.device.read":           { domain: "rms", resource: "device", verb: "read",    label: "단말 모니터링 조회" },
  "rms.device.control":        { domain: "rms", resource: "device", verb: "control", label: "단말 원격 제어" },
  "rms.device.command":        { domain: "rms", resource: "device", verb: "command", label: "단말 명령 전송" },
  // rms.alert
  "rms.alert.read":            { domain: "rms", resource: "alert", verb: "read",   label: "장애 알림 조회" },
  "rms.alert.update":          { domain: "rms", resource: "alert", verb: "update", label: "장애 알림 수정" },
  "rms.alert.close":           { domain: "rms", resource: "alert", verb: "close",  label: "장애 알림 종료" },
  // rms.command
  "rms.command.create":        { domain: "rms", resource: "command", verb: "create",  label: "명령 요청 생성" },
  "rms.command.approve":       { domain: "rms", resource: "command", verb: "approve", label: "명령 요청 승인" },
  // rms.battery
  "rms.battery.read":          { domain: "rms", resource: "battery", verb: "read", label: "배터리 상태 조회" },
  // rms.communication
  "rms.communication.read":    { domain: "rms", resource: "communication", verb: "read", label: "통신 상태 조회" },
  // registry
  "registry.device.read":      { domain: "registry", resource: "device", verb: "read",   label: "디바이스 등록 조회" },
  "registry.device.create":    { domain: "registry", resource: "device", verb: "create", label: "디바이스 등록" },
  "registry.device.update":    { domain: "registry", resource: "device", verb: "update", label: "디바이스 수정" },
  "registry.customer.read":    { domain: "registry", resource: "customer", verb: "read",   label: "고객사 조회" },
  "registry.customer.create":  { domain: "registry", resource: "customer", verb: "create", label: "고객사 등록" },
  "registry.customer.update":  { domain: "registry", resource: "customer", verb: "update", label: "고객사 수정" },
  "registry.group.read":       { domain: "registry", resource: "group", verb: "read",   label: "그룹 조회" },
  "registry.group.create":     { domain: "registry", resource: "group", verb: "create", label: "그룹 등록" },
  "registry.group.update":     { domain: "registry", resource: "group", verb: "update", label: "그룹 수정" },
  "registry.partner.read":     { domain: "registry", resource: "partner", verb: "read",   label: "파트너 조회" },
  "registry.partner.create":   { domain: "registry", resource: "partner", verb: "create", label: "파트너 등록" },
  "registry.partner.update":   { domain: "registry", resource: "partner", verb: "update", label: "파트너 수정" },
  "registry.relationship.read":     { domain: "registry", resource: "relationship", verb: "read",   label: "운영 관계 조회" },
  "registry.relationship.create":   { domain: "registry", resource: "relationship", verb: "create", label: "운영 관계 등록" },
  "registry.relationship.update":   { domain: "registry", resource: "relationship", verb: "update", label: "운영 관계 수정" },

  // ---------------------------------------------------------------------------
  // analysis -- Device Analysis module (independent, read-only)
  // ---------------------------------------------------------------------------
  "analysis.dashboard.read":    { domain: "analysis", resource: "dashboard",   verb: "read",   label: "분석 대시보드 조회" },
  "analysis.telemetry.read":    { domain: "analysis", resource: "telemetry",   verb: "read",   label: "텔레메트리 분석 조회" },
  "analysis.prediction.read":   { domain: "analysis", resource: "prediction",  verb: "read",   label: "장애 예측 조회" },
  "analysis.lifecycle.read":    { domain: "analysis", resource: "lifecycle",   verb: "read",   label: "라이프사이클 분석 조회" },
  "analysis.environment.read":  { domain: "analysis", resource: "environment", verb: "read",   label: "환경 분석 조회" },
  "analysis.export":            { domain: "analysis", resource: "data",        verb: "export", label: "분석 데이터 내보내기" },

  // ---------------------------------------------------------------------------
  // field_ops -- Field Operations module (independent)
  // ---------------------------------------------------------------------------
  "field_ops.work_order.read":     { domain: "field_ops", resource: "work_order", verb: "read",    label: "작업 지시 조회" },
  "field_ops.work_order.create":   { domain: "field_ops", resource: "work_order", verb: "create",  label: "작업 지시 생성" },
  "field_ops.work_order.update":   { domain: "field_ops", resource: "work_order", verb: "update",  label: "작업 지시 수정" },
  "field_ops.work_order.assign":   { domain: "field_ops", resource: "work_order", verb: "assign",  label: "작업 지시 배정" },
  "field_ops.work_order.approve":  { domain: "field_ops", resource: "work_order", verb: "approve", label: "작업 지시 승인" },
  "field_ops.work_order.submit_completion": { domain: "field_ops", resource: "work_order", verb: "submit_completion", label: "작업 완료 제출" },
  "field_ops.work_order.close":    { domain: "field_ops", resource: "work_order", verb: "close",   label: "작업 지시 최종 완료" },
  "field_ops.maintenance_report.read":   { domain: "field_ops", resource: "maintenance_report", verb: "read",   label: "유지보수 보고서 조회" },
  "field_ops.maintenance_report.create": { domain: "field_ops", resource: "maintenance_report", verb: "create", label: "유지보수 보고서 생성" },
  "field_ops.analytics.read":     { domain: "field_ops", resource: "analytics", verb: "read",   label: "유지보수 분석 조회" },
  "field_ops.analytics.export":   { domain: "field_ops", resource: "analytics", verb: "export", label: "유지보수 분석 내보내기" },
} as const;

export type ActionId = keyof typeof ACTION_CATALOG;

export interface ActionMeta {
  domain: string;
  resource: string;
  verb: string;
  label: string;
}

/** Get all actions for a given domain */
export function getActionsByDomain(domain: string): { id: ActionId; meta: ActionMeta }[] {
  return (Object.entries(ACTION_CATALOG) as [ActionId, ActionMeta][])
    .filter(([, meta]) => meta.domain === domain)
    .map(([id, meta]) => ({ id, meta }));
}

/** Get all unique domains */
export function getAllDomains(): string[] {
  const domains = new Set(Object.values(ACTION_CATALOG).map((m) => m.domain));
  return [...domains];
}

/** Domain labels */
export const DOMAIN_LABEL: Record<string, string> = {
  admin:     "관리자",
  policy:    "정책",
  cms:       "콘텐츠 관리",
  rms:       "원격 관리",
  registry:  "등록 관리",
  analysis:  "단말 분석",
  field_ops: "현장 운영",
};
