import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonDemo() {
  return (
    <div className="flex items-center gap-[var(--density-gap)]">
      <Skeleton className="size-12 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}
