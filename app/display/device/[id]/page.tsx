import Link from "next/link";
import DisplayFrame from "@/components/display/DisplayFrame";
import { getOverallSnapshot } from "@/components/rms/shared/overall-state-mock";
import {
  resolveDisplayState,
  buildDisplayStateInput,
  DISPLAY_STATE_ROUTE,
  DISPLAY_STATE_LABEL,
  DISPLAY_STATE_DESC,
  LOW_POWER_SOC_THRESHOLD,
  type DisplayState,
} from "@/lib/display-state";

// ---------------------------------------------------------------------------
// Mock battery data per device (in production: from device telemetry)
// ---------------------------------------------------------------------------
const MOCK_BATTERY_SOC: Record<string, number> = {
  DEV001: 82,
  DEV002: 45,
  DEV003: 8,   // Low battery + Overall "경고" -> test conflict rule
  DEV004: 92,
  DEV005: 12,  // Low battery + Overall "치명" -> CRITICAL wins
  DEV006: 67,
  DEV007: 35,
  DEV008: 55,
  DEV009: 10,
  DEV010: 5,   // Low battery + Overall "오프라인" -> OFFLINE wins
  DEV011: 75,
  DEV012: 60,
};

const MOCK_EMERGENCY_FLAG = false;

// ---------------------------------------------------------------------------
// All possible display states for the override picker
// ---------------------------------------------------------------------------
const ALL_STATES: DisplayState[] = ["NORMAL", "LOW_POWER", "CRITICAL", "OFFLINE", "EMERGENCY"];

export default async function DisplayDevicePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // -- Resolve display state using the hybrid engine (single source of truth) --
  const snapshot = getOverallSnapshot(id);
  const soc = MOCK_BATTERY_SOC[id] ?? 50;
  const input = buildDisplayStateInput(
    snapshot.overallState,
    soc,
    MOCK_EMERGENCY_FLAG,
  );
  const computedState = resolveDisplayState(input);
  const isLowPower = soc <= LOW_POWER_SOC_THRESHOLD;
  const computedRoute = `${DISPLAY_STATE_ROUTE[computedState]}?deviceId=${encodeURIComponent(id)}`;

  return (
    <DisplayFrame deviceId={id}>
      <div className="h-full grid grid-rows-[auto_auto_1fr_auto] gap-6">
        {/* Header */}
        <header className="border-b-4 border-black pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight">
                단말 프리뷰
              </h1>
              <p className="text-xl mt-2">
                Hybrid 상태 판단 엔진이 실시간으로 Display 화면을 결정합니다.
              </p>
            </div>

            <div className="border-2 border-black px-3 py-1 text-lg font-semibold tabular-nums">
              ID: {id}
            </div>
          </div>
        </header>

        {/* Computed State Card */}
        <div className="border-4 border-black p-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">
              Hybrid Engine Result
            </span>
          </div>

          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-5xl font-black">{computedState}</span>
            <span className="text-2xl text-gray-600">({DISPLAY_STATE_LABEL[computedState]})</span>
          </div>

          <p className="text-lg text-gray-500 mb-4">
            {DISPLAY_STATE_DESC[computedState]}
          </p>

          {/* Input summary */}
          <div className="grid grid-cols-3 gap-4 border-t-2 border-black pt-4 text-sm">
            <div>
              <span className="text-gray-400 font-semibold">Overall</span>
              <p className="text-xl font-bold mt-1">{snapshot.overallState}</p>
            </div>
            <div>
              <span className="text-gray-400 font-semibold">Battery SOC</span>
              <p className="text-xl font-bold mt-1">
                {soc}%
                {isLowPower && (
                  <span className="text-base text-gray-500 ml-2">
                    {"(<="}{LOW_POWER_SOC_THRESHOLD}{"% = LOW_POWER)"}
                  </span>
                )}
              </p>
            </div>
            <div>
              <span className="text-gray-400 font-semibold">Emergency</span>
              <p className="text-xl font-bold mt-1">{input.emergencyFlag ? "YES" : "NO"}</p>
            </div>
          </div>

          {/* Conflict rule applied */}
          {isLowPower && computedState !== "LOW_POWER" && (
            <div className="mt-4 border-2 border-dashed border-gray-400 px-4 py-3">
              <p className="text-base font-bold text-gray-600">
                {"Conflict rule: battery is low (SOC={soc}%), but Overall=\"{snapshot.overallState}\" "
                  .replace("{soc}", String(soc))
                  .replace("{snapshot.overallState}", snapshot.overallState)}
                {"=> "}
                {computedState} wins over LOW_POWER
              </p>
            </div>
          )}

          {/* Go to computed screen */}
          <div className="mt-6 flex items-center gap-4 flex-wrap">
            <Link
              href={computedRoute}
              className="inline-block border-4 border-black px-8 py-4 text-2xl font-black hover:bg-black hover:text-white transition-colors"
            >
              {"Computed Screen: "}{computedState} {"->"}
            </Link>
            <Link
              href={`/display/cms/${encodeURIComponent(id)}?displayState=${computedState}`}
              className="inline-block border-4 border-black px-6 py-4 text-xl font-bold hover:bg-black hover:text-white transition-colors"
            >
              CMS Rendering {"->"}
            </Link>
          </div>
        </div>

        {/* Manual State Override Links */}
        <main className="grid gap-3 content-start">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">
            Manual Override (프리뷰 직접 선택)
          </p>
          {ALL_STATES.map((state) => {
            const isComputed = state === computedState;
            return (
              <PreviewLink
                key={state}
                href={`${DISPLAY_STATE_ROUTE[state]}?deviceId=${encodeURIComponent(id)}`}
                title={state}
                desc={DISPLAY_STATE_DESC[state]}
                isActive={isComputed}
              />
            );
          })}
        </main>

        {/* Footer */}
        <footer className="border-t-4 border-black pt-4 text-lg flex justify-between">
          <span>Hybrid policy: LOW_POWER by Battery, CRITICAL/OFFLINE by Overall</span>
          <Link href="/display" className="underline font-semibold">
            Display 프리뷰로
          </Link>
        </footer>
      </div>
    </DisplayFrame>
  );
}

function PreviewLink({
  href,
  title,
  desc,
  isActive,
}: {
  href: string;
  title: string;
  desc: string;
  isActive?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`border-2 p-4 grid grid-cols-[180px_1fr] items-center ${
        isActive
          ? "border-black bg-black text-white"
          : "border-gray-300 hover:border-black"
      }`}
    >
      <div className="text-2xl font-black">{title}</div>
      <div className={`text-lg font-medium leading-snug ${isActive ? "text-gray-300" : ""}`}>
        {desc}
        {isActive && <span className="ml-3 text-sm font-bold">(= computed)</span>}
      </div>
    </Link>
  );
}
