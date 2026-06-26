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
    return;
  }

  label.prepend(document.createTextNode(`${value}\n            `));
}

function setButtonText(selector, value, root = document) {
  const button = root.querySelector(selector);
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

function writeSignatureText(text, signatureText = document.querySelector(".signatureText")) {
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

function createExpertSlide(expert, index) {
  const slide = document.createElement("article");
  slide.className = "expertSlide";
  slide.setAttribute("aria-label", expert.name || `Ekspert ${index + 1}`);

  const profile = document.createElement("div");
  profile.className = "expertProfile";

  const photo = document.createElement("div");
  photo.className = expert.photo ? "expertPhoto" : "expertPhoto expertPhoto--placeholder";

  if (expert.photo) {
    const img = document.createElement("img");
    img.src = expert.photo;
    img.alt = expert.photoAlt || expert.name || "";
    img.loading = "lazy";
    photo.appendChild(img);
  } else {
    const initials = document.createElement("span");
    initials.className = "expertPhoto__initials";
    initials.textContent = (expert.name || "EX")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    photo.appendChild(initials);
  }

  const signature = document.createElement("span");
  signature.className = "expertSignature";
  signature.setAttribute("aria-label", `${siteContent.labels?.expertSignature || "Podpis"} ${expert.name || ""}`.trim());
  signature.setAttribute("aria-hidden", "true");
  signature.innerHTML = `
    <svg viewBox="0 0 520 150" role="img" focusable="false">
      <title></title>
      <text class="signatureText" x="10" y="96" textLength="500" lengthAdjust="spacingAndGlyphs"></text>
    </svg>
  `;
  setText("title", expert.signature || expert.name || "", signature);
  writeSignatureText(expert.signature || expert.name || "", signature.querySelector(".signatureText"));
  photo.appendChild(signature);

  const bio = document.createElement("div");
  bio.className = "expertBio";

  const name = document.createElement("h3");
  name.textContent = expert.name || "";
  bio.appendChild(name);

  (expert.bio || []).forEach((paragraphText) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = paragraphText;
    bio.appendChild(paragraph);
  });

  profile.appendChild(photo);
  profile.appendChild(bio);
  slide.appendChild(profile);

  const stats = document.createElement("div");
  stats.className = "expertStats";
  stats.setAttribute("aria-label", siteContent.labels?.expertStats || "");

  (expert.stats || []).forEach((item) => {
    const stat = document.createElement("article");
    const value = document.createElement("strong");
    const suffix = item.suffix || "";
    value.dataset.countTo = String(item.value || 0);
    value.dataset.countSuffix = suffix;
    value.textContent = `1${suffix}`;

    const label = document.createElement("span");
    label.textContent = item.label || "";

    stat.appendChild(value);
    stat.appendChild(label);
    stats.appendChild(stat);
  });

  slide.appendChild(stats);
  return slide;
}

function renderExperts(expertsContent) {
  const track = document.querySelector("[data-experts-track]");
  const dots = document.querySelector("[data-experts-dots]");
  if (!track || !Array.isArray(expertsContent?.items)) return;

  track.innerHTML = "";
  expertsContent.items.forEach((expert, index) => {
    track.appendChild(createExpertSlide(expert, index));
  });

  if (!dots) return;

  dots.innerHTML = "";
  expertsContent.items.forEach((expert, index) => {
    const dot = document.createElement("button");
    dot.className = "expertsDot";
    dot.type = "button";
    dot.dataset.expertDot = String(index);
    dot.setAttribute("aria-label", expert.name || `Ekspert ${index + 1}`);

    const fill = document.createElement("span");
    dot.appendChild(fill);
    dots.appendChild(dot);
  });
}

function renderSignals(signalsContent) {
  const list = document.querySelector("[data-signals-list]");
  if (!list || !Array.isArray(signalsContent?.items)) return;

  list.innerHTML = "";
  signalsContent.items.forEach((item, index) => {
    const signal = document.createElement("li");
    signal.className = "signalItem";
    signal.style.setProperty("--i", index);

    const number = document.createElement("span");
    number.textContent = String(index + 1);

    const text = document.createElement("p");
    text.textContent = item;

    signal.appendChild(number);
    signal.appendChild(text);
    list.appendChild(signal);
  });
}

function renderStories(storiesContent) {
  const grid = document.querySelector("[data-stories-grid]");
  const dots = document.querySelector("[data-stories-dots]");
  if (!grid || !Array.isArray(storiesContent?.items)) return;

  grid.innerHTML = "";
  if (dots) {
    dots.innerHTML = "";
  }

  storiesContent.items.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "storyCard reveal";
    card.dataset.storyCard = String(index);
    card.style.setProperty("--i", index);

    const avatar = document.createElement("div");
    avatar.className = "storyAvatar";
    avatar.setAttribute("aria-hidden", "true");

    if (item.photo) {
      const avatarImage = document.createElement("img");
      avatarImage.src = item.photo;
      avatarImage.alt = "";
      avatarImage.loading = "lazy";
      avatar.appendChild(avatarImage);
    } else {
      avatar.textContent = (item.name || "?").slice(0, 1);
    }

    const name = document.createElement("h3");
    name.textContent = item.name || "";

    const profile = document.createElement("blockquote");
    profile.textContent = item.profile || "";

    const text = document.createElement("p");
    text.textContent = item.text || "";

    const recommendation = document.createElement("p");
    recommendation.className = "storyCard__recommendation";
    const recommendationText = item.package || "";
    const packageName = recommendationText.split(" ").pop() || "";
    const prefix = packageName ? recommendationText.slice(0, -packageName.length) : recommendationText;
    recommendation.append(prefix);

    if (packageName) {
      const recommendationPackage = document.createElement("strong");
      recommendationPackage.textContent = packageName;
      recommendation.appendChild(recommendationPackage);
    }

    card.appendChild(avatar);
    card.appendChild(name);
    card.appendChild(profile);
    card.appendChild(text);
    card.appendChild(recommendation);
    grid.appendChild(card);

    if (dots) {
      const dot = document.createElement("button");
      dot.className = "expertsDot storyDot";
      dot.type = "button";
      dot.dataset.storyDot = String(index);
      dot.setAttribute("aria-label", item.name || `Historia ${index + 1}`);

      const fill = document.createElement("span");
      dot.appendChild(fill);
      dots.appendChild(dot);
    }
  });
}

function renderPackages(packagesContent) {
  const grid = document.querySelector("[data-packages-grid]");
  const dots = document.querySelector("[data-packages-dots]");
  if (!grid || !Array.isArray(packagesContent?.items)) return;

  grid.innerHTML = "";
  if (dots) {
    dots.innerHTML = "";
  }

  packagesContent.items.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "packagePath reveal";
    card.style.setProperty("--i", index);

    const meta = document.createElement("div");
    meta.className = "packagePath__meta";

    const step = document.createElement("span");
    step.textContent = item.step || String(index + 1).padStart(2, "0");

    const type = document.createElement("small");
    type.textContent = item.type || "";

    meta.appendChild(step);
    meta.appendChild(type);

    const name = document.createElement("h3");
    name.textContent = item.name || "";

    const tagline = document.createElement("p");
    tagline.className = "packagePath__tagline";
    tagline.textContent = item.tagline || "";

    const context = document.createElement("div");
    context.className = "packagePath__context";

    const contextLabel = document.createElement("span");
    contextLabel.textContent = item.contextLabel || "";

    const contextText = document.createElement("p");
    contextText.textContent = item.context || "";

    context.appendChild(contextLabel);
    context.appendChild(contextText);

    const featureList = document.createElement("ul");
    (item.focus || []).forEach((feature) => {
      const li = document.createElement("li");
      li.textContent = feature;
      featureList.appendChild(li);
    });

    const outcome = document.createElement("p");
    outcome.className = "packagePath__result";
    outcome.textContent = item.result || "";

    card.appendChild(meta);
    card.appendChild(name);
    card.appendChild(tagline);
    card.appendChild(context);
    card.appendChild(featureList);
    card.appendChild(outcome);
    grid.appendChild(card);

    if (dots) {
      const dot = document.createElement("button");
      dot.className = "expertsDot packageDot";
      dot.type = "button";
      dot.dataset.packageDot = String(index);
      dot.setAttribute("aria-label", item.name || `Pakiet ${index + 1}`);

      const fill = document.createElement("span");
      dot.appendChild(fill);
      dots.appendChild(dot);
    }
  });
}

function renderPackageActions(packagesContent) {
  const ctaItems = document.querySelectorAll("#pakiety .packagesCta__item");
  const consultItem = ctaItems[0];
  const quizItem = ctaItems[1];

  if (consultItem) {
    const text = consultItem.querySelector("p");

    if (text) {
      text.innerHTML = "";
      const lead = document.createElement("strong");
      lead.textContent = packagesContent?.ctaLead || "";
      text.appendChild(lead);
      text.append(` ${packagesContent?.ctaText || ""}`);
    }

    setButtonText(".btn", packagesContent?.cta, consultItem);
  }

  if (quizItem) {
    const text = quizItem.querySelector("p");

    if (text) {
      text.innerHTML = "";
      const lead = document.createElement("strong");
      lead.textContent = packagesContent?.quizLead || "";
      text.appendChild(lead);
      text.append(` ${packagesContent?.quizText || ""}`);
    }

    setButtonText("[data-open-quiz]", packagesContent?.quizCta, quizItem);
  }
}

function renderFormulaMobile(formulaContent) {
  const mobile = document.querySelector("[data-formula-mobile]");
  const track = document.querySelector("[data-formula-mobile-track]");
  const dots = document.querySelector("[data-formula-dots]");
  const slides = Array.isArray(formulaContent?.mobileSlides) ? formulaContent.mobileSlides.slice(0, 3) : [];
  if (!mobile || !track || !dots || slides.length === 0) return;

  setAttr("[data-formula-mobile]", "aria-label", formulaContent?.mobileLabel || "");
  track.innerHTML = "";
  dots.innerHTML = "";
  track.style.setProperty("--formula-slide-count", String(slides.length));

  const background = document.createElement("span");
  background.className = "formulaMobile__background";
  background.setAttribute("aria-hidden", "true");
  track.appendChild(background);

  slides.forEach((slide, index) => {
    const article = document.createElement("article");
    article.className = "formulaMobileSlide";
    article.dataset.formulaSlide = String(index);
    article.style.setProperty("--slide-index", index);

    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow eyebrow--light";
    eyebrow.textContent = slide.eyebrow || "";
    article.appendChild(eyebrow);

    const title = document.createElement("h3");
    title.textContent = slide.title || "";
    article.appendChild(title);

    if (slide.text) {
      const text = document.createElement("p");
      text.className = "formulaMobileSlide__text";
      text.textContent = slide.text;
      article.appendChild(text);
    }

    if (slide.strong) {
      const strong = document.createElement("strong");
      strong.textContent = slide.strong;
      article.appendChild(strong);
    }

    if (Array.isArray(slide.points)) {
      const list = document.createElement("ul");
      slide.points.forEach((point) => {
        const item = document.createElement("li");
        item.textContent = point;
        list.appendChild(item);
      });
      article.appendChild(list);
    }

    track.appendChild(article);

    const dot = document.createElement("button");
    dot.className = "expertsDot formulaDot";
    dot.type = "button";
    dot.dataset.formulaDot = String(index);
    dot.setAttribute("aria-label", `${formulaContent?.mobileLabel || "Slajd"} ${index + 1}`);

    const fill = document.createElement("span");
    dot.appendChild(fill);
    dots.appendChild(dot);
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
  setAttr(".brand__logo", "alt", content.labels?.home);
  setAttr(".heroLogo", "aria-label", content.labels?.home);
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

  setText("#sygnaly .eyebrow", content.signals?.eyebrow);
  setText("#sygnaly h2", content.signals?.title);
  setText("#sygnaly .signalsKicker", content.signals?.kicker);
  renderSignals(content.signals);

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

  setText("#historie .sectionHead .eyebrow", content.stories?.eyebrow);
  setText("#historie .sectionHead h2", content.stories?.title);
  setText("#historie .sectionHead > p:not(.eyebrow)", content.stories?.lead);
  renderStories(content.stories);
  const storiesCtaText = document.querySelector("#historie .storiesCta p");
  if (storiesCtaText) {
    storiesCtaText.innerHTML = "";
    const ctaLead = document.createElement("strong");
    ctaLead.textContent = content.stories?.ctaLead || "";
    storiesCtaText.appendChild(ctaLead);
    storiesCtaText.append(` ${content.stories?.ctaText || ""}`);
  }
  setButtonText("#historie .storiesCta .btn", content.stories?.ctaButton);

  setText("#pakiety .sectionHead .eyebrow", content.packages?.eyebrow);
  setText("#pakiety .sectionHead h2", content.packages?.title);
  setText("#pakiety .sectionHead > p:not(.eyebrow)", content.packages?.lead);
  renderPackages(content.packages);
  renderPackageActions(content.packages);
  setText(".nav__cta", content.nav?.cta);

  setText("#formula .eyebrow", content.formula?.eyebrow);
  setText("#formula h2", content.formula?.title);
  setText("#formula .formula__lead", content.formula?.lead);
  setText("#formula .formula__text", content.formula?.text);
  setText("#formula .formula__punchline", content.formula?.punchline);
  setText("#formula .formulaRadioCard > span", content.formula?.teamLabel);
  setAttr("#formula .formula__image", "alt", content.formula?.imageAlt);
  setList("#formula [data-formula-points]", content.formula?.points);
  renderFormulaMobile(content.formula);

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
  setAttr(".expertsCarousel", "aria-label", content.experts?.title);
  renderExperts(content.experts);

  setText("#kontakt .eyebrow", content.contact?.eyebrow);
  setText("#kontakt h2", content.contact?.title);
  setText("#kontakt .contact__copy > p:not(.eyebrow)", content.contact?.lead);

  const contactCards = document.querySelectorAll(".contactCard");
  const emailCard = contactCards[0];
  const phoneCard = contactCards[1];
  const linkedinCard = contactCards[2];

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

  if (linkedinCard) {
    linkedinCard.href = content.contact?.linkedinHref || linkedinCard.href;
    setText("span", content.contact?.linkedinLabel, linkedinCard);
    setText("strong", content.contact?.linkedinText, linkedinCard);
  }

  setText(".contact__actions [data-open-modal='faq']", content.contact?.faqButton);

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
  setText(".contactConsent span", content.contact?.fields?.consent);
  setButtonText(".contactForm .btn--primary", content.contact?.submit);

  const footerYear = document.getElementById("year");
  const footerParagraph = document.querySelector(".footer p");

  if (footerParagraph && footerYear) {
    footerParagraph.innerHTML = `© <span id="year">${footerYear.textContent}</span> ${content.footer?.name || ""}. ${content.footer?.rights || ""}`;
  }

  setText(".footer a", content.footer?.backToTop);
  const footerModalButtons = document.querySelectorAll(".footer__links button");
  if (footerModalButtons[0] && content.footer?.faq) {
    footerModalButtons[0].textContent = content.footer.faq;
  }
  if (footerModalButtons[1] && content.footer?.privacy) {
    footerModalButtons[1].textContent = content.footer.privacy;
  }
}

applySiteContent();

/* =========================================================
   SITE MODALS
   ========================================================= */

function initSiteModals(modalContent) {
  const modal = document.querySelector("[data-site-modal]");
  const panel = modal?.querySelector(".siteModal__panel");
  const content = modal?.querySelector("[data-modal-content]");
  const closeButtons = modal?.querySelectorAll("[data-modal-close]");
  const openButtons = document.querySelectorAll("[data-open-modal]");

  if (!modal || !panel || !content) return;

  let activeType = null;

  function textEl(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text || "";
    return element;
  }

  function renderHeader(data) {
    const header = document.createElement("header");
    header.className = "siteModal__header";
    header.appendChild(textEl("p", "eyebrow", data?.eyebrow));
    const title = textEl("h2", "", data?.title);
    title.id = "siteModalTitle";
    header.appendChild(title);
    if (data?.lead) {
      header.appendChild(textEl("p", "siteModal__lead", data.lead));
    }
    return header;
  }

  function renderCooperation(data) {
    const fragment = document.createDocumentFragment();
    fragment.appendChild(renderHeader(data));

    const note = document.createElement("div");
    note.className = "siteModal__note";
    note.innerHTML = `<span aria-hidden="true">●</span><p>${data?.secureNote || ""}</p>`;
    fragment.appendChild(note);

    const form = document.createElement("form");
    form.className = "modalForm";
    form.dataset.cooperationForm = "";
    form.noValidate = true;

    const fields = data?.fields || {};
    form.innerHTML = `
      <label>
        <span>${fields.name || "Imię i nazwisko"}</span>
        <input type="text" name="name" placeholder="${fields.namePlaceholder || ""}" required>
      </label>
      <label>
        <span>${fields.email || "Adres e-mail"}</span>
        <input type="email" name="email" placeholder="${fields.emailPlaceholder || ""}" required>
      </label>
      <label>
        <span>${fields.phone || "Telefon"}</span>
        <input type="tel" name="phone" placeholder="${fields.phonePlaceholder || ""}">
      </label>
      <label class="modalForm__wide">
        <span>${fields.message || "Wiadomość"}</span>
        <textarea name="message" rows="6" placeholder="${fields.messagePlaceholder || ""}" required></textarea>
      </label>
      <input class="formHoneypot" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <label class="modalConsent modalForm__wide">
        <input type="checkbox" name="consent" required>
        <span>${data?.consent || ""}</span>
      </label>
      <button class="btn btn--primary btn--wide modalForm__wide" type="submit" data-cooperation-submit disabled>
        ${data?.submit || "Wyślij"}
        <span class="btn__shine" aria-hidden="true"></span>
      </button>
      <p class="formStatus modalForm__wide" role="status" aria-live="polite"></p>
    `;

    const consentInput = form.querySelector('input[name="consent"]');
    const submitButton = form.querySelector("[data-cooperation-submit]");
    const syncSubmitState = () => {
      if (!submitButton) return;
      submitButton.disabled = !consentInput?.checked;
    };

    consentInput?.addEventListener("change", syncSubmitState);
    syncSubmitState();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const status = form.querySelector(".formStatus");
      const name = String(formData.get("name") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const phone = String(formData.get("phone") || "").trim();
      const message = String(formData.get("message") || "").trim();
      const consent = formData.get("consent");
      const website = String(formData.get("website") || "").trim();

      if (!name || !email || !message || !consent) {
        if (status) status.textContent = data?.status?.missingFields || "";
        return;
      }

      const sent = await sendSiteForm({
        type: "cooperation",
        payload: { name, email, phone, message, consent: Boolean(consent), website },
        statusElement: status,
        statusText: data?.status || {},
        submitButton
      });

      if (sent) {
        form.reset();
        syncSubmitState();
      }
    });

    fragment.appendChild(form);
    return fragment;
  }

  function renderFaq(data) {
    const fragment = document.createDocumentFragment();
    fragment.appendChild(renderHeader(data));

    const list = document.createElement("div");
    list.className = "modalFaq";
    (data?.items || []).forEach((item) => {
      const article = document.createElement("article");
      article.className = "modalFaq__item";
      article.appendChild(textEl("h3", "", item.question));
      article.appendChild(textEl("p", "", item.answer));
      list.appendChild(article);
    });
    fragment.appendChild(list);

    const cta = document.createElement("div");
    cta.className = "modalCta";
    const text = document.createElement("p");
    const lead = document.createElement("strong");
    lead.textContent = data?.ctaLead || "";
    text.appendChild(lead);
    text.append(` ${data?.ctaText || ""}`);
    cta.appendChild(text);
    cta.appendChild(textEl("span", "", data?.microcopy));
    const link = document.createElement("a");
    link.className = "btn btn--primary";
    link.href = "#kontakt";
    link.textContent = data?.ctaText || "Umów konsultację";
    link.addEventListener("click", closeModal);
    cta.appendChild(link);
    fragment.appendChild(cta);

    return fragment;
  }

  function renderPrivacy(data) {
    const fragment = document.createDocumentFragment();
    fragment.appendChild(renderHeader(data));

    const list = document.createElement("div");
    list.className = "modalPrivacy";
    (data?.sections || []).forEach((section) => {
      const article = document.createElement("article");
      article.className = "modalPrivacy__section";
      article.appendChild(textEl("h3", "", section.title));
      article.appendChild(textEl("p", "", section.text));
      list.appendChild(article);
    });
    fragment.appendChild(list);

    return fragment;
  }

  function renderModal(type) {
    const data = modalContent?.[type];
    if (!data) return false;

    content.innerHTML = "";
    if (type === "cooperation") {
      content.appendChild(renderCooperation(data));
    } else if (type === "faq") {
      content.appendChild(renderFaq(data));
    } else if (type === "privacy") {
      content.appendChild(renderPrivacy(data));
    }

    return true;
  }

  function openModal(type) {
    if (!renderModal(type)) return;
    activeType = type;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    panel.scrollTop = 0;
    requestAnimationFrame(() => modal.querySelector("[data-modal-close]")?.focus({ preventScroll: true }));
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    activeType = null;
  }

  closeButtons?.forEach((button) => {
    button.setAttribute("aria-label", modalContent?.closeLabel || "Zamknij okno");
    button.addEventListener("click", closeModal);
  });

  openButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const type = button.getAttribute("data-open-modal");
      if (typeof setDrawer === "function") setDrawer(false);
      openModal(type);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeType) {
      closeModal();
    }
  });
}

initSiteModals(siteContent.modals);

/* =========================================================
   PACKAGE QUIZ
   ========================================================= */

function initPackageQuiz(quizContent) {
  const widget = document.querySelector("[data-quiz-widget]");
  const toggle = document.querySelector("[data-quiz-toggle]");
  const panel = document.querySelector("[data-quiz-panel]");
  const close = document.querySelector("[data-quiz-close]");
  const messages = document.querySelector("[data-quiz-messages]");
  const footer = document.querySelector("[data-quiz-footer]");
  const openButtons = Array.from(document.querySelectorAll("[data-open-quiz]"));
  const questions = Array.isArray(quizContent?.questions) ? quizContent.questions : [];

  if (!widget || !toggle || !panel || !messages || !footer || questions.length === 0) return;

  const personas = ["magda", "aleksandra", "marek", "krzysztof"];
  const pairResults = quizContent?.pairResults || {};

  let started = false;
  let completed = false;
  let currentQuestion = 0;
  let scores = {};
  let timers = [];
  let panelResizeTimer = null;
  let panelResizeFrame = null;
  let panelLockedHeight = 0;

  function clearTimers() {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers = [];
  }

  function schedule(callback, delay) {
    const timer = window.setTimeout(callback, prefersReduced ? 0 : delay);
    timers.push(timer);
    return timer;
  }

  function scrollMessages() {
    messages.scrollTop = messages.scrollHeight;
  }

  function scrollMessagesToEnd() {
    scrollMessages();
    requestAnimationFrame(() => {
      scrollMessages();
      requestAnimationFrame(scrollMessages);
    });
  }

  function getPanelMaxHeight() {
    const maxHeight = window.getComputedStyle(panel).maxHeight;
    const parsed = Number.parseFloat(maxHeight);
    return Number.isFinite(parsed) ? parsed : window.innerHeight;
  }

  function easePanelResize(progress) {
    return 1 - Math.pow(1 - progress, 3);
  }

  function finishPanelResize() {
    if (panelResizeTimer) {
      window.clearTimeout(panelResizeTimer);
      panelResizeTimer = null;
    }

    if (panelResizeFrame) {
      cancelAnimationFrame(panelResizeFrame);
      panelResizeFrame = null;
    }

    panel.style.height = "";
    panel.style.maxHeight = "";
    panel.style.minHeight = panelLockedHeight ? `${panelLockedHeight}px` : "";
    panel.classList.remove("is-resizing");
    scrollMessagesToEnd();
  }

  function withPanelResize(callback) {
    if (prefersReduced) {
      callback();
      return;
    }

    if (panelResizeTimer) {
      window.clearTimeout(panelResizeTimer);
      panelResizeTimer = null;
    }

    if (panelResizeFrame) {
      cancelAnimationFrame(panelResizeFrame);
      panelResizeFrame = null;
    }

    const maxHeight = getPanelMaxHeight();
    const startHeight = Math.min(Math.max(panel.getBoundingClientRect().height, panelLockedHeight), maxHeight);
    panel.style.height = `${startHeight}px`;
    panel.style.maxHeight = `${maxHeight}px`;
    panel.classList.add("is-resizing");
    void panel.offsetHeight;

    callback();

    panelResizeFrame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panel.style.maxHeight = "none";
        const measuredHeight = Math.min(panel.scrollHeight, maxHeight);
        const endHeight = Math.max(startHeight, measuredHeight, panelLockedHeight);
        panelLockedHeight = endHeight;
        panel.style.maxHeight = `${maxHeight}px`;
        const duration = 920;
        const delta = endHeight - startHeight;
        const startedAt = performance.now();

        if (delta < 1) {
          panel.style.height = `${endHeight}px`;
          panelResizeTimer = window.setTimeout(finishPanelResize, 0);
          return;
        }

        const animateResize = (timestamp) => {
          const progress = Math.min((timestamp - startedAt) / duration, 1);
          const eased = easePanelResize(progress);
          panel.style.height = `${startHeight + delta * eased}px`;

          if (progress < 1) {
            panelResizeFrame = requestAnimationFrame(animateResize);
            return;
          }

          panel.style.height = `${endHeight}px`;
          panelResizeTimer = window.setTimeout(finishPanelResize, 0);
        };

        panelResizeFrame = requestAnimationFrame(animateResize);
      });
    });
  }

  function openQuiz(shouldStart = true) {
    widget.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");

    if (shouldStart && !started) {
      startQuiz();
    }
  }

  function closeQuiz() {
    widget.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    panel.style.minHeight = "";
    panelLockedHeight = 0;
  }

  function createMessage(text, type = "bot") {
    const bubble = document.createElement("div");
    bubble.className = `quizMessage quizMessage--${type}`;
    bubble.textContent = text;
    return bubble;
  }

  function addMessage(text, type = "bot") {
    const bubble = createMessage(text, type);
    withPanelResize(() => {
      messages.appendChild(bubble);
    });
    scrollMessages();
    return bubble;
  }

  function addTyping(callback) {
    if (prefersReduced) {
      callback();
      return;
    }

    const typing = document.createElement("div");
    typing.className = "quizMessage quizMessage--bot quizTyping";
    typing.setAttribute("aria-label", quizContent?.typingLabel || "Piszę...");
    typing.innerHTML = "<span></span><span></span><span></span>";
    withPanelResize(() => {
      messages.appendChild(typing);
    });
    scrollMessages();

    schedule(() => {
      withPanelResize(() => {
        typing.remove();
        callback();
      });
    }, 900);
  }

  function addBotMessage(text, delay = 620, after) {
    schedule(() => {
      addTyping(() => {
        messages.appendChild(createMessage(text));
        scrollMessages();
        if (after) schedule(after, 180);
      });
    }, delay);
  }

  function setFooterDefault() {
    footer.innerHTML = "";

    if (!completed) return;

    const restart = document.createElement("button");
    restart.className = "btn btn--secondary";
    restart.type = "button";
    restart.textContent = quizContent?.restartLabel || "Zacznij od nowa";
    restart.addEventListener("click", startQuiz);
    footer.appendChild(restart);

    if (completed) {
      const cta = document.createElement("a");
      cta.className = "btn btn--primary";
      cta.href = "#kontakt";
      cta.textContent = quizContent?.cta || "Umów konsultację";
      cta.addEventListener("click", closeQuiz);
      footer.appendChild(cta);
    }

    scrollMessagesToEnd();
  }

  function addAnswers(question) {
    const group = document.createElement("div");
    group.className = "quizAnswers";

    question.answers.forEach((answer, index) => {
      const button = document.createElement("button");
      button.className = "quizAnswer";
      button.type = "button";
      button.textContent = answer.text || "";
      button.style.setProperty("--quiz-answer-delay", `${index * 110}ms`);
      if ((answer.text || "").length > 42) {
        button.classList.add("quizAnswer--wide");
      }
      button.addEventListener("click", () => {
        withPanelResize(() => {
          group.remove();
          messages.appendChild(createMessage(answer.text || "", "user"));
          scrollMessages();
        });

        schedule(() => {
          scores[answer.persona] = (scores[answer.persona] || 0) + Number(answer.points || 0);
          currentQuestion += 1;

          if (currentQuestion >= questions.length) {
            showResult();
          } else {
            askQuestion();
          }
        }, 120);
      });
      group.appendChild(button);
    });

    withPanelResize(() => {
      messages.appendChild(group);
    });
  }

  function askQuestion() {
    const question = questions[currentQuestion];
    if (!question) return;

    const progress = `${quizContent?.progressLabel || "Pytanie"} ${currentQuestion + 1}/${questions.length}`;
    addBotMessage(`${progress}: ${question.text}`, 620, () => addAnswers(question));
  }

  function getRecommendation() {
    const ranked = personas
      .map((persona) => ({ persona, score: scores[persona] || 0 }))
      .sort((a, b) => b.score - a.score);
    const top = ranked[0];
    const second = ranked[1];

    if (!top || top.score === 0) return quizContent?.results?.dispersed;

    if (top.score - second.score >= 4) {
      return quizContent?.results?.[top.persona] || quizContent?.results?.dispersed;
    }

    const closePersonas = ranked.filter((item) => item.score > 0 && top.score - item.score <= 3);

    if (closePersonas.length === 2) {
      const key = closePersonas.map((item) => item.persona).sort().join("+");
      return {
        ...(quizContent?.results?.mixed || {}),
        ...(pairResults[key] || {})
      };
    }

    return quizContent?.results?.dispersed || quizContent?.results?.mixed;
  }

  function addResultMessage(result) {
    const bubble = document.createElement("article");
    bubble.className = "quizMessage quizMessage--bot quizMessage--result";

    const title = document.createElement("h3");
    title.textContent = result?.title || "";

    const packageLabel = document.createElement("span");
    packageLabel.className = "quizResultPackage";
    packageLabel.append(quizContent?.resultPackagePrefix || "");
    const packageName = document.createElement("strong");
    packageName.textContent = result?.package || "";
    packageLabel.appendChild(packageName);

    const text = document.createElement("p");
    text.textContent = result?.text || "";

    const note = document.createElement("em");
    note.textContent = result?.note || result?.label || "";

    bubble.appendChild(title);
    bubble.appendChild(packageLabel);
    bubble.appendChild(text);
    bubble.appendChild(note);
    messages.appendChild(bubble);
    scrollMessagesToEnd();
  }

  function showResult() {
    completed = true;
    addBotMessage(quizContent?.calculatingMessage || "", 700, () => {
      addTyping(() => {
        addResultMessage(getRecommendation());
        setFooterDefault();
      });
    });
  }

  function startQuiz() {
    clearTimers();
    started = true;
    completed = false;
    currentQuestion = 0;
    scores = personas.reduce((acc, persona) => {
      acc[persona] = 0;
      return acc;
    }, {});
    messages.innerHTML = "";
    footer.innerHTML = "";
    panel.style.minHeight = "";
    panelLockedHeight = 0;

    const intro = Array.isArray(quizContent?.intro) ? quizContent.intro : [];
    addMessage(intro[0] || "Pomogę Ci dobrać właściwy pakiet.");
    addBotMessage(intro[1] || "Odpowiedz na kilka pytań.", 780, askQuestion);
    setFooterDefault();
  }

  setText("[data-quiz-title]", quizContent?.title || "");
  setText("[data-quiz-eyebrow]", quizContent?.eyebrow || "");
  setText(".quizFab__text", quizContent?.fabLabel || "");
  setAttr("[data-quiz-panel]", "aria-label", quizContent?.panelLabel || "");
  setAttr("[data-quiz-close]", "aria-label", quizContent?.closeLabel || "");

  toggle.addEventListener("click", () => {
    if (widget.classList.contains("is-open")) {
      closeQuiz();
      return;
    }

    openQuiz(true);
  });

  close?.addEventListener("click", closeQuiz);
  openButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      if (typeof setDrawer === "function") setDrawer(false);
      openQuiz(true);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && widget.classList.contains("is-open")) {
      closeQuiz();
    }
  });
}

initPackageQuiz(siteContent.quiz);

const quizWidget = document.querySelector("[data-quiz-widget]");
const pageFooter = document.querySelector(".footer");

function updateQuizWidgetOffset() {
  if (!quizWidget || !pageFooter) return;

  const baseOffset = window.matchMedia("(max-width: 680px)").matches ? 12 : 22;
  const footerGap = 8;
  const footerTop = pageFooter.getBoundingClientRect().top;
  const overlap = Math.max(0, window.innerHeight - footerTop + footerGap);

  quizWidget.style.setProperty("--quiz-bottom-offset", `${baseOffset + overlap}px`);
}

updateQuizWidgetOffset();
window.addEventListener("scroll", rafThrottle(updateQuizWidgetOffset), { passive: true });
window.addEventListener("resize", rafThrottle(updateQuizWidgetOffset), { passive: true });

/* =========================================================
   MOBILE STORY CARDS
   ========================================================= */

const storiesGrid = document.querySelector("[data-stories-grid]");
const storyDots = Array.from(document.querySelectorAll("[data-story-dot]"));
const mobileStories = window.matchMedia("(max-width: 680px)");
let activeStorySlide = 0;
let storyScrollTimer = null;

function getStoryCards() {
  return Array.from(storiesGrid?.querySelectorAll("[data-story-card]") || []);
}

function getStorySlidePositions(cards = getStoryCards()) {
  if (!storiesGrid) return [];

  return cards.map((card) => card.offsetLeft - storiesGrid.offsetLeft);
}

function setActiveStorySlide(index) {
  const cards = getStoryCards();
  if (cards.length === 0) return;

  activeStorySlide = Math.max(0, Math.min(index, cards.length - 1));
  storyDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === activeStorySlide);
  });
}

function scrollToStorySlide(index) {
  if (!storiesGrid || !mobileStories.matches) return;

  const cards = getStoryCards();
  const positions = getStorySlidePositions(cards);
  if (positions.length === 0) return;

  const nextIndex = Math.max(0, Math.min(index, positions.length - 1));
  storiesGrid.scrollTo({
    left: positions[nextIndex],
    behavior: "smooth"
  });
  setActiveStorySlide(nextIndex);
}

function syncActiveStoryFromScroll() {
  if (!storiesGrid || !mobileStories.matches) return;

  const positions = getStorySlidePositions();
  if (positions.length === 0) return;

  const nearestIndex = positions.reduce((nearest, position, index) => {
    const distance = Math.abs(position - storiesGrid.scrollLeft);
    return distance < nearest.distance ? { index, distance } : nearest;
  }, { index: 0, distance: Infinity }).index;

  setActiveStorySlide(nearestIndex);
}

storiesGrid?.addEventListener("click", (event) => {
  if (!mobileStories.matches) return;
  if (!(event.target instanceof Element)) return;

  const card = event.target.closest("[data-story-card]");
  if (!card || !storiesGrid.contains(card)) return;

  const cards = Array.from(storiesGrid.querySelectorAll("[data-story-card]"));
  const cardIndex = cards.indexOf(card);
  if (cardIndex < 0) return;

  const cardRect = card.getBoundingClientRect();
  const gridRect = storiesGrid.getBoundingClientRect();
  syncActiveStoryFromScroll();

  if (cardIndex > activeStorySlide) {
    scrollToStorySlide(activeStorySlide + 1);
  } else if (cardIndex < activeStorySlide || cardRect.left < gridRect.left + 8) {
    scrollToStorySlide(activeStorySlide - 1);
  }
});

storyDots.forEach((dot, index) => {
  dot.addEventListener("click", () => scrollToStorySlide(index));
});

storiesGrid?.addEventListener("scroll", () => {
  if (storyScrollTimer) {
    window.clearTimeout(storyScrollTimer);
  }

  storyScrollTimer = window.setTimeout(syncActiveStoryFromScroll, 90);
}, { passive: true });

setActiveStorySlide(0);

const packagesGrid = document.querySelector("[data-packages-grid]");
const packageDots = Array.from(document.querySelectorAll("[data-package-dot]"));
const mobilePackages = window.matchMedia("(max-width: 680px)");
let activePackageSlide = 0;
let packageScrollTimer = null;

function getPackageCards() {
  return Array.from(packagesGrid?.querySelectorAll(".packagePath") || []);
}

function getPackageSlidePositions(cards = getPackageCards()) {
  const firstOffset = cards[0]?.offsetLeft || 0;
  return cards.map((item) => item.offsetLeft - firstOffset);
}

function setActivePackageSlide(index) {
  if (packageDots.length === 0) return;

  activePackageSlide = Math.max(0, Math.min(index, packageDots.length - 1));
  packageDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === activePackageSlide);
  });
}

function scrollToPackageSlide(index) {
  if (!packagesGrid) return;

  const cards = getPackageCards();
  const positions = getPackageSlidePositions(cards);
  const nextIndex = Math.max(0, Math.min(index, positions.length - 1));

  packagesGrid.scrollTo({
    left: positions[nextIndex] || 0,
    behavior: "smooth"
  });
  setActivePackageSlide(nextIndex);
}

function syncActivePackageFromScroll() {
  if (!packagesGrid || packageDots.length === 0) return;

  const positions = getPackageSlidePositions();
  const nearestIndex = positions.reduce((nearestIndex, position, index) => {
    const nearestDistance = Math.abs(positions[nearestIndex] - packagesGrid.scrollLeft);
    const distance = Math.abs(position - packagesGrid.scrollLeft);
    return distance < nearestDistance ? index : nearestIndex;
  }, 0);

  setActivePackageSlide(nearestIndex);
}

packagesGrid?.addEventListener("click", (event) => {
  if (!mobilePackages.matches) return;
  if (!(event.target instanceof Element)) return;

  const card = event.target.closest(".packagePath");
  if (!card || !packagesGrid.contains(card)) return;

  const cards = Array.from(packagesGrid.querySelectorAll(".packagePath"));
  const cardIndex = cards.indexOf(card);
  if (cardIndex < 0) return;

  const cardRect = card.getBoundingClientRect();
  const gridRect = packagesGrid.getBoundingClientRect();
  const positions = getPackageSlidePositions(cards);
  const currentIndex = positions.reduce((nearestIndex, position, index) => {
    const nearestDistance = Math.abs(positions[nearestIndex] - packagesGrid.scrollLeft);
    const distance = Math.abs(position - packagesGrid.scrollLeft);
    return distance < nearestDistance ? index : nearestIndex;
  }, 0);

  if (cardIndex > currentIndex) {
    scrollToPackageSlide(currentIndex + 1);
  } else if (cardIndex < currentIndex || cardRect.left < gridRect.left + 8) {
    scrollToPackageSlide(currentIndex - 1);
  }
});

packagesGrid?.addEventListener("scroll", () => {
  if (!mobilePackages.matches) return;
  if (packageScrollTimer) {
    window.clearTimeout(packageScrollTimer);
  }

  packageScrollTimer = window.setTimeout(syncActivePackageFromScroll, 100);
}, { passive: true });

packageDots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    scrollToPackageSlide(index);
  });
});

if (packageDots.length > 0) {
  setActivePackageSlide(0);
}

/* =========================================================
   MOBILE FORMULA SLIDES
   ========================================================= */

const formulaTrack = document.querySelector("[data-formula-mobile-track]");
const formulaDots = Array.from(document.querySelectorAll("[data-formula-dot]"));
const mobileFormula = window.matchMedia("(max-width: 680px)");
let activeFormulaSlide = 0;
let formulaScrollTimer = null;

function getFormulaSlides() {
  return Array.from(formulaTrack?.querySelectorAll("[data-formula-slide]") || []);
}

function getFormulaSlidePositions(slides = getFormulaSlides()) {
  const firstOffset = slides[0]?.offsetLeft || 0;
  return slides.map((slide) => slide.offsetLeft - firstOffset);
}

function setActiveFormulaSlide(index) {
  if (formulaDots.length === 0) return;

  activeFormulaSlide = Math.max(0, Math.min(index, formulaDots.length - 1));
  formulaDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === activeFormulaSlide);
  });
}

function scrollToFormulaSlide(index) {
  if (!formulaTrack || !mobileFormula.matches) return;

  const positions = getFormulaSlidePositions();
  if (positions.length === 0) return;

  const nextIndex = Math.max(0, Math.min(index, positions.length - 1));
  formulaTrack.scrollTo({
    left: positions[nextIndex],
    behavior: "smooth"
  });
  setActiveFormulaSlide(nextIndex);
}

function syncActiveFormulaFromScroll() {
  if (!formulaTrack || !mobileFormula.matches || formulaDots.length === 0) return;

  const positions = getFormulaSlidePositions();
  if (positions.length === 0) return;

  const nearestIndex = positions.reduce((nearestIndex, position, index) => {
    const nearestDistance = Math.abs(positions[nearestIndex] - formulaTrack.scrollLeft);
    const distance = Math.abs(position - formulaTrack.scrollLeft);
    return distance < nearestDistance ? index : nearestIndex;
  }, 0);

  setActiveFormulaSlide(nearestIndex);
}

formulaTrack?.addEventListener("scroll", () => {
  if (!mobileFormula.matches) return;
  if (formulaScrollTimer) {
    window.clearTimeout(formulaScrollTimer);
  }

  formulaScrollTimer = window.setTimeout(syncActiveFormulaFromScroll, 90);
}, { passive: true });

formulaDots.forEach((dot, index) => {
  dot.addEventListener("click", () => scrollToFormulaSlide(index));
});

if (formulaDots.length > 0) {
  setActiveFormulaSlide(0);
}

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

const processSteps = Array.from(document.querySelectorAll("[data-process-step]"));
const mobileProcessSteps = window.matchMedia("(max-width: 980px)");

if (processSteps.length > 0) {
  if (!prefersReduced && "IntersectionObserver" in window) {
    const processObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const requiredRatio = mobileProcessSteps.matches ? 0.42 : 0.28;
        if (!entry.isIntersecting || entry.intersectionRatio < requiredRatio) return;

        entry.target.classList.add("is-process-step-visible");
        processObserver.unobserve(entry.target);
      });
    }, {
      rootMargin: mobileProcessSteps.matches ? "0px 0px -8% 0px" : "0px 0px -6% 0px",
      threshold: [0.25, 0.42, 0.5, 0.72, 0.9]
    });

    processSteps.forEach((step) => processObserver.observe(step));
  } else {
    processSteps.forEach((step) => step.classList.add("is-process-step-visible"));
  }
}

/* =========================================================
   EXPERT SECTION ANIMATION
   ========================================================= */

const expertsSection = document.getElementById("eksperci");
const expertSlides = Array.from(document.querySelectorAll(".expertSlide"));
const expertStatsCards = Array.from(document.querySelectorAll(".expertStats"));
const animatedExpertStats = new WeakSet();

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

function startExpertCounters(statsCard) {
  if (!statsCard || animatedExpertStats.has(statsCard)) return;

  animatedExpertStats.add(statsCard);
  statsCard.querySelectorAll("[data-count-to]").forEach((counter) => {
    animateExpertCounter(counter);
  });
}

function startExpertSignature(slide) {
  if (!slide || slide.classList.contains("is-signature-animated")) return;
  slide.classList.add("is-signature-animated");
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
    expertSlides.forEach(startExpertSignature);
    expertStatsCards.forEach(startExpertCounters);
  }
}

if (expertSlides.length > 0) {
  if (!prefersReduced && "IntersectionObserver" in window) {
    const expertSlideObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        startExpertSignature(entry.target);
        expertSlideObserver.unobserve(entry.target);
      });
    }, {
      threshold: 0.36
    });

    expertSlides.forEach((slide) => expertSlideObserver.observe(slide));
  } else {
    expertSlides.forEach(startExpertSignature);
  }
}

if (expertStatsCards.length > 0) {
  if (!prefersReduced && "IntersectionObserver" in window) {
    const expertStatsObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        startExpertCounters(entry.target);
        expertStatsObserver.unobserve(entry.target);
      });
    }, {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.12
    });

    expertStatsCards.forEach((statsCard) => expertStatsObserver.observe(statsCard));
  } else {
    expertStatsCards.forEach(startExpertCounters);
  }
}

const expertsTrack = document.querySelector("[data-experts-track]");
const expertDots = Array.from(document.querySelectorAll("[data-expert-dot]"));
let activeExpertSlide = 0;
let expertCarouselVisible = false;
let expertScrollTimer = null;
let expertProgrammaticScroll = false;

function setActiveExpertSlide(index, resetProgress = true) {
  if (!expertsTrack || expertSlides.length === 0) return;

  activeExpertSlide = (index + expertSlides.length) % expertSlides.length;
  expertDots.forEach((dot, dotIndex) => {
    const isActive = dotIndex === activeExpertSlide;
    dot.classList.toggle("is-active", isActive);

    if (isActive && resetProgress) {
      dot.classList.remove("is-loading");
      void dot.offsetWidth;
      dot.classList.add("is-loading");
    } else if (!isActive) {
      dot.classList.remove("is-loading");
    }
  });
}

function scrollToExpertSlide(index) {
  if (!expertsTrack || expertSlides.length === 0) return;

  const nextIndex = (index + expertSlides.length) % expertSlides.length;
  expertProgrammaticScroll = true;
  expertsTrack.scrollTo({
    left: expertSlides[nextIndex].offsetLeft - expertsTrack.offsetLeft,
    behavior: "smooth"
  });
  setActiveExpertSlide(nextIndex);
  window.setTimeout(() => {
    expertProgrammaticScroll = false;
  }, 560);
}

function syncActiveExpertFromScroll() {
  if (!expertsTrack || expertSlides.length === 0) return;

  const trackLeft = expertsTrack.scrollLeft;
  const nearestIndex = expertSlides.reduce((nearest, slide, index) => {
    const distance = Math.abs(slide.offsetLeft - expertsTrack.offsetLeft - trackLeft);
    return distance < nearest.distance ? { index, distance } : nearest;
  }, { index: 0, distance: Infinity }).index;

  if (nearestIndex !== activeExpertSlide) {
    setActiveExpertSlide(nearestIndex);
  }
}

if (expertDots.length > 0) {
  expertDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      scrollToExpertSlide(index);
    });

    dot.addEventListener("animationend", () => {
      if (!dot.classList.contains("is-active") || !expertCarouselVisible || prefersReduced) return;
      scrollToExpertSlide(activeExpertSlide + 1);
    });
  });

  setActiveExpertSlide(0, false);
}

expertsTrack?.addEventListener("scroll", () => {
  if (expertScrollTimer) {
    window.clearTimeout(expertScrollTimer);
  }

  expertScrollTimer = window.setTimeout(syncActiveExpertFromScroll, 120);
}, { passive: true });

if (expertsSection && expertDots.length > 0) {
  if (!prefersReduced && "IntersectionObserver" in window) {
    const expertCarouselObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        expertCarouselVisible = entry.isIntersecting;

        if (entry.isIntersecting) {
          setActiveExpertSlide(activeExpertSlide);
        } else {
          expertDots.forEach((dot) => dot.classList.remove("is-loading"));
        }
      });
    }, {
      threshold: 0.28
    });

    expertCarouselObserver.observe(expertsSection);
  } else {
    expertCarouselVisible = true;
    setActiveExpertSlide(0, false);
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
    const isActionLink = link.hasAttribute("data-open-quiz") || link.hasAttribute("data-open-modal");
    link.classList.toggle("is-active", !isActionLink && href === `#${currentId}`);
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
const goalTitle = siteContent.hero?.goalTitle || "";
const goalPrefix = siteContent.hero?.goalPrefix || "Cel";

const goalCard = document.querySelector("[data-goal-card]");
const goalStackTitle = document.querySelector("[data-goal-title]");
const goalFace = document.querySelector("[data-goal-face]");
const goalLabel = document.querySelector("[data-goal-label]");
const goalText = document.querySelector("[data-goal-text]");
const nextGoalLabel = document.querySelector("[data-next-goal-label]");
const nextGoalText = document.querySelector("[data-next-goal-text]");
let currentGoal = 0;
let isGoalAnimating = false;
let hasGoalAdvanced = false;
let goalAnimationTimers = [];

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

function getGoalLabel(displayIndex) {
  return String(displayIndex);
}

function updateGoalCard(index) {
  if (!goalCard || !goalLabel || !goalText || !nextGoalLabel || !nextGoalText) return;
  if (goalCards.length === 0) return;

  const { displayIndex, nextIndex, nextDisplayIndex } = getGoalInfo(index);

  if (goalStackTitle) {
    goalStackTitle.textContent = goalTitle;
  }
  goalLabel.textContent = getGoalLabel(displayIndex);
  goalText.textContent = goalCards[index] || "";
  nextGoalLabel.textContent = getGoalLabel(nextDisplayIndex);
  nextGoalText.textContent = goalCards[nextIndex] || "";
  goalCard.setAttribute("aria-label", `${siteContent.labels?.showNextGoal || "Pokaż kolejny cel"}. ${siteContent.labels?.currentGoal || "Aktualnie: cel"} ${displayIndex}`);
}

function updateFrontGoal(index) {
  if (!goalCard || !goalLabel || !goalText) return;
  if (goalCards.length === 0) return;

  const { displayIndex } = getGoalInfo(index);

  goalLabel.textContent = getGoalLabel(displayIndex);
  goalText.textContent = goalCards[index] || "";
  goalCard.setAttribute("aria-label", `${siteContent.labels?.showNextGoal || "Pokaż kolejny cel"}. ${siteContent.labels?.currentGoal || "Aktualnie: cel"} ${displayIndex}`);
}

function updateNextGoal(index) {
  if (!nextGoalLabel || !nextGoalText) return;
  if (goalCards.length === 0) return;

  const { nextIndex, nextDisplayIndex } = getGoalInfo(index);

  nextGoalLabel.textContent = getGoalLabel(nextDisplayIndex);
  nextGoalText.textContent = goalCards[nextIndex] || "";
}

function clearGoalAnimationTimers() {
  goalAnimationTimers.forEach((timer) => window.clearTimeout(timer));
  goalAnimationTimers = [];
}

function advanceGoalCard() {
  currentGoal = (currentGoal + 1) % goalCards.length;
  updateFrontGoal(currentGoal);
  updateNextGoal(currentGoal);
  hasGoalAdvanced = true;
  goalCard.classList.add("is-handoff");
}

function completeGoalAnimation() {
  if (!goalCard || goalCards.length === 0) return;

  clearGoalAnimationTimers();

  if (isGoalAnimating && !hasGoalAdvanced) {
    advanceGoalCard();
  }

  goalCard.classList.remove("is-cycling");
  goalCard.classList.remove("is-handoff");
  isGoalAnimating = false;
  hasGoalAdvanced = false;
}

function runGoalAnimation() {
  if (!goalCard || goalCards.length === 0) return;

  const isMobileGoalCard = window.matchMedia("(max-width: 680px)").matches;
  const handoffDelay = isMobileGoalCard ? 1115 : 915;
  const finishDelay = isMobileGoalCard ? 1160 : 950;

  clearGoalAnimationTimers();
  isGoalAnimating = true;
  goalCard.classList.remove("is-cycling");
  goalCard.classList.remove("is-handoff");
  void goalCard.offsetWidth;
  goalCard.classList.add("is-cycling");
  hasGoalAdvanced = false;
  goalAnimationTimers = [
    window.setTimeout(advanceGoalCard, handoffDelay),
    window.setTimeout(completeGoalAnimation, finishDelay)
  ];
}

function playNextGoal() {
  if (goalCards.length === 0) return;

  if (prefersReduced) {
    currentGoal = (currentGoal + 1) % goalCards.length;
    updateGoalCard(currentGoal);
    return;
  }

  if (isGoalAnimating) {
    completeGoalAnimation();
  }

  runGoalAnimation();
}

goalCard?.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;

  event.preventDefault();
  playNextGoal();
});

goalCard?.addEventListener("click", (event) => {
  event.preventDefault();

  if (event.detail === 0) {
    playNextGoal();
  }
});

updateGoalCard(currentGoal);

/* =========================================================
   CONTACT FORM
   ========================================================= */

const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");
const contactConsentInput = contactForm?.querySelector('input[name="privacyConsent"]');
const contactSubmitButton = contactForm?.querySelector("[data-contact-submit]");
const FORM_ENDPOINT = "send-form.php";

function syncContactSubmitState() {
  if (!contactSubmitButton) return;
  contactSubmitButton.disabled = !contactConsentInput?.checked;
}

contactConsentInput?.addEventListener("change", syncContactSubmitState);
syncContactSubmitState();

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const privacyConsent = formData.get("privacyConsent");
  const website = String(formData.get("website") || "").trim();
  const contactText = siteContent.contact || {};
  const statusText = contactText.status || {};

  if (!name || !email || !message || !privacyConsent) {
    setFormStatus(statusText.missingFields || "");
    return;
  }

  const sent = await sendSiteForm({
    type: "contact",
    payload: { name, email, message, consent: Boolean(privacyConsent), website },
    statusElement: formStatus,
    statusText,
    submitButton: contactSubmitButton
  });

  if (sent) {
    contactForm.reset();
    syncContactSubmitState();
  }
});

function setFormStatus(text) {
  if (!formStatus) return;
  formStatus.textContent = text;
}

async function sendSiteForm({ type, payload, statusElement, statusText = {}, submitButton }) {
  const setStatus = (text) => {
    if (statusElement) statusElement.textContent = text;
  };

  if (window.location.protocol === "file:") {
    setStatus(statusText.localOnly || "");
    return false;
  }

  const previousDisabled = submitButton?.disabled;

  try {
    if (submitButton) submitButton.disabled = true;
    setStatus(statusText.sending || "");

    const response = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ type, ...payload })
    });

    let result = null;
    try {
      result = await response.json();
    } catch {
      result = null;
    }

    if (!response.ok || !result?.ok) {
      throw new Error(result?.message || "Form submission failed");
    }

    setStatus(statusText.success || "");
    return true;
  } catch {
    setStatus(statusText.error || "");
    return false;
  } finally {
    if (submitButton) submitButton.disabled = Boolean(previousDisabled);
    syncContactSubmitState();
  }
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
