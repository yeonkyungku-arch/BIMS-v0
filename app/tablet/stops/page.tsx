"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Bus, AlertTriangle, Search, Navigation } from "lucide-react";

// Mock stops data
const MOCK_STOPS = [
  {
    id: "STOP-001",
    name: "강남역 1번 정류장",
    line: "3호선",
    location: "강남구 테헤란로 12",
    lat: 37.4979,
    lng: 127.0276,
    routes: ["2413", "2016", "2224"],
    devices: 1,
    status: "정상",
    lastInspection: "2025-02-05",
  },
  {
    id: "STOP-002",
    name: "강남역 2번 정류장",
    line: "3호선",
    location: "강남구 테헤란로 10",
    lat: 37.4979,
    lng: 127.0270,
    routes: ["2413", "2016"],
    devices: 1,
    status: "정상",
    lastInspection: "2025-02-05",
  },
  {
    id: "STOP-003",
    name: "서초역 정류장",
    line: "2호선",
    location: "서초구 강남대로 63",
    lat: 37.4947,
    lng: 127.0126,
    routes: ["2413", "2016", "2224", "N62"],
    devices: 2,
    status: "주의",
    lastInspection: "2025-02-03",
  },
  {
    id: "STOP-004",
    name: "교대역 정류장",
    line: "2호선",
    location: "서초구 강남대로 30",
    lat: 37.4807,
    lng: 127.0055,
    routes: ["2224"],
    devices: 1,
    status: "정상",
    lastInspection: "2025-02-04",
  },
  {
    id: "STOP-005",
    name: "남부터미널 정류장",
    line: "터미널",
    location: "서초구 서초대로 386",
    lat: 37.4828,
    lng: 126.9876,
    routes: ["100", "101", "102"],
    devices: 2,
    status: "오류",
    lastInspection: "2025-02-02",
  },
];

export default function StopsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return MOCK_STOPS.filter((stop) => {
      const q = searchQuery.toLowerCase();
      return (
        stop.name.toLowerCase().includes(q) ||
        stop.id.toLowerCase().includes(q) ||
        stop.line.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "정상":
        return "bg-green-100 text-green-800";
      case "주의":
        return "bg-yellow-100 text-yellow-800";
      case "오류":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold">정류장 관리</h2>
        <Button
          size="lg"
          variant="outline"
          className="h-12 px-6"
          onClick={() => router.push("/tablet/terminal")}
          title="지도에서 보기"
        >
          <Navigation className="h-5 w-5 mr-2" />
          지도
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="정류장명, ID, 노선 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">
        {filtered.length}개 정류장 발견
      </p>

      {/* Stops list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">
              조건에 맞는 정류장이 없습니다.
            </p>
          </div>
        ) : (
          filtered.map((stop) => (
            <Card
              key={stop.id}
              className="cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
              onClick={() => router.push(`/tablet/stops/${stop.id}`)}
            >
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{stop.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      {stop.location}
                    </p>
                  </div>
                  <Badge
                    className={`text-xs font-semibold whitespace-nowrap flex-shrink-0 ${getStatusColor(stop.status)}`}
                  >
                    {stop.status}
                  </Badge>
                </div>

                {/* Stop info grid */}
                <div className="grid grid-cols-3 gap-4 text-sm bg-muted/50 p-3 rounded">
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">
                      노선
                    </div>
                    <div className="font-semibold">{stop.line}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">
                      단말
                    </div>
                    <div className="font-semibold">{stop.devices}개</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">
                      마지막 점검
                    </div>
                    <div className="font-semibold text-xs">
                      {new Date(stop.lastInspection).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Routes */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Bus className="h-4 w-4" />
                    운행 노선
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stop.routes.map((route) => (
                      <Badge key={route} variant="outline" className="text-xs">
                        {route}번
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Status alert */}
                {stop.status !== "정상" && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-amber-700">
                      점검이 필요한 정류장입니다.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
