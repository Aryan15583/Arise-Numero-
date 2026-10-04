import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // These two rules assume every component will run under the React
      // Compiler and flag the standard, React-docs-sanctioned pattern of
      // "read an external source (localStorage, Intl, geolocation) once on
      // mount, store it in state" as an error. That pattern is used
      // deliberately here (CartContext, CurrencyContext, booking timezone
      // detection, checkout's saved coupon) to avoid SSR/CSR hydration
      // mismatches — the effect intentionally defers the read to the
      // client. Downgraded to a warning rather than rewritten to
      // useSyncExternalStore, which would add real complexity for no
      // behavioral difference here.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
