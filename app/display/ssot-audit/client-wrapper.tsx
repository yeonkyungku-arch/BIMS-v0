'use client';

import dynamic from 'next/dynamic';

const SSOTAuditContent = dynamic(() => import('./content'), { ssr: false });

export default function SSOTAuditClientWrapper() {
  return <SSOTAuditContent />;
}
