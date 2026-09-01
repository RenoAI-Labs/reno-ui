import { Separator } from "@/components/ui/separator";

export default function SeparatorDemo() {
  return (
    <div>
      <div className="space-y-1">
        <h4 className="text-sm leading-none font-medium">reno-ui</h4>
        <p className="text-muted-foreground text-sm">Thư viện thành phần cho nhiều sản phẩm.</p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center gap-[var(--density-gap)] text-sm">
        <span>Thành phần</span>
        <Separator orientation="vertical" />
        <span>Khối</span>
        <Separator orientation="vertical" />
        <span>Chủ đề</span>
      </div>
    </div>
  );
}
