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
    // The token gate applies only to shipped component source. Theme files
    // declare raw colours by definition, and the docs site is free to use
    // whatever it needs — neither is installed into a customer project.
    files: ["registry/reno/ui/**/*.{ts,tsx}", "registry/reno/blocks/**/*.{ts,tsx}"],
    rules: {
      "reno-tokens/no-raw-color": "error",
    },
  },
];

export default config;
