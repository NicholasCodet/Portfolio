import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    cssMinify: true,
    rollupOptions: {
      input: {
        home: resolve(__dirname, "src/pages/index.html"),
        // ajoute ici toutes tes pages :
        kaelis: resolve(__dirname, "src/pages/kaelis.html"),
        talers: resolve(__dirname, "src/pages/talers.html"),
      },

      output: { manualChunks: undefined },
    },
    assetsInlineLimit: 0,
  },
  server: {
    open: "/src/pages/index.html",
    strictPort: true,
  },
});
