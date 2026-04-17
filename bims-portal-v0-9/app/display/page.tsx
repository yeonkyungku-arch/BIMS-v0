import Link from "next/link";
import DisplayFrame from "@/components/display/DisplayFrame";

export default function DisplayRootPage() {
  return (
    <DisplayFrame>
      <div className="h-full grid grid-rows-[auto_1fr_auto] gap-6">
        {/* Header */}
        <header className="border-b-4 border-black pb-4">
          <h1 className="text-4xl font-black tracking-tight">Display 프리뷰</h1>
          <p className="text-xl mt-2">
            E-paper 표시부는 상태별 페이지로 분리되어 있습니다. 아래에서 상태를 선택하세요.
          </p>
        </header>

        {/* Main */}
        <main className="grid gap-4 content-start">
          <PreviewLink
            href="/display/state/normal"
            title="NORMAL"
            desc="정상 상태: ETA 표시"
          />
          <PreviewLink
            href="/display/state/low"
            title="LOW_POWER"
            desc="저전력: ETA 제거, 상태 텍스트 표시"
          />
          <PreviewLink
            href="/display/state/critical"
            title="CRITICAL"
            desc="긴급: 노선/행선지만 표시"
          />
          <PreviewLink
            href="/display/state/offline"
            title="OFFLINE"
            desc="통신 불가: ETA 제거, 마지막 정상 수신 정보 표시"
          />
          <PreviewLink
            href="/display/state/emergency"
            title="EMERGENCY"
            desc="비상 안내: 모든 콘텐츠 오버라이드, 비상 메시지만 표시"
          />
        </main>

        {/* CMS Rendering Section */}
        <div className="border-4 border-black p-5">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 block">
            CMS Content Rendering
          </span>
          <div className="grid gap-3">
            <PreviewLink
              href="/display/cms/DEV001"
              title="CMS: DEV001"
              desc="Gateway 콘텐츠 해석 (NORMAL)"
            />
            <PreviewLink
              href="/display/cms/DEV003?displayState=LOW_POWER"
              title="CMS: DEV003"
              desc="Gateway 콘텐츠 해석 (LOW_POWER SOC)"
            />
            <PreviewLink
              href="/display/cms/DEV005?displayState=EMERGENCY"
              title="CMS: DEV005"
              desc="Gateway 콘텐츠 해석 (EMERGENCY 오버라이드)"
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t-4 border-black pt-4 text-lg flex justify-between">
          <span>Hybrid policy: LOW_POWER by Battery, CRITICAL/OFFLINE by Overall</span>
          <span className="tabular-nums">V2.0</span>
        </footer>
      </div>
    </DisplayFrame>
  );
}

function PreviewLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="border-2 border-black p-5 grid grid-cols-[220px_1fr] items-center"
    >
      <div className="text-4xl font-black">{title}</div>
      <div className="text-2xl font-medium leading-snug">{desc}</div>
    </Link>
  );
}
