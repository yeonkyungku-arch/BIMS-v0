// =============================================================================
// BIMS Field Operations - Dispatch Management Mock Data
// =============================================================================

import {
  EngineerRecord,
  EngineerStatus,
  AssignableWork,
  DispatchChangeRecord,
  WorkPriority,
} from "./dispatch-types";

// Mock engineers
export const MOCK_ENGINEERS: EngineerRecord[] = [
  {
    engineerId: "ENG-001",
    engineerName: "김철수",
    partnerCompany: "서울유지보수(주)",
    assignedRegion: "서울 강남권",
    phoneNumber: "010-1234-5678",
    email: "kim.cs@partner.co.kr",
    status: "AVAILABLE",
    currentLocation: "서울 강남구 삼성동",
    currentLocationCoords: { lat: 37.5088, lng: 127.0631 },
    assignedWorkCount: 3,
    pendingWorkCount: 2,
    completedTodayCount: 4,
    nextScheduledWork: {
      workOrderId: "WO-2026-0342",
      busStopName: "삼성역 1번출구",
      scheduledTime: "2026-03-13T14:00:00",
      priority: "HIGH",
    },
    expectedEndTime: "2026-03-13T18:00:00",
    lastUpdatedAt: "2026-03-13T11:32:00",
  },
  {
    engineerId: "ENG-002",
    engineerName: "이영희",
    partnerCompany: "서울유지보수(주)",
    assignedRegion: "서울 강북권",
    phoneNumber: "010-2345-6789",
    email: "lee.yh@partner.co.kr",
    status: "IN_TRANSIT",
    currentLocation: "서울 종로구 이동 중",
    currentLocationCoords: { lat: 37.5704, lng: 126.9922 },
    assignedWorkCount: 2,
    pendingWorkCount: 1,
    completedTodayCount: 3,
    nextScheduledWork: {
      workOrderId: "WO-2026-0345",
      busStopName: "광화문역 2번출구",
      scheduledTime: "2026-03-13T13:30:00",
      priority: "MEDIUM",
    },
    expectedEndTime: "2026-03-13T17:30:00",
    lastUpdatedAt: "2026-03-13T11:45:00",
  },
  {
    engineerId: "ENG-003",
    engineerName: "박민준",
    partnerCompany: "경기유지보수(주)",
    assignedRegion: "경기 성남권",
    phoneNumber: "010-3456-7890",
    email: "park.mj@partner2.co.kr",
    status: "WORKING",
    currentLocation: "성남시 분당구 서현동",
    currentLocationCoords: { lat: 37.3850, lng: 127.1235 },
    assignedWorkCount: 4,
    pendingWorkCount: 3,
    completedTodayCount: 2,
    nextScheduledWork: {
      workOrderId: "WO-2026-0350",
      busStopName: "서현역 3번출구",
      scheduledTime: "2026-03-13T15:00:00",
      priority: "LOW",
    },
    expectedEndTime: "2026-03-13T19:00:00",
    lastUpdatedAt: "2026-03-13T10:20:00",
  },
  {
    engineerId: "ENG-004",
    engineerName: "최수진",
    partnerCompany: "인천유지보수(주)",
    assignedRegion: "인천 부평권",
    phoneNumber: "010-4567-8901",
    email: "choi.sj@partner3.co.kr",
    status: "AVAILABLE",
    currentLocation: "인천 부평구 부평동",
    currentLocationCoords: { lat: 37.4921, lng: 126.7234 },
    assignedWorkCount: 1,
    pendingWorkCount: 0,
    completedTodayCount: 5,
    nextScheduledWork: null,
    expectedEndTime: null,
    lastUpdatedAt: "2026-03-13T11:50:00",
  },
  {
    engineerId: "ENG-005",
    engineerName: "정대원",
    partnerCompany: "서울유지보수(주)",
    assignedRegion: "서울 강남권",
    phoneNumber: "010-5678-9012",
    email: "jung.dw@partner.co.kr",
    status: "OFFLINE",
    currentLocation: "서울 서초구",
    assignedWorkCount: 0,
    pendingWorkCount: 0,
    completedTodayCount: 0,
    nextScheduledWork: null,
    expectedEndTime: null,
    lastUpdatedAt: "2026-03-13T08:00:00",
  },
  {
    engineerId: "ENG-006",
    engineerName: "강민서",
    partnerCompany: "경기유지보수(주)",
    assignedRegion: "경기 수원권",
    phoneNumber: "010-6789-0123",
    email: "kang.ms@partner2.co.kr",
    status: "IN_TRANSIT",
    currentLocation: "수원시 영통구 이동 중",
    currentLocationCoords: { lat: 37.2636, lng: 127.0286 },
    assignedWorkCount: 3,
    pendingWorkCount: 2,
    completedTodayCount: 1,
    nextScheduledWork: {
      workOrderId: "WO-2026-0355",
      busStopName: "광교역 1번출구",
      scheduledTime: "2026-03-13T14:30:00",
      priority: "CRITICAL",
    },
    expectedEndTime: "2026-03-13T18:30:00",
    lastUpdatedAt: "2026-03-13T11:40:00",
  },
  {
    engineerId: "ENG-007",
    engineerName: "윤서연",
    partnerCompany: "서울유지보수(주)",
    assignedRegion: "서울 강서권",
    phoneNumber: "010-7890-1234",
    email: "yoon.sy@partner.co.kr",
    status: "WORKING",
    currentLocation: "서울 강서구 화곡동",
    currentLocationCoords: { lat: 37.5416, lng: 126.8493 },
    assignedWorkCount: 2,
    pendingWorkCount: 1,
    completedTodayCount: 3,
    nextScheduledWork: {
      workOrderId: "WO-2026-0360",
      busStopName: "화곡역 4번출구",
      scheduledTime: "2026-03-13T16:00:00",
      priority: "MEDIUM",
    },
    expectedEndTime: "2026-03-13T18:00:00",
    lastUpdatedAt: "2026-03-13T11:15:00",
  },
  {
    engineerId: "ENG-008",
    engineerName: "한지민",
    partnerCompany: "인천유지보수(주)",
    assignedRegion: "인천 연수권",
    phoneNumber: "010-8901-2345",
    email: "han.jm@partner3.co.kr",
    status: "ON_BREAK",
    currentLocation: "인천 연수구 송도동",
    assignedWorkCount: 2,
    pendingWorkCount: 2,
    completedTodayCount: 2,
    nextScheduledWork: {
      workOrderId: "WO-2026-0365",
      busStopName: "송도역 2번출구",
      scheduledTime: "2026-03-13T15:30:00",
      priority: "LOW",
    },
    expectedEndTime: "2026-03-13T19:00:00",
    lastUpdatedAt: "2026-03-13T12:00:00",
  },
];

// Mock assignable work orders
export const MOCK_ASSIGNABLE_WORKS: AssignableWork[] = [
  {
    workOrderId: "WO-2026-0370",
    workType: "정기 점검",
    customerName: "서울교통공사",
    busStopName: "강남역 5번출구",
    regionName: "서울 강남권",
    priority: "HIGH",
    scheduledDate: "2026-03-13",
    estimatedDuration: 60,
    isUrgent: true,
    isSameRegion: true,
  },
  {
    workOrderId: "WO-2026-0371",
    workType: "부품 교체",
    customerName: "서울교통공사",
    busStopName: "역삼역 3번출구",
    regionName: "서울 강남권",
    priority: "CRITICAL",
    scheduledDate: "2026-03-13",
    estimatedDuration: 90,
    isUrgent: true,
    isSameRegion: true,
  },
  {
    workOrderId: "WO-2026-0372",
    workType: "장애 수리",
    customerName: "경기도청",
    busStopName: "서현역 2번출구",
    regionName: "경기 성남권",
    priority: "MEDIUM",
    scheduledDate: "2026-03-14",
    estimatedDuration: 45,
    isUrgent: false,
    isSameRegion: false,
  },
  {
    workOrderId: "WO-2026-0373",
    workType: "정기 점검",
    customerName: "인천시청",
    busStopName: "부평역 1번출구",
    regionName: "인천 부평권",
    priority: "LOW",
    scheduledDate: "2026-03-15",
    estimatedDuration: 30,
    isUrgent: false,
    isSameRegion: false,
  },
];

// Mock dispatch change history
export const MOCK_DISPATCH_CHANGES: DispatchChangeRecord[] = [
  {
    changeId: "CHG-001",
    changeType: "ASSIGNED",
    workOrderId: "WO-2026-0342",
    newEngineerId: "ENG-001",
    changedBy: "admin@bims.co.kr",
    changedAt: "2026-03-13T09:00:00",
    reason: "정규 배정",
  },
  {
    changeId: "CHG-002",
    changeType: "REASSIGNED",
    workOrderId: "WO-2026-0340",
    previousEngineerId: "ENG-003",
    newEngineerId: "ENG-001",
    changedBy: "admin@bims.co.kr",
    changedAt: "2026-03-13T10:30:00",
    reason: "엔지니어 일정 변경",
  },
  {
    changeId: "CHG-003",
    changeType: "PRIORITY_CHANGED",
    workOrderId: "WO-2026-0355",
    changedBy: "manager@bims.co.kr",
    changedAt: "2026-03-13T11:00:00",
    reason: "긴급 요청으로 우선순위 상향",
  },
];

// Summary calculation
export interface DispatchSummary {
  pendingAssignments: number;
  completedToday: number;
  availableEngineers: number;
  inTransitEngineers: number;
  delayedRiskWorks: number;
}

export function buildDispatchSummary(engineers: EngineerRecord[]): DispatchSummary {
  return {
    pendingAssignments: engineers.reduce((sum, e) => sum + e.pendingWorkCount, 0),
    completedToday: engineers.reduce((sum, e) => sum + e.completedTodayCount, 0),
    availableEngineers: engineers.filter((e) => e.status === "AVAILABLE").length,
    inTransitEngineers: engineers.filter((e) => e.status === "IN_TRANSIT").length,
    delayedRiskWorks: engineers.filter(
      (e) => e.nextScheduledWork?.priority === "CRITICAL" || e.nextScheduledWork?.priority === "HIGH"
    ).length,
  };
}

// Filter helpers
export function filterEngineers(
  engineers: EngineerRecord[],
  filters: {
    customer: string;
    region: string;
    status: string;
    assignmentStatus: string;
    priority: string;
    searchTerm: string;
  }
): EngineerRecord[] {
  return engineers.filter((engineer) => {
    if (filters.customer !== "all" && engineer.partnerCompany !== filters.customer) return false;
    if (filters.region !== "all" && engineer.assignedRegion !== filters.region) return false;
    if (filters.status !== "all" && engineer.status !== filters.status) return false;
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      if (
        !engineer.engineerName.toLowerCase().includes(term) &&
        !engineer.engineerId.toLowerCase().includes(term) &&
        !engineer.partnerCompany.toLowerCase().includes(term)
      ) {
        return false;
      }
    }
    return true;
  });
}
