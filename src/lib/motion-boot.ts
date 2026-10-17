// Inline script (in <head>) that drives the site's motion without waiting for
// React. It only sets data attributes, which React never overwrites:
//   <html data-motion>   motion allowed (not set for prefers-reduced-motion)
//   <html data-scrolled> page scrolled past the top (header turns solid)
//   <html data-intro>    intro splash playing (once per visit, not on
//                        landing pages, admin or preview)
//   [data-reveal] gets data-in when it enters the viewport (fade-up)
//   .rm-fill-line gets its fill progress from its position on screen
// New elements after client-side navigation are picked up automatically.
// Styles: src/app/design.css. Written in plain ES5-style code on purpose: it
// runs before anything else on every page.
/* eslint-disable no-var */

const source = function () {
  var d = document.documentElement;
  var reduce = false;
  try {
    reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {}
  if (!reduce) {
    d.setAttribute("data-motion", "");
    try {
      var noIntro = /^\/(lp|admin|login|no-access|preview)(\/|$)/.test(location.pathname);
      if (!noIntro && !sessionStorage.getItem("rm-intro")) {
        sessionStorage.setItem("rm-intro", "1");
        d.setAttribute("data-intro", "");
        setTimeout(function () {
          d.removeAttribute("data-intro");
        }, 3300);
      }
    } catch {}
  }

  var lines: HTMLElement[] = [];
  function setScrolled() {
    if (window.scrollY > 24) d.setAttribute("data-scrolled", "");
    else d.removeAttribute("data-scrolled");
  }
  function fill() {
    var h = window.innerHeight;
    for (var i = 0; i < lines.length; i++) {
      var r = lines[i].getBoundingClientRect();
      var p = (h * 0.88 - r.top) / (h * 0.42);
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      lines[i].style.backgroundPositionX = 100 - p * 100 + "%";
    }
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      setScrolled();
      fill();
    });
  }

  var io =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          function (entries) {
            entries.forEach(function (e) {
              if (e.isIntersecting) {
                e.target.setAttribute("data-in", "");
                io!.unobserve(e.target);
              }
            });
          },
          { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
        )
      : null;

  var scanQueued = false;
  function scan() {
    scanQueued = false;
    document.querySelectorAll("[data-reveal]:not([data-in]):not([data-watched])").forEach(function (el) {
      el.setAttribute("data-watched", "");
      if (io) io.observe(el);
      else el.setAttribute("data-in", "");
    });
    lines = Array.prototype.slice.call(document.querySelectorAll(".rm-fill-line"));
    fill();
  }
  function queueScan() {
    if (scanQueued) return;
    scanQueued = true;
    requestAnimationFrame(scan);
  }
  function init() {
    scan();
    setScrolled();
    new MutationObserver(queueScan).observe(document.body, { childList: true, subtree: true });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
};

/** Minified at build by Next; kept readable here. */
export const MOTION_BOOT_SCRIPT = `(${source.toString()})();`;
