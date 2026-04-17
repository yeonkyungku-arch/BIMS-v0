/**
 * BIMS Display Power Profiles
 * 
 * Power profiles handle device-specific rendering constraints
 * (refresh rates, row counts, pagination) WITHOUT owning state.
 * 
 * All state (currentPage, etc.) is managed by DisplayCoordinator.
 */

export { SolarPowerProfile } from "./SolarPowerProfile";
export { GridPowerProfile } from "./GridPowerProfile";
