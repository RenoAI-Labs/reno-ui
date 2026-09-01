import { Badge } from "@/components/ui/badge";

export default function BadgeDemo() {
  return (
    <div className="flex flex-wrap items-center gap-[var(--density-gap)]">
      <Badge>Mặc định</Badge>
      <Badge variant="secondary">Phụ</Badge>
      <Badge variant="outline">Viền</Badge>
      <Badge variant="success">Hoàn tất</Badge>
      <Badge variant="warning">Chờ duyệt</Badge>
      <Badge variant="info">Mới</Badge>
      <Badge variant="destructive">Quá hạn</Badge>
    </div>
  );
}
