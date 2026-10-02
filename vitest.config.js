import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.js",
    include: [
      "tests/unit/**/*.{test,spec}.{js,jsx,ts,tsx}",
      "tests/integration/**/*.{test,spec}.{js,jsx,ts,tsx}",
      "**/__tests__/*.{test,spec}.{js,jsx,ts,tsx}",
    ],
    exclude: ["tests/e2e/**", "node_modules/**", "dist/**", ".next/**"],
  },
});
