import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import { Checkbox } from "@/components/ui/checkbox";
import FormDemo from "@/registry/reno/examples/form-demo";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

/**
 * jsdom has no PointerEvent/ResizeObserver/scrollIntoView support, which some
 * Radix primitives (Select in particular) probe on mount. These are smoke-level
 * polyfills scoped to this file only — see tests/setup.ts, which stays clean.
 */
beforeAll(() => {
  const proto = Element.prototype as Element & {
    hasPointerCapture?: () => boolean;
    releasePointerCapture?: () => void;
    scrollIntoView?: () => void;
  };
  proto.hasPointerCapture ??= () => false;
  proto.releasePointerCapture ??= () => {};
  proto.scrollIntoView ??= () => {};

  if (typeof window.ResizeObserver === "undefined") {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

describe("Input", () => {
  it("renders and forwards density-based height", () => {
    render(<Input placeholder="Nguyễn Văn A" />);
    const input = screen.getByPlaceholderText("Nguyễn Văn A");
    expect(input).toBeInTheDocument();
    // The field takes `--density-input-height` when a theme sets one and falls
    // back to the shared control height otherwise. Asserting the fallback is
    // present is what keeps a future edit from hard-coding `h-9` again.
    expect(input.className).toContain(
      "h-[var(--density-input-height,var(--density-control-height))]",
    );
    expect(input.className).toContain(
      "px-[var(--density-input-px,var(--density-control-px))]",
    );
  });

  it("applies aria-invalid styling hooks", () => {
    render(<Input aria-invalid placeholder="email" />);
    expect(screen.getByPlaceholderText("email")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("Textarea", () => {
  it("renders with density-based min height", () => {
    render(<Textarea placeholder="Ghi chú" />);
    const textarea = screen.getByPlaceholderText("Ghi chú");
    expect(textarea).toBeInTheDocument();
    expect(textarea.className).toContain("var(--density-control-height)");
  });
});

describe("Label", () => {
  it("associates with a control via htmlFor", () => {
    render(
      <>
        <Label htmlFor="label-test-input">Họ và tên</Label>
        <Input id="label-test-input" />
      </>,
    );
    expect(screen.getByLabelText("Họ và tên")).toBeInTheDocument();
  });
});

describe("Select", () => {
  it("renders the closed trigger with a placeholder", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Chọn vai trò" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Quản trị viên</SelectItem>
        </SelectContent>
      </Select>,
    );
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeInTheDocument();
    expect(screen.getByText("Chọn vai trò")).toBeInTheDocument();
  });
});

describe("Checkbox", () => {
  it("toggles checked state on click", () => {
    render(<Checkbox aria-label="Đồng ý" />);
    const checkbox = screen.getByRole("checkbox", { name: "Đồng ý" });
    expect(checkbox).toHaveAttribute("aria-checked", "false");
    fireEvent.click(checkbox);
    expect(checkbox).toHaveAttribute("aria-checked", "true");
  });
});

describe("RadioGroup", () => {
  it("selects an item on click", () => {
    render(
      <RadioGroup defaultValue="monthly">
        <RadioGroupItem value="monthly" aria-label="Hàng tháng" />
        <RadioGroupItem value="yearly" aria-label="Hàng năm" />
      </RadioGroup>,
    );
    const yearly = screen.getByRole("radio", { name: "Hàng năm" });
    expect(yearly).toHaveAttribute("aria-checked", "false");
    fireEvent.click(yearly);
    expect(yearly).toHaveAttribute("aria-checked", "true");
  });
});

describe("Switch", () => {
  it("toggles on click", () => {
    render(<Switch aria-label="Bật thông báo" />);
    const toggle = screen.getByRole("switch", { name: "Bật thông báo" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });
});

describe("Slider", () => {
  it("renders a thumb with the given value", () => {
    render(<Slider defaultValue={[40]} max={100} />);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "40");
  });
});

describe("InputOTP", () => {
  it("renders the configured number of slots", () => {
    render(
      <InputOTP maxLength={4}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>,
    );
    expect(document.querySelectorAll('[data-slot="input-otp-slot"]')).toHaveLength(4);
  });
});

describe("Form", () => {
  it("shows validation errors and marks the invalid field on empty submit", async () => {
    render(<FormDemo />);

    fireEvent.click(screen.getByRole("button", { name: "Gửi biểu mẫu" }));

    const nameInput = await screen.findByPlaceholderText("Nguyễn Văn A");
    await waitFor(() => {
      expect(screen.getByText("Họ và tên phải có ít nhất 2 ký tự")).toBeInTheDocument();
    });
    expect(nameInput).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Vui lòng chọn vai trò")).toBeInTheDocument();
    expect(
      screen.getByText("Bạn cần đồng ý điều khoản để tiếp tục"),
    ).toBeInTheDocument();
  });
});
