"use client";

import { ShieldX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AccessDenied() {
  return (
    <div data-testid="access-denied" className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ShieldX className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <CardTitle>접근 권한 없음</CardTitle>
          <CardDescription>
            현재 역할로는 이 페이지에 접근할 수 없습니다.
            <br />
            필요한 경우 관리자에게 문의하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">대시보드로 이동</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
