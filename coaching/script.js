/* Created by Patryk Piwowarczyk */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    const rotateX = (0.5 - y) * 5;
    const rotateY = (x - 0.5) * 7;

    el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
  });

  el.addEventListener("mouseleave", () => {
    el.style.transform = "";
  });
});

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

  if (!name || !email || !message) {
    setFormStatus("Uzupełnij wszystkie pola formularza.");
    return;
  }

  const subject = encodeURIComponent(`Rozmowa coachingowa — ${name}`);
  const body = encodeURIComponent(
    `Imię: ${name}\nE-mail: ${email}\n\nWiadomość:\n${message}`
  );

  setFormStatus("Otwieram klienta pocztowego...");
  window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;

  window.setTimeout(() => {
    setFormStatus("Jeśli klient pocztowy się nie otworzył, napisz bezpośrednio na adres e-mail podany obok.");
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
