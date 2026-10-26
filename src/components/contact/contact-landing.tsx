"use client";

import { useEffect } from "react";

// Book a Call links point to /contact#enquiry. Arriving on the Contact page
// from another page through one of them, the page opens at the top (title
// first, header as on any page top) instead of jumping to the form: the
// #enquiry is dropped from the address and the page goes back to the top
// once the router's own jump to the anchor has happened. On the Contact
// page itself, Book a Call still scrolls to the form.
export function ContactLanding() {
  useEffect(() => {
    if (window.location.hash !== "#enquiry") return;
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    const top = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      // The router's jump to #enquiry (scrollIntoView) can also scroll a
      // clipped box around the form; put that back too.
      const box = document.querySelector<HTMLElement>(".rm-contact");
      if (box) box.scrollTop = 0;
    };
    top();
    const frame = requestAnimationFrame(top);
    return () => cancelAnimationFrame(frame);
  }, []);
  return null;
}
