"use client";

export default function SolarDisplayDocPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 font-sans space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-black">Solar-Powered E-Paper Bus Display</h1>
        <p className="text-lg text-gray-600">Technical Design Specifications</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">System Overview</h2>
        <p className="text-gray-700 leading-relaxed">
          A low-power e-paper display system designed for solar-powered bus stop installations.
          The system prioritizes power efficiency through paging mode, minimal refresh cycles,
          and stable black-and-white rendering optimized for e-paper panel efficiency.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Power Optimization Strategies</h2>
        <ul className="space-y-3 text-gray-700">
          <li className="flex gap-3">
            <span className="font-semibold min-w-fit">Paging Mode:</span>
            <span>4 bus rows per page, no scrolling. Page changes trigger full refresh every 10-15 seconds.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold min-w-fit">Monochrome Only:</span>
            <span>Pure black on white. No grayscale or color—reduces processing and panel refresh complexity.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold min-w-fit">Minimal Redraws:</span>
            <span>Static layout with fixed positions. Suitable for e-paper partial refresh zones.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold min-w-fit">No Animations:</span>
            <span>Zero motion, no transitions. All state changes are instant and discrete.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold min-w-fit">Compact Header:</span>
            <span>Minimal visual density in header reduces ink usage and refresh area.</span>
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Display Layout</h2>
        
        <div className="bg-gray-100 p-6 space-y-4 rounded-lg">
          <div className="space-y-2">
            <h3 className="font-bold">Header (Compact Mode)</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>• Stop Name (2xl font) + Stop Code (xs)</div>
              <div>• Last Update Time + Battery % indicator</div>
              <div>• Total height: ~60px (3% of screen)</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold">Bus Rows (4 per page)</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>• Row 1: Route Number (5xl) + ETA (3xl)</div>
              <div>• Row 2: Destination (sm) + Stops Away (xs)</div>
              <div>• Row height: ~80px each (32% total)</div>
              <div>• Separator: 1px gray line between rows</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold">Footer</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>• Page indicator: "페이지 1/2"</div>
              <div>• Power status: "태양광 운영 중" or "⚠ 저전력 모드"</div>
              <div>• Total height: ~40px (5% of screen)</div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Bus Row Information Architecture</h2>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
          <div className="space-y-2">
            <h3 className="font-semibold">Primary (Line 1)</h3>
            <ul className="text-sm text-gray-700 space-y-1 ml-4">
              <li>• <strong>Route Number</strong> (5xl, left): Largest visual element for quick recognition</li>
              <li>• <strong>ETA</strong> (3xl, right): Critical user information</li>
              <li>• Example: "2413" | "곧"</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Secondary (Line 2)</h3>
            <ul className="text-sm text-gray-700 space-y-1 ml-4">
              <li>• <strong>Destination</strong> (sm, left): Truncated for space</li>
              <li>• <strong>Stops Away</strong> (xs, right): Supporting detail</li>
              <li>• Example: "성동구민센터" | "1정"</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Device Specifications</h2>
        
        <div className="bg-gray-100 p-4 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Target Display:</span>
              <p className="text-gray-600">Medium e-paper (5-7")</p>
            </div>
            <div>
              <span className="font-semibold">Power Source:</span>
              <p className="text-gray-600">Solar panel + battery backup</p>
            </div>
            <div>
              <span className="font-semibold">Refresh Frequency:</span>
              <p className="text-gray-600">Page turn every 10-15 seconds</p>
            </div>
            <div>
              <span className="font-semibold">Operating Mode:</span>
              <p className="text-gray-600">Paging (no scrolling)</p>
            </div>
            <div>
              <span className="font-semibold">Rows per Page:</span>
              <p className="text-gray-600">4 bus arrivals</p>
            </div>
            <div>
              <span className="font-semibold">Color Support:</span>
              <p className="text-gray-600">Black & White (1-bit)</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Battery Management Features</h2>
        
        <ul className="space-y-3 text-gray-700">
          <li className="flex gap-3">
            <span className="font-semibold min-w-fit">Battery Indicator:</span>
            <span>Visual bar graph in header (0-100%) with text label</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold min-w-fit">Low Power Mode:</span>
            <span>Triggered below 30%. Footer shows "⚠ 저전력 모드" warning</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold min-w-fit">Page Cycle Adjustment:</span>
            <span>Extend cycle to 20+ seconds in low power mode</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold min-w-fit">Last Update Time:</span>
            <span>Displayed in header for service verification</span>
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Design Principles</h2>
        
        <ul className="space-y-2 text-gray-700 list-disc list-inside">
          <li>Stable: Fixed layout, no motion, minimal redraw areas</li>
          <li>Practical: Real-world transit signboard aesthetic, not futuristic</li>
          <li>Efficient: Every visual element serves purpose in power budget</li>
          <li>Readable: High contrast, large hierarchy, suitable for distance viewing</li>
          <li>Reliable: Clear status indicators, no ambiguous UI states</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Comparison: Solar vs Grid-Powered</h2>
        
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 p-3 text-left">Feature</th>
              <th className="border border-gray-300 p-3 text-left">Grid-Powered</th>
              <th className="border border-gray-300 p-3 text-left">Solar-Powered</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            <tr>
              <td className="border border-gray-300 p-3 font-semibold">Bus Rows</td>
              <td className="border border-gray-300 p-3">5 rows (always visible)</td>
              <td className="border border-gray-300 p-3">4 rows per page (paged)</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-300 p-3 font-semibold">Scrolling</td>
              <td className="border border-gray-300 p-3">Yes (continuous)</td>
              <td className="border border-gray-300 p-3">No (page-based only)</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-3 font-semibold">Refresh</td>
              <td className="border border-gray-300 p-3">Every 2-3 seconds</td>
              <td className="border border-gray-300 p-3">Every 10-15 seconds</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-300 p-3 font-semibold">Header Size</td>
              <td className="border border-gray-300 p-3">Compact but spacious</td>
              <td className="border border-gray-300 p-3">Minimal density</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-3 font-semibold">Colors</td>
              <td className="border border-gray-300 p-3">Full color + animations</td>
              <td className="border border-gray-300 p-3">Black & white only</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-300 p-3 font-semibold">Battery Indicator</td>
              <td className="border border-gray-300 p-3">Optional</td>
              <td className="border border-gray-300 p-3">Required + visible</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="bg-amber-50 p-6 rounded-lg border border-amber-200 space-y-3">
        <h2 className="text-2xl font-bold">Implementation Notes</h2>
        <ul className="space-y-2 text-gray-700 text-sm">
          <li>✓ Designed for 10-15 second page cycles ideal for solar + e-paper combo</li>
          <li>✓ Monochrome rendering reduces display power consumption by 60-70%</li>
          <li>✓ Page-based layout eliminates scrolling motor drain</li>
          <li>✓ All visual elements optimized for stable e-paper partial refresh</li>
          <li>✓ Battery status always visible—critical for maintenance and diagnostics</li>
        </ul>
      </section>
    </div>
  );
}
