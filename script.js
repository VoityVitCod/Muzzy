const root = document.documentElement;
const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll(".nav a")];
const revealItems = [...document.querySelectorAll(".reveal")];
const parallaxScenes = [...document.querySelectorAll(".js-parallax-scene")];
const tiltCards = [...document.querySelectorAll(".tilt-card")];
const autoGalleries = [...document.querySelectorAll("[data-autoscroll]")];
const logicSection = document.querySelector("#logic");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setScrollProgress() {
  const scrollTop = window.scrollY;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
  root.style.setProperty("--scroll-progress", `${progress}%`);
}

function setLogicProgress() {
  if (!logicSection) return;

  const rect = logicSection.getBoundingClientRect();
  const travel = window.innerHeight * 0.7;
  const raw = ((travel - rect.top) / (rect.height + travel)) * 100;
  const progress = clamp(raw, 0, 100);
  root.style.setProperty("--logic-progress", `${progress}%`);
}

function updateActiveNav(id) {
  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
  });
}

function initRevealObserver() {
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      obs.unobserve(entry.target);
    });
  }, {
    threshold: 0.18,
    rootMargin: "0px 0px -80px 0px"
  });

  revealItems.forEach((item) => observer.observe(item));
}

function initSectionObserver() {
  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      updateActiveNav(entry.target.id);
    });
  }, {
    threshold: 0.55
  });

  sections.forEach((section) => observer.observe(section));
}

function initParallax() {
  if (prefersReducedMotion || isCoarsePointer) return;

  parallaxScenes.forEach((scene) => {
    const layers = [...scene.querySelectorAll("[data-depth]")];

    scene.addEventListener("pointermove", (event) => {
      const rect = scene.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      layers.forEach((layer) => {
        const depth = Number(layer.dataset.depth || 0);
        const translateX = x * depth * 42;
        const translateY = y * depth * 42;
        layer.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
      });
    });

    scene.addEventListener("pointerleave", () => {
      layers.forEach((layer) => {
        layer.style.transform = "";
      });
    });
  });
}

function initTiltCards() {
  if (prefersReducedMotion || isCoarsePointer) return;

  tiltCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * 10;
      const rotateX = (0.5 - y) * 8;

      card.classList.add("is-hovered");
      card.style.setProperty("--tilt-x", `${rotateX}deg`);
      card.style.setProperty("--tilt-y", `${rotateY}deg`);
      card.style.setProperty("--tilt-scale", "1.012");
    });

    card.addEventListener("pointerleave", () => {
      card.classList.remove("is-hovered");
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
      card.style.setProperty("--tilt-scale", "1");
    });
  });
}

function initCursorGlow() {
  if (prefersReducedMotion || isCoarsePointer) return;

  window.addEventListener("pointermove", (event) => {
    root.style.setProperty("--cursor-x", `${event.clientX}px`);
    root.style.setProperty("--cursor-y", `${event.clientY}px`);
  });
}

function initAutoGalleries() {
  if (prefersReducedMotion) return;

  autoGalleries.forEach((gallery, index) => {
    let paused = false;
    let lastTime = performance.now();
    const speed = 16 + index * 3;

    gallery.addEventListener("pointerenter", () => {
      paused = true;
    });

    gallery.addEventListener("pointerleave", () => {
      paused = false;
      lastTime = performance.now();
    });

    gallery.addEventListener("focusin", () => {
      paused = true;
    });

    gallery.addEventListener("focusout", () => {
      paused = false;
      lastTime = performance.now();
    });

    function tick(now) {
      const delta = now - lastTime;
      lastTime = now;

      if (!paused && gallery.scrollWidth > gallery.clientWidth + 2) {
        gallery.scrollLeft += (delta / 1000) * speed;

        if (gallery.scrollLeft >= gallery.scrollWidth - gallery.clientWidth - 2) {
          gallery.scrollLeft = 0;
        }
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}

function handleScroll() {
  setScrollProgress();
  setLogicProgress();
}

initRevealObserver();
initSectionObserver();
initParallax();
initTiltCards();
initCursorGlow();
initAutoGalleries();
handleScroll();

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("resize", handleScroll);
