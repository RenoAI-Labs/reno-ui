"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

export default function CarouselDemo() {
  return (
    // The arrows sit outside the track, so the wrapper reserves room for them —
    // otherwise they overlap whatever is beside the carousel.
    <div className="px-14">
      {/* No `loop`: the first slide starts flush and "Trước" renders disabled,
          which is the state worth seeing. */}
      <Carousel className="w-full max-w-xs">
        <CarouselContent>
          {["Bài 1", "Bài 2", "Bài 3", "Bài 4", "Bài 5"].map((label) => (
            <CarouselItem key={label} className="basis-full sm:basis-1/2">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center">
                  <span className="text-2xl font-semibold">{label}</span>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}
