"use client";

import * as React from "react";
import { CircleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * "It broke — try again."
 *
 * Sibling of `EmptyState`, kept as a separate item rather than a variant: the
 * two differ in the thing that matters most, which is what the user is supposed
 * to do next. An empty state offers a way forward; an error state offers a
 * retry, and it needs the handler and the button that go with it.
 *
 * The shell markup is repeated here instead of shared with `EmptyState`. Three
 * layout classes are not worth a dependency between two registry items that a
 * project should be able to install one of.
 *
 * `role="alert"` is on the root: an error nobody sees announced is an error a
 * screen-reader user waits on. It means a surface that mounts already failed
 * announces itself, which is the intended trade.
 *
 * `retryLabel` defaults to Vietnamese and is overridable. reno-ui ships no i18n
 * runtime — display strings are props, so a project keeps whatever i18n setup it
 * already has and inherits nothing at handover.
 */
function ErrorState({
  icon,
  title,
  titleAs,
  body,
  action,
  onRetry,
  retryLabel = "Thử lại",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  /** Defaults to an alert glyph. Pass `null` for no icon at all. */
  icon?: React.ReactNode;
  title?: React.ReactNode;
  /**
   * Element the title renders as. Defaults to `p`, the same axis and the same
   * default as `EmptyState`.
   *
   * An error state that takes the whole page — a route that failed to load, a
   * 404, a section that could not fetch — is a region of the document, and its
   * title is the heading a screen-reader user navigates to. A `<p>` is right
   * only when the error sits inside something that already carries the heading
   * (a grid body, a player), which is why the default did not change.
   */
  titleAs?: "p" | "h2" | "h3" | "h4";
  /** What went wrong, in a sentence the user can act on. */
  body?: React.ReactNode;
  /** Replaces the built-in retry button when a different action fits better. */
  action?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  const TitleTag = titleAs ?? "p";

  return (
    <div
      data-slot="error-state"
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      {icon === undefined ? (
        <CircleAlertIcon className="size-8 text-destructive" aria-hidden />
      ) : (
        icon
      )}
      {title ? (
        <TitleTag className={cn("font-medium", titleAs ? "text-base" : "text-sm")}>
          {title}
        </TitleTag>
      ) : null}
      {body ? <p className="text-sm text-muted-foreground">{body}</p> : null}
      {action ??
        (onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null)}
    </div>
  );
}

export { ErrorState };
