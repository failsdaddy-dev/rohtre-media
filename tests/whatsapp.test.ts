import { describe, expect, it } from "vitest";
import { fillTemplate, whatsappLink } from "../src/lib/whatsapp";

describe("WhatsApp links (R9)", () => {
  it("uses wa.me with digits only and an encoded message", () => {
    expect(whatsappLink("+91 96957-47475", "Hi & hello? 100%")).toBe(
      "https://wa.me/919695747475?text=Hi%20%26%20hello%3F%20100%25",
    );
  });

  it("fills the page variables", () => {
    expect(fillTemplate("Hi, I want {service} for my {niche} brand", { service: "Meta ads", niche: "fashion" })).toBe(
      "Hi, I want Meta ads for my fashion brand",
    );
  });

  it("drops missing and unknown variables without leaving gaps", () => {
    expect(fillTemplate("Hi, I'm on your {page} page {foo}.", {})).toBe("Hi, I'm on your page.");
  });
});
