import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // framer-motion useInView returns a boolean state value — not a ref.current access.
      // The react-hooks/refs rule produces false positives for this pattern.
      "react-hooks/refs": "off",
      // <img> is intentionally used for the robot avatar (small, local, no CDN needed).
      "@next/next/no-img-element": "warn",
      // Relax explicit-any to warn so build doesn't fail on pre-existing any types.
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused vars that start with _ (common suppression pattern).
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    },
  },
]);

export default eslintConfig;

