import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AlertDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-[var(--density-gap)]">
      <Alert>
        <InfoIcon />
        <AlertTitle>Đã lưu bản nháp</AlertTitle>
        <AlertDescription>Thay đổi của bạn được lưu tự động.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <CircleCheckIcon />
        <AlertTitle>Thành công</AlertTitle>
        <AlertDescription>Đơn hàng đã được xử lý.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <TriangleAlertIcon />
        <AlertTitle>Cảnh báo</AlertTitle>
        <AlertDescription>Kho hàng sắp hết, còn dưới 5 sản phẩm.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <CircleAlertIcon />
        <AlertTitle>Lỗi</AlertTitle>
        <AlertDescription>Không thể kết nối tới máy chủ.</AlertDescription>
      </Alert>
    </div>
  );
}
