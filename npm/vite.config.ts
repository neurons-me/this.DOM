import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dts from "vite-plugin-dts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ["src", "index.ts"],
      exclude: ["tests", "**/*.test.*"],
    }),
  ],
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "index.ts"),
      name: "DOM",
      fileName: (format) => {
        if (format === "cjs") return "dom.cjs";
        if (format === "es") return "dom.es.js";
        if (format === "umd") return "dom.umd.js";
        return `dom.${format}.js`;
      },
      formats: ["es", "cjs", "umd"],
    },
    rollupOptions: {
      output: {
        exports: "named",
        globals: {},
      },
    },
  },
});
