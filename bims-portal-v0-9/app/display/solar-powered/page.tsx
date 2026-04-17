"use client";

import { useState } from "react";
import SolarPoweredDisplay from "@/components/display/SolarPoweredDisplay";
import { Button } from "@/components/ui/button";

const mockBuses = [
  { routeNo: "2413", destination: "성동구민센터", eta: "곧", stopsAway: "1" },
  { routeNo: "2016", destination: "서울숲", eta: "2분", stopsAway: "1" },
  { routeNo: "2224", destination: "성동구민센터", eta: "4분", stopsAway: "2" },
  { routeNo: "N62", destination: "서울숲", eta: "8분", stopsAway: "3" },
  { routeNo: "462", destination: "강남역", eta: "12분", stopsAway: "4" },
  { routeNo: "1611", destination: "광진구청", eta: "15분", stopsAway: "5" },
  { routeNo: "3412", destination: "동대문", eta: "18분", stopsAway: "6" },
  { routeNo: "2700", destination: "강남역", eta: "22분", stopsAway: "7" },
];

export default function SolarDisplayPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState(85);
  const totalPages = Math.ceil(mockBuses.length / 4);

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-900 gap-4 p-4">
      {/* E-paper display simulation */}
      <div className="flex-1 border-8 border-gray-700 bg-white shadow-2xl overflow-hidden">
        <SolarPoweredDisplay
          stopName="성동구청"
          stopCode="12-345"
          buses={mockBuses}
          currentPage={currentPage}
          totalPages={totalPages}
          batteryLevel={batteryLevel}
          lastUpdate="14:32"
        />
      </div>

      {/* Control panel */}
      <div className="bg-gray-800 text-white p-4 rounded-lg flex items-center justify-between gap-4">
        <div className="text-sm space-y-1">
          <div>Page: {currentPage + 1}/{totalPages}</div>
          <div>Battery: {batteryLevel}%</div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrevPage}
            className="text-white border-white hover:bg-white hover:text-gray-800"
          >
            ← Previous
          </Button>
          <Button
            variant="outline"
            onClick={handleNextPage}
            className="text-white border-white hover:bg-white hover:text-gray-800"
          >
            Next →
          </Button>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={batteryLevel}
          onChange={(e) => setBatteryLevel(Number(e.target.value))}
          className="w-32"
        />
      </div>
    </div>
  );
}
