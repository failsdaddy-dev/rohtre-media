// Inline script (in <head>) that runs before the page paints. It only sets
// attributes on <html> (which has suppressHydrationWarning), never on page
// elements, so React's hydration never sees a difference:
//   <html data-motion>   motion allowed (not set for prefers-reduced-motion)
//   <html data-scrolled> page scrolled past the top (header turns solid)
//   <html data-intro>    intro splash playing (once per visit, not on
//                        landing pages, admin or preview)
// Scroll reveals and filled lines start after hydration, in
// src/components/motion.tsx. Styles: src/app/design.css.
// Written in plain ES5-style code on purpose: it runs before anything else.
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

  var ticking = false;
  function setScrolled() {
    ticking = false;
    if (window.scrollY > 24) d.setAttribute("data-scrolled", "");
    else d.removeAttribute("data-scrolled");
  }
  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(setScrolled);
    },
    { passive: true },
  );
  setScrolled();
};

export const MOTION_BOOT_SCRIPT = `(${source.toString()})();`;
