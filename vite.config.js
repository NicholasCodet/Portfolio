import { resolve } from "path";
import { defineConfig } from "vite";

const pagesDir = resolve(__dirname, "src/pages");
const casesDir = resolve(pagesDir, "cases");

export default defineConfig(({ command }) => ({
  root: pagesDir,
  base: command === "build" ? "./" : "/",
  publicDir: resolve(__dirname, "public"),
  build: {
    outDir: resolve(__dirname, "dist"),
    assetsDir: "assets",
    sourcemap: false,
    cssMinify: true,
    //-
    cssCodeSplit: false, // regroupe tous les CSS en un seul fichier
    minify: "esbuild",
    //-
    assetsInlineLimit: 0,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(pagesDir, "index.html"),
        kaelis: resolve(casesDir, "kaelis.html"),
        talers: resolve(casesDir, "talers.html"),
      },
      output: { manualChunks: undefined },
    },
  },
  server: {
    open: "/index.html",
    strictPort: true,
  },
}));
