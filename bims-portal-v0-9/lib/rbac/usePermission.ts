// ---------------------------------------------------------------------------
// Permission Helper -- hasAction / hasAnyAction
// ---------------------------------------------------------------------------
// Operates on a flat array of ActionId strings (the "user actions" set).
// Used for:
//  - Sidebar visibility
//  - Button visibility
//  - Page access
//
// If user lacks the required action, the element must NOT be rendered
// (never show disabled state for unauthorized actions).
// ---------------------------------------------------------------------------

import type { ActionId } from "./action-catalog";

/**
 * Check if `userActions` contains the given `action`.
 */
export function hasAction(userActions: readonly ActionId[], action: ActionId): boolean {
  return userActions.includes(action);
}

/**
 * Check if `userActions` contains at least one of the given `actions`.
 */
export function hasAnyAction(userActions: readonly ActionId[], actions: readonly ActionId[]): boolean {
  return actions.some((a) => userActions.includes(a));
}

/**
 * Check if `userActions` contains ALL of the given `actions`.
 */
export function hasAllActions(userActions: readonly ActionId[], actions: readonly ActionId[]): boolean {
  return actions.every((a) => userActions.includes(a));
}
