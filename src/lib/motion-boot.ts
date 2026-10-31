// Inline script (in <head>) that runs before the page paints. It only sets
// attributes on <html> (which has suppressHydrationWarning), never on page
// elements, so React's hydration never sees a difference:
//   <html data-motion>   motion allowed (not set for prefers-reduced-motion)
//   <html data-scrolled> page scrolled past the top (header turns solid)
//   <html data-intro>    intro splash playing (once per visit, not on
//                        landing pages, admin or preview)
//   <html data-intro-go> the page is ready: the intro's animations may run
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
        // The intro holds on its dark screen until the page has finished
        // loading and the logo is ready, so it never plays unseen behind a slow
        // load. MAX_WAIT stops a slow image or video from holding it for long.
        var started = false;
        var waiting = 2;
        var start = function () {
          if (started) return;
          if (!document.querySelector(".rm-intro")) {
            if (document.readyState === "complete") d.removeAttribute("data-intro");
            return;
          }
          started = true;
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              d.setAttribute("data-intro-go", "");
              setTimeout(function () {
                d.removeAttribute("data-intro");
                d.removeAttribute("data-intro-go");
              }, 3900);
            });
          });
        };
        var ready = function () {
          waiting--;
          if (waiting <= 0) start();
        };
        var logo = new Image();
        logo.onload = logo.onerror = ready;
        logo.src = "/brand/logo-intro-white.png";
        window.addEventListener("load", ready);
        window.addEventListener("DOMContentLoaded", function () {
          if (waiting <= 0) start();
        });
        setTimeout(function () {
          waiting = 0;
          start();
        }, 3000); // MAX_WAIT
      }
    } catch {}
  }

  var ticking = false;
  function setScrolled() {
    ticking = false;
    if (window.scrollY >= 8) d.setAttribute("data-scrolled", "");
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
