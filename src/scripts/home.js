import { onReady } from "./utils/ready.js";

const ric = typeof window !== "undefined" ? window.requestIdleCallback : null;

function runWhenIdle(fn) {
  if (typeof fn !== "function") return;
  if (typeof ric === "function") {
    ric(() => fn());
  } else {
    setTimeout(fn, 1);
  }
}

function mountWhenVisible(selector, loader, { rootMargin = "256px 0px" } = {}) {
  const target = document.querySelector(selector);
  if (!target || typeof loader !== "function") return;

  let mounted = false;
  const load = () => {
    if (mounted) return;
    mounted = true;
    Promise.resolve()
      .then(() => loader())
      .catch(() => {});
  };

  const hasObserver = typeof window !== "undefined" && "IntersectionObserver" in window;
  if (!hasObserver) {
    load();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        load();
      }
    },
    { rootMargin }
  );

  observer.observe(target);
}

function mountHero() {
  import("../components/hero/hero.js")
    .then(({ mountHero }) => mountHero())
    .catch(() => {});
}

onReady(() => {
  mountHero();

  mountWhenVisible("section.references", () =>
    import("../components/references/references.js").then(({ mountReferences }) =>
      mountReferences()
    )
  );

  mountWhenVisible("section.quote", () =>
    import("../components/quote/quote.js").then(({ mountQuote }) => mountQuote())
  );

  mountWhenVisible("section.about", () =>
    import("../components/about/about.js").then(({ mountAbout }) => mountAbout())
  );

  mountWhenVisible("section.testimonials", () =>
    import("../components/testimonials/testimonials.js").then(
      ({ mountTestimonials }) => mountTestimonials()
    )
  );

  mountWhenVisible(
    "section.case-studies",
    () =>
      import("../components/portfolio/portfolio.js").then(({ mountCaseStudies }) =>
        mountCaseStudies()
      ),
    { rootMargin: "320px 0px" }
  );

  mountWhenVisible(
    "section.kpi",
    () => import("../components/kpi/kpi.js").then(({ mountKPI }) => mountKPI()),
    { rootMargin: "320px 0px" }
  );

  mountWhenVisible("section.writings", () =>
    import("../components/thoughts/thoughts.js").then(({ mountThoughts }) =>
      mountThoughts()
    )
  );

  mountWhenVisible(
    "footer.section.footer",
    () =>
      import("../components/footer/footer.js").then(({ mountFooter }) =>
        mountFooter("footer.section.footer")
      ),
    { rootMargin: "480px 0px" }
  );

  runWhenIdle(() => {
    Promise.all([
      import("./utils/press-feedback.js").then(({ initPressFeedback }) =>
        initPressFeedback()
      ),
      import("./utils/click-sound.js").then(({ initClickSound }) =>
        initClickSound()
      ),
    ]).catch(() => {});
  });
});
