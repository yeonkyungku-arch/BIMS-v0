// ---------------------------------------------------------------------------
// resolveTarget -- Auto-resolve targetType/targetId from action + payload
// ---------------------------------------------------------------------------
// Uses ACTION_TARGET_RULES as the single source of truth.
// In development: throws hard errors for missing mappings (fail-fast).
// In production: falls back to Unknown/unknown (never crashes).
// ---------------------------------------------------------------------------

import { getActionTargetRule } from "./actionTargetMap";

const IS_DEV = process.env.NODE_ENV !== "production";

export interface ResolvedTarget {
  targetType: string;
  targetId: string;
}

/**
 * Extract a nested value from an object using a dot-path key.
 * e.g. getByPath({ user: { id: "U1" } }, "user.id") => "U1"
 */
function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Resolve the target for an audit event.
 *
 * @param action - ActionId string (e.g. "admin.user.create")
 * @param payload - Optional object to extract targetId from (usually `after` or merged params)
 * @returns { targetType, targetId }
 */
export function resolveTarget(
  action: string,
  payload?: Record<string, unknown> | null,
): ResolvedTarget {
  const rule = getActionTargetRule(action);

  // --- No mapping found = always throw (dev + prod) ---
  if (!rule) {
    throw new Error(
      `[audit/resolveTarget] Missing ACTION_TARGET_RULES mapping for: "${action}". ` +
      `Add a rule in lib/audit/actionTargetMap.ts.`,
    );
  }

  // --- Constant targetId takes priority ---
  if (rule.targetIdConst) {
    return { targetType: rule.targetType, targetId: rule.targetIdConst };
  }

  // --- Extract targetId from payload via dot-path ---
  if (rule.targetIdPath) {
    if (!payload) {
      throw new Error(
        `[audit/resolveTarget] Payload required for action "${action}" (targetIdPath: "${rule.targetIdPath}") but was ${payload}.`,
      );
    }
    const extracted = getByPath(payload, rule.targetIdPath);
    if (extracted !== undefined && extracted !== null && extracted !== "") {
      return { targetType: rule.targetType, targetId: String(extracted) };
    }
    throw new Error(
      `[audit/resolveTarget] Missing targetId at path "${rule.targetIdPath}" ` +
      `for action "${action}". Payload keys: [${Object.keys(payload).join(", ")}]`,
    );
  }

  // No targetIdPath and no targetIdConst -- mapping exists but has no ID strategy
  return { targetType: rule.targetType, targetId: rule.action };
}

/**
 * Validate that a given action has a mapping. Returns the rule or null.
 * Useful for verification pages.
 */
export function validateMapping(action: string): {
  mapped: boolean;
  rule: ReturnType<typeof getActionTargetRule>;
} {
  const rule = getActionTargetRule(action);
  return { mapped: !!rule, rule };
}
