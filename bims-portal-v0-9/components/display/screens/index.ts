/**
 * BIMS Display Screens
 * 
 * Each screen maps 1:1 to a DisplayState.
 * Screens are pure rendering templates with NO state computation.
 * 
 * DisplayState -> Screen mapping:
 *   NORMAL    -> NormalScreen
 *   DEGRADED  -> DegradedScreen
 *   CRITICAL  -> CriticalScreen
 *   OFFLINE   -> OfflineScreen
 *   EMERGENCY -> EmergencyScreen
 */

export { default as NormalScreen } from "./NormalScreen";
export { default as DegradedScreen } from "./DegradedScreen";
export { default as CriticalScreen } from "./CriticalScreen";
export { default as OfflineScreen } from "./OfflineScreen";
export { default as EmergencyScreen } from "./EmergencyScreen";
