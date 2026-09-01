import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";

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
