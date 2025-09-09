console.log("Home Script Loaded");

import { mountAbout } from "./renders/about.js";
import { mountCaseStudies } from "./renders/case-studies.js";
import { mountFooter } from "./renders/footer.js";
import { mountHero } from "./renders/hero.js";
import { mountKPI } from "./renders/kpi.js";
import { mountReferences } from "./renders/references.js";
import { mountTestimonials } from "./renders/testimonials.js";
import { mountTestimony } from "./renders/testimony.js";
import { mountWriting } from "./renders/writing.js";
import { onReady } from "./utils/ready.js";

onReady(() => {
  mountHero();
  mountReferences();
  mountCaseStudies({
    dribbbleUsername: "nicholascodet",
    shotsMax: 10,
  });
  mountTestimony();
  mountAbout();
  mountTestimonials({
    limit: 6,
  });
  mountKPI();
  mountWriting({ mediumUser: "nicholas.codet" });
  mountFooter();
});
