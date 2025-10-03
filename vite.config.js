import { resolve } from "path";
import { defineConfig } from "vite";

const rootDir = resolve(__dirname, "src/pages");

export default defineConfig({
  root: rootDir,
  publicDir: resolve(__dirname, "public"),
  build: {
    outDir: resolve(__dirname, "dist"),
    assetsDir: "assets",
    sourcemap: false,
    cssMinify: true,
    assetsInlineLimit: 0,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(rootDir, "index.html"),
        kaelis: resolve(rootDir, "kaelis.html"),
        talers: resolve(rootDir, "talers.html"),
      },
      output: { manualChunks: undefined },
    },
  },
  server: {
    open: "/index.html",
    strictPort: true,
  },
});
