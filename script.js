/* Created by Patryk Piwowarczyk */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const siteContent = window.siteContent || {};

/* =========================================================
   CONTENT STRINGS
   ========================================================= */

function setText(selector, value, root = document) {
  const element = root.querySelector(selector);
  if (!element || value === undefined || value === null) return;
  element.textContent = value;
}

function setAttr(selector, attribute, value, root = document) {
  const element = root.querySelector(selector);
  if (!element || value === undefined || value === null) return;
  element.setAttribute(attribute, value);
}

function setLabelText(selector, value) {
  const label = document.querySelector(selector);
  if (!label || value === undefined || value === null) return;

  const textNode = Array.from(label.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
  if (textNode) {
    textNode.textContent = `${value}\n            `;
  }
}

function setButtonText(selector, value) {
  const button = document.querySelector(selector);
  if (!button || value === undefined || value === null) return;

  const shine = button.querySelector(".btn__shine");
  button.textContent = value;

  if (shine) {
    button.append(" ");
    button.appendChild(shine);
  }
}

function setList(selector, items) {
  const list = document.querySelector(selector);
  if (!list || !Array.isArray(items)) return;

  list.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
}

function setParagraphs(selector, paragraphs) {
  const container = document.querySelector(selector);
  if (!container || !Array.isArray(paragraphs)) return;

  const existingParagraphs = Array.from(container.querySelectorAll(":scope > p:not(.eyebrow)"));
  existingParagraphs.forEach((paragraph, index) => {
    if (paragraphs[index] !== undefined) {
      paragraph.textContent = paragraphs[index];
    }
  });
}

function setNavLinks(selector, links) {
  const container = document.querySelector(selector);
  if (!container || !Array.isArray(links)) return;

  const anchors = Array.from(container.querySelectorAll("a"));
  anchors.forEach((anchor, index) => {
    const link = links[index];
    if (!link) return;

    anchor.href = link.href;
    anchor.textContent = link.label;
  });
}

function writeSignatureText(text) {
  const signatureText = document.querySelector(".signatureText");
  if (!signatureText || !text) return;

  signatureText.innerHTML = "";
  let glyphIndex = 0;

  Array.from(text).forEach((char) => {
    const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");

    if (char === " ") {
      tspan.setAttribute("dx", "18");
      tspan.textContent = " ";
      signatureText.appendChild(tspan);
      return;
    }

    tspan.classList.add("signatureGlyph");
    tspan.style.setProperty("--i", glyphIndex);
    tspan.textContent = char;
    signatureText.appendChild(tspan);
    glyphIndex += 1;
  });
}

function applySiteContent() {
  const content = siteContent;
  if (!content || Object.keys(content).length === 0) return;

  document.documentElement.dataset.contentSource = "content.js";

  if (content.meta?.title) {
    document.title = content.meta.title;
  }

  setAttr('meta[name="description"]', "content", content.meta?.description);
  setAttr(".brand", "aria-label", content.labels?.home);
  setAttr(".nav__links", "aria-label", content.labels?.navigation);
  setAttr(".linkedin", "aria-label", content.labels?.linkedin);
  setAttr("#navToggle", "aria-label", content.labels?.openMenu);
  setAttr("#drawerBackdrop", "aria-label", content.labels?.closeMenu);
  setAttr("[data-goal-card]", "aria-label", content.labels?.showNextGoal);
  setAttr(".expertStats", "aria-label", content.labels?.expertStats);
  setAttr(".expertSignature", "aria-label", content.labels?.expertSignature);

  setNavLinks(".nav__links", content.nav?.links);
  setNavLinks(".drawer__panel", content.nav?.links);
  setText(".nav__cta", content.nav?.cta);
  setText(".drawer__panel .btn", content.nav?.cta);

  setText(".hero .eyebrow", content.hero?.eyebrow);
  setText(".hero__title", content.hero?.title);
  setText(".hero__lead", content.hero?.lead);
  setButtonText(".hero__actions .btn--primary", content.hero?.primaryCta);
  setText(".hero__actions .btn--text", content.hero?.secondaryCta);

  setAttr("#o-mnie img", "alt", content.challenge?.imageAlt);
  setText("#o-mnie .eyebrow", content.challenge?.eyebrow);
  setText("#o-mnie h2", content.challenge?.title);
  setList("#o-mnie .checkList", content.challenge?.items);
  setText("#o-mnie .challengeNote span", content.challenge?.note);
  setText("#o-mnie .challengeNote strong", content.challenge?.noteStrong);

  setAttr("#coaching img", "alt", content.method?.imageAlt);
  setText("#coaching .eyebrow", content.method?.eyebrow);
  setText("#coaching h2", content.method?.title);
  setParagraphs("#coaching .section__copy", content.method?.paragraphs);

  setText("#oferta .sectionHead .eyebrow", content.offer?.eyebrow);
  setText("#oferta .sectionHead h2", content.offer?.title);
  setText("#oferta .sectionHead > p:not(.eyebrow)", content.offer?.lead);

  document.querySelectorAll("#oferta .offerCard").forEach((card, index) => {
    const item = content.offer?.cards?.[index];
    if (!item) return;

    setText(".offerCard__number", item.number, card);
    setText("h3", item.title, card);
    setText("p", item.text, card);
  });

  setText(".section--navy .sectionHead .eyebrow", content.process?.eyebrow);
  setText(".section--navy .sectionHead h2", content.process?.title);

  document.querySelectorAll(".processStep").forEach((step, index) => {
    const item = content.process?.steps?.[index];
    if (!item) return;

    setText("span", item.number, step);
    setText("h3", item.title, step);
    setText("p", item.text, step);
  });

  setText("#eksperci .sectionHead .eyebrow", content.experts?.eyebrow);
  setText("#eksperci .sectionHead h2", content.experts?.title);
  setText("#eksperci .sectionHead > p:not(.eyebrow)", content.experts?.lead);

  setAttr(".expertPhoto img", "alt", content.experts?.photoAlt);
  setText(".expertSignature title", content.experts?.signature);
  writeSignatureText(content.experts?.signature);
  setText(".expertBio .eyebrow", content.experts?.role);
  setText(".expertBio h3", content.experts?.name);
  setParagraphs(".expertBio", content.experts?.bio);

  document.querySelectorAll(".expertStats article").forEach((stat, index) => {
    const item = content.experts?.stats?.[index];
    if (!item) return;

    const value = stat.querySelector("[data-count-to]");
    if (value) {
      value.dataset.countTo = String(item.value);
      value.dataset.countSuffix = item.suffix || "";
      value.textContent = `1${item.suffix || ""}`;
    }

    setText("span", item.label, stat);
  });

  setText("#kontakt .eyebrow", content.contact?.eyebrow);
  setText("#kontakt h2", content.contact?.title);
  setText("#kontakt .contact__copy > p:not(.eyebrow)", content.contact?.lead);

  const contactCards = document.querySelectorAll(".contactCard");
  const emailCard = contactCards[0];
  const phoneCard = contactCards[1];

  if (emailCard) {
    emailCard.href = `mailto:${content.contact?.email || emailCard.href}`;
    setText("span", content.contact?.emailLabel, emailCard);
    setText("strong", content.contact?.email, emailCard);
  }

  if (phoneCard) {
    phoneCard.href = `tel:${content.contact?.phoneHref || content.contact?.phone || ""}`;
    setText("span", content.contact?.phoneLabel, phoneCard);
    setText("strong", content.contact?.phone, phoneCard);
  }

  const contactFormElement = document.getElementById("contactForm");
  if (contactFormElement && content.contact?.formEmail) {
    contactFormElement.dataset.email = content.contact.formEmail;
  }

  setLabelText('label:has(input[name="name"])', content.contact?.fields?.name);
  setLabelText('label:has(input[name="email"])', content.contact?.fields?.email);
  setLabelText('label:has(textarea[name="message"])', content.contact?.fields?.message);
  setAttr('input[name="name"]', "placeholder", content.contact?.fields?.namePlaceholder);
  setAttr('input[name="email"]', "placeholder", content.contact?.fields?.emailPlaceholder);
  setAttr('textarea[name="message"]', "placeholder", content.contact?.fields?.messagePlaceholder);
  setButtonText(".contactForm .btn--primary", content.contact?.submit);

  const footerYear = document.getElementById("year");
  const footerParagraph = document.querySelector(".footer p");

  if (footerParagraph && footerYear) {
    footerParagraph.innerHTML = `© <span id="year">${footerYear.textContent}</span> ${content.footer?.name || ""}. ${content.footer?.rights || ""}`;
  }

  setText(".footer a", content.footer?.backToTop);
}

applySiteContent();

/* =========================================================
   YEAR
   ========================================================= */

const yearEl = document.getElementById("year");

if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}

/* =========================================================
   HEADER STATE
   ========================================================= */

const siteHeader = document.getElementById("siteHeader");

function updateHeaderState() {
  siteHeader?.classList.toggle("is-scrolled", window.scrollY > 8);
}

updateHeaderState();
window.addEventListener("scroll", updateHeaderState, { passive: true });

/* =========================================================
   DRAWER
   ========================================================= */

const navToggle = document.getElementById("navToggle");
const drawer = document.getElementById("drawer");
const drawerBackdrop = document.getElementById("drawerBackdrop");

function setDrawer(open) {
  navToggle?.setAttribute("aria-expanded", open ? "true" : "false");
  drawer?.classList.toggle("is-open", open);
  drawer?.setAttribute("aria-hidden", open ? "false" : "true");
  document.body.classList.toggle("drawer-open", open);
}

navToggle?.addEventListener("click", () => {
  const isOpen = drawer?.getAttribute("aria-hidden") === "false";
  setDrawer(!isOpen);
});

drawerBackdrop?.addEventListener("click", () => setDrawer(false));

drawer?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setDrawer(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setDrawer(false);
  }
});

document.addEventListener("click", (event) => {
  if (!drawer?.classList.contains("is-open")) return;

  const panel = drawer.querySelector(".drawer__panel");
  const clickedInsidePanel = panel?.contains(event.target);
  const clickedToggle = navToggle?.contains(event.target);

  if (!clickedInsidePanel && !clickedToggle) {
    setDrawer(false);
  }
});

/* =========================================================
   REVEAL ON SCROLL
   ========================================================= */

const revealEls = Array.from(document.querySelectorAll(".reveal"));

if (!prefersReduced && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.14
  });

  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

/* =========================================================
   EXPERT SECTION ANIMATION
   ========================================================= */

const expertsSection = document.getElementById("eksperci");
const expertStats = document.querySelector(".expertStats");
const expertCounters = Array.from(document.querySelectorAll("[data-count-to]"));
let expertCountersStarted = false;

function animateExpertCounter(counter) {
  const target = Number(counter.dataset.countTo || 0);
  const suffix = counter.dataset.countSuffix || "+";
  const duration = 920;
  const start = performance.now();
  let lastValue = 1;

  if (prefersReduced) {
    counter.textContent = `${target}${suffix}`;
    return;
  }

  counter.textContent = `1${suffix}`;
  counter.classList.add("is-counting");

  window.setTimeout(() => {
    counter.classList.remove("is-counting");
  }, 260);

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.max(1, Math.round(1 + (target - 1) * eased));

    if (value !== lastValue) {
      counter.textContent = `${value}${suffix}`;
      lastValue = value;
    }

    if (progress < 1) {
      requestAnimationFrame(tick);
      return;
    }

    counter.textContent = `${target}${suffix}`;
    counter.classList.remove("is-counting");
    counter.classList.add("is-settled");
  }

  requestAnimationFrame(tick);
}

function startExpertCounters() {
  if (expertCountersStarted) return;

  expertCountersStarted = true;
  expertCounters.forEach((counter) => {
    animateExpertCounter(counter);
  });
}

function startExpertsAnimation() {
  if (!expertsSection || expertsSection.classList.contains("is-animated")) return;

  expertsSection.classList.add("is-animated");
}

if (expertsSection) {
  if (!prefersReduced && "IntersectionObserver" in window) {
    const expertsObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        startExpertsAnimation();
        expertsObserver.unobserve(entry.target);
      });
    }, {
      threshold: 0.32
    });

    expertsObserver.observe(expertsSection);
  } else {
    startExpertsAnimation();
    startExpertCounters();
  }
}

if (expertStats) {
  if (!prefersReduced && "IntersectionObserver" in window) {
    const expertStatsObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        startExpertCounters();
        expertStatsObserver.unobserve(entry.target);
      });
    }, {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.12
    });

    expertStatsObserver.observe(expertStats);
  } else {
    startExpertCounters();
  }
}

/* =========================================================
   ACTIVE NAV LINK
   ========================================================= */

const sections = Array.from(document.querySelectorAll("main section[id]"));
const navLinks = Array.from(document.querySelectorAll(".nav__links a"));

function updateActiveNav() {
  const offset = window.scrollY + 130;

  let currentId = sections[0]?.id;

  sections.forEach((section) => {
    if (section.offsetTop <= offset) {
      currentId = section.id;
    }
  });

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    link.classList.toggle("is-active", href === `#${currentId}`);
  });
}

updateActiveNav();
window.addEventListener("scroll", rafThrottle(updateActiveNav), { passive: true });
window.addEventListener("resize", rafThrottle(updateActiveNav), { passive: true });

/* =========================================================
   MAGNETIC BUTTONS
   ========================================================= */

const magneticButtons = document.querySelectorAll("[data-magnetic]");

magneticButtons.forEach((button) => {
  button.addEventListener("mousemove", (event) => {
    const rect = button.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * 100;
    const mouseY = ((event.clientY - rect.top) / rect.height) * 100;

    button.style.setProperty("--mx", `${mouseX}%`);
    button.style.setProperty("--my", `${mouseY}%`);

    if (prefersReduced) return;

    const deltaX = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
    const deltaY = (event.clientY - (rect.top + rect.height / 2)) / rect.height;

    button.style.transform = `translate3d(${deltaX * 5}px, ${deltaY * 5}px, 0)`;
  });

  button.addEventListener("mouseleave", () => {
    button.style.transform = "";
    button.style.setProperty("--mx", "20%");
    button.style.setProperty("--my", "20%");
  });
});

/* =========================================================
   TILT CARDS
   ========================================================= */

const tiltEls = document.querySelectorAll("[data-tilt]");

tiltEls.forEach((el) => {
  el.addEventListener("mousemove", (event) => {
    if (prefersReduced) return;

    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    const isImage = el.classList.contains("blobImage");
    const rotateX = (0.5 - y) * (isImage ? 4 : 5);
    const rotateY = (x - 0.5) * (isImage ? 6 : 7);
    const lift = isImage ? -3 : -2;

    el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${lift}px)`;
  });

  el.addEventListener("mouseleave", () => {
    el.style.transform = "";
  });
});

/* =========================================================
   HERO GOAL CARDS
   ========================================================= */

const goalCards = siteContent.hero?.goals || [];
const goalPrefix = siteContent.hero?.goalPrefix || "Cel";

const goalCard = document.querySelector("[data-goal-card]");
const goalFace = document.querySelector("[data-goal-face]");
const goalLabel = document.querySelector("[data-goal-label]");
const goalText = document.querySelector("[data-goal-text]");
const nextGoalLabel = document.querySelector("[data-next-goal-label]");
const nextGoalText = document.querySelector("[data-next-goal-text]");
let currentGoal = 0;
let isGoalAnimating = false;

function getGoalInfo(index) {
  const displayIndex = index + 1;
  const nextIndex = goalCards.length ? (index + 1) % goalCards.length : 0;
  const nextDisplayIndex = nextIndex + 1;

  return {
    displayIndex,
    nextIndex,
    nextDisplayIndex
  };
}

function updateGoalCard(index) {
  if (!goalCard || !goalLabel || !goalText || !nextGoalLabel || !nextGoalText) return;
  if (goalCards.length === 0) return;

  const { displayIndex, nextIndex, nextDisplayIndex } = getGoalInfo(index);

  goalLabel.textContent = `${goalPrefix} ${displayIndex}`;
  goalText.textContent = goalCards[index] || "";
  nextGoalLabel.textContent = `${goalPrefix} ${nextDisplayIndex}`;
  nextGoalText.textContent = goalCards[nextIndex] || "";
  goalCard.setAttribute("aria-label", `${siteContent.labels?.showNextGoal || "Pokaż kolejny cel"}. ${siteContent.labels?.currentGoal || "Aktualnie: cel"} ${displayIndex}`);
}

function updateFrontGoal(index) {
  if (!goalCard || !goalLabel || !goalText) return;
  if (goalCards.length === 0) return;

  const { displayIndex } = getGoalInfo(index);

  goalLabel.textContent = `${goalPrefix} ${displayIndex}`;
  goalText.textContent = goalCards[index] || "";
  goalCard.setAttribute("aria-label", `${siteContent.labels?.showNextGoal || "Pokaż kolejny cel"}. ${siteContent.labels?.currentGoal || "Aktualnie: cel"} ${displayIndex}`);
}

function updateNextGoal(index) {
  if (!nextGoalLabel || !nextGoalText) return;
  if (goalCards.length === 0) return;

  const { nextIndex, nextDisplayIndex } = getGoalInfo(index);

  nextGoalLabel.textContent = `${goalPrefix} ${nextDisplayIndex}`;
  nextGoalText.textContent = goalCards[nextIndex] || "";
}

goalCard?.addEventListener("click", () => {
  if (isGoalAnimating) return;
  if (goalCards.length === 0) return;

  if (prefersReduced) {
    currentGoal = (currentGoal + 1) % goalCards.length;
    updateGoalCard(currentGoal);
    return;
  }

  const advanceFrontGoal = () => {
    currentGoal = (currentGoal + 1) % goalCards.length;
    updateFrontGoal(currentGoal);
    updateNextGoal(currentGoal);
    goalCard.classList.add("is-handoff");
  };

  const finishGoalAnimation = () => {
    goalCard.classList.remove("is-cycling");
    goalCard.classList.remove("is-handoff");
    isGoalAnimating = false;
  };

  const isMobileGoalCard = window.matchMedia("(max-width: 680px)").matches;
  const handoffDelay = isMobileGoalCard ? 1115 : 915;
  const finishDelay = isMobileGoalCard ? 1160 : 950;

  isGoalAnimating = true;
  goalCard.classList.add("is-cycling");
  window.setTimeout(advanceFrontGoal, handoffDelay);
  window.setTimeout(finishGoalAnimation, finishDelay);
});

updateGoalCard(currentGoal);

/* =========================================================
   CONTACT FORM
   ========================================================= */

const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const targetEmail = contactForm.dataset.email || "kontakt@twojadomena.pl";
  const contactText = siteContent.contact || {};
  const fieldText = contactText.fields || {};
  const statusText = contactText.status || {};

  if (!name || !email || !message) {
    setFormStatus(statusText.missingFields || "");
    return;
  }

  const subjectPrefix = statusText.subjectPrefix || "";
  const subject = encodeURIComponent(`${subjectPrefix} — ${name}`);
  const body = encodeURIComponent(
    `${fieldText.name || "Name"}: ${name}\n${fieldText.email || "E-mail"}: ${email}\n\n${fieldText.message || "Message"}:\n${message}`
  );

  setFormStatus(statusText.openingEmail || "");
  window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;

  window.setTimeout(() => {
    setFormStatus(statusText.emailFallback || "");
  }, 1200);
});

function setFormStatus(text) {
  if (!formStatus) return;
  formStatus.textContent = text;
}

/* =========================================================
   HELPERS
   ========================================================= */

function rafThrottle(fn) {
  let ticking = false;

  return function throttled(...args) {
    if (ticking) return;

    ticking = true;

    requestAnimationFrame(() => {
      fn.apply(this, args);
      ticking = false;
    });
  };
}
