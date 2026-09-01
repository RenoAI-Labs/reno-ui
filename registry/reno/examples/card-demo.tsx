import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CardDemo() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Gói Chuyên nghiệp</CardTitle>
        <CardDescription>Dành cho đội nhóm cần nhiều tính năng hơn.</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            Sửa
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Bao gồm báo cáo nâng cao, hỗ trợ ưu tiên và tối đa 20 thành viên.
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-[var(--density-gap)]">
        <Button variant="ghost">Huỷ</Button>
        <Button>Nâng cấp</Button>
      </CardFooter>
    </Card>
  );
}
