import type { MaintenanceReportRecord } from "./maintenance-report-types";

// Map constants for Korean labels
const MAINTENANCE_TYPE_LABELS: Record<string, string> = {
  PREVENTIVE: "예방 정비",
  CORRECTIVE: "수정 정비",
  EMERGENCY: "긴급 출동",
  INSPECTION: "정기 점검",
  PARTS_REPLACEMENT: "부품 교체",
};

const WORK_RESULT_LABELS: Record<string, string> = {
  SUCCESS: "성공",
  PARTIAL: "부분 완료",
  FAILED: "실패",
  REQUIRES_FOLLOWUP: "후속 조치 필요",
};

const EVIDENCE_STATUS_LABELS: Record<string, string> = {
  COMPLETE: "완료",
  PARTIAL: "일부 누락",
  MISSING: "누락",
};

const REPORT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "초안",
  SUBMITTED: "제출됨",
  PENDING_APPROVAL: "승인 대기",
  APPROVED: "승인됨",
  REJECTED: "반려됨",
  REVISION_REQUIRED: "수정 필요",
};

/**
 * Generate and download a maintenance report PDF
 * Uses browser print functionality with a styled HTML document
 */
export function downloadMaintenancePdf(report: MaintenanceReportRecord): void {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const reportedDate = report.reportedAt
    ? new Date(report.reportedAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  const siteVisitTime = report.siteVisitTime
    ? new Date(report.siteVisitTime).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>유지보수 내역서 - ${report.reportId}</title>
  <style>
    @media print {
      @page {
        size: A4;
        margin: 15mm;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
      font-size: 10pt;
      color: #1a1a1a;
      line-height: 1.5;
      padding: 20px;
    }
    
    .container {
      max-width: 210mm;
      margin: 0 auto;
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 16px;
      border-bottom: 2px solid #0f172a;
      margin-bottom: 20px;
    }
    
    .header-left h1 {
      font-size: 20pt;
      font-weight: bold;
      color: #0f172a;
      margin-bottom: 4px;
    }
    
    .header-left p {
      font-size: 9pt;
      color: #64748b;
    }
    
    .header-right {
      text-align: right;
    }
    
    .report-id {
      font-size: 11pt;
      font-weight: bold;
      color: #0f172a;
      font-family: monospace;
    }
    
    .report-date {
      font-size: 9pt;
      color: #64748b;
      margin-top: 4px;
    }
    
    /* Sections */
    .section {
      margin-bottom: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    
    .section-title {
      background: #f8fafc;
      padding: 8px 12px;
      font-size: 10pt;
      font-weight: bold;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .section-content {
      padding: 12px;
    }
    
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
    }
    
    .cell {
      padding: 8px;
      background: #f8fafc;
      border-radius: 4px;
    }
    
    .cell-label {
      font-size: 8pt;
      color: #64748b;
      margin-bottom: 2px;
    }
    
    .cell-value {
      font-size: 10pt;
      color: #0f172a;
    }
    
    .cell-value.mono {
      font-family: monospace;
    }
    
    /* Badge */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 500;
    }
    
    .badge-blue {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .badge-green {
      background: #dcfce7;
      color: #166534;
    }
    
    .badge-yellow {
      background: #fef3c7;
      color: #92400e;
    }
    
    .badge-red {
      background: #fee2e2;
      color: #991b1b;
    }
    
    /* Text blocks */
    .text-block {
      background: #f8fafc;
      padding: 12px;
      border-radius: 4px;
      font-size: 9pt;
      color: #334155;
      white-space: pre-wrap;
    }
    
    /* Parts list */
    .parts-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    
    .part-tag {
      background: #e2e8f0;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 8pt;
      color: #475569;
    }
    
    /* Signature */
    .signature-section {
      margin-top: 24px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    
    .signature-box {
      text-align: center;
      padding: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }
    
    .signature-label {
      font-size: 9pt;
      color: #64748b;
      margin-bottom: 24px;
    }
    
    .signature-line {
      border-top: 1px solid #0f172a;
      padding-top: 8px;
      font-size: 9pt;
      color: #0f172a;
    }
    
    /* Footer */
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #94a3b8;
    }
    
    .no-print {
      margin-bottom: 20px;
    }
    
    @media print {
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="no-print">
      <button onclick="window.print()" style="padding: 8px 16px; background: #0f172a; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 10pt;">
        PDF로 인쇄 / 저장
      </button>
      <button onclick="window.close()" style="padding: 8px 16px; background: #e2e8f0; color: #0f172a; border: none; border-radius: 4px; cursor: pointer; font-size: 10pt; margin-left: 8px;">
        닫기
      </button>
    </div>
    
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <h1>유지보수 내역서</h1>
        <p>Maintenance Report</p>
      </div>
      <div class="header-right">
        <div class="report-id">${report.reportId}</div>
        <div class="report-date">작성일: ${formattedDate}</div>
      </div>
    </div>
    
    <!-- Section 1: 기본 정보 -->
    <div class="section">
      <div class="section-title">1. 기본 정보</div>
      <div class="section-content">
        <div class="grid">
          <div class="cell">
            <div class="cell-label">보고서 번호</div>
            <div class="cell-value mono">${report.reportId}</div>
          </div>
          <div class="cell">
            <div class="cell-label">작업지시 번호</div>
            <div class="cell-value mono">${report.workOrderId || "-"}</div>
          </div>
          <div class="cell">
            <div class="cell-label">정류소명</div>
            <div class="cell-value">${report.busStopName || "-"}</div>
          </div>
          <div class="cell">
            <div class="cell-label">단말 ID</div>
            <div class="cell-value mono">${report.deviceId || "-"}</div>
          </div>
          <div class="cell">
            <div class="cell-label">고객사</div>
            <div class="cell-value">${report.customerName || "-"}</div>
          </div>
          <div class="cell">
            <div class="cell-label">권역</div>
            <div class="cell-value">${report.regionName || "-"}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Section 2: 유지보수 업체 정보 -->
    <div class="section">
      <div class="section-title">2. 유지보수 업체 정보</div>
      <div class="section-content">
        <div class="grid">
          <div class="cell">
            <div class="cell-label">유지보수 업체</div>
            <div class="cell-value">${report.vendorName || "-"}</div>
          </div>
          <div class="cell">
            <div class="cell-label">현장 방문 시간</div>
            <div class="cell-value">${siteVisitTime}</div>
          </div>
          <div class="cell">
            <div class="cell-label">보고 일시</div>
            <div class="cell-value">${reportedDate}</div>
          </div>
          <div class="cell">
            <div class="cell-label">출동 번호</div>
            <div class="cell-value mono">${report.dispatchId || "-"}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Section 3: 작업 내용 -->
    <div class="section">
      <div class="section-title">3. 작업 내용</div>
      <div class="section-content">
        <div class="grid-3" style="margin-bottom: 12px;">
          <div class="cell">
            <div class="cell-label">유지보수 유형</div>
            <div class="cell-value">
              <span class="badge badge-blue">${MAINTENANCE_TYPE_LABELS[report.maintenanceType] || report.maintenanceType}</span>
            </div>
          </div>
          <div class="cell">
            <div class="cell-label">작업 결과</div>
            <div class="cell-value">
              <span class="badge ${report.workResult === "SUCCESS" ? "badge-green" : report.workResult === "FAILED" ? "badge-red" : "badge-yellow"}">${WORK_RESULT_LABELS[report.workResult] || report.workResult}</span>
            </div>
          </div>
          <div class="cell">
            <div class="cell-label">보고서 상태</div>
            <div class="cell-value">
              <span class="badge ${report.reportStatus === "APPROVED" ? "badge-green" : "badge-yellow"}">${REPORT_STATUS_LABELS[report.reportStatus] || report.reportStatus}</span>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <div class="cell-label" style="margin-bottom: 4px;">증상 요약</div>
          <div class="text-block">${report.symptomSummary || "내용 없음"}</div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <div class="cell-label" style="margin-bottom: 4px;">조치 내용</div>
          <div class="text-block">${report.actionTaken || "내용 없음"}</div>
        </div>
        
        ${report.replacedParts && report.replacedParts.length > 0 ? `
        <div>
          <div class="cell-label" style="margin-bottom: 4px;">교체 부품</div>
          <div class="parts-list">
            ${report.replacedParts.map(part => `<span class="part-tag">${part}</span>`).join("")}
          </div>
        </div>
        ` : ""}
      </div>
    </div>
    
    <!-- Section 4: 증빙 현황 -->
    <div class="section">
      <div class="section-title">4. 증빙 현황</div>
      <div class="section-content">
        <div class="grid-3">
          <div class="cell">
            <div class="cell-label">증빙 상태</div>
            <div class="cell-value">
              <span class="badge ${report.evidenceStatus === "COMPLETE" ? "badge-green" : report.evidenceStatus === "MISSING" ? "badge-red" : "badge-yellow"}">${EVIDENCE_STATUS_LABELS[report.evidenceStatus] || report.evidenceStatus}</span>
            </div>
          </div>
          <div class="cell">
            <div class="cell-label">첨부 파일 수</div>
            <div class="cell-value">${report.attachmentCount || 0}개</div>
          </div>
          <div class="cell">
            <div class="cell-label">체크리스트 완료</div>
            <div class="cell-value">${report.checklistCompleted ? "완료" : "미완료"}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Section 5: 비고 -->
    ${report.notes ? `
    <div class="section">
      <div class="section-title">5. 비고</div>
      <div class="section-content">
        <div class="text-block">${report.notes}</div>
      </div>
    </div>
    ` : ""}
    
    <!-- Signature -->
    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-label">작성자</div>
        <div class="signature-line">${report.vendorName || ""}</div>
      </div>
      <div class="signature-box">
        <div class="signature-label">확인자</div>
        <div class="signature-line">&nbsp;</div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div>본 문서는 BIS 유지보수 관리 시스템에서 자동 생성되었습니다.</div>
      <div>생성일시: ${new Date().toLocaleString("ko-KR")}</div>
    </div>
  </div>
</body>
</html>
  `;

  // Open new window and write content
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}
