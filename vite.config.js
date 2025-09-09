import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    cssMinify: true,
    rollupOptions: {
      output: { manualChunks: undefined },
    },
    assetsInlineLimit: 0,
  },
  server: {
    open: true,
    strictPort: true,
  },
});
