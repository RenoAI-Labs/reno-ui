import { AspectRatio } from "@/components/ui/aspect-ratio";

export default function AspectRatioDemo() {
  return (
    <AspectRatio ratio={16 / 9} className="bg-muted flex w-full max-w-sm items-center justify-center rounded-md">
      <span className="text-muted-foreground text-sm">Ảnh minh hoạ 16:9</span>
    </AspectRatio>
  );
}
