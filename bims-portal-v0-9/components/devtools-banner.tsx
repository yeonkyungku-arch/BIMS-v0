import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Informational banner for DevTools pages.
 * Makes it clear these are validation/verification tools, not operational features.
 */
export function DevToolsBanner() {
  return (
    <Alert variant="default" className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
      <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
        {"이 화면은 운영 기능이 아니라, 규칙/데이터 구성의 검증용 도구입니다. (Super Admin 전용)"}
      </AlertDescription>
    </Alert>
  );
}
