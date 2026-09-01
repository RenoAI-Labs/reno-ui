import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next writes AGENTS.md and CLAUDE.md at the repo root on `next dev`. This
  // repo keeps its own instructions and its docs under docs/, so the generated
  // pair is noise that would land in every contributor's working tree.
  agentRules: false,

  // Registry JSON lives in public/r/ and is served statically by Next.
  // Consuming projects fetch it cross-origin via the shadcn CLI, so it must be
  // readable without credentials (registry is public — decision D4).
  async headers() {
    return [
      {
        source: "/r/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
