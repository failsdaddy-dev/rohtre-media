import { z } from "zod";
import type { JsonSchema } from "../components/admin/schema-form";
import { homeSchema } from "../content/home-schema";
import { SECTION_TYPES, type SectionType } from "../sections/schemas";

// JSON Schemas for the admin's generic forms, made from the same Zod schemas
// the site validates with (one source of truth). "input" mode describes what
// an editor may type (defaults allowed to be missing).

// The JSON round trip drops the hidden "~standard" helper (with functions) that
// Zod attaches to the result: React can only send plain data to the browser.
const toJson = (schema: z.ZodType) =>
  JSON.parse(JSON.stringify(z.toJSONSchema(schema, { io: "input", unrepresentable: "any" }))) as JsonSchema;

export function sectionJsonSchemas(): Record<SectionType, JsonSchema> {
  return Object.fromEntries(Object.entries(SECTION_TYPES).map(([type, def]) => [type, toJson(def.schema)])) as Record<
    SectionType,
    JsonSchema
  >;
}

export function homeJsonSchemas(): Record<string, JsonSchema> {
  return Object.fromEntries(Object.entries(homeSchema.shape).map(([key, s]) => [key, toJson(s)]));
}

export { toJson };
