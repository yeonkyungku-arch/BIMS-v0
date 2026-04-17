import { DevToolsGuard } from "@/components/super-admin-guard";
import { DevToolsBanner } from "@/components/devtools-banner";
import { ContractPanel } from "@/components/rms/contract/contract-panel";
import { PageHeader } from "@/components/page-header";

export default function Page() {
  return (
    <DevToolsGuard>
      <PageHeader
        title="데이터 계약(검증)"
        description="시스템 데이터 계약 정의 및 검증 도구"
        breadcrumbs={[
          { label: "관리자 설정", href: "/admin" },
          { label: "데이터 계약(검증)" },
        ]}
        section="admin"
      />
      <DevToolsBanner />
      <ContractPanel />
    </DevToolsGuard>
  );
}
