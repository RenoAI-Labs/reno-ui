import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

describe("Toggle", () => {
  it("reports its pressed state to assistive tech", async () => {
    const user = userEvent.setup();
    render(<Toggle aria-label="In đậm" />);

    const toggle = screen.getByRole("button", { name: "In đậm" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("reads its height from the density tokens, never a fixed one", () => {
    // The whole multi-domain premise: an ERP preset renders this control
    // shorter than an e-learning preset with no change to the component.
    render(<Toggle aria-label="a" />);
    const cls = screen.getByRole("button").className;
    expect(cls).toContain("h-[var(--density-control-height)]");
    expect(cls).not.toMatch(/\bh-\d/);
  });

  it("applies the outline variant", () => {
    render(<Toggle variant="outline" aria-label="a" />);
    expect(screen.getByRole("button").className).toContain("border-input");
  });
});

describe("ToggleGroup", () => {
  it("selects one value at a time in single mode", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ToggleGroup type="single" defaultValue="day" onValueChange={onValueChange}>
        <ToggleGroupItem value="day">Ngày</ToggleGroupItem>
        <ToggleGroupItem value="week">Tuần</ToggleGroupItem>
      </ToggleGroup>,
    );

    expect(screen.getByRole("radio", { name: "Ngày" })).toHaveAttribute("aria-checked", "true");

    await user.click(screen.getByRole("radio", { name: "Tuần" }));
    expect(onValueChange).toHaveBeenCalledWith("week");
  });

  it("accumulates values in multiple mode", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ToggleGroup type="multiple" defaultValue={["bold"]} onValueChange={onValueChange}>
        <ToggleGroupItem value="bold">B</ToggleGroupItem>
        <ToggleGroupItem value="italic">I</ToggleGroupItem>
      </ToggleGroup>,
    );

    await user.click(screen.getByRole("button", { name: "I" }));
    expect(onValueChange).toHaveBeenCalledWith(["bold", "italic"]);
  });

  it("defaults to the joined segmented look and separates on spacing", () => {
    // This is the one prop that decides whether the group reads as a segmented
    // control or as loose buttons — the two shapes projects keep rewriting as
    // separate components.
    const { rerender } = render(
      <ToggleGroup type="single" data-testid="group">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );
    // The joined look is driven entirely by `data-spacing="0"` reaching the
    // ITEM through context — the `data-[spacing=0]:*` classes on the item are
    // unconditional in the source, so asserting they are present proves nothing.
    expect(screen.getByTestId("group")).toHaveAttribute("data-spacing", "0");
    expect(screen.getByRole("radio", { name: "A" })).toHaveAttribute("data-spacing", "0");

    rerender(
      <ToggleGroup type="single" spacing={2} data-testid="group">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByTestId("group")).toHaveAttribute("data-spacing", "2");
    expect(screen.getByRole("radio", { name: "A" })).toHaveAttribute("data-spacing", "2");
    expect(screen.getByTestId("group").style.getPropertyValue("--toggle-group-gap")).toBe("2");
  });

  it("keeps its gap variable when the consumer passes a style of their own", () => {
    // Regression: `style` was set before `{...props}`, so a consumer's style
    // object replaced it wholesale — spacing={n} rendered with no gap, no error.
    render(
      <ToggleGroup type="single" spacing={3} style={{ width: "100%" }} data-testid="group">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );

    const group = screen.getByTestId("group");
    expect(group.style.getPropertyValue("--toggle-group-gap")).toBe("3");
    expect(group.style.width).toBe("100%");
  });

  it("passes variant and size down to items through context", () => {
    render(
      <ToggleGroup type="single" variant="outline" size="sm">
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>,
    );

    const item = screen.getByRole("radio", { name: "A" });
    expect(item).toHaveAttribute("data-variant", "outline");
    expect(item.className).toContain("h-[var(--density-control-height-sm)]");
  });
});
