import DisplayFrame from "@/components/display/DisplayFrame";
import { DisplayRenderer } from "@/components/display/DisplayRenderer";
import { resolveDisplayViewModel } from "@/lib/display/resolver/shared-display-resolver";
import { buildMockContent, buildMockRoutes } from "@/lib/display/resolver/mock-data";

export default function DisplayLowPowerPreviewPage({
  searchParams,
}: {
  searchParams?: { deviceId?: string; deviceProfile?: string };
}) {
  const deviceId = searchParams?.deviceId;
  const deviceProfile = (searchParams?.deviceProfile ?? "SOLAR") as "GRID" | "SOLAR";

  const vm = resolveDisplayViewModel({
    content: buildMockContent(),
    context: {
      deviceId: deviceId ?? "preview",
      deviceProfile,
      // LOW_POWER is derived from SOC, not displayState
      displayState: "NORMAL",
      socLevel: "LOW_POWER",
      now: new Date(),
      routes: buildMockRoutes("LOW_POWER"),
    },
  });

  return (
    <DisplayFrame deviceId={deviceId}>
      {deviceId && (
        <div className="absolute top-6 right-6 border-2 border-black px-3 py-1 text-lg font-semibold tabular-nums bg-white">
          ID: {deviceId}
        </div>
      )}
      <DisplayRenderer viewModel={vm} className="w-full h-full" />
    </DisplayFrame>
  );
}
