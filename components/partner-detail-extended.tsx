'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockSuppliers, mockWarehouses } from '@/lib/mock-data';
import { Phone, Mail, Building2, Package, Warehouse } from 'lucide-react';

interface PartnerDetailExtendedProps {
  partnerId: string;
  partnerName: string;
}

export function PartnerDetailExtended({ partnerId, partnerName }: PartnerDetailExtendedProps) {
  // 해당 파트너의 공급사 정보 필터링
  const partnerSuppliers = mockSuppliers.filter((s) => s.partnerId === partnerId);
  
  // 해당 파트너의 창고 정보 필터링
  const partnerWarehouses = mockWarehouses.filter((w) => w.partnerId === partnerId);

  return (
    <div className="space-y-6">
      {/* 공급사/제조사 정보 */}
      {partnerSuppliers.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Package className="h-3 w-3" />
            공급사 / 제조사 정보
          </h4>
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="space-y-4">
                {partnerSuppliers.map((supplier) => (
                  <div key={supplier.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{supplier.partnerName}</div>
                        <div className="text-xs text-muted-foreground">{supplier.id}</div>
                      </div>
                      <Badge variant={supplier.supplierType === 'manufacturer' ? 'default' : 'secondary'}>
                        {supplier.supplierType === 'manufacturer'
                          ? '제조사'
                          : supplier.supplierType === 'supplier'
                          ? '공급사'
                          : '공급+제조'}
                      </Badge>
                    </div>
                    
                    {/* 공급 제품 카테고리 */}
                    <div>
                      <div className="text-xs font-medium text-foreground mb-1">공급 제품:</div>
                      <div className="flex flex-wrap gap-1">
                        {supplier.productCategories.map((cat, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px]">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* 연락처 */}
                    <div className="flex gap-2 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span className="font-medium">{supplier.contactPerson}</span>
                      </div>
                      <a href={`tel:${supplier.contactPhone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                        <Phone className="h-3 w-3" />
                        {supplier.contactPhone}
                      </a>
                      <a href={`mailto:${supplier.contactEmail}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                        <Mail className="h-3 w-3" />
                        이메일
                      </a>
                    </div>

                    {/* 활성 상태 */}
                    <div className="flex justify-between items-center pt-1 border-t">
                      <span className="text-xs text-muted-foreground">상태:</span>
                      <Badge variant={supplier.isActive ? 'default' : 'secondary'} className="text-[10px]">
                        {supplier.isActive ? '활성' : '비활성'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 창고 정보 */}
      {partnerWarehouses.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Warehouse className="h-3 w-3" />
            창고 정보
          </h4>
          <Card className="bg-card/50">
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className="h-8 text-[11px]">창고명</TableHead>
                      <TableHead className="h-8 text-[11px]">주소</TableHead>
                      <TableHead className="h-8 text-[11px]">담당자</TableHead>
                      <TableHead className="h-8 text-[11px]">연락처</TableHead>
                      <TableHead className="h-8 text-[11px]">상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partnerWarehouses.map((warehouse) => (
                      <TableRow key={warehouse.id} className="border-b last:border-0">
                        <TableCell className="py-2 font-medium">{warehouse.name}</TableCell>
                        <TableCell className="py-2 text-muted-foreground truncate max-w-xs">{warehouse.address}</TableCell>
                        <TableCell className="py-2">{warehouse.managerName}</TableCell>
                        <TableCell className="py-2">
                          <div className="flex gap-1">
                            <a href={`tel:${warehouse.managerPhone}`} className="text-blue-600 hover:underline" title={warehouse.managerPhone}>
                              <Phone className="h-3 w-3" />
                            </a>
                            <a href={`mailto:${warehouse.managerEmail}`} className="text-blue-600 hover:underline" title={warehouse.managerEmail}>
                              <Mail className="h-3 w-3" />
                            </a>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge variant={warehouse.isActive ? 'default' : 'secondary'} className="text-[10px]">
                            {warehouse.isActive ? '활성' : '비활성'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 통합 정보 없을 경우 */}
      {partnerSuppliers.length === 0 && partnerWarehouses.length === 0 && (
        <div className="text-center text-xs text-muted-foreground py-4 rounded-lg border border-dashed">
          공급사/제조사 또는 창고 정보가 없습니다
        </div>
      )}
    </div>
  );
}
