import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ComboboxOption } from "@/components/ui/combobox";
import { ComboboxCreatable } from "@/components/ui/combobox-creatable";

// jsdom lacks the two browser APIs Radix Popover and cmdk reach for:
// ResizeObserver (positioning) and scrollIntoView (keeping the active item
// visible). Stubbed here rather than in tests/setup.ts, which every suite loads.
class ResizeObserverStub implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;
Element.prototype.scrollIntoView ??= function scrollIntoViewStub() {};

const options: ComboboxOption[] = [
  { value: "khuyen-mai", label: "Khuyến mãi" },
  { value: "huong-dan", label: "Hướng dẫn" },
];

async function openAndType(text: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("combobox"));
  await user.type(screen.getByPlaceholderText("Tìm hoặc nhập tên mới..."), text);
  return user;
}

describe("ComboboxCreatable", () => {
  it("offers to create the typed text when nothing matches", async () => {
    render(<ComboboxCreatable options={options} onCreate={vi.fn()} />);
    await openAndType("Tin tuyển dụng");

    expect(await screen.findByText('Tạo "Tin tuyển dụng"')).toBeInTheDocument();
  });

  it("does not offer to create an option that already exists", async () => {
    render(<ComboboxCreatable options={options} onCreate={vi.fn()} />);
    await openAndType("khuyến mãi");

    // Case and surrounding space must not produce a duplicate of an existing tag.
    await waitFor(() => expect(screen.getByText("Khuyến mãi")).toBeInTheDocument());
    expect(screen.queryByText(/^Tạo /)).not.toBeInTheDocument();
  });

  it("hides the create row while there is no query to create from", async () => {
    render(<ComboboxCreatable options={options} onCreate={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("combobox"));

    expect(screen.queryByText(/^Tạo /)).not.toBeInTheDocument();
  });

  it("selects the value the caller returns from an async create", async () => {
    const onValueChange = vi.fn();
    // Resolved by hand rather than on a timer: a timed promise races the
    // assertion below and the pending row it is looking for may already be gone.
    let settle: (value: string) => void = () => {};
    const onCreate = vi.fn(() => new Promise<string>((resolve) => (settle = resolve)));

    render(
      <ComboboxCreatable options={options} onCreate={onCreate} onValueChange={onValueChange} />,
    );
    const user = await openAndType("Chủ đề mới");
    await user.click(await screen.findByText('Tạo "Chủ đề mới"'));

    // The pending row is what tells the user the round-trip is happening.
    expect(await screen.findByText("Đang tạo...")).toBeInTheDocument();

    settle("moi");
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith("moi"));
    expect(onCreate).toHaveBeenCalledWith("Chủ đề mới");
  });

  it("leaves selection alone when the caller drives value itself", async () => {
    const onValueChange = vi.fn();
    render(
      <ComboboxCreatable
        options={options}
        onCreate={async () => undefined}
        onValueChange={onValueChange}
      />,
    );
    const user = await openAndType("Tự quản lý");
    await user.click(await screen.findByText('Tạo "Tự quản lý"'));

    await waitFor(() => expect(screen.queryByText("Đang tạo...")).not.toBeInTheDocument());
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("keeps the typed text and reports the failure when create rejects", async () => {
    render(
      <ComboboxCreatable options={options} onCreate={async () => Promise.reject(new Error("500"))} />,
    );
    const user = await openAndType("Hỏng");
    await user.click(await screen.findByText('Tạo "Hỏng"'));

    expect(await screen.findByRole("alert")).toHaveTextContent("Không tạo được lựa chọn mới.");
    expect(screen.getByPlaceholderText("Tìm hoặc nhập tên mới...")).toHaveValue("Hỏng");
  });

  it("selects an existing option without ever calling onCreate", async () => {
    const onCreate = vi.fn();
    const onValueChange = vi.fn();
    render(
      <ComboboxCreatable options={options} onCreate={onCreate} onValueChange={onValueChange} />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("Hướng dẫn"));

    expect(onValueChange).toHaveBeenCalledWith("huong-dan");
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("renders no create row at all when the caller passes no onCreate", async () => {
    render(<ComboboxCreatable options={options} />);
    await openAndType("Không có onCreate");

    expect(screen.queryByText(/^Tạo /)).not.toBeInTheDocument();
    expect(await screen.findByText("Không tìm thấy")).toBeInTheDocument();
  });
});
