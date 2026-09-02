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
  body,
  action,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  /** Defaults to an inbox glyph. Pass `null` for no icon at all. */
  icon?: React.ReactNode;
  title?: React.ReactNode;
  /** Supporting sentence under the title. */
  body?: React.ReactNode;
  /** The way out — usually a button that creates the first record. */
  action?: React.ReactNode;
}) {
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
      {title ? <p className="text-sm font-medium">{title}</p> : null}
      {body ? <p className="text-sm text-muted-foreground">{body}</p> : null}
      {action}
    </div>
  );
}

export { EmptyState };
