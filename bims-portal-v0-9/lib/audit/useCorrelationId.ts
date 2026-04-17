// ---------------------------------------------------------------------------
// useCorrelationId -- stable correlationId per page session with group support
// ---------------------------------------------------------------------------
// Each page mount gets one correlationId. All audit events from actions
// performed on that page share the same correlationId until:
//   1) The page unmounts (e.g., user navigates away), or
//   2) The caller explicitly calls newCorrelationGroup()
// ---------------------------------------------------------------------------

import { useRef, useCallback, useState } from "react";
import { generateCorrelationId } from "./correlation";

export interface UseCorrelationIdReturn {
  /** Current correlationId -- stable until page unmount or newCorrelationGroup() */
  correlationId: string;
  /** Start a new correlation group (generates a fresh correlationId) */
  newCorrelationGroup: () => string;
  /** How many groups have been created in this session (starts at 1) */
  groupCount: number;
}

/**
 * Returns a stable correlationId that persists for the lifetime of
 * the component. Call `newCorrelationGroup()` to manually start a
 * new group -- useful when a user wants to separate batches of actions.
 */
export function useCorrelationId(): UseCorrelationIdReturn {
  const ref = useRef<string>(generateCorrelationId());
  const [groupCount, setGroupCount] = useState(1);
  // We use a state trigger to force re-renders when the group changes
  const [, setTick] = useState(0);

  const newCorrelationGroup = useCallback(() => {
    const next = generateCorrelationId();
    ref.current = next;
    setGroupCount((c) => c + 1);
    setTick((t) => t + 1);
    return next;
  }, []);

  return {
    correlationId: ref.current,
    newCorrelationGroup,
    groupCount,
  };
}
