import DisplayFrame from "@/components/display/DisplayFrame";
import { DisplayRenderer } from "@/components/display/DisplayRenderer";
import { resolveDisplayViewModel } from "@/lib/display/resolver/shared-display-resolver";
import { buildMockContent } from "@/lib/display/resolver/mock-data";

export default async function DisplayEmergencyPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ deviceId?: string; deviceProfile?: string }>;
}) {
  const { deviceId, deviceProfile: dp } = await searchParams;
  const deviceProfile = (dp ?? "SOLAR") as "GRID" | "SOLAR";

  const vm = resolveDisplayViewModel({
    content: buildMockContent("EMERGENCY"),
    context: {
      deviceId: deviceId ?? "preview",
      deviceProfile,
      displayState: "EMERGENCY",
      socLevel: "NORMAL",
      now: new Date(),
    },
  });

  return (
    <DisplayFrame>
      {deviceId && (
        <div className="absolute top-6 right-6 border-2 border-black px-3 py-1 text-lg font-semibold tabular-nums bg-white text-black z-10">
          ID: {deviceId}
        </div>
      )}
      <DisplayRenderer viewModel={vm} className="w-full h-full" />
    </DisplayFrame>
  );
}
