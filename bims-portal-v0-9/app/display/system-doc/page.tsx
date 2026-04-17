"use client";

export default function DisplaySystemDocPage() {
  return (
    <div className="min-h-screen bg-white p-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-black mb-2">BIMS 5-State Display System</h1>
        <p className="text-xl text-gray-600 mb-12">13.3" E-Paper Transit Signboard Design</p>

        {/* Design System Overview */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b-4 border-black pb-3">Unified Design Language</h2>
          <div className="space-y-4 text-lg leading-relaxed">
            <p>
              All 5 states share a consistent transit signboard aesthetic optimized for e-paper displays. The design prioritizes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Strong Hierarchy</strong>: Route Number {'>'} ETA {'>'} Destination {'>'} Stops Away</li>
              <li><strong>High Contrast</strong>: Bold borders (4px header/footer, 2px row dividers) for e-paper readability</li>
              <li><strong>Monochrome-First</strong>: Black text/borders on white background, minimal gray accents</li>
              <li><strong>Stable Composition</strong>: Fixed zones (Header | Main | Footer) for consistent partial refresh</li>
              <li><strong>Operational Focus</strong>: Information-first layout, no decorative elements</li>
            </ul>
          </div>
        </section>

        {/* State Specifications */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b-4 border-black pb-3">5-State Specifications</h2>

          {/* NORMAL */}
          <div className="mb-12 p-6 border-l-4 border-black bg-gray-50">
            <h3 className="text-2xl font-bold mb-3">1. NORMAL</h3>
            <p className="text-gray-700 mb-4">Standard operational state with real-time passenger information.</p>
            <div className="space-y-2 text-sm">
              <p><strong>Header:</strong> Stop name (left), Date/Day/Weather/Temperature (right)</p>
              <p><strong>Main:</strong> 5 bus rows with live ETA. Row hierarchy: Route# | ETA | Destination | Stops Away</p>
              <p><strong>Footer:</strong> Single-line operational notice (e.g., "안전 운행을 위해 정류장 질서를 지켜주세요")</p>
              <p><strong>Visual:</strong> Bold black borders, 4px header/footer dividers, light gray row separators (2px)</p>
              <p><strong>Use Case:</strong> Day-to-day passenger operations. Full confidence in data freshness.</p>
            </div>
          </div>

          {/* DEGRADED */}
          <div className="mb-12 p-6 border-l-4 border-amber-600 bg-amber-50">
            <h3 className="text-2xl font-bold mb-3">2. DEGRADED (Low Power)</h3>
            <p className="text-gray-700 mb-4">Partial service reliability degradation. ETA becomes less confident.</p>
            <div className="space-y-2 text-sm">
              <p><strong>Header:</strong> Same as NORMAL</p>
              <p><strong>Alert Banner:</strong> New prominent section below header with warning message (e.g., "버스 정보 일부가 지연될 수 있습니다")</p>
              <p><strong>Main:</strong> Same bus row layout, but ETA replaced with "예정" (scheduled time) label + time</p>
              <p><strong>Footer:</strong> Updated warning notice</p>
              <p><strong>Visual:</strong> Same bold structure, alert banner adds weight to signal status change</p>
              <p><strong>Use Case:</strong> Network lag, partial data loss, or low battery alert. Shows last-known data with qualification.</p>
            </div>
          </div>

          {/* CRITICAL */}
          <div className="mb-12 p-6 border-l-4 border-red-600 bg-red-50">
            <h3 className="text-2xl font-bold mb-3">3. CRITICAL</h3>
            <p className="text-gray-700 mb-4">System trouble. Hides bus arrival area, shows only status message.</p>
            <div className="space-y-2 text-sm">
              <p><strong>Header:</strong> May remain (stop info is still relevant context)</p>
              <p><strong>Main:</strong> HIDDEN. Replaced with large centered message: "버스 정보 시스템 점검 중입니다. 잠시 후 다시 확인해 주세요."</p>
              <p><strong>Status Indicator:</strong> Small secondary message: "시스템 점검 중"</p>
              <p><strong>Footer:</strong> Apology: "이용에 불편을 드려 죄송합니다."</p>
              <p><strong>Visual:</strong> Same signboard structure (header/footer borders), but main area is message-only. Does not look empty or broken.</p>
              <p><strong>Use Case:</strong> Server down, database error, or scheduled maintenance. Clear communication without looking failed.</p>
            </div>
          </div>

          {/* OFFLINE */}
          <div className="mb-12 p-6 border-l-4 border-gray-600 bg-gray-50">
            <h3 className="text-2xl font-bold mb-3">4. OFFLINE</h3>
            <p className="text-gray-700 mb-4">Communication failure. Last-known data shown with offline indicator.</p>
            <div className="space-y-2 text-sm">
              <p><strong>Header:</strong> Same structure, but data is static (last known time)</p>
              <p><strong>Main:</strong> Shows previous bus list (2-4 routes) in same row layout, implying "last known data"</p>
              <p><strong>Alert Section:</strong> Bold message: "통신 장애로 인해 정보가 업데이트되지 않습니다."</p>
              <p><strong>Footer:</strong> Status: "네트워크 연결을 확인 중입니다."</p>
              <p><strong>Visual:</strong> Same layout as NORMAL/DEGRADED but with fewer rows and prominent offline notice</p>
              <p><strong>Use Case:</strong> WiFi/4G loss, server unavailable, but display has cached data. Doesn't go blank—retains value.</p>
            </div>
          </div>

          {/* EMERGENCY */}
          <div className="mb-12 p-6 border-l-4 border-black bg-black text-white">
            <h3 className="text-2xl font-bold mb-3">5. EMERGENCY</h3>
            <p className="text-gray-300 mb-4">Emergency situation. Full-screen message takeover with maximum clarity.</p>
            <div className="space-y-2 text-sm">
              <p><strong>Layout:</strong> Entire screen dedicated to emergency content</p>
              <p><strong>Main Message:</strong> Large bold text (e.g., "긴급 재난 안내")</p>
              <p><strong>Details:</strong> Multi-line contextual message (e.g., "현재 기상 특보로 인해 일부 버스 운행이 중단될 수 있습니다.")</p>
              <p><strong>Footer:</strong> Action/safety instruction (e.g., "안전한 장소로 이동하시기 바랍니다.")</p>
              <p><strong>Visual:</strong> Maximum contrast, bold separators, center-aligned. No bus data. Immediate clarity.</p>
              <p><strong>Use Case:</strong> Weather alerts, natural disaster, security incident, or emergency vehicle override.</p>
            </div>
          </div>
        </section>

        {/* Shared Design Rules */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b-4 border-black pb-3">Shared Design Rules</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-bold mb-2">Typography</h4>
              <ul className="space-y-1 text-sm">
                <li>Font: Noto Sans KR (system-ui fallback)</li>
                <li>Route Number: text-7xl font-black</li>
                <li>ETA: text-6xl font-black</li>
                <li>Destination: text-2xl font-semibold</li>
                <li>Stops Away: text-sm font-medium</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-bold mb-2">Spacing & Borders</h4>
              <ul className="space-y-1 text-sm">
                <li>Header: px-8 py-5, border-b-4</li>
                <li>Main rows: px-8 py-5, border-b-2</li>
                <li>Footer: px-8 py-4, border-t-4</li>
                <li>Row dividers: border-gray-300 (light gray)</li>
                <li>All major borders: border-black</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-bold mb-2">Layout Structure</h4>
              <ul className="space-y-1 text-sm">
                <li>Flex: flex-col h-full w-full</li>
                <li>Header: flex justify-between</li>
                <li>Main: flex-1 flex flex-col</li>
                <li>Bus rows: flex-1 + flex justify-between</li>
                <li>Footer: flex items-center justify-center</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-bold mb-2">E-Paper Optimization</h4>
              <ul className="space-y-1 text-sm">
                <li>Monochrome (black/white/gray only)</li>
                <li>High contrast for readability at distance</li>
                <li>Bold borders enable partial refresh zones</li>
                <li>Stable composition for e-paper friendly updates</li>
                <li>No animations, no color gradients</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Preview Links */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b-4 border-black pb-3">Preview States</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/display/all-states"
              className="p-4 bg-black text-white font-bold text-center rounded hover:bg-gray-800 transition"
            >
              View All States
            </a>
            <a
              href="/display/states/normal"
              className="p-4 bg-blue-600 text-white font-bold text-center rounded hover:bg-blue-700 transition"
            >
              → NORMAL
            </a>
            <a
              href="/display/states/degraded"
              className="p-4 bg-amber-600 text-white font-bold text-center rounded hover:bg-amber-700 transition"
            >
              → DEGRADED
            </a>
            <a
              href="/display/states/critical"
              className="p-4 bg-red-600 text-white font-bold text-center rounded hover:bg-red-700 transition"
            >
              → CRITICAL
            </a>
            <a
              href="/display/states/offline"
              className="p-4 bg-gray-600 text-white font-bold text-center rounded hover:bg-gray-700 transition"
            >
              → OFFLINE
            </a>
            <a
              href="/display/states/emergency"
              className="p-4 bg-black text-white font-bold text-center rounded hover:bg-gray-800 transition"
            >
              → EMERGENCY
            </a>
          </div>
        </section>

        {/* Specifications */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6 border-b-4 border-black pb-3">Hardware Specifications</h2>
          <div className="space-y-3 text-lg">
            <p><strong>Display:</strong> 13.3-inch e-paper (16:20 aspect ratio)</p>
            <p><strong>Resolution:</strong> High DPI optimized for text readability</p>
            <p><strong>Color Support:</strong> Monochrome (black/white/light gray)</p>
            <p><strong>Refresh:</strong> Partial refresh zones supported (header/main/footer independent)</p>
            <p><strong>Power:</strong> Solar or grid powered with low-power states</p>
            <p><strong>Deployment:</strong> Public transit stops, passenger information displays</p>
          </div>
        </section>

        <div className="bg-black text-white p-8 rounded-lg text-center">
          <p className="text-lg font-semibold">
            This design system ensures consistent, readable, and reliable passenger information across all operational states.
          </p>
        </div>
      </div>
    </div>
  );
}
