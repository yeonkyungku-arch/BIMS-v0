import DegradedModeDisplay from "@/components/display/DegradedModeDisplay";

export default function DegradedStatePage() {
  return (
    <DegradedModeDisplay
      date="2026년 3월 12일"
      day="수"
      weather="흐림"
      temperature="3°C / 9°C"
      buses={[
        { routeNo: "2413", destination: "성동구민종합체육센터 방면", scheduledTime: "14:25", status: "scheduled" },
        { routeNo: "2016", destination: "서울숲 방면", scheduledTime: "14:28", status: "scheduled" },
        { routeNo: "2224", destination: "성동구민종합체육센터 방면", scheduledTime: "14:31", status: "scheduled" },
        { routeNo: "N62", destination: "서울숲 방면", scheduledTime: "", status: "service_ended" },
      ]}
      serviceNotice="버스 정보 일부가 지연될 수 있습니다."
      footerNotice="일부 버스 정보가 지연될 수 있습니다."
    />
  );
}
