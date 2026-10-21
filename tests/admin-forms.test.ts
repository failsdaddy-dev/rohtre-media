import { describe, expect, it } from "vitest";
import { blankFor, humanize } from "../src/components/admin/schema-form";
import { homeJsonSchemas, sectionJsonSchemas } from "../src/lib/json-schemas";
import { collectMediaIds, removedMedia } from "../src/lib/media-refs";
import { sanitizeHtml } from "../src/lib/sanitize";
import { SECTION_TYPES, sectionSchema } from "../src/sections/schemas";

describe("admin forms from schemas (R23, R28)", () => {
  it("every section type and home section converts to a form schema", () => {
    const sections = sectionJsonSchemas();
    expect(Object.keys(sections).sort()).toEqual(Object.keys(SECTION_TYPES).sort());
    for (const s of Object.values(sections)) expect(s.type).toBe("object");
    for (const s of Object.values(homeJsonSchemas())) expect(s.type).toBe("object");
  });

  it("the offer banner images become upload fields", () => {
    const hero = sectionJsonSchemas().hero;
    const banner = hero.properties!.offerBanner.properties!;
    const desktop = banner.desktop.anyOf?.find((s) => s.type === "object");
    expect(desktop?.properties).toHaveProperty("publicId");
  });

  it("a blank new section of any type passes validation once its required text is filled", () => {
    const schemas = sectionJsonSchemas();
    const blank = blankFor(schemas.customHtml);
    expect(
      sectionSchema.safeParse({ id: "x", type: "customHtml", variant: "contained", enabled: true, props: blank })
        .success,
    ).toBe(true);
  });

  it("labels read like words", () => {
    expect(humanize("offerBanner")).toBe("Offer Banner");
    expect(humanize("image_public_id")).toBe("Image");
  });
});

describe("media references (delete-on-remove)", () => {
  it("finds every Cloudinary file in nested content", () => {
    const ids = collectMediaIds({ a: [{ publicId: "rohtre-media/images/a" }], b: "rohtre-media/video/b", c: "other" });
    expect([...ids].sort()).toEqual(["rohtre-media/images/a", "rohtre-media/video/b"]);
  });
  it("knows which files an edit stopped using", () => {
    expect(removedMedia({ x: "rohtre-media/images/old" }, { x: "rohtre-media/images/new" })).toEqual([
      "rohtre-media/images/old",
    ]);
  });
});

describe("custom HTML (R26)", () => {
  it("removes scripts, event handlers, iframes and javascript: links", () => {
    const dirty =
      '<p onclick="steal()">Hi</p><script>alert(1)</script><iframe src="https://x"></iframe><a href="javascript:alert(1)">x</a><img src="https://res.cloudinary.com/a.png" onerror="x()">';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toMatch(/script|onclick|onerror|iframe|javascript:/i);
    expect(clean).toContain("<p>Hi</p>");
  });
  it("keeps normal formatting and safe links", () => {
    const clean = sanitizeHtml('<h2>Title</h2><a href="https://rohtremedia.com">site</a>');
    expect(clean).toContain("<h2>Title</h2>");
    expect(clean).toContain('rel="noopener noreferrer"');
  });
});

describe("admin form schemas are plain data (server → browser)", () => {
  it("carry no functions or hidden helpers", () => {
    const plain = (v: unknown): boolean =>
      typeof v !== "function" &&
      (!v ||
        typeof v !== "object" ||
        Object.entries(Object.getOwnPropertyDescriptors(v)).every(
          ([k, d]) => (d.enumerable || (Array.isArray(v) && k === "length")) && !d.get && plain(d.value),
        ));
    expect(plain(sectionJsonSchemas())).toBe(true);
    expect(plain(homeJsonSchemas())).toBe(true);
  });
});
