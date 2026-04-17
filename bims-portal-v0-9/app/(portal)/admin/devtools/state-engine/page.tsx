import { DevToolsGuard } from "@/components/super-admin-guard";
import { DevToolsBanner } from "@/components/devtools-banner";
import { SimulatorScreen } from "@/components/rms/simulator/simulator-screen";
import { PageHeader } from "@/components/page-header";

export default function Page() {
  return (
    <DevToolsGuard>
      <PageHeader
        title="상태엔진 검증"
        description="단말 상태 전이 규칙 및 엔진 로직 검증"
        breadcrumbs={[
          { label: "관리자 설정", href: "/admin" },
          { label: "상태엔진 검증" },
        ]}
        section="admin"
      />
      <DevToolsBanner />
      <SimulatorScreen />
    </DevToolsGuard>
  );
}
