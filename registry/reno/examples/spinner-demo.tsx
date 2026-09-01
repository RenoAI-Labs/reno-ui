import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function SpinnerDemo() {
  return (
    <div className="flex flex-wrap items-center gap-[var(--density-gap)]">
      <Spinner size="sm" />
      <Spinner />
      <Spinner size="lg" />
      <Button disabled>
        <Spinner size="sm" />
        Đang xử lý…
      </Button>
    </div>
  );
}
