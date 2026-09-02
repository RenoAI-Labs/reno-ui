/**
 * Everything a project has to name to use the rich text editor, and nothing
 * that comes from TipTap.
 *
 * The same boundary `grid-state.ts` draws around TanStack and `video-source.ts`
 * around hls.js. A TipTap type on a public prop would put every consuming
 * project on TipTap's release timeline: their code stops compiling on a major
 * bump they did not ask for, in a file they cannot change without diverging
 * from the registry. Keeping the vocabulary here means a major bump is a change
 * in `use-rich-text.ts` and nowhere else.
 *
 * Nothing in this file may import `@tiptap/*`, not even as a type.
 * `scripts/check-boundaries.mjs` enforces that.
 */

/**
 * The document, as HTML.
 *
 * HTML rather than TipTap's JSON because it is what both source projects
 * already store, and because a column of HTML stays readable when the editor
 * that wrote it is gone — which is the point of a handover. The cost is that a
 * round trip is normalising rather than lossless; see
 * `docs/rich-text-contract.md`.
 */
export type RichTextValue = string;

/**
 * The toolbar's groups.
 *
 * This list is closed on purpose. A rich text editor is the component in a
 * library most likely to grow without end — every project wants one more
 * button — so the set was fixed to what a real editor in production actually
 * uses, and tables, footnotes, mentions and collaborative editing are
 * explicitly out. Adding to this type is a decision, not a patch.
 */
export type ToolbarGroup =
  | "format"
  | "heading"
  | "list"
  | "align"
  | "link"
  | "history"
  | "media";

/**
 * Groups shown when the project says nothing.
 *
 * `align` and `media` are off: alignment is a house-style decision many CMSs
 * deliberately withhold from authors, and `media` implies a story about where
 * images live that not every screen has.
 */
export const DEFAULT_TOOLBAR_GROUPS: ToolbarGroup[] = [
  "format",
  "heading",
  "list",
  "link",
  "history",
];

export type HeadingLevel = 1 | 2 | 3;
export type TextAlign = "left" | "center" | "right";

/**
 * Every user-visible string the editor can render.
 *
 * Same rule as the DataGrid and the player: reno-ui depends on no i18n runtime,
 * so strings are data with Vietnamese defaults. A string literal inside the
 * editor's JSX is a bug.
 */
export type RichTextLabels = {
  editor: string;

  /** Names for the toggle groups themselves, not for their buttons. */
  formatGroup: string;
  headingGroup: string;
  listGroup: string;
  alignGroup: string;

  bold: string;
  italic: string;
  underline: string;
  strike: string;
  code: string;

  paragraph: string;
  heading: (level: HeadingLevel) => string;

  bulletList: string;
  orderedList: string;
  blockquote: string;

  alignLeft: string;
  alignCenter: string;
  alignRight: string;

  link: string;
  linkDialogTitle: string;
  linkUrl: string;
  linkText: string;
  linkSave: string;
  linkRemove: string;
  cancel: string;

  image: string;
  imageDialogTitle: string;
  imageUrl: string;
  imageAlt: string;
  imageUpload: string;
  imageUploading: string;
  imageUploadFailed: string;
  imageInsert: string;
  tabUrl: string;
  tabUpload: string;

  youtube: string;
  youtubeDialogTitle: string;
  youtubeUrl: string;
  youtubeInvalid: string;
  youtubeInsert: string;

  undo: string;
  redo: string;
};

export const defaultRichTextLabels: RichTextLabels = {
  editor: "Trình soạn thảo",

  formatGroup: "Định dạng chữ",
  headingGroup: "Cấp tiêu đề",
  listGroup: "Danh sách và trích dẫn",
  alignGroup: "Căn lề",

  bold: "Đậm",
  italic: "Nghiêng",
  underline: "Gạch chân",
  strike: "Gạch ngang",
  code: "Mã",

  paragraph: "Đoạn văn",
  heading: (level) => `Tiêu đề ${level}`,

  bulletList: "Danh sách dấu đầu dòng",
  orderedList: "Danh sách đánh số",
  blockquote: "Trích dẫn",

  alignLeft: "Căn trái",
  alignCenter: "Căn giữa",
  alignRight: "Căn phải",

  link: "Liên kết",
  linkDialogTitle: "Chèn liên kết",
  linkUrl: "Địa chỉ",
  linkText: "Chữ hiển thị",
  linkSave: "Lưu",
  linkRemove: "Gỡ liên kết",
  cancel: "Huỷ",

  image: "Chèn ảnh",
  imageDialogTitle: "Chèn ảnh",
  imageUrl: "Địa chỉ ảnh",
  imageAlt: "Mô tả ảnh",
  imageUpload: "Chọn tệp",
  imageUploading: "Đang tải ảnh lên…",
  imageUploadFailed: "Tải ảnh lên thất bại. Thử lại hoặc chèn theo địa chỉ.",
  imageInsert: "Chèn",
  tabUrl: "Theo địa chỉ",
  tabUpload: "Tải lên",

  youtube: "Nhúng YouTube",
  youtubeDialogTitle: "Nhúng video YouTube",
  youtubeUrl: "Đường dẫn YouTube",
  youtubeInvalid: "Không nhận ra đường dẫn YouTube.",
  youtubeInsert: "Nhúng",

  undo: "Hoàn tác",
  redo: "Làm lại",
};

export const englishRichTextLabels: RichTextLabels = {
  editor: "Rich text editor",

  formatGroup: "Text formatting",
  headingGroup: "Heading level",
  listGroup: "Lists and quotes",
  alignGroup: "Alignment",

  bold: "Bold",
  italic: "Italic",
  underline: "Underline",
  strike: "Strikethrough",
  code: "Code",

  paragraph: "Paragraph",
  heading: (level) => `Heading ${level}`,

  bulletList: "Bulleted list",
  orderedList: "Numbered list",
  blockquote: "Quote",

  alignLeft: "Align left",
  alignCenter: "Align centre",
  alignRight: "Align right",

  link: "Link",
  linkDialogTitle: "Insert link",
  linkUrl: "URL",
  linkText: "Text",
  linkSave: "Save",
  linkRemove: "Remove link",
  cancel: "Cancel",

  image: "Insert image",
  imageDialogTitle: "Insert image",
  imageUrl: "Image URL",
  imageAlt: "Alt text",
  imageUpload: "Choose a file",
  imageUploading: "Uploading…",
  imageUploadFailed: "The upload failed. Try again, or insert by URL.",
  imageInsert: "Insert",
  tabUrl: "By URL",
  tabUpload: "Upload",

  youtube: "Embed YouTube",
  youtubeDialogTitle: "Embed a YouTube video",
  youtubeUrl: "YouTube URL",
  youtubeInvalid: "That is not a YouTube URL we recognise.",
  youtubeInsert: "Embed",

  undo: "Undo",
  redo: "Redo",
};

export function resolveRichTextLabels(
  overrides?: Partial<RichTextLabels>,
  base: RichTextLabels = defaultRichTextLabels,
): RichTextLabels {
  return overrides ? { ...base, ...overrides } : base;
}

/**
 * The video id inside a YouTube URL, or `null` if there is not one.
 *
 * Three shapes reach a paste box in practice and all three have to work,
 * because a person copying a link has no idea which one they got:
 *
 *   https://www.youtube.com/watch?v=ID    the address bar
 *   https://youtu.be/ID                   the Share button
 *   https://www.youtube.com/embed/ID      an existing embed, pasted back in
 *
 * Parsed with `URL` rather than by regex so that a query string in any order, a
 * `&t=`, or an `m.` / `music.` host all behave. Anything unparseable returns
 * `null`, which is what lets the dialog say so instead of embedding a blank
 * iframe.
 */
export function youtubeVideoId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  const host = parsed.hostname.replace(/^www\./, "");
  const id = (raw: string | null | undefined) =>
    raw && /^[A-Za-z0-9_-]{6,20}$/.test(raw) ? raw : null;

  if (host === "youtu.be") return id(parsed.pathname.slice(1).split("/")[0]);

  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    if (parsed.pathname === "/watch") return id(parsed.searchParams.get("v"));
    const embedded = /^\/(?:embed|v|shorts)\/([^/]+)/.exec(parsed.pathname);
    if (embedded) return id(embedded[1]);
  }

  return null;
}

/** The canonical watch URL for a video id. */
export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Normalise any accepted YouTube URL, or `null`.
 *
 * The editor stores the canonical watch URL rather than whatever was pasted, so
 * the same video is one string in the database regardless of where the link
 * came from.
 */
export function normaliseYoutubeUrl(url: string): string | null {
  const id = youtubeVideoId(url);
  return id ? youtubeWatchUrl(id) : null;
}
