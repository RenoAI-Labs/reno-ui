"use client";

import * as React from "react";
import {
  BoldIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  Redo2Icon,
  StrikethroughIcon,
  TextAlignCenterIcon,
  TextAlignEndIcon,
  TextAlignStartIcon,
  TextQuoteIcon,
  UnderlineIcon,
  Undo2Icon,
  VideoIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { RichTextCommands, RichTextEditorState } from "@/hooks/use-rich-text";
import type { RichTextLabels, ToolbarGroup } from "@/lib/rich-text-value";

import {
  ToolbarActions,
  ToolbarRadioGroup,
  ToolbarSeparator,
  ToolbarToggleGroup,
} from "./toolbar-group";

/**
 * The toolbar, assembled from whichever groups the project asked for.
 *
 * Order is fixed rather than following the `groups` array. A toolbar whose
 * buttons move depending on configuration is one an author has to re-learn per
 * screen, and the muscle memory of "bold is top left" is worth more than the
 * flexibility.
 */
export function RichTextToolbar({
  groups,
  state,
  commands,
  labels,
  onOpenLink,
  onOpenImage,
  onOpenYoutube,
}: {
  groups: ToolbarGroup[];
  state: RichTextEditorState;
  commands: RichTextCommands;
  labels: RichTextLabels;
  onOpenLink: () => void;
  onOpenImage: () => void;
  onOpenYoutube: () => void;
}) {
  const has = (group: ToolbarGroup) => groups.includes(group);
  const shown: React.ReactNode[] = [];

  if (has("format")) {
    shown.push(
      <ToolbarToggleGroup
        key="format"
        label={labels.formatGroup}
        toggles={[
          {
            value: "bold",
            label: labels.bold,
            icon: <BoldIcon aria-hidden />,
            active: state.bold,
            onToggle: commands.toggleBold,
          },
          {
            value: "italic",
            label: labels.italic,
            icon: <ItalicIcon aria-hidden />,
            active: state.italic,
            onToggle: commands.toggleItalic,
          },
          {
            value: "underline",
            label: labels.underline,
            icon: <UnderlineIcon aria-hidden />,
            active: state.underline,
            onToggle: commands.toggleUnderline,
          },
          {
            value: "strike",
            label: labels.strike,
            icon: <StrikethroughIcon aria-hidden />,
            active: state.strike,
            onToggle: commands.toggleStrike,
          },
          {
            value: "code",
            label: labels.code,
            icon: <CodeIcon aria-hidden />,
            active: state.code,
            onToggle: commands.toggleCode,
          },
        ]}
      />,
    );
  }

  if (has("heading")) {
    shown.push(
      <ToolbarRadioGroup
        key="heading"
        label={labels.headingGroup}
        // Paragraph is the state when no heading is active, so it is the
        // group's value rather than a sixth button nobody would find.
        value={state.heading ? `h${state.heading}` : "p"}
        onClear={() => commands.setHeading(null)}
        toggles={[
          {
            value: "p",
            label: labels.paragraph,
            icon: <PilcrowIcon aria-hidden />,
            active: state.heading === null,
            onToggle: () => commands.setHeading(null),
          },
          {
            value: "h1",
            label: labels.heading(1),
            icon: <Heading1Icon aria-hidden />,
            active: state.heading === 1,
            onToggle: () => commands.setHeading(1),
          },
          {
            value: "h2",
            label: labels.heading(2),
            icon: <Heading2Icon aria-hidden />,
            active: state.heading === 2,
            onToggle: () => commands.setHeading(2),
          },
          {
            value: "h3",
            label: labels.heading(3),
            icon: <Heading3Icon aria-hidden />,
            active: state.heading === 3,
            onToggle: () => commands.setHeading(3),
          },
        ]}
      />,
    );
  }

  if (has("list")) {
    shown.push(
      <ToolbarToggleGroup
        key="list"
        label={labels.listGroup}
        toggles={[
          {
            value: "bulletList",
            label: labels.bulletList,
            icon: <ListIcon aria-hidden />,
            active: state.bulletList,
            onToggle: commands.toggleBulletList,
          },
          {
            value: "orderedList",
            label: labels.orderedList,
            icon: <ListOrderedIcon aria-hidden />,
            active: state.orderedList,
            onToggle: commands.toggleOrderedList,
          },
          {
            value: "blockquote",
            label: labels.blockquote,
            icon: <TextQuoteIcon aria-hidden />,
            active: state.blockquote,
            onToggle: commands.toggleBlockquote,
          },
        ]}
      />,
    );
  }

  if (has("align")) {
    shown.push(
      <ToolbarRadioGroup
        key="align"
        label={labels.alignGroup}
        value={state.align}
        onClear={() => commands.setAlign("left")}
        toggles={[
          {
            value: "left",
            label: labels.alignLeft,
            icon: <TextAlignStartIcon aria-hidden />,
            active: state.align === "left",
            onToggle: () => commands.setAlign("left"),
          },
          {
            value: "center",
            label: labels.alignCenter,
            icon: <TextAlignCenterIcon aria-hidden />,
            active: state.align === "center",
            onToggle: () => commands.setAlign("center"),
          },
          {
            value: "right",
            label: labels.alignRight,
            icon: <TextAlignEndIcon aria-hidden />,
            active: state.align === "right",
            onToggle: () => commands.setAlign("right"),
          },
        ]}
      />,
    );
  }

  if (has("link")) {
    shown.push(
      <ToolbarActions key="link">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={labels.link}
          // `aria-pressed` because the caret being inside a link is state, and
          // the icon alone does not carry it to a screen reader.
          aria-pressed={state.linkHref !== null}
          onClick={onOpenLink}
        >
          <LinkIcon aria-hidden />
        </Button>
      </ToolbarActions>,
    );
  }

  if (has("media")) {
    shown.push(
      <ToolbarActions key="media">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={labels.image}
          onClick={onOpenImage}
        >
          <ImageIcon aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={labels.youtube}
          onClick={onOpenYoutube}
        >
          {/* A generic video glyph, not the YouTube mark: reno-ui ships no
              third-party brand logos — see docs/icons.md. */}
          <VideoIcon aria-hidden />
        </Button>
      </ToolbarActions>,
    );
  }

  if (has("history")) {
    shown.push(
      <ToolbarActions key="history">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={labels.undo}
          disabled={!state.canUndo}
          onClick={commands.undo}
        >
          <Undo2Icon aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={labels.redo}
          disabled={!state.canRedo}
          onClick={commands.redo}
        >
          <Redo2Icon aria-hidden />
        </Button>
      </ToolbarActions>,
    );
  }

  return (
    <div
      data-slot="rich-text-toolbar"
      role="toolbar"
      aria-label={labels.editor}
      aria-orientation="horizontal"
      className="flex flex-wrap items-center gap-1 border-b border-border bg-card px-[var(--density-cell-padding-x)] py-[var(--density-cell-padding-y)]"
    >
      {shown.map((group, index) => (
        <React.Fragment key={index}>
          {index > 0 ? <ToolbarSeparator /> : null}
          {group}
        </React.Fragment>
      ))}
    </div>
  );
}
