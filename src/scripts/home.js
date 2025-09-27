console.log("Home Script Loaded");

import { mountCaseStudies as mountCaseStudiesComponent } from "../components/portfolio/portfolio.js";
import { mountFooter as mountFooterComponent } from "../components/footer/footer.js";
import { mountHero as mountHeroComponent } from "../components/hero/hero.js";
import { mountKPI as mountKPIComponent } from "../components/kpi/kpi.js";
import { mountThoughts as mountThoughtsComponent } from "../components/thoughts/thoughts.js";

import { mountAbout as mountAboutComponent } from "../components/about/about.js";
import { mountReferences as mountReferencesComponent } from "../components/references/references.js";
import { mountTestimonials as mountTestimonialsComponent } from "../components/testimonials/testimonials.js";
import { mountQuote as mountQuoteComponent } from "../components/quote/quote.js";
import { initClickSound } from "./utils/click-sound.js";
import { initPressFeedback } from "./utils/press-feedback.js";
import { onReady } from "./utils/ready.js";

onReady(() => {
  initPressFeedback();
  initClickSound();

  mountReferencesComponent();
  mountQuoteComponent();
  mountAboutComponent();
  mountTestimonialsComponent();

  mountHeroComponent();
  mountCaseStudiesComponent();
  mountKPIComponent();
  mountThoughtsComponent();
  mountFooterComponent(".section.footer");
});
