import { runSimulation, scenarios } from "../lib/state-engine";

function fmt(snap: ReturnType<typeof runSimulation>[number]) {
  return [
    `t=${snap.timeSec}s`,
    `Overall=${snap.overall}`,
    `Display=${snap.displayState}`,
    `Incident=${snap.incident}`,
    `Maint=${snap.maintenance}`,
    `Tablet=${snap.tabletBadge}`,
    `MaintLabel=${snap.maintenanceLabel || "-"}`,
    `SOC=${snap.soc}%`,
    `ETA=${snap.etaVisible}`,
    `Flap=${snap.flapping}`,
  ].join(" | ");
}

// Scenario 4 (OFFLINE -> EMERGENCY)
console.log("=== SCENARIO 4: OFFLINE -> EMERGENCY ===");
const s4 = scenarios.find((s) => s.id === "s4")!;
const r4 = runSimulation(s4.events);
for (const snap of r4) {
  console.log(fmt(snap));
  if (snap.notes.length) console.log("  Notes:", snap.notes.join("; "));
}

// Scenario 9 (OFFLINE + CRITICAL overlap)
console.log("\n=== SCENARIO 9: OFFLINE + CRITICAL overlap ===");
const s9 = scenarios.find((s) => s.id === "s9")!;
const r9 = runSimulation(s9.events);
for (const snap of r9) {
  console.log(fmt(snap));
  if (snap.notes.length) console.log("  Notes:", snap.notes.join("; "));
}

// Validate Scenario 9 key assertions
console.log("\n=== SCENARIO 9 ASSERTIONS ===");
const at330 = r9.find((s) => s.timeSec === 330);
const at540 = r9.find((s) => s.timeSec === 540);
const at660 = r9.find((s) => s.timeSec === 660);
const at900 = r9.find((s) => s.timeSec === 900);
const at960 = r9.find((s) => s.timeSec === 960);

console.log(`t=330s overall=OFFLINE? ${at330?.overall === "OFFLINE" ? "PASS" : "FAIL"} (got ${at330?.overall})`);
console.log(`t=540s overall=OFFLINE? ${at540?.overall === "OFFLINE" ? "PASS" : "FAIL"} (got ${at540?.overall})`);
console.log(`t=660s overall=CRITICAL? ${at660?.overall === "CRITICAL" ? "PASS" : "FAIL"} (got ${at660?.overall})`);
console.log(`t=900s overall=NORMAL? ${at900?.overall === "NORMAL" ? "PASS" : "FAIL"} (got ${at900?.overall})`);
console.log(`t=960s overall=NORMAL? ${at960?.overall === "NORMAL" ? "PASS" : "FAIL"} (got ${at960?.overall})`);
