import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button, buttonVariants } from "@/components/ui/button";

describe("Button", () => {
  it("renders as a button by default", () => {
    render(<Button>Lưu</Button>);
    expect(screen.getByRole("button", { name: "Lưu" })).toBeInTheDocument();
  });

  it("forwards disabled state", () => {
    render(<Button disabled>Lưu</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders the child element when asChild is set", () => {
    render(
      <Button asChild>
        <a href="/docs">Tài liệu</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Tài liệu" });
    expect(link).toHaveAttribute("href", "/docs");
    // asChild must keep the styling while dropping the <button> element.
    expect(link).toHaveAttribute("data-slot", "button");
  });

  it("sizes itself from density tokens rather than a fixed height", () => {
    render(<Button>Lưu</Button>);
    // The whole multi-domain story rests on this: a fixed `h-10` here would
    // make ERP and e-learning identical.
    expect(screen.getByRole("button").className).toContain(
      "h-[var(--density-control-height)]",
    );
  });
});

describe("Button variant=\"unstyled\"", () => {
  it("emits no classes of its own, so a project stylesheet wins", () => {
    render(
      <Button variant="unstyled" className="btn btn-primary">
        Lưu
      </Button>,
    );
    // Not "no background utility" like ghost — no utility at all, including the
    // base and the size, which is what a project's own .btn rule needs.
    expect(screen.getByRole("button").className).toBe("btn btn-primary");
  });

  it("ignores size, which ghost could not", () => {
    render(
      <Button variant="unstyled" size="lg" className="btn">
        Lưu
      </Button>,
    );
    expect(screen.getByRole("button").className).toBe("btn");
  });

  it("keeps the element behaviour it is there for", () => {
    render(
      <Button variant="unstyled" className="btn" disabled>
        Lưu
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("data-slot", "button");
  });

  it("is honoured by buttonVariants() too, not only by <Button>", () => {
    // AlertDialogAction and PaginationLink style raw elements through this.
    expect(buttonVariants({ variant: "unstyled", className: "btn" })).toBe("btn");
    expect(buttonVariants({ variant: "ghost" })).toContain("inline-flex");
  });

  it("leaves every other variant byte-identical", () => {
    expect(buttonVariants()).toBe(buttonVariants({ variant: "default", size: "default" }));
    expect(buttonVariants({ variant: "ghost" })).toContain("hover:bg-accent");
  });
});
