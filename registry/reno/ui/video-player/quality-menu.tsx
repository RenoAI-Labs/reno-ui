"use client";

import { SettingsIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AUTO_QUALITY, type PlayerLabels, type VideoQuality } from "@/lib/video-source";

/**
 * The rendition picker.
 *
 * Rendered only when there is a ladder to pick from, which is a real condition
 * rather than a defensive one: a single-rendition playlist has nothing to
 * choose, and native HLS playback exposes no ladder at all, so on Safari this
 * control is correctly absent rather than empty.
 */
export function QualityMenu({
  qualities,
  activeQuality,
  onQualityChange,
  currentHeight,
  labels,
}: {
  qualities: VideoQuality[];
  activeQuality: string;
  onQualityChange: (id: string) => void;
  /** The rung playing right now, so the automatic entry can name it. */
  currentHeight: number | null;
  labels: PlayerLabels;
}) {
  if (qualities.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={labels.quality}>
          <SettingsIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={activeQuality} onValueChange={onQualityChange}>
          {qualities.map((quality) => (
            <DropdownMenuRadioItem key={quality.id} value={quality.id}>
              {/*
                "Auto" alone tells a viewer nothing about what they are getting,
                which is the whole reason they opened this menu. Naming the rung
                it settled on turns the entry into information.
              */}
              {quality.id === AUTO_QUALITY && currentHeight
                ? labels.autoQualityAt(currentHeight)
                : quality.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
