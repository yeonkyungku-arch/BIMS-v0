export default function GridPoweredDocPage() {
  return (
    <div className="min-h-screen bg-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black mb-2">Grid-Powered E-Paper Display</h1>
        <p className="text-gray-600 mb-8">Technical specification and design documentation for AC-powered public transit signboard.</p>

        <div className="space-y-8">
          {/* OVERVIEW */}
          <section>
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-black pb-2">Overview</h2>
            <div className="space-y-3 text-base leading-relaxed">
              <p>
                The Grid-Powered E-Paper Display is designed for AC-powered installation in high-traffic public transit stops. Unlike solar-powered variants, this system prioritizes data density and real-time information updates through scrolling, suitable for 13.3" and 25" e-paper panels.
              </p>
              <p className="font-semibold">Key Advantage:</p>
              <p className="text-sm">Consistent power supply enables higher refresh rates, more route information, and continuous scrolling without battery optimization constraints.</p>
            </div>
          </section>

          {/* DEVICE SPECS */}
          <section>
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-black pb-2">Device Specifications</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="border border-gray-300 p-4">
                  <h3 className="font-bold mb-2 text-lg">Medium Device (13.3")</h3>
                  <ul className="text-sm space-y-1">
                    <li><strong>Resolution:</strong> 1600 × 1200 px (16:12 aspect)</li>
                    <li><strong>Routes Visible:</strong> 5-6 rows per screen</li>
                    <li><strong>Interaction:</strong> Scrolling for additional routes</li>
                    <li><strong>Typical Setting:</strong> Secondary transit stops, bus shelters</li>
                  </ul>
                </div>
                <div className="border border-gray-300 p-4">
                  <h3 className="font-bold mb-2 text-lg">Large Device (25")</h3>
                  <ul className="text-sm space-y-1">
                    <li><strong>Resolution:</strong> 3200 × 2400 px (4:3 aspect)</li>
                    <li><strong>Routes Visible:</strong> 8-10 rows per screen</li>
                    <li><strong>Interaction:</strong> Scrolling for additional routes</li>
                    <li><strong>Typical Setting:</strong> Major transit hubs, central stops</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* VISUAL HIERARCHY */}
          <section>
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-black pb-2">Visual Hierarchy</h2>
            <div className="space-y-4">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left py-2 px-3 font-bold">Element</th>
                    <th className="text-left py-2 px-3 font-bold">Size (Medium)</th>
                    <th className="text-left py-2 px-3 font-bold">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="py-2 px-3 font-semibold">Route Number</td>
                    <td className="py-2 px-3">5xl (48px) font-black</td>
                    <td className="py-2 px-3">Strongest visual element, immediate recognition</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="py-2 px-3 font-semibold">ETA</td>
                    <td className="py-2 px-3">4xl (36px) font-black</td>
                    <td className="py-2 px-3">Second strongest, critical arrival info</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="py-2 px-3 font-semibold">Destination</td>
                    <td className="py-2 px-3">lg (18px) font-semibold</td>
                    <td className="py-2 px-3">Secondary information, route confirmation</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="py-2 px-3 font-semibold">Stops Away</td>
                    <td className="py-2 px-3">xs (12px) font-medium</td>
                    <td className="py-2 px-3">Supporting detail, tertiary reference</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* LAYOUT ZONES */}
          <section>
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-black pb-2">Layout Structure</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 border-l-4 border-black">
                <h3 className="font-bold mb-2">Header Zone (Fixed)</h3>
                <p className="text-sm mb-2">Stop name, date, day, weather, temperature. Fixed at top, always visible. Uses 4px bottom border for e-paper partial refresh optimization.</p>
              </div>
              <div className="bg-gray-50 p-4 border-l-4 border-black">
                <h3 className="font-bold mb-2">Route List Zone (Scrollable)</h3>
                <p className="text-sm mb-2">Primary content area showing 5-10 bus routes. Supports smooth scrolling for additional data. Each route row uses 1px bottom border for efficient partial refresh. Row height: 3-4 lines of text with 12px vertical padding.</p>
              </div>
              <div className="bg-gray-50 p-4 border-l-4 border-black">
                <h3 className="font-bold mb-2">Footer Zone (Fixed)</h3>
                <p className="text-sm">Single-line operational message (safety notice, service alerts, etc.). Fixed at bottom, always visible. Uses 4px top border for stability.</p>
              </div>
            </div>
          </section>

          {/* ROW STRUCTURE */}
          <section>
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-black pb-2">Route Row Structure</h2>
            <div className="bg-white border-2 border-black p-4">
              <div className="mb-4 pb-4 border-b-2 border-gray-300">
                <div className="flex justify-between items-baseline mb-1">
                  <div className="text-4xl font-black">2413</div>
                  <div className="text-3xl font-black">곧 도착</div>
                </div>
                <div className="flex justify-between items-baseline">
                  <div className="text-lg font-semibold">성동구민종합체육센터 방면</div>
                  <div className="text-xs font-medium text-gray-700">1 정류장 전</div>
                </div>
              </div>
              <p className="text-sm text-gray-600"><strong>Line 1:</strong> Route number (left) aligned with ETA (right), both using large bold weights for visual dominance.</p>
              <p className="text-sm text-gray-600"><strong>Line 2:</strong> Destination (left) + Stops Away (right) on single horizontal row for compact spacing.</p>
            </div>
          </section>

          {/* E-PAPER OPTIMIZATION */}
          <section>
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-black pb-2">E-Paper Optimization</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-3">
                <span className="font-bold min-w-32">Monochrome Only:</span>
                <span>Black text on white background. No grayscale or intermediate tones. Reduces refresh complexity and power consumption.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold min-w-32">Partial Refresh Zones:</span>
                <span>Header and footer are fixed update zones. Route list supports fine-grained partial refreshes for changed rows only.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold min-w-32">Border Strategy:</span>
                <span>4px solid borders for header/footer define major refresh boundaries. 1px borders between rows enable isolated updates.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold min-w-32">No Decorations:</span>
                <span>Zero gradients, shadows, rounded corners. Maximizes clarity and minimizes ink transitions for flashing.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold min-w-32">Scrolling Support:</span>
                <span>Smooth vertical scrolling is supported for high-traffic stops with many routes. Each scroll increments partial refresh zones.</span>
              </li>
            </ul>
          </section>

          {/* COMPARISON TABLE */}
          <section>
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-black pb-2">System Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-black">
                    <th className="text-left py-2 px-3 font-bold">Feature</th>
                    <th className="text-left py-2 px-3 font-bold">Solar-Powered</th>
                    <th className="text-left py-2 px-3 font-bold">Grid-Powered</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="py-2 px-3 font-semibold">Power Source</td>
                    <td className="py-2 px-3">Solar panels + battery</td>
                    <td className="py-2 px-3">AC grid connection</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="py-2 px-3 font-semibold">Device Size</td>
                    <td className="py-2 px-3">5-7" e-paper</td>
                    <td className="py-2 px-3">13.3" or 25" e-paper</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="py-2 px-3 font-semibold">Routes Shown</td>
                    <td className="py-2 px-3">3-4 (paged)</td>
                    <td className="py-2 px-3">5-6 or 8-10 (scrollable)</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="py-2 px-3 font-semibold">Interaction</td>
                    <td className="py-2 px-3">Page cycling (10s+)</td>
                    <td className="py-2 px-3">Continuous scrolling</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="py-2 px-3 font-semibold">Refresh Rate</td>
                    <td className="py-2 px-3">~30-60s for full screen</td>
                    <td className="py-2 px-3">5-10s for ETA updates</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold">Use Case</td>
                    <td className="py-2 px-3">Remote/rural stops</td>
                    <td className="py-2 px-3">Urban transit hubs</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* IMPLEMENTATION NOTES */}
          <section>
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-black pb-2">Implementation Notes</h2>
            <div className="space-y-3 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <p><strong>Route Data Source:</strong> Connect to real-time transit APIs (transit agency feeds). Update ETA values every 5-10 seconds via WebSocket or polling.</p>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <p><strong>Scrolling Behavior:</strong> Auto-scroll through route list when more than 6 routes available. Pause on user interaction (if touch-enabled). Cycle timing: 3-5 seconds per screen.</p>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <p><strong>Offline Resilience:</strong> Cache last-known route data. Display "마지막 업데이트: HH:MM" in header when offline. Show cached data with dim visual cue.</p>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <p><strong>Network Connectivity:</strong> Dedicated 4G/5G modem for continuous API polling. Fallback to WiFi in areas with coverage.</p>
              </div>
            </div>
          </section>

          {/* DEPLOYMENT GUIDE */}
          <section>
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-black pb-2">Deployment Guide</h2>
            <div className="space-y-3 text-sm">
              <h3 className="font-bold">Hardware Setup:</h3>
              <ol className="list-decimal list-inside space-y-1 ml-3">
                <li>Mount e-paper display in weather-resistant enclosure (IP54+ rating)</li>
                <li>Install industrial compute module (Raspberry Pi 4+ or equivalent)</li>
                <li>Connect to 24V power supply with UPS backup (12+ hour capacity)</li>
                <li>Configure 4G/5G modem for data connectivity</li>
              </ol>
              <h3 className="font-bold mt-4">Software Setup:</h3>
              <ol className="list-decimal list-inside space-y-1 ml-3">
                <li>Deploy Next.js app to compute module</li>
                <li>Configure display controller for partial refresh zones</li>
                <li>Set up API integration for transit data feeds</li>
                <li>Enable remote monitoring and OTA updates</li>
              </ol>
            </div>
          </section>

          {/* FOOTER */}
          <div className="mt-12 pt-8 border-t-2 border-gray-300 text-xs text-gray-600">
            <p>BIMS Grid-Powered E-Paper Display System • Version 1.0 • March 2026</p>
            <p>Designed for public transit accessibility and operational clarity.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
