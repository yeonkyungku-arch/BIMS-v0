'use client';

import React, { useState } from 'react';
import BIMSAdminShell from '@/components/bims-admin-shell';
import {
  DashboardCard,
  StatusBadge,
  DataTable,
  FilterToolbar,
  DetailDrawer,
  Accordion,
} from '@/components/bims-admin-components';
import { Activity, AlertCircle, CheckCircle2, TrendingUp, Server, Signal } from 'lucide-react';

export default function AdminDashboardPage() {
  const [selectedDevice, setSelectedDevice] = useState<Record<string, any> | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Sample data
  const deviceData = [
    {
      id: 'BIS-001',
      name: '강남역 1번',
      status: 'active',
      location: '강남구',
      devices: 12,
      lastUpdate: '2분 전',
    },
    {
      id: 'BIS-002',
      name: '서울역 2번',
      status: 'warning',
      location: '중구',
      devices: 11,
      lastUpdate: '5분 전',
    },
    {
      id: 'BIS-003',
      name: '홍대입구역 1번',
      status: 'active',
      location: '마포구',
      devices: 13,
      lastUpdate: '1분 전',
    },
    {
      id: 'BIS-004',
      name: '종로3가역 3번',
      status: 'error',
      location: '종로구',
      devices: 10,
      lastUpdate: '12분 전',
    },
    {
      id: 'BIS-005',
      name: '삼성역 2번',
      status: 'active',
      location: '강남구',
      devices: 12,
      lastUpdate: '30초 전',
    },
  ];

  const handleRowClick = (row: Record<string, any>) => {
    setSelectedDevice(row);
    setDrawerOpen(true);
  };

  return (
    <BIMSAdminShell currentPage="시스템 대시보드">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">시스템 대시보드</h1>
        <p className="text-slate-600">E-paper 버스정보시스템 운영 현황</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="전체 정류장"
          value="1,234"
          change="↑ 12% 전월 대비"
          icon={<Activity className="w-6 h-6" />}
          color="blue"
        />
        <DashboardCard
          title="정상 운영"
          value="1,189"
          change="↑ 96.4% 정상율"
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="green"
        />
        <DashboardCard
          title="주의 필요"
          value="35"
          change="↓ 2.8% 전월 대비"
          icon={<AlertCircle className="w-6 h-6" />}
          color="amber"
        />
        <DashboardCard
          title="장애 현황"
          value="10"
          change="↓ 1.2% 전월 대비"
          icon={<Signal className="w-6 h-6" />}
          color="red"
        />
      </div>

      {/* Stats section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Health panel */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">시스템 상태 분석</h2>
          <Accordion
            items={[
              {
                title: '배터리 상태 분석',
                content: (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">정상</span>
                      <div className="flex-1 mx-4 bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: '78%' }}
                        />
                      </div>
                      <span className="text-sm font-medium">78%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">주의</span>
                      <div className="flex-1 mx-4 bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full"
                          style={{ width: '18%' }}
                        />
                      </div>
                      <span className="text-sm font-medium">18%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">경고</span>
                      <div className="flex-1 mx-4 bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: '4%' }}
                        />
                      </div>
                      <span className="text-sm font-medium">4%</span>
                    </div>
                  </div>
                ),
              },
              {
                title: '통신 상태 분석',
                content: (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm">4G/LTE</span>
                      <span className="text-sm font-semibold text-green-600">842 (68%)</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm">Wi-Fi</span>
                      <span className="text-sm font-semibold text-blue-600">285 (23%)</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <span className="text-sm">오프라인</span>
                      <span className="text-sm font-semibold text-amber-600">107 (9%)</span>
                    </div>
                  </div>
                ),
              },
              {
                title: '배포 현황',
                content: (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">최신 버전</span>
                      <StatusBadge status="active" label="v2.1.0" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">배포율</span>
                      <span className="text-sm font-medium">94.2%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">업그레이드 대기</span>
                      <span className="text-sm font-medium">73개</span>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">빠른 작업</h3>
          <div className="space-y-3">
            <button className="w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
              배포 실행
            </button>
            <button className="w-full px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
              콘텐츠 생성
            </button>
            <button className="w-full px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
              장치 등록
            </button>
            <button className="w-full px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
              보고서 생성
            </button>
          </div>
        </div>
      </div>

      {/* Devices table */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">정류장 목록</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            새 정류장 추가
          </button>
        </div>

        <FilterToolbar
          filters={[
            {
              key: 'status',
              label: '상태',
              options: [
                { value: 'active', label: '정상' },
                { value: 'warning', label: '주의' },
                { value: 'error', label: '장애' },
              ],
            },
            {
              key: 'district',
              label: '구',
              options: [
                { value: 'gangnam', label: '강남구' },
                { value: 'mapo', label: '마포구' },
                { value: 'jongno', label: '종로구' },
              ],
            },
          ]}
        />

        <DataTable
          columns={[
            { key: 'id', label: '정류장 ID', width: 'w-20' },
            { key: 'name', label: '정류장명' },
            { key: 'location', label: '지역' },
            { key: 'devices', label: '단말수' },
            { key: 'status', label: '상태' },
            { key: 'lastUpdate', label: '마지막 업데이트' },
          ]}
          data={deviceData.map((device) => ({
            ...device,
            status: (
              <StatusBadge
                status={device.status as 'active' | 'inactive' | 'warning' | 'error'}
                label={
                  device.status === 'active'
                    ? '정상'
                    : device.status === 'warning'
                      ? '주의'
                      : '장애'
                }
              />
            ),
          }))}
          onRowClick={handleRowClick}
        />
      </div>

      {/* Detail drawer */}
      <DetailDrawer
        isOpen={drawerOpen}
        title={selectedDevice?.name || '상세정보'}
        onClose={() => setDrawerOpen(false)}
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">기본정보</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-600">ID</span>
                <span className="text-sm font-medium">{selectedDevice?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-600">지역</span>
                <span className="text-sm font-medium">{selectedDevice?.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-600">단말수</span>
                <span className="text-sm font-medium">{selectedDevice?.devices}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">상태</h3>
            <StatusBadge
              status={selectedDevice?.status as 'active' | 'inactive' | 'warning' | 'error'}
              label={
                selectedDevice?.status === 'active'
                  ? '정상'
                  : selectedDevice?.status === 'warning'
                    ? '주의'
                    : '장애'
              }
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex gap-2">
            <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              편집
            </button>
            <button className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm font-medium">
              삭제
            </button>
          </div>
        </div>
      </DetailDrawer>
    </BIMSAdminShell>
  );
}
