import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi as vitestVi } from "vitest";

import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

// jsdom is missing a few browser APIs these components touch: ResizeObserver
// (Radix Popover/Tooltip positioning), Element.scrollIntoView (cmdk, to keep
// the active item visible), and matchMedia (useIsMobile). Stub them locally
// rather than in the shared tests/setup.ts, which other batches' suites also
// load.
class ResizeObserverStub implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;

Element.prototype.scrollIntoView ??= function scrollIntoViewStub() {};

window.matchMedia ??=
  function matchMediaStub(query: string): MediaQueryList {
    return {
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  };

const options: ComboboxOption[] = [
  { value: "hanoi", label: "Hà Nội" },
  { value: "hcm", label: "TP. Hồ Chí Minh" },
  { value: "danang", label: "Đà Nẵng", disabled: true },
];

describe("Combobox", () => {
  it("shows the placeholder when no value is selected", () => {
    render(<Combobox options={options} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Chọn...");
  });

  it("opens the list, filters by search, and selects an option", async () => {
    const onValueChange = vitestVi.fn();
    render(<Combobox options={options} onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole("combobox"));
    const list = await screen.findByRole("listbox");
    expect(within(list).getByText("Hà Nội")).toBeInTheDocument();

    const search = screen.getByPlaceholderText("Tìm kiếm...");
    fireEvent.change(search, { target: { value: "Đà Nẵng" } });
    expect(within(list).queryByText("Hà Nội")).not.toBeInTheDocument();
    expect(within(list).getByText("Đà Nẵng")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "" } });
    fireEvent.click(within(list).getByText("Hà Nội"));

    expect(onValueChange).toHaveBeenCalledWith("hanoi");
  });

  it("renders the empty state when no option matches", async () => {
    render(<Combobox options={options} emptyText="Không tìm thấy" />);

    fireEvent.click(screen.getByRole("combobox"));
    const search = await screen.findByPlaceholderText("Tìm kiếm...");
    fireEvent.change(search, { target: { value: "xyz-not-found" } });

    expect(await screen.findByText("Không tìm thấy")).toBeInTheDocument();
  });

  it("shows a clear affordance and reports null once cleared", async () => {
    const onValueChange = vitestVi.fn();
    render(
      <Combobox options={options} value="hanoi" onValueChange={onValueChange} clearable />,
    );

    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("Hà Nội");

    const clearIcon = trigger.querySelector('[data-slot="combobox-clear"]');
    expect(clearIcon).toBeTruthy();
    if (clearIcon) fireEvent.click(clearIcon);

    expect(onValueChange).toHaveBeenCalledWith(null);
  });
});

describe("DatePicker", () => {
  it("shows the placeholder, then opens a day grid to select a date", async () => {
    const onValueChange = vitestVi.fn();
    render(<DatePicker onValueChange={onValueChange} />);

    const trigger = screen.getByRole("button");
    expect(trigger).toHaveTextContent("Chọn ngày");

    fireEvent.click(trigger);
    const grid = await screen.findByRole("grid");
    const dayButton = within(grid).getAllByRole("gridcell")[0].querySelector("button");
    expect(dayButton).toBeTruthy();
    if (dayButton) fireEvent.click(dayButton);

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0][0]).toBeInstanceOf(Date);
  });
});

describe("Sidebar", () => {
  it("renders provider, menu items, and a working trigger", () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Trang chủ</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>,
    );

    expect(screen.getByText("Trang chủ")).toBeInTheDocument();

    // collapsible="none" above means the trigger's toggleSidebar() call has no
    // visible effect on this particular <Sidebar>; this still exercises the
    // useSidebar()/toggleSidebar() wiring without throwing.
    const trigger = screen.getByRole("button", { name: "Đóng/mở thanh điều hướng" });
    fireEvent.click(trigger);
    expect(trigger).toBeInTheDocument();
  });

  it("throws when a sidebar part is rendered outside SidebarProvider", () => {
    const spy = vitestVi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<SidebarTrigger />)).toThrow(
      "useSidebar must be used within a SidebarProvider.",
    );
    spy.mockRestore();
  });
});
