import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { DataGridEmpty, DataGridError } from "@/components/ui/data-grid/data-grid-states";
import { defaultLabels } from "@/lib/grid-labels";

describe("EmptyState", () => {
  it("renders title, body and action", () => {
    render(
      <EmptyState
        title="Chưa có khoá học nào"
        body="Tạo khoá học đầu tiên."
        action={<button type="button">Tạo</button>}
      />,
    );

    expect(screen.getByText("Chưa có khoá học nào")).toBeInTheDocument();
    expect(screen.getByText("Tạo khoá học đầu tiên.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tạo" })).toBeInTheDocument();
  });

  it("draws a default icon, and drops it entirely on icon={null}", () => {
    const { container, rerender } = render(<EmptyState body="x" />);
    expect(container.querySelector("svg")).toBeTruthy();

    rerender(<EmptyState body="x" icon={null} />);
    expect(container.querySelector("svg")).toBeNull();
  });
});

describe("ErrorState", () => {
  it("calls onRetry from the retry button", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorState body="Hỏng rồi" onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("shows no retry button when there is nothing to retry", () => {
    // An error the user cannot act on should not offer a button that does
    // nothing — that is worse than no button.
    render(<ErrorState body="Không có quyền" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("takes a Vietnamese retry label by default and an override as a prop", () => {
    const { rerender } = render(<ErrorState onRetry={() => {}} />);
    expect(screen.getByRole("button")).toHaveTextContent("Thử lại");

    rerender(<ErrorState onRetry={() => {}} retryLabel="Retry" />);
    expect(screen.getByRole("button")).toHaveTextContent("Retry");
  });

  it("announces itself as an alert", () => {
    render(<ErrorState body="Hỏng rồi" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

describe("the DataGrid states are the same components, not copies", () => {
  /**
   * The failure this guards against is duplication, not rendering: the grid
   * used to draw its own empty and error shells. If someone re-inlines them,
   * the two versions drift and only one gets fixed.
   */
  it("renders the grid's empty label through EmptyState", () => {
    const { container } = render(<DataGridEmpty labels={defaultLabels} />);
    expect(container.querySelector('[data-slot="empty-state"]')).toBeTruthy();
    expect(screen.getByText(defaultLabels.empty)).toBeInTheDocument();
  });

  it("renders the grid's error label and retry through ErrorState", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<DataGridError labels={defaultLabels} onRetry={onRetry} />);

    expect(container.querySelector('[data-slot="error-state"]')).toBeTruthy();
    expect(screen.getByText(defaultLabels.error)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: defaultLabels.retry }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
