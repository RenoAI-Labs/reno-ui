import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

import renoTokens from "./eslint-rules/no-raw-color.mjs";

const config = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "public/r/**",
      "**/*.generated.ts",
      "**/*.generated.css",
    ],
  },

  // eslint-config-next 16 ships native flat configs, so no FlatCompat shim.
  ...nextCoreWebVitals,
  ...nextTypeScript,

  {
    plugins: { "reno-tokens": renoTokens },
  },

  {
    // Shipped component source, plus the showcase.
    //
    // The showcase is not installed into any project, so on the surface it could
    // hardcode whatever looks good fastest. That is exactly why it must not: its
    // job is to demonstrate that four presets x light/dark re-theme a real screen
    // with no component change. One hardcoded colour in it and the demonstration
    // is worthless — and the defect would be invisible until someone switched
    // preset and looked closely.
    //
    // Theme files stay exempt: raw colour values are what they are for.
    files: [
      "registry/reno/ui/**/*.{ts,tsx}",
      "registry/reno/blocks/**/*.{ts,tsx}",
      "app/showcase/**/*.{ts,tsx}",
    ],
    rules: {
      "reno-tokens/no-raw-color": "error",
    },
  },
];

export default config;
