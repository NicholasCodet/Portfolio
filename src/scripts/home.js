console.log("Home Script Loaded");

import { mountCaseStudies } from "./renders/case-studies.js";
import { mountFooter } from "./renders/footer.js";
import { mountHero } from "./renders/hero.js";
import { mountKPI } from "./renders/kpi.js";
import { mountAbout } from "./renders/about.js";
import { mountReferences } from "./renders/references.js";
import { mountTestimonials } from "./renders/testimonials.js";
import { mountTestimony } from "./renders/testimony.js";
import { mountWritings } from "./renders/writings.js";
import { initPressFeedback } from "./utils/buttons.js";
import { initClickSound } from "./utils/click-sound.js";
import { onReady } from "./utils/ready.js";

onReady(() => {
  initPressFeedback();
  initClickSound();
  mountHero();
  mountReferences();
  mountCaseStudies();
  mountTestimony();
  mountAbout();
  mountTestimonials();
  mountKPI();
  mountWritings();
  mountFooter();
});
