'use client';

import React from 'react';
import { TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

// Dashboard card component
export function DashboardCard({
  title,
  value,
  change,
  trend = 'up',
  icon,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'amber' | 'slate';
}) {
  const colorMap = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
    slate: 'text-slate-600',
  };

  const bgColorMap = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    amber: 'bg-amber-50 border-amber-200',
    slate: 'bg-slate-50 border-slate-200',
  };

  return (
    <div className={`${bgColorMap[color]} border rounded-lg p-6`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
          {change && (
            <p
              className={`text-xs mt-2 ${
                trend === 'up'
                  ? 'text-green-600'
                  : trend === 'down'
                    ? 'text-red-600'
                    : 'text-slate-600'
              }`}
            >
              {trend === 'up' && '↑'} {trend === 'down' && '↓'} {change}
            </p>
          )}
        </div>
        {icon && <div className={`${colorMap[color]} opacity-50`}>{icon}</div>}
      </div>
    </div>
  );
}

// Status badge component
export function StatusBadge({
  status,
  label,
}: {
  status: 'active' | 'inactive' | 'warning' | 'error';
  label: string;
}) {
  const statusMap = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-slate-100 text-slate-700',
    warning: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusMap[status]}`}>
      <span className={`w-2 h-2 rounded-full mr-2 ${status === 'active' ? 'bg-green-500' : status === 'warning' ? 'bg-amber-500' : status === 'error' ? 'bg-red-500' : 'bg-slate-400'}`} />
      {label}
    </span>
  );
}

// Table component
export function DataTable({
  columns,
  data,
  onRowClick,
}: {
  columns: Array<{ key: string; label: string; width?: string }>;
  data: Array<Record<string, any>>;
  onRowClick?: (row: Record<string, any>) => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-6 py-3 text-left font-semibold text-slate-700 ${col.width || ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((col) => (
                <td key={`${idx}-${col.key}`} className="px-6 py-4">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Filter toolbar component
export function FilterToolbar({
  onSearch,
  onFilter,
  filters,
}: {
  onSearch?: (query: string) => void;
  onFilter?: (filters: Record<string, string>) => void;
  filters?: Array<{ key: string; label: string; options: Array<{ value: string; label: string }> }>;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="검색..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {filters?.map((filter) => (
            <select
              key={filter.key}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => onFilter?.({ [filter.key]: e.target.value })}
            >
              <option value="">{filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>
    </div>
  );
}

// Detail drawer component
export function DetailDrawer({
  isOpen,
  title,
  onClose,
  children,
}: {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      )}
      <div
        className={`fixed right-0 top-0 h-screen w-full sm:w-96 bg-white shadow-xl transition-transform duration-300 z-50 overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </>
  );
}

// Accordion component
export function Accordion({
  items,
}: {
  items: Array<{ title: string; content: React.ReactNode }>;
}) {
  const [expandedIdx, setExpandedIdx] = React.useState<number | null>(null);

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
          >
            <span className="font-medium text-slate-900">{item.title}</span>
            <span
              className={`transition-transform duration-300 ${expandedIdx === idx ? 'rotate-180' : ''}`}
            >
              ▼
            </span>
          </button>
          {expandedIdx === idx && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
