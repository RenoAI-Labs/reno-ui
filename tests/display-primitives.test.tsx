import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { KvList, KvRow } from "@/components/ui/kv-row";
import { StatCard } from "@/components/ui/stat-card";
import { Stepper, defaultStepperLabels } from "@/components/ui/stepper";
import { Timeline } from "@/components/ui/timeline";

/**
 * The four primitives a real project wrote by hand because reno had no answer:
 * a KPI tile, a key/value row, a stepper and an activity feed.
 *
 * What is asserted here is mostly semantics, and that is deliberate. Three of
 * the four originals were presentational only — `<div>`s carrying meaning in
 * colour — so the value reno adds over "port the file" is the part a test can
 * actually hold onto.
 */

describe("StatCard separates the arrow from the judgement", () => {
  it("colours a rise positive by default", () => {
    render(<StatCard label="Tuyển mới" value="19" delta={{ text: "12,5%", direction: "up" }} />);
    expect(screen.getByText("12,5%").closest("[data-slot=badge]")).toHaveClass("bg-success");
  });

  it("lets a rise be bad news", () => {
    /*
      The defect in the implementation this was drawn from, which colours "up"
      green unconditionally. Attrition, churn, refunds and cost all rise in the
      wrong direction, and a green chip on a rising churn figure is a dashboard
      telling the reader the opposite of the truth.
    */
    render(
      <StatCard
        label="Tỉ lệ nghỉ việc"
        value="3,8"
        delta={{ text: "0,6 điểm", direction: "up", intent: "negative" }}
      />,
    );
    expect(screen.getByText("0,6 điểm").closest("[data-slot=badge]")).toHaveClass(
      "bg-destructive",
    );
  });

  it("shows no arrow when there is no baseline to compare against", () => {
    // "Not enough data yet" has to be visible. The alternative — hiding the
    // chip — reads as "no change", which is a different claim.
    const { container } = render(
      <StatCard label="Doanh thu" value="0" delta={{ text: "chưa có dữ liệu" }} />,
    );
    expect(screen.getByText("chưa có dữ liệu")).toBeInTheDocument();
    expect(container.querySelector("[data-slot=stat-card] svg")).toBeNull();
  });

  it("marks itself busy and hides the number while loading", () => {
    // A KPI row where one number is slower than the others is the normal case.
    const { container } = render(<StatCard label="Chi phí" value="12.000.000" loading />);
    expect(container.querySelector("[data-slot=stat-card]")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("12.000.000")).not.toBeInTheDocument();
  });

  it("becomes a real control when it is clickable", async () => {
    // A clickable div is reachable by mouse only. A KPI that filters the list
    // below it has to answer to the keyboard too.
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<StatCard label="Tổng nhân sự" value="240" onClick={onClick} />);

    const tile = screen.getByRole("button", { name: /Tổng nhân sự/ });
    tile.focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("stays a plain tile when it is not", () => {
    render(<StatCard label="Tổng nhân sự" value="240" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("KvRow reads as pairs, not as two runs of text", () => {
  it("renders a description list so each label owns its value", () => {
    const { container } = render(
      <KvList>
        <KvRow label="Mã đơn">SO-1042</KvRow>
        <KvRow label="Khách hàng">Đại Việt</KvRow>
      </KvList>,
    );

    expect(container.querySelector("dl")).toBeInTheDocument();
    const terms = Array.from(container.querySelectorAll("dt")).map((n) => n.textContent);
    const values = Array.from(container.querySelectorAll("dd")).map((n) => n.textContent);
    expect(terms).toEqual(["Mã đơn", "Khách hàng"]);
    expect(values).toEqual(["SO-1042", "Đại Việt"]);
  });

  it("draws the divider from the list, not from the row", () => {
    // The original got this hairline from a `.kv-row + .kv-row` rule in a
    // stylesheet the component did not own, which is why it could not be
    // installed on its own. Owning it here also means inserting a row into the
    // middle of the list cannot get it wrong.
    const { container } = render(
      <KvList>
        <KvRow label="a">1</KvRow>
      </KvList>,
    );
    expect(container.querySelector("[data-slot=kv-list]")?.className).toContain("[&>*+*]:border-t");
    expect(container.querySelector("[data-slot=kv-row]")?.className).not.toContain("border-t");
  });
});

describe("Stepper says where you are in words", () => {
  const steps = [{ label: "Giỏ hàng" }, { label: "Thông tin" }, { label: "Thanh toán" }];

  it("is an ordered list of exactly the steps", () => {
    // A connector rendered as its own list item would make a screen reader
    // announce five items for a three-step flow.
    const { container } = render(<Stepper steps={steps} current={1} />);
    expect(container.querySelectorAll("ol > li")).toHaveLength(3);
  });

  it("marks the current step for assistive tech", () => {
    // Queried by slot, not by `li`: counting list items is the test above's
    // job, and indexing into `li` here would make a stray one fail both.
    const { container } = render(<Stepper steps={steps} current={1} />);
    const items = Array.from(container.querySelectorAll("[data-slot=stepper-step]"));
    expect(items.map((li) => li.getAttribute("aria-current"))).toEqual([null, "step", null]);
  });

  it("puts each step's state in text, not only in colour", () => {
    // Colour alone reaches neither a screen reader nor a reader who cannot tell
    // the two greys apart.
    render(<Stepper steps={steps} current={1} />);
    expect(screen.getByText(`Bước 1 / 3 — ${defaultStepperLabels.done}`)).toBeInTheDocument();
    expect(screen.getByText(`Bước 2 / 3 — ${defaultStepperLabels.current}`)).toBeInTheDocument();
    expect(screen.getByText(`Bước 3 / 3 — ${defaultStepperLabels.upcoming}`)).toBeInTheDocument();
  });

  it("defaults its own strings to Vietnamese and takes an override", () => {
    const { rerender } = render(<Stepper steps={steps} current={0} />);
    expect(screen.getByRole("list", { name: "Tiến trình" })).toBeInTheDocument();

    rerender(<Stepper steps={steps} current={0} labels={{ stepper: "Checkout" }} />);
    expect(screen.getByRole("list", { name: "Checkout" })).toBeInTheDocument();
    // The rest survive a partial override. Proven through `stepOf` rather than
    // through the state words: those are the test above's subject, and reading
    // them here would make one mistake fail both.
    expect(screen.getByText(/Bước 2 \/ 3/)).toBeInTheDocument();
  });

  it("treats a current past the end as everything done", () => {
    const { container } = render(<Stepper steps={steps} current={3} />);
    const states = Array.from(container.querySelectorAll("[data-slot=stepper-step]")).map((li) =>
      li.getAttribute("data-state"),
    );
    expect(states).toEqual(["done", "done", "done"]);
  });
});

describe("Timeline", () => {
  const entries = [
    { id: "a", title: "Đã thanh toán", meta: "Thu Hà · 2 giờ trước", intent: "success" as const },
    { id: "b", title: "Gọi tư vấn", meta: "Minh Quân · hôm qua" },
  ];

  it("is an ordered list of the entries", () => {
    const { container } = render(<Timeline entries={entries} />);
    expect(container.querySelectorAll("ol > li")).toHaveLength(2);
    expect(screen.getByText("Đã thanh toán")).toBeInTheDocument();
  });

  it("does not trail a connector past the last entry", () => {
    // A line running into nothing reads as "more below", which is the one thing
    // it must not say at the end of a feed.
    const { container } = render(<Timeline entries={entries} />);
    const rails = Array.from(container.querySelectorAll("li")).map(
      (li) => li.querySelectorAll("span[aria-hidden]").length,
    );
    // First entry: dot + connector. Last: dot only.
    expect(rails[0]).toBeGreaterThan(rails[1]!);
  });

  it("exposes intent for styling without making colour the only signal", () => {
    const { container } = render(<Timeline entries={entries} />);
    expect(
      Array.from(container.querySelectorAll("li")).map((li) => li.getAttribute("data-intent")),
    ).toEqual(["success", "default"]);
  });

  it("keys entries by id, so inserting at the top does not remount the rest", () => {
    // An activity feed grows at the head. Keying by array index would re-create
    // every row on each new event, losing focus and any open action menu.
    const { container, rerender } = render(<Timeline entries={entries} />);
    const second = container.querySelectorAll("li")[1];

    rerender(<Timeline entries={[{ id: "new", title: "Mới" }, ...entries]} />);
    expect(container.querySelectorAll("li")[2]).toBe(second);
  });
});
