"use client";

import { Badge } from "@/components/ui/badge";
import { KvList, KvRow } from "@/components/ui/kv-row";

export default function KvRowDemo() {
  return (
    <KvList className="max-w-lg">
      <KvRow label="Mã đơn" mono>
        SO-2026-01042
      </KvRow>
      <KvRow label="Khách hàng">Công ty CP Đại Việt</KvRow>
      <KvRow label="Trạng thái">
        <Badge variant="success">Đã thanh toán</Badge>
      </KvRow>
      <KvRow label="Email liên hệ">ke-toan@dai-viet-rat-dai.example.com</KvRow>
      <KvRow label="Giá trị" mono>
        128.500.000 ₫
      </KvRow>
    </KvList>
  );
}
