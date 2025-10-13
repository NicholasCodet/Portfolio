import { build } from "vite";
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Window } from "happy-dom";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distDir = path.resolve(projectRoot, "dist");
const ssrOutDir = path.resolve(projectRoot, ".prerender");
const ssrEntry = path.resolve(projectRoot, "scripts/prerender-entry.js");

await build({
  configFile: false,
  root: projectRoot,
  logLevel: "error",
  publicDir: path.resolve(projectRoot, "public"),
  build: {
    ssr: true,
    minify: false,
    outDir: ssrOutDir,
    emptyOutDir: true,
    rollupOptions: {
      input: ssrEntry,
      output: {
        format: "esm",
        entryFileNames: "[name].mjs",
      },
    },
  },
});

const bundleFiles = await readdir(ssrOutDir);
const entryFile = bundleFiles.find(
  (file) =>
    file.startsWith("prerender-entry") && file.endsWith(".mjs"),
);
if (!entryFile) {
  throw new Error("Unable to locate prerender entry bundle.");
}

const runtime = await import(
  pathToFileURL(path.resolve(ssrOutDir, entryFile)).href
);

const pages = [
  {
    name: "home",
    file: path.resolve(distDir, "index.html"),
    url: "https://nicholascodet.com/",
    render: renderHome,
  },
];

const caseDir = path.resolve(distDir, "cases");
const caseFiles = await safeReadDir(caseDir);
for (const file of caseFiles) {
  if (!file.endsWith(".html")) continue;
  const slug = file.replace(/\.html$/i, "");
  pages.push({
    name: `case:${slug}`,
    file: path.resolve(caseDir, file),
    url: `https://nicholascodet.com/cases/${slug}/`,
    slug,
    render: (ctx) => renderCase(ctx, slug),
  });
}

for (const page of pages) {
  await prerenderPage(page);
}

async function renderHome() {
  await runtime.mountReferences();
  await runtime.mountQuote();
  await runtime.mountAbout();
  await runtime.mountTestimonials();
  await runtime.mountHero();
  await runtime.mountCaseStudies();
  await runtime.mountKPI();
  await runtime.mountThoughts();
  await runtime.mountFooter(".section.footer");
}

async function renderCase(ctx, slug) {
  const entry = runtime.getCaseBySlug(slug);
  if (!entry) {
    console.warn(`[prerender] missing case data for slug "${slug}"`);
    return;
  }
  const data =
    entry?.raw?.case ||
    entry?.raw ||
    entry?.case ||
    entry;

  await runtime.mountCaseHero({ data });
  await runtime.mountCaseBody({ data });

  const quoteSection = ctx.document.querySelector("section.quote");
  if (quoteSection) {
    if (data?.quote) {
      await runtime.mountQuote({
        selector: "section.quote",
        data: [data.quote],
      });
    } else {
      quoteSection.remove();
    }
  }

  await runtime.mountRelatedProjects({
    selector: "section.related-projects",
  });
  await runtime.mountFooter("footer.section.footer");
}

async function prerenderPage(page) {
  let html;
  try {
    html = await readFile(page.file, "utf8");
  } catch (error) {
    console.warn(
      `[prerender] skipped ${page.name} (missing ${path.relative(projectRoot, page.file)})`,
    );
    return;
  }

  const window = createDom(html, page.url);
  const cleanup = installGlobals(window);

  try {
    await page.render({ window, document: window.document, page });
    if (window.happyDOM?.waitUntilComplete) {
      await window.happyDOM.waitUntilComplete();
    }
    const output =
      "<!DOCTYPE html>\n" + window.document.documentElement.outerHTML;
    await writeFile(page.file, output, "utf8");
    console.log(
      `[prerender] wrote ${path.relative(projectRoot, page.file)}`,
    );
  } catch (error) {
    console.error(`[prerender] failed for ${page.name}:`, error);
  } finally {
    cleanup();
    window.happyDOM?.close?.();
  }
}

function createDom(html, url) {
  const window = new Window({ url });
  window.document.write(html);
  window.document.close();
  return window;
}

function installGlobals(window) {
  const previous = new Map();

  const define = (key, value) => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
    previous.set(key, descriptor ?? null);
    try {
      Object.defineProperty(globalThis, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value,
      });
    } catch {
      globalThis[key] = value;
    }
  };

  define("window", window);
  define("self", window);
  define("document", window.document);
  define("navigator", window.navigator);
  define("location", window.location);
  define("HTMLElement", window.HTMLElement);
  define("SVGElement", window.SVGElement);
  define("Element", window.Element);
  define("Node", window.Node);
  define("Event", window.Event);
  define("CustomEvent", window.CustomEvent);
  define("DOMParser", window.DOMParser);
  define("MutationObserver", window.MutationObserver);
  define("performance", window.performance);
  define("requestAnimationFrame", window.requestAnimationFrame);
  define("cancelAnimationFrame", window.cancelAnimationFrame);

  window.window = window;
  window.self = window;

  if (!window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: !/max-width:\s*575/.test(query),
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    });
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = () => 0;
  }
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = () => {};
  }

  window.scrollTo = window.scrollTo || (() => {});

  const noopObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };

  if (!window.ResizeObserver) {
    window.ResizeObserver = noopObserver;
  }
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = noopObserver;
  }
  define("ResizeObserver", window.ResizeObserver);
  define("IntersectionObserver", window.IntersectionObserver);

  if (!window.navigator.clipboard) {
    window.navigator.clipboard = {
      writeText: async () => {},
    };
  }

  const headers = {
    get() {
      return "";
    },
  };
  const fetchStub = async () => ({
    ok: false,
    status: 404,
    headers,
    text: async () => "",
    json: async () => ({}),
    arrayBuffer: async () => new ArrayBuffer(0),
  });

  const fetchDescriptor =
    Object.getOwnPropertyDescriptor(globalThis, "fetch") ?? null;
  previous.set("fetch", fetchDescriptor);
  try {
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: fetchStub,
    });
  } catch {
    globalThis.fetch = fetchStub;
  }

  return () => {
    for (const [key, descriptor] of previous.entries()) {
      if (descriptor === null) {
        delete globalThis[key];
      } else {
        Object.defineProperty(globalThis, key, descriptor);
      }
    }
  };
}

async function safeReadDir(dir) {
  try {
    return await readdir(dir);
  } catch {
    return [];
  }
}
