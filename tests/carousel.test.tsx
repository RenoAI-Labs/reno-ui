import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Embla measures the DOM, which jsdom does not lay out; it needs both of these
// to initialise at all. Layout-dependent behaviour (which slide is in view) is
// Embla's own concern and is not asserted here — the reno contract is.
class ObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
for (const name of ["ResizeObserver", "IntersectionObserver"] as const) {
  if (!(name in globalThis)) {
    (globalThis as unknown as Record<string, unknown>)[name] = ObserverStub;
  }
}
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

function Basic({ prevLabel, nextLabel }: { prevLabel?: string; nextLabel?: string } = {}) {
  return (
    <Carousel>
      <CarouselContent>
        <CarouselItem>Bài 1</CarouselItem>
        <CarouselItem>Bài 2</CarouselItem>
      </CarouselContent>
      <CarouselPrevious label={prevLabel} />
      <CarouselNext label={nextLabel} />
    </Carousel>
  );
}

describe("Carousel", () => {
  it("renders its slides with carousel semantics", () => {
    const { container } = render(<Basic />);
    expect(screen.getByRole("region")).toHaveAttribute("aria-roledescription", "carousel");

    const slides = container.querySelectorAll('[role="group"][aria-roledescription="slide"]');
    expect(slides).toHaveLength(2);
  });

  it("names the arrows in Vietnamese by default and takes overrides", () => {
    const { rerender } = render(<Basic />);
    expect(screen.getByRole("button", { name: "Trước" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sau" })).toBeInTheDocument();

    rerender(<Basic prevLabel="Previous" nextLabel="Next" />);
    expect(screen.getByRole("button", { name: "Previous" })).toBeInTheDocument();
  });

  it("spaces slides from the density token rather than a fixed gap", () => {
    const { container } = render(<Basic />);
    const item = container.querySelector('[data-slot="carousel-item"]');
    expect(item?.className).toContain("pl-[var(--density-gap)]");
  });

  it("throws a useful error when a part is used outside <Carousel />", () => {
    // Without this the failure surfaces as "cannot read property of null" deep
    // inside the part that was rendered.
    expect(() => render(<CarouselNext />)).toThrow(/must be used within a <Carousel \/>/);
  });
});
