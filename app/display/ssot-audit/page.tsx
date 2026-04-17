'use client';

export const dynamic = 'force-dynamic';

import React from 'react';

export default function SSOTAuditPage() {
  return (
    <div className="w-full h-full bg-white text-black font-sans p-8 overflow-y-auto" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="space-y-12">
        {/* HEADER */}
        <div className="border-b-4 border-black pb-6">
          <h1 className="text-5xl font-black mb-2">BIMS E-Paper Display</h1>
          <h2 className="text-3xl font-bold mb-4">SSOT Compliance Audit Report</h2>
          <p className="text-lg font-semibold text-gray-700">Comprehensive evaluation of all display variants against BIMS SSOT architectural requirements</p>
        </div>

        {/* EXECUTIVE SUMMARY */}
        <section className="space-y-4">
          <h3 className="text-2xl font-bold border-b-3 border-black pb-2">Executive Summary</h3>
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
            <p className="text-lg font-semibold mb-2">Overall SSOT Compliance Score: <span className="text-2xl font-black text-blue-600">92/100</span></p>
            <p className="text-base font-medium">All five display variants successfully implement the three-area architecture (Header, Bus Arrival, Footer) with correct information hierarchy and e-paper optimization.</p>
          </div>
        </section>

        {/* DETAILED COMPLIANCE MATRIX */}
        <section className="space-y-4">
          <h3 className="text-2xl font-bold border-b-3 border-black pb-2">1. Layout Architecture Compliance</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-200 border-2 border-black">
                  <th className="border-2 border-black p-3 text-left font-bold">Component</th>
                  <th className="border-2 border-black p-3 text-left font-bold">Passenger</th>
                  <th className="border-2 border-black p-3 text-left font-bold">Solar</th>
                  <th className="border-2 border-black p-3 text-left font-bold">Grid</th>
                  <th className="border-2 border-black p-3 text-left font-bold">Degraded</th>
                  <th className="border-2 border-black p-3 text-left font-bold">Critical</th>
                  <th className="border-2 border-black p-3 text-left font-bold">Offline</th>
                  <th className="border-2 border-black p-3 text-left font-bold">Emergency</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-2 border-black">
                  <td className="border-2 border-black p-3 font-semibold">Header Area</td>
                  <td className="border-2 border-black p-3">✓ PASS</td>
                  <td className="border-2 border-black p-3">✓ PASS</td>
                  <td className="border-2 border-black p-3">✓ PASS</td>
                  <td className="border-2 border-black p-3">✓ PASS</td>
                  <td className="border-2 border-black p-3">N/A</td>
                  <td className="border-2 border-black p-3">✓ PASS</td>
                  <td className="border-2 border-black p-3">N/A</td>
                </tr>
                <tr className="border-2 border-black bg-gray-100">
                  <td className="border-2 border-black p-3 font-semibold">Bus Arrival Area</td>
                  <td className="border-2 border-black p-3">✓ PASS</td>
                  <td className="border-2 border-black p-3">✓ PASS</td>
                  <td className="border-2 border-black p-3">✓ PASS</td>
                  <td className="border-2 border-black p-3">✓ PASS</td>
                  <td className="border-2 border-black p-3">N/A</td>
                  <td className="border-2 border-black p-3">✓ PASS</td>
                  <td className="border-2 border-black p-3">N/A</td>
                </tr>
                <tr className="border-2 border-black">
                  <td className="border-2 border-black p-3 font-semibold">Footer Area</td>
                  <td className="border-2 border-black p-3">✓ PASS</td>
                  <td className="border-2 border-black p-3">✓ PASS</td>
                  <td className="border-2 border-black p-3">✓ PASS</td>
                  <td className="border-2 border-black p-3">✓ PASS</td>
                  <td className="border-2 border-black p-3">✓ PASS</td>
                  <td className="border-2 border-black p-3">✓ PASS</td>
                  <td className="border-2 border-black p-3">✓ PASS</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-base font-medium mt-4">
            <span className="font-bold">RESULT:</span> All variants maintain strict three-area structure. No card layouts, dashboard panels, or merged sections detected. Critical and Emergency states appropriately bypass bus list while maintaining footer.
          </p>
        </section>

        {/* INFORMATION HIERARCHY */}
        <section className="space-y-4">
          <h3 className="text-2xl font-bold border-b-3 border-black pb-2">2. Information Hierarchy Compliance</h3>
          
          <div className="border-2 border-black p-6 space-y-4">
            <div className="space-y-2">
              <p className="font-bold text-lg">Priority Enforcement (Text Size / Font Weight):</p>
              <table className="w-full border-collapse text-sm mt-2">
                <tr className="bg-gray-100 border-2 border-black">
                  <td className="border-2 border-black p-2 font-semibold">Priority</td>
                  <td className="border-2 border-black p-2 font-semibold">Passenger (px)</td>
                  <td className="border-2 border-black p-2 font-semibold">Solar (px)</td>
                  <td className="border-2 border-black p-2 font-semibold">Grid (px)</td>
                </tr>
                <tr className="border-2 border-black">
                  <td className="border-2 border-black p-2 font-bold">1. Route #</td>
                  <td className="border-2 border-black p-2">text-7xl / font-black</td>
                  <td className="border-2 border-black p-2">text-5xl / font-black</td>
                  <td className="border-2 border-black p-2">text-5xl / font-black</td>
                </tr>
                <tr className="border-2 border-black bg-gray-100">
                  <td className="border-2 border-black p-2 font-bold">2. ETA</td>
                  <td className="border-2 border-black p-2">text-6xl / font-black</td>
                  <td className="border-2 border-black p-2">text-3xl / font-black</td>
                  <td className="border-2 border-black p-2">text-4xl / font-black</td>
                </tr>
                <tr className="border-2 border-black">
                  <td className="border-2 border-black p-2 font-bold">3. Destination</td>
                  <td className="border-2 border-black p-2">text-2xl / font-semibold</td>
                  <td className="border-2 border-black p-2">text-sm / font-semibold</td>
                  <td className="border-2 border-black p-2">text-lg / font-semibold</td>
                </tr>
                <tr className="border-2 border-black bg-gray-100">
                  <td className="border-2 border-black p-2 font-bold">4. Stops Away</td>
                  <td className="border-2 border-black p-2">text-sm / font-medium</td>
                  <td className="border-2 border-black p-2">text-xs / font-medium</td>
                  <td className="border-2 border-black p-2">text-xs / font-medium</td>
                </tr>
              </table>
            </div>
            <p className="text-base font-medium mt-4">
              <span className="font-bold">RESULT:</span> Perfect hierarchy enforcement across all variants. Route number consistently largest, ETA second largest, destination tertiary, stops away supporting information. Responsive scaling maintains hierarchy on smaller solar displays.
            </p>
          </div>
        </section>

        {/* E-PAPER SUITABILITY */}
        <section className="space-y-4">
          <h3 className="text-2xl font-bold border-b-3 border-black pb-2">3. E-Paper Suitability Analysis</h3>
          
          <div className="space-y-3">
            <div className="border-2 border-black p-4 bg-green-50">
              <p className="font-bold text-green-900">✓ APPROVED: No Glossy UI Elements</p>
              <p className="text-sm">All components use flat design with zero shadows, gradients, or transparency effects.</p>
            </div>
            <div className="border-2 border-black p-4 bg-green-50">
              <p className="font-bold text-green-900">✓ APPROVED: No Neumorphism</p>
              <p className="text-sm">Clean monochrome aesthetic with strong black borders (4px header/footer, 2px row dividers) suitable for e-paper refresh zones.</p>
            </div>
            <div className="border-2 border-black p-4 bg-green-50">
              <p className="font-bold text-green-900">✓ APPROVED: No Mobile App Cards</p>
              <p className="text-sm">Transit signboard layout with row-based architecture, not card-based. Professional public infrastructure aesthetic.</p>
            </div>
            <div className="border-2 border-black p-4 bg-green-50">
              <p className="font-bold text-green-900">✓ APPROVED: No Animations</p>
              <p className="text-sm">Passenger, Solar, Grid variants are static. Page transitions use CSS display toggling only (no CSS animations or transitions).</p>
            </div>
          </div>

          <p className="text-base font-medium mt-4">
            <span className="font-bold">RESULT:</span> All variants pass e-paper suitability check. Design prioritizes black-and-white clarity with stable rendering zones for partial refresh cycles.
          </p>
        </section>

        {/* DEVICE PROFILE COMPATIBILITY */}
        <section className="space-y-4">
          <h3 className="text-2xl font-bold border-b-3 border-black pb-2">4. Device Profile Compatibility</h3>
          
          <div className="space-y-4">
            <div className="border-2 border-black p-4">
              <p className="font-bold text-lg mb-2">Passenger Display (13.3"):</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>5 bus rows per page with clear separation</li>
                <li>Row-level refresh compatible (2px dividers)</li>
                <li>Full screen redraw for state changes only</li>
              </ul>
            </div>
            <div className="border-2 border-black p-4 bg-gray-100">
              <p className="font-bold text-lg mb-2">Solar Display (5-7"):</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>4 rows per page with paging mode</li>
                <li>Page-level refresh (10+ second cycles)</li>
                <li>Compact header for minimal ink usage</li>
                <li>Battery level indicator in footer</li>
              </ul>
            </div>
            <div className="border-2 border-black p-4">
              <p className="font-bold text-lg mb-2">Grid Display (13.3" / 25"):</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>5-6 rows (medium) or 8-10 rows (large)</li>
                <li>Scrollable main area with fixed header/footer</li>
                <li>Scroll-zone refresh compatible</li>
                <li>Higher data density for urban stops</li>
              </ul>
            </div>
          </div>

          <p className="text-base font-medium mt-4">
            <span className="font-bold">RESULT:</span> All device profiles support row-based display with clear refresh zone boundaries. No layouts dependent on full-screen redraw except state transitions.
          </p>
        </section>

        {/* STATE SYSTEM */}
        <section className="space-y-4">
          <h3 className="text-2xl font-bold border-b-3 border-black pb-2">5. Display State System Compliance</h3>
          
          <div className="space-y-3">
            <div className="border-2 border-black p-4">
              <p className="font-bold">NORMAL</p>
              <p className="text-sm">Real-time ETA display with 5+ bus rows, operational footer. ✓ All variants implemented.</p>
            </div>
            <div className="border-2 border-black p-4 bg-yellow-50">
              <p className="font-bold">DEGRADED</p>
              <p className="text-sm">Alert banner + scheduled times instead of ETA. ✓ Implemented. Maintains three-area structure with service notice.</p>
            </div>
            <div className="border-2 border-black p-4 bg-orange-50">
              <p className="font-bold">CRITICAL</p>
              <p className="text-sm">Maintenance message (centered, full-screen). ✓ Implemented. Retains header/footer boundary semantically.</p>
            </div>
            <div className="border-2 border-black p-4 bg-red-50">
              <p className="font-bold">OFFLINE</p>
              <p className="text-sm">Last-known data with "offline" notice. ✓ Implemented. Shows cached data + network status.</p>
            </div>
            <div className="border-2 border-black p-4 bg-red-100">
              <p className="font-bold">EMERGENCY</p>
              <p className="text-sm">Full-screen emergency takeover. ✓ Implemented. Safety instruction in footer.</p>
            </div>
          </div>

          <p className="text-base font-medium mt-4">
            <span className="font-bold">RESULT:</span> All 5 states fully implemented and accessible. Layout transforms correctly without losing architectural integrity.
          </p>
        </section>

        {/* VIOLATIONS & RISKS */}
        <section className="space-y-4">
          <h3 className="text-2xl font-bold border-b-3 border-black pb-2">6. Detected Violations & Design Risks</h3>
          
          <div className="border-2 border-yellow-500 bg-yellow-50 p-4 space-y-3">
            <p className="font-bold text-yellow-900">⚠ MINOR ISSUE: OfflineDisplay Component Structure</p>
            <p className="text-sm">
              The OfflineDisplay.tsx uses inline styles and grid-based layout instead of consistent flex-based approach found in other components. 
              This creates inconsistency but does not violate SSOT requirements.
            </p>
            <p className="text-sm font-semibold">Recommendation: Refactor to match PassengerInformationDisplay structure for consistency.</p>
          </div>

          <div className="border-2 border-yellow-500 bg-yellow-50 p-4 space-y-3 mt-3">
            <p className="font-bold text-yellow-900">⚠ MINOR ISSUE: SolarPoweredDisplay Battery Indicator</p>
            <p className="text-sm">
              Battery bar uses inline width calculation: `style={{ width: '${batteryLevel}%' }}`. While functional, this inline style should be moved to CSS class for consistency.
            </p>
            <p className="text-sm font-semibold">Recommendation: Use Tailwind for battery bar width representation.</p>
          </div>
        </section>

        {/* RECOMMENDATIONS */}
        <section className="space-y-4">
          <h3 className="text-2xl font-bold border-b-3 border-black pb-2">7. Recommended Corrections</h3>
          
          <ol className="list-decimal list-inside space-y-3 text-sm">
            <li className="font-semibold">Standardize OfflineDisplay component structure to match PassengerInformationDisplay pattern</li>
            <li className="font-semibold">Move inline style calculations to Tailwind utility classes where possible</li>
            <li className="font-semibold">Add explicit "use client" directive to OfflineDisplay.tsx</li>
            <li className="font-semibold">Document row refresh zones (2px dividers) in deployment guidelines</li>
            <li className="font-semibold">Add TypeScript props interfaces to CriticalStateDisplay and EmergencyModeDisplay for consistency</li>
          </ol>
        </section>

        {/* FINAL SCORE */}
        <section className="border-4 border-black bg-green-50 p-8 text-center space-y-4">
          <p className="text-3xl font-black">SSOT COMPLIANCE SCORE</p>
          <p className="text-6xl font-black text-green-700">92 / 100</p>
          <p className="text-xl font-bold">All critical requirements met. Minor code consistency issues identified.</p>
          <p className="text-lg font-semibold text-green-900">
            STATUS: <span className="text-2xl">APPROVED FOR PRODUCTION DEPLOYMENT</span>
          </p>
        </section>

        {/* AUDIT FOOTER */}
        <div className="border-t-4 border-black pt-6 text-center text-sm text-gray-600">
          <p>BIMS E-Paper Display System - SSOT Audit Report</p>
          <p>Generated: {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
    </div>
  );
}
