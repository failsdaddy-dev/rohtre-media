import type { Hints } from "@/components/admin/schema-form";

// Field labels shared by the Work page, brand and Recognition editors.

/** Labels for an image copied from the live site (shared with the brand form and Recognition). */
export const PIC_HINTS: Hints = {
  media: {
    label: "Upload (replaces the image copied from the live site)",
    help: "JPG, PNG or WebP up to 10 MB. Alt text is required: it describes the image for screen readers.",
  },
  src: {
    label: "Image copied from the live site",
    help: "Shown while nothing is uploaded above. Clear it to show no image.",
  },
  w: { hidden: true },
  h: { hidden: true },
};

/** Labels for the red-strip numbers (work page and brands). */
export const STAT_HINTS: Hints = {
  prefix: { label: "Before the number", help: "e.g. + or + $" },
  value: { label: "Number", help: "Digits only (200, 1.5). It counts up from 0 on the page." },
  suffix: { label: "After the number", help: "e.g. %, K, M" },
  label: { label: "Label" },
  text: { label: "Line under it" },
};
