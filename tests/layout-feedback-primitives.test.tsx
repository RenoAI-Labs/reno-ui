import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// react-resizable-panels needs ResizeObserver, which jsdom does not implement.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (!("ResizeObserver" in globalThis)) {
  (globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
    ResizeObserverStub;
}

// jsdom does not implement matchMedia; sonner's Toaster reads it to resolve
// the "system" theme.
if (typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

describe("Card", () => {
  it("renders every part with its data-slot", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Tiêu đề</CardTitle>
          <CardDescription>Mô tả</CardDescription>
          <CardAction>Hành động</CardAction>
        </CardHeader>
        <CardContent>Nội dung</CardContent>
        <CardFooter>Chân trang</CardFooter>
      </Card>,
    );
    expect(screen.getByText("Tiêu đề").closest('[data-slot="card"]')).toBeInTheDocument();
    expect(screen.getByText("Nội dung")).toHaveAttribute("data-slot", "card-content");
    expect(screen.getByText("Chân trang")).toHaveAttribute("data-slot", "card-footer");
  });
});

describe("Separator", () => {
  it("defaults to horizontal orientation", () => {
    render(<Separator data-testid="sep" />);
    expect(screen.getByTestId("sep")).toHaveAttribute("data-orientation", "horizontal");
  });

  it("supports vertical orientation", () => {
    render(<Separator orientation="vertical" data-testid="sep" />);
    expect(screen.getByTestId("sep")).toHaveAttribute("data-orientation", "vertical");
  });
});

describe("Tabs", () => {
  it("shows the active panel for the default tab", () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Nội dung A</TabsContent>
        <TabsContent value="b">Nội dung B</TabsContent>
      </Tabs>,
    );
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "A" })).toHaveAttribute("data-state", "active");
    expect(screen.getByText("Nội dung A")).toBeInTheDocument();
  });

  it("sizes the tab list from a density token", () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(screen.getByRole("tablist").className).toContain("h-[var(--density-control-height)]");
  });
});

describe("Accordion", () => {
  it("opens the item matching defaultValue", () => {
    render(
      <Accordion type="single" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger>Câu hỏi</AccordionTrigger>
          <AccordionContent>Câu trả lời</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(screen.getByRole("button", { name: "Câu hỏi" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Câu trả lời")).toBeInTheDocument();
  });
});

describe("Collapsible", () => {
  it("renders trigger and content when defaultOpen", () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Mở</CollapsibleTrigger>
        <CollapsibleContent>Nội dung ẩn</CollapsibleContent>
      </Collapsible>,
    );
    expect(screen.getByText("Mở")).toHaveAttribute("data-slot", "collapsible-trigger");
    expect(screen.getByText("Nội dung ẩn")).toBeInTheDocument();
  });
});

describe("ScrollArea", () => {
  it("renders its viewport content without throwing", () => {
    render(
      <ScrollArea className="h-24 w-24" data-testid="area">
        <div>Danh sách</div>
      </ScrollArea>,
    );
    expect(screen.getByTestId("area")).toBeInTheDocument();
    expect(screen.getByText("Danh sách")).toBeInTheDocument();
  });
});

describe("Resizable", () => {
  it("renders a panel group with a separator handle", () => {
    // react-resizable-panels overwrites a consumer-supplied data-testid with
    // its own generated id, so locate the group by data-slot instead.
    const { container } = render(
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize={50}>Trái</ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>Phải</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(container.querySelector('[data-slot="resizable-panel-group"]')).toBeInTheDocument();
    expect(screen.getByText("Trái")).toBeInTheDocument();
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });
});

describe("AspectRatio", () => {
  it("renders children inside the ratio wrapper", () => {
    render(
      <AspectRatio ratio={16 / 9} data-testid="ratio">
        <span>Nội dung</span>
      </AspectRatio>,
    );
    expect(screen.getByTestId("ratio")).toBeInTheDocument();
    expect(screen.getByText("Nội dung")).toBeInTheDocument();
  });
});

describe("Alert", () => {
  it("renders with the alert role", () => {
    render(
      <Alert>
        <AlertTitle>Tiêu đề</AlertTitle>
        <AlertDescription>Mô tả</AlertDescription>
      </Alert>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("applies the destructive variant's token", () => {
    render(<Alert variant="destructive" data-testid="alert" />);
    expect(screen.getByTestId("alert").className).toContain("text-destructive");
  });
});

describe("Progress", () => {
  it("reflects its value on the progressbar", () => {
    render(<Progress value={40} aria-label="Tiến trình" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40");
  });
});

describe("Skeleton", () => {
  it("renders a pulsing placeholder", () => {
    render(<Skeleton data-testid="skeleton" />);
    const el = screen.getByTestId("skeleton");
    expect(el).toHaveAttribute("data-slot", "skeleton");
    expect(el.className).toContain("animate-pulse");
  });
});

describe("Badge", () => {
  it("renders as a span by default", () => {
    render(<Badge>Mới</Badge>);
    expect(screen.getByText("Mới")).toHaveAttribute("data-slot", "badge");
  });

  it("renders the child element when asChild is set", () => {
    render(
      <Badge asChild variant="secondary">
        <a href="/tag">Nhãn</a>
      </Badge>,
    );
    const link = screen.getByRole("link", { name: "Nhãn" });
    expect(link).toHaveAttribute("data-slot", "badge");
  });
});

describe("Spinner", () => {
  it("renders an accessible status indicator", () => {
    render(<Spinner label="Đang tải dữ liệu" />);
    expect(screen.getByRole("status", { name: "Đang tải dữ liệu" })).toBeInTheDocument();
  });

  it("sizes itself from a density token", () => {
    render(<Spinner data-testid="spinner" />);
    expect(screen.getByTestId("spinner").className).toContain("density-control-height");
  });
});

describe("Toaster", () => {
  it("renders sonner's notification region without throwing", () => {
    render(<Toaster />);
    expect(screen.getByRole("region", { name: /notifications/i })).toBeInTheDocument();
  });
});
