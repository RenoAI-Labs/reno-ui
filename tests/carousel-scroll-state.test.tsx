import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

/**
 * The scroll state is the one part of the carousel that is NOT shadcn's code:
 * it was rewritten from a `useState` mirror seeded by a `setState` in an effect
 * body into a direct `useSyncExternalStore` subscription. Everything here pins
 * that contract, because a regression in it — dropping `api` from the subscribe
 * dependencies, returning an object snapshot, forgetting to unsubscribe — still
 * renders and still passes every assertion in carousel.test.tsx.
 *
 * Embla is faked rather than driven for real: jsdom never lays the track out,
 * so a real instance reports "cannot scroll" in both directions forever and
 * cannot tell a working subscription from a dead one. The behaviour under a
 * real Embla is covered in carousel.test.tsx, which does not mock it.
 */
type Listener = () => void;

function fakeEmbla(initial: { prev: boolean; next: boolean }) {
  const listeners = new Map<string, Set<Listener>>();
  const state = { ...initial };
  return {
    state,
    listeners,
    emit(event: string) {
      listeners.get(event)?.forEach((fn) => fn());
    },
    listenerCount() {
      return [...listeners.values()].reduce((n, set) => n + set.size, 0);
    },
    api: {
      canScrollPrev: () => state.prev,
      canScrollNext: () => state.next,
      scrollPrev: () => {},
      scrollNext: () => {},
      on(event: string, fn: Listener) {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event)!.add(fn);
        return this;
      },
      off(event: string, fn: Listener) {
        listeners.get(event)?.delete(fn);
        return this;
      },
    },
  };
}

const embla = vi.hoisted(() => ({ current: null as ReturnType<typeof fakeEmbla> | null }));

vi.mock("embla-carousel-react", () => ({
  default: () => [() => {}, embla.current?.api],
}));

afterEach(() => {
  embla.current = null;
});

function Basic() {
  return (
    <Carousel>
      <CarouselContent>
        <CarouselItem>Bài 1</CarouselItem>
        <CarouselItem>Bài 2</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

const prev = () => screen.getByRole("button", { name: "Trước" });
const next = () => screen.getByRole("button", { name: "Sau" });

describe("Carousel scroll state", () => {
  it("disables the arrow Embla says cannot scroll", () => {
    embla.current = fakeEmbla({ prev: false, next: true });
    render(<Basic />);

    expect(prev()).toBeDisabled();
    expect(next()).toBeEnabled();
  });

  it("re-reads on select", () => {
    // Catches a subscription that is registered but whose snapshot never
    // changes: the arrows freeze in whatever state they mounted with.
    const e = fakeEmbla({ prev: false, next: true });
    embla.current = e;
    render(<Basic />);

    e.state.prev = true;
    e.state.next = false;
    act(() => e.emit("select"));

    expect(prev()).toBeEnabled();
    expect(next()).toBeDisabled();
  });

  it("re-reads on reInit", () => {
    const e = fakeEmbla({ prev: true, next: true });
    embla.current = e;
    render(<Basic />);

    e.state.next = false;
    act(() => e.emit("reInit"));

    expect(next()).toBeDisabled();
  });

  it("follows the api when Embla hands back a new instance", () => {
    // The real hook yields `undefined` on the first render and the instance on
    // the next, so the subscription MUST be keyed on the api. Drop `api` from
    // the dependencies and the arrows stay stuck on the first instance forever.
    const first = fakeEmbla({ prev: false, next: true });
    embla.current = first;
    const { rerender } = render(<Basic />);

    const second = fakeEmbla({ prev: true, next: false });
    embla.current = second;
    rerender(<Basic />);

    expect(first.listenerCount()).toBe(0);
    expect(second.listenerCount()).toBeGreaterThan(0);
    expect(prev()).toBeEnabled();
    expect(next()).toBeDisabled();
  });

  it("unsubscribes on unmount", () => {
    // A leaked listener keeps the unmounted tree alive and fires on every
    // scroll for the rest of the page's life.
    const e = fakeEmbla({ prev: false, next: true });
    embla.current = e;
    const { unmount } = render(<Basic />);

    expect(e.listenerCount()).toBeGreaterThan(0);
    unmount();
    expect(e.listenerCount()).toBe(0);
  });
});
