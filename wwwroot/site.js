(() => {
  "use strict";
  document.documentElement.classList.add("js");

  const themeButton = document.querySelector(".theme-toggle");
  function applyTheme(theme, save = false) {
    const selected = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = selected;
    document.querySelector('meta[name="theme-color"]').content = selected === "dark" ? "#101321" : "#f4f0ed";
    const label = selected === "dark" ? "Switch to light mode" : "Switch to dark mode";
    themeButton.setAttribute("aria-label", label);
    themeButton.title = label;
    if (save) {
      try { localStorage.setItem("portfolio-theme", selected); } catch { /* The toggle still works for this visit. */ }
    }
  }
  themeButton.hidden = false;
  applyTheme(document.documentElement.dataset.theme);
  themeButton.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true);
  });
  window.addEventListener("storage", (event) => {
    if (event.key === "portfolio-theme" || event.key === null) applyTheme(event.newValue);
  });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const routes = new Set(["/", "/index.html", "/work.html", "/about.html", "/contact.html", "/transcriptive-ai.html", "/contact-search.html", "/simple-english.html", "/object-oriented-game.html"]);
  let revealObserver;
  let controller;
  let navigationId = 0;
  let transition;
  let fallbackAnimation;
  let menuOpen = false;
  const menu = document.querySelector("#primary-navigation");
  const toggle = document.querySelector(".menu-toggle");

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  history.replaceState({ ...history.state, portfolio: true, scrollY: window.scrollY }, "", location.href);

  function setMenu(open, returnFocus = false) {
    menuOpen = open;
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    if (returnFocus) toggle.focus();
  }
  toggle.addEventListener("click", () => setMenu(!menuOpen));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuOpen) setMenu(false, true);
  });
  document.addEventListener("click", (event) => {
    if (menuOpen && !event.target.closest(".header-inner")) setMenu(false);
  });
  window.matchMedia("(min-width: 601px)").addEventListener("change", () => setMenu(false));

  function initPage() {
    window.PortfolioSky?.mount();
    revealObserver?.disconnect();
    const reveals = document.querySelectorAll(".reveal");
    if (!reducedMotion.matches && "IntersectionObserver" in window) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.06, rootMargin: "0px 0px -25px 0px" });
      reveals.forEach((element) => {
        // Content already in view stays visible even if the observer is delayed.
        if (element.getBoundingClientRect().top > window.innerHeight * .96) {
          element.classList.add("will-reveal");
          revealObserver.observe(element);
        }
      });
    }
    document.querySelectorAll("[data-year]").forEach((element) => {
      element.textContent = String(new Date().getFullYear());
    });


    const copyButton = document.querySelector(".copy-email");
    if (copyButton && navigator.clipboard?.writeText && window.isSecureContext) {
      copyButton.hidden = false;
      copyButton.addEventListener("click", async () => {
        const status = document.querySelector(".copy-status");
        try {
          await navigator.clipboard.writeText("khunchristopherkhun@gmail.com");
          status.textContent = "Email address copied. Ready to paste.";
        } catch {
          status.textContent = "Copy isn’t available here. Select the address above, or use Write an email.";
        }
      });
    }
  }

  reducedMotion.addEventListener("change", () => {
    revealObserver?.disconnect();
    document.querySelectorAll(".will-reveal").forEach((element) => element.classList.add("is-visible"));
    if (reducedMotion.matches) {
      document.getAnimations().forEach((animation) => { try { animation.finish(); } catch { animation.cancel(); } });
      transition?.skipTransition?.();
      fallbackAnimation?.finish();
    }
  });

  function updateMetadata(next) {
    document.title = next.title;
    ["meta[name='description']", "link[rel='canonical']", "meta[property='og:title']", "meta[property='og:description']", "meta[property='og:url']"].forEach((selector) => {
      const current = document.querySelector(selector);
      const replacement = next.querySelector(selector);
      if (current && replacement) current.replaceWith(document.importNode(replacement, true));
    });
  }

  function restoreScroll(url, scrollY) {
    let target;
    try { target = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch { /* Invalid fragments are ignored. */ }
    if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
    else window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
  }

  async function navigate(url, { pop = false, scrollY = 0 } = {}) {
    const id = ++navigationId;
    clearTimeout(scrollTimer);
    if (!pop) {
      history.replaceState({ ...history.state, portfolio: true, scrollY: window.scrollY }, "", location.href);
    }
    document.documentElement.classList.add("is-navigating");
    controller?.abort();
    transition?.skipTransition?.();
    fallbackAnimation?.cancel();
    controller = new AbortController();
    const signal = controller.signal;
    const main = document.querySelector("main");
    main.setAttribute("aria-busy", "true");
    try {
      const response = await fetch(url.pathname + url.search, { signal, headers: { "X-Requested-With": "PortfolioNavigation" } });
      if (!response.ok) throw new Error("Page unavailable");
      const html = await response.text();
      if (id !== navigationId) return;
      const next = new DOMParser().parseFromString(html, "text/html");
      const nextMain = next.querySelector("main");
      const nextNav = next.querySelector("#primary-navigation");
      if (!nextMain || !nextNav) throw new Error("Invalid page");
      // Complete the previous snapshot before starting another transition.
      if (transition) await transition.finished.catch(() => {});
      if (id !== navigationId) return;

      const swap = () => {
        if (id !== navigationId) return;
        if (!pop) {
          history.pushState({ portfolio: true, scrollY: 0 }, "", url.href);
        }
        document.querySelector("main").replaceWith(document.importNode(nextMain, true));
        menu.replaceChildren(...[...nextNav.childNodes].map((node) => document.importNode(node, true)));
        document.body.dataset.page = next.body.dataset.page;
        updateMetadata(next);
        setMenu(false);
        document.querySelector("main").dataset.navigated = "true";
        document.querySelector("main").focus({ preventScroll: true });
        restoreScroll(url, scrollY);
        initPage();
        document.querySelector("#navigation-status").textContent = document.title;
      };

      document.documentElement.classList.add("is-navigating");
      if (reducedMotion.matches) {
        swap();
      } else if (document.startViewTransition) {
        transition = document.startViewTransition(swap);
        await transition.finished;
        if (id === navigationId && pop) restoreScroll(url, scrollY);
      } else if (main.animate) {
        fallbackAnimation = main.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateX(-20px) scale(.99)" }], { duration: 220, easing: "ease", fill: "forwards" });
        await fallbackAnimation.finished;
        if (id !== navigationId) return;
        swap();
        fallbackAnimation = document.querySelector("main").animate([{ opacity: 0, transform: "translateX(30px) scale(.985)" }, { opacity: 1, transform: "none" }], { duration: 560, easing: "cubic-bezier(.22,1,.36,1)" });
        await fallbackAnimation.finished;
      } else {
        swap();
      }
    } catch (error) {
      if (id === navigationId && error.name !== "AbortError") {
        // Standard navigation keeps every page usable when enhancement fails.
        window.location.assign(url.href);
      }
    } finally {
      if (id === navigationId) {
        document.querySelector("main")?.removeAttribute("aria-busy");
        document.documentElement.classList.remove("is-navigating");
        transition = undefined;
        fallbackAnimation = undefined;
      }
    }
  }

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest("a[href]");
    if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !routes.has(url.pathname)) return;
    if (url.pathname === location.pathname && url.search === location.search) {
      if (!url.hash) {
        event.preventDefault();
        setMenu(false);
        window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "instant" : "smooth" });
      }
      return;
    }
    event.preventDefault();
    navigate(url);
  });

  window.addEventListener("popstate", (event) => {
    navigate(new URL(location.href), { pop: true, scrollY: event.state?.scrollY || 0 });
  });

  // Preserve the latest scroll offset for browser Back and Forward navigation.
  let scrollTimer;
  window.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      if (!document.documentElement.classList.contains("is-navigating")) {
        history.replaceState({ ...history.state, portfolio: true, scrollY: window.scrollY }, "", location.href);
      }
    }, 120);
  }, { passive: true });

  initPage();
})();
