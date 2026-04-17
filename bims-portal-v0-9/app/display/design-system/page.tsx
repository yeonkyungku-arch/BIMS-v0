'use client';

import React, { useState } from 'react';

export default function DesignSystemPage() {
  const [selectedDevice, setSelectedDevice] = useState<'small' | 'standard' | 'large'>('standard');
  const [selectedState, setSelectedState] = useState<'normal' | 'degraded' | 'offline' | 'critical' | 'emergency'>('normal');

  const deviceSpecs = {
    small: { size: '5-7"', rows: '3-4', width: 'w-full max-w-lg', label: 'Solar-Powered Stop Display' },
    standard: { size: '13.3"', rows: '5-6', width: 'w-full max-w-4xl', label: 'Standard Bus Stop Display' },
    large: { size: '25"', rows: '8-10', width: 'w-full max-w-6xl', label: 'High-Traffic Hub Display' },
  };

  const stateConfigs = {
    normal: { bg: 'bg-white', title: 'Normal Operation', desc: 'Real-time bus arrivals with live ETAs' },
    degraded: { bg: 'bg-amber-50', title: 'Degraded Mode', desc: 'Partial service - showing scheduled times instead of ETAs' },
    offline: { bg: 'bg-gray-50', title: 'Offline Label', desc: 'Last-known data with offline notification' },
    critical: { bg: 'bg-stone-100', title: 'Critical Service', desc: 'System maintenance - centered message only' },
    emergency: { bg: 'bg-red-50', title: 'Emergency Takeover', desc: 'Full-screen emergency message with maximum clarity' },
  };

  const spec = deviceSpecs[selectedDevice];
  const stateConfig = stateConfigs[selectedState];

  const exampleBuses = [
    { routeNo: '2413', destination: '성동구민종합체육센터 방면', eta: '곧 도착', stopsAway: '1 정류장 전' },
    { routeNo: '2016', destination: '서울숲 방면', eta: '2분', stopsAway: '1 정류장 전' },
    { routeNo: '2224', destination: '성동구민종합체육센터 방면', eta: '4분', stopsAway: '2 정류장 전' },
    { routeNo: 'N62', destination: '서울숲 방면', eta: '8분', stopsAway: '3 정류장 전' },
    { routeNo: '462', destination: '강남역 방면', eta: '12분', stopsAway: '4 정류장 전' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* TITLE */}
        <div className="mb-12">
          <h1 className="text-5xl font-black mb-3">BIMS E-Paper Display System</h1>
          <p className="text-xl text-slate-600">Public Transit Signboard Design Specification v1.0</p>
        </div>

        {/* CONTROLS */}
        <div className="grid grid-cols-2 gap-8 mb-12">
          <div>
            <h3 className="text-sm font-bold uppercase text-slate-500 mb-3">Device Profile</h3>
            <div className="flex gap-2">
              {(Object.keys(deviceSpecs) as Array<keyof typeof deviceSpecs>).map((device) => (
                <button
                  key={device}
                  onClick={() => setSelectedDevice(device)}
                  className={`px-4 py-2 text-sm font-semibold rounded border-2 transition-all ${
                    selectedDevice === device
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-blue-600'
                  }`}
                >
                  {device === 'small' ? 'Small (5-7")' : device === 'standard' ? 'Standard (13.3")' : 'Large (25")'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase text-slate-500 mb-3">State Variant</h3>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(stateConfigs) as Array<keyof typeof stateConfigs>).map((state) => (
                <button
                  key={state}
                  onClick={() => setSelectedState(state)}
                  className={`px-3 py-2 text-xs font-semibold rounded border-2 transition-all ${
                    selectedState === state
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-900'
                  }`}
                >
                  {state.charAt(0).toUpperCase() + state.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* LIVE PREVIEW */}
        <div className="mb-12">
          <h2 className="text-2xl font-black mb-4">Live Preview: {stateConfig.title}</h2>
          <div className={`${stateConfig.bg} border-4 border-slate-300 rounded-lg overflow-hidden shadow-2xl`}>
            <div className={`${spec.width} mx-auto aspect-video flex items-center justify-center`}>
              {/* DISPLAY MOCKUP */}
              <div className="w-full h-full flex flex-col bg-white text-black" style={{ fontFamily: '"Noto Sans KR", system-ui, sans-serif' }}>
                {/* HEADER */}
                <header className="flex items-center justify-between px-8 py-5 border-b-4 border-black bg-white">
                  <div className="text-left flex-1">
                    <div className={`font-black leading-tight tracking-tight ${selectedDevice === 'small' ? 'text-2xl' : selectedDevice === 'standard' ? 'text-4xl' : 'text-6xl'}`}>
                      성동구청 정류장
                    </div>
                  </div>
                  <div className="text-right flex-1">
                    <div className={`font-semibold leading-tight ${selectedDevice === 'small' ? 'text-sm' : selectedDevice === 'standard' ? 'text-xl' : 'text-2xl'}`}>
                      2026년 3월 12일 (수)
                    </div>
                    <div className={`font-medium mt-1 ${selectedDevice === 'small' ? 'text-xs' : selectedDevice === 'standard' ? 'text-lg' : 'text-xl'}`}>
                      맑음 4°C / 12°C
                    </div>
                  </div>
                </header>

                {/* CONTENT */}
                <main className="flex-1 flex flex-col overflow-hidden border-b-4 border-black">
                  {selectedState === 'normal' || selectedState === 'degraded' ? (
                    exampleBuses.slice(0, selectedDevice === 'small' ? 3 : selectedDevice === 'standard' ? 5 : 8).map((bus, idx) => (
                      <div key={idx} className="flex-1 flex flex-col justify-center px-6 py-4 border-b-2 border-gray-300 last:border-b-0">
                        <div className="flex items-baseline justify-between mb-2">
                          <div className={`font-black leading-none tracking-tight ${selectedDevice === 'small' ? 'text-4xl' : selectedDevice === 'standard' ? 'text-7xl' : 'text-8xl'}`}>
                            {bus.routeNo}
                          </div>
                          <div className={`font-black leading-none tracking-tight ${selectedDevice === 'small' ? 'text-2xl' : selectedDevice === 'standard' ? 'text-6xl' : 'text-7xl'} ${selectedState === 'degraded' ? 'text-gray-500' : ''}`}>
                            {selectedState === 'degraded' ? '--' : bus.eta}
                          </div>
                        </div>
                        <div className={`font-semibold leading-tight mb-1 ${selectedDevice === 'small' ? 'text-xs' : selectedDevice === 'standard' ? 'text-2xl' : 'text-3xl'}`}>
                          {bus.destination}
                        </div>
                        {bus.stopsAway && (
                          <div className={`font-medium text-gray-700 ${selectedDevice === 'small' ? 'text-[10px]' : selectedDevice === 'standard' ? 'text-sm' : 'text-base'}`}>
                            {bus.stopsAway}
                          </div>
                        )}
                      </div>
                    ))
                  ) : selectedState === 'offline' ? (
                    <>
                      <div className="flex-1 flex flex-col justify-center px-8 py-6 border-b-2 border-gray-400">
                        <div className="flex items-baseline justify-between mb-2 opacity-60">
                          <div className="text-5xl font-black leading-none">2413</div>
                          <div className="text-4xl font-black leading-none">8분</div>
                        </div>
                        <div className="text-xl font-semibold mb-1 opacity-60">성동구민종합체육센터 방면</div>
                        <div className="text-xs text-gray-600 opacity-60">1 정류장 전</div>
                      </div>
                      <div className="flex items-center justify-center flex-1 bg-gray-100">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-700">⚠ 오프라인 상태</div>
                          <div className="text-xs text-gray-600 mt-1">마지막 업데이트: 3:45 PM</div>
                        </div>
                      </div>
                    </>
                  ) : selectedState === 'critical' ? (
                    <div className="flex-1 flex items-center justify-center px-8 py-6">
                      <div className="text-center">
                        <div className="text-3xl font-black mb-3">시스템 점검 중</div>
                        <div className="text-lg text-gray-700">정보 업데이트를 위해 잠시 중단됩니다</div>
                        <div className="text-sm text-gray-600 mt-3">예상 시간: 2-3분</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center px-8 py-6 bg-red-100">
                      <div className="text-center">
                        <div className="text-4xl font-black text-red-900 mb-3">⚠ 긴급 상황</div>
                        <div className="text-2xl font-bold text-red-800">모든 서비스 중단</div>
                        <div className="text-lg text-red-700 mt-3">정류장 운영자에게 문의하세요</div>
                        <div className="text-base text-red-600 mt-2">비상 전화: 112</div>
                      </div>
                    </div>
                  )}
                </main>

                {/* FOOTER */}
                <footer className="flex items-center justify-center px-6 py-4 bg-white border-t-4 border-black">
                  <div className={`text-center font-semibold ${selectedDevice === 'small' ? 'text-xs' : selectedDevice === 'standard' ? 'text-lg' : 'text-2xl'}`}>
                    안전 운행을 위해 정류장 질서를 지켜주세요.
                  </div>
                </footer>
              </div>
            </div>
          </div>
        </div>

        {/* SPECIFICATION PANELS */}
        <div className="grid grid-cols-3 gap-8 mb-12">
          {/* COMPONENT HIERARCHY */}
          <div className="bg-white p-8 rounded-lg border-2 border-slate-200">
            <h3 className="text-lg font-black mb-6">Visual Hierarchy</h3>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded">
                <div className="text-sm font-bold text-slate-600 mb-2">1st Priority (Primary)</div>
                <div className="text-5xl font-black">Route #</div>
                <div className="text-xs text-slate-500 mt-2">Largest element, left position, governs row size</div>
              </div>
              <div className="bg-slate-50 p-4 rounded">
                <div className="text-sm font-bold text-slate-600 mb-2">2nd Priority (Secondary)</div>
                <div className="text-3xl font-black">ETA</div>
                <div className="text-xs text-slate-500 mt-2">Right-aligned, second-largest, critical information</div>
              </div>
              <div className="bg-slate-50 p-4 rounded">
                <div className="text-sm font-bold text-slate-600 mb-2">3rd Priority (Tertiary)</div>
                <div className="text-lg font-semibold">Destination</div>
                <div className="text-xs text-slate-500 mt-2">Medium size, full row width below route/ETA</div>
              </div>
              <div className="bg-slate-50 p-4 rounded">
                <div className="text-sm font-bold text-slate-600 mb-2">4th Priority (Supporting)</div>
                <div className="text-sm font-medium">Stops Away</div>
                <div className="text-xs text-slate-500 mt-2">Smallest text, optional field</div>
              </div>
            </div>
          </div>

          {/* DEVICE PROFILES */}
          <div className="bg-white p-8 rounded-lg border-2 border-slate-200">
            <h3 className="text-lg font-black mb-6">Device Profiles</h3>
            <div className="space-y-3">
              <div className="border-l-4 border-blue-600 pl-4">
                <div className="font-bold text-sm">Small (5-7")</div>
                <div className="text-xs text-slate-600">Solar-powered, 3-4 rows</div>
                <div className="text-xs text-slate-500 mt-1">Paging mode, low power</div>
              </div>
              <div className="border-l-4 border-green-600 pl-4">
                <div className="font-bold text-sm">Standard (13.3")</div>
                <div className="text-xs text-slate-600">Grid-powered, 5-6 rows</div>
                <div className="text-xs text-slate-500 mt-1">Real-time updates, medium density</div>
              </div>
              <div className="border-l-4 border-purple-600 pl-4">
                <div className="font-bold text-sm">Large (25")</div>
                <div className="text-xs text-slate-600">Grid-powered, 8-10 rows</div>
                <div className="text-xs text-slate-500 mt-1">High-traffic hubs, scrolling enabled</div>
              </div>
            </div>
          </div>

          {/* STATE VARIANTS */}
          <div className="bg-white p-8 rounded-lg border-2 border-slate-200">
            <h3 className="text-lg font-black mb-6">State Variants</h3>
            <div className="space-y-2 text-sm">
              <div className="py-2 px-3 bg-white border-l-4 border-green-500 font-semibold">Normal</div>
              <div className="py-2 px-3 bg-amber-50 border-l-4 border-amber-500 font-semibold">Degraded</div>
              <div className="py-2 px-3 bg-gray-50 border-l-4 border-gray-500 font-semibold">Offline</div>
              <div className="py-2 px-3 bg-stone-100 border-l-4 border-stone-600 font-semibold">Critical</div>
              <div className="py-2 px-3 bg-red-50 border-l-4 border-red-600 font-semibold">Emergency</div>
            </div>
          </div>
        </div>

        {/* DESIGN PRINCIPLES */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-8 rounded-lg mb-12">
          <h3 className="text-2xl font-black mb-6">Design Principles</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="font-bold text-blue-900 mb-2">✓ Information Priority</div>
              <div className="text-sm text-slate-700">Route number governs every layout decision. ETA is always visible. Destination supports context.</div>
            </div>
            <div>
              <div className="font-bold text-blue-900 mb-2">✓ E-Paper Optimized</div>
              <div className="text-sm text-slate-700">Monochrome rendering only. Stable layout zones for partial refresh. Borders support update regions.</div>
            </div>
            <div>
              <div className="font-bold text-blue-900 mb-2">✓ Distance Readability</div>
              <div className="text-sm text-slate-700">Font sizes scale for device profile. High contrast. No decorative elements. 20+ meter viewable distance.</div>
            </div>
            <div>
              <div className="font-bold text-blue-900 mb-2">✓ Public Infrastructure</div>
              <div className="text-sm text-slate-700">Professional transit signboard aesthetic. No app-like UI patterns. Supports all states without breaking.</div>
            </div>
          </div>
        </div>

        {/* LAYOUT SPECIFICATIONS */}
        <div className="grid grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-lg border-2 border-slate-200">
            <h3 className="text-lg font-black mb-6">Header Component</h3>
            <div className="space-y-3 text-sm">
              <div className="border-b pb-2">
                <div className="font-bold text-slate-700">Stop Name</div>
                <div className="text-xs text-slate-600">Left-aligned, bold, largest in header. 4xl (standard)</div>
              </div>
              <div className="border-b pb-2">
                <div className="font-bold text-slate-700">Date / Weekday</div>
                <div className="text-xs text-slate-600">Right-aligned, compact format. Format: YYYY년 M월 D일 (요일)</div>
              </div>
              <div>
                <div className="font-bold text-slate-700">Weather & Temperature</div>
                <div className="text-xs text-slate-600">Right-aligned below date. Format: 맑음 4°C / 12°C</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg border-2 border-slate-200">
            <h3 className="text-lg font-black mb-6">Bus Row Component</h3>
            <div className="space-y-3 text-sm">
              <div className="border-b pb-2">
                <div className="font-bold text-slate-700">Route Number + ETA Row</div>
                <div className="text-xs text-slate-600">Route # left (7xl), ETA right (6xl), same baseline</div>
              </div>
              <div className="border-b pb-2">
                <div className="font-bold text-slate-700">Destination Row</div>
                <div className="text-xs text-slate-600">Full width, 2xl, supports Korean text wrapping</div>
              </div>
              <div>
                <div className="font-bold text-slate-700">Stops Away Row</div>
                <div className="text-xs text-slate-600">Optional, small text, light gray color, supporting context</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-lg border-2 border-slate-200 mt-8">
          <h3 className="text-lg font-black mb-6">Footer Notice Component</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="font-bold text-slate-700 mb-2">Normal Message</div>
              <div className="text-sm text-slate-600">안전 운행을 위해 정류장 질서를 지켜주세요.</div>
            </div>
            <div>
              <div className="font-bold text-slate-700 mb-2">Warning Message</div>
              <div className="text-sm text-slate-600">도로 공사 중입니다. 일시 운행 중단될 수 있습니다.</div>
            </div>
            <div>
              <div className="font-bold text-slate-700 mb-2">Service Message</div>
              <div className="text-sm text-slate-600">심야 버스 노선 운영 중입니다. 자세한 정보는 앱을 참조하세요.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
