import * as React from "react";
import { InboxIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * "There is nothing here yet."
 *
 * This started inside the DataGrid, where it was the state everyone forgot. It
 * turns out nothing about it belongs to a grid: a search with no matches, a
 * fresh project, an empty folder and an unfiltered report all need the same
 * three things — an icon, a sentence, and the action that fixes it. The grid now
 * imports this rather than owning a private copy.
 *
 * Every string is a prop. There is no default copy, because "no results" and
 * "no courses yet" are not the same sentence and a generic one helps nobody.
 */
function EmptyState({
  icon,
  title,
  titleAs,
  body,
  action,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  /** Defaults to an inbox glyph. Pass `null` for no icon at all. */
  icon?: React.ReactNode;
  title?: React.ReactNode;
  /**
   * Element the title renders as. Defaults to `p`.
   *
   * An empty state that IS the page — a list with no records yet, a section of
   * an object page — is a region of the document, and its title is the heading
   * a screen-reader user navigates to. A `<p>` is the right call only when the
   * empty state sits inside something that already carries the heading, which
   * is why the default did not change.
   */
  titleAs?: "p" | "h2" | "h3" | "h4";
  /** Supporting sentence under the title. */
  body?: React.ReactNode;
  /** The way out — usually a button that creates the first record. */
  action?: React.ReactNode;
}) {
  const TitleTag = titleAs ?? "p";

  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      {icon === undefined ? (
        <InboxIcon className="size-8 text-muted-foreground" aria-hidden />
      ) : (
        icon
      )}
      {title ? (
        <TitleTag className={cn("font-medium", titleAs ? "text-base" : "text-sm")}>
          {title}
        </TitleTag>
      ) : null}
      {body ? <p className="text-sm text-muted-foreground">{body}</p> : null}
      {action}
    </div>
  );
}

export { EmptyState };
