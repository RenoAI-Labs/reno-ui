import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const students = Array.from({ length: 20 }, (_, index) => `Học viên ${index + 1}`);

export default function ScrollAreaDemo() {
  return (
    <ScrollArea className="h-72 w-56 rounded-md border">
      <div className="p-4">
        <h4 className="mb-4 text-sm leading-none font-medium">Danh sách lớp</h4>
        {students.map((student) => (
          <div key={student}>
            <div className="text-sm">{student}</div>
            <Separator className="my-2" />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
