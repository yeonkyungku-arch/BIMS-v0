import PassengerInformationDisplay from "@/components/display/PassengerInformationDisplay";

export default function NormalStatePage() {
  return (
    <PassengerInformationDisplay
      stopName="성동구청 정류장"
      date="2026년 3월 12일"
      day="수"
      weather="맑음"
      temperature="4°C / 12°C"
      buses={[
        { routeNo: "2413", destination: "성동구민종합체육센터 방면", eta: "곧 도착", stopsAway: "1 정류장 전" },
        { routeNo: "2016", destination: "서울숲 방면", eta: "2분", stopsAway: "1 정류장 전" },
        { routeNo: "2224", destination: "성동구민종합체육센터 방면", eta: "4분", stopsAway: "2 정류장 전" },
        { routeNo: "N62", destination: "서울숲 방면", eta: "8분", stopsAway: "3 정류장 전" },
        { routeNo: "462", destination: "강남역 방면", eta: "12분", stopsAway: "4 정류장 전" },
      ]}
      noticeMessage="안전 운행을 위해 정류장 질서를 지켜주세요."
    />
  );
}
