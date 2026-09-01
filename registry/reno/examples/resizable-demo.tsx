import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function ResizableDemo() {
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="min-h-52 max-w-md rounded-lg border"
    >
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6 text-sm">Danh sách</div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center p-6 text-sm">Chi tiết</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
