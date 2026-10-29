import { SiteBrand } from "@/components/ui/site-brand";

/** A stand-in mark drawn in `currentColor`, so it follows the theme like a real SVG logo would. */
function DemoMark() {
  return (
    <svg viewBox="0 0 32 32" className="text-primary" fill="currentColor" aria-hidden>
      <rect width="32" height="32" rx="8" />
      <path d="M10 22V10h7a4 4 0 0 1 0 8h-3l5 4h-4l-5-4v4z" className="fill-primary-foreground" />
    </svg>
  );
}

export default function SiteBrandDemo() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-6">
        <SiteBrand href="#" logo={<DemoMark />} wordmark="Reno Labs" />
        <SiteBrand href="#" variant="logo" logo={<DemoMark />} wordmark="Reno Labs" />
        <SiteBrand href="#" variant="wordmark" logo={<DemoMark />} wordmark="Reno Labs" />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <SiteBrand href="#" size="sm" logo={<DemoMark />} wordmark="Reno Labs" />
        <SiteBrand href="#" logo={<DemoMark />} wordmark="Reno Labs" />
        <SiteBrand href="#" size="lg" logo={<DemoMark />} wordmark="Reno Labs" />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        {/* An image URL keeps its own width; only the height is set. */}
        <SiteBrand href="#" logo="/media/sample-photo.png" wordmark="Reno Labs" />
        {/*
          Fallback state: no logo, so even `variant="logo"` shows the wordmark.
          Shown by omitting the logo rather than pointing at a broken URL, which
          would leave a 404 in the console of the docs site.
        */}
        <SiteBrand href="#" variant="logo" wordmark="Reno Labs" />
      </div>
    </div>
  );
}
