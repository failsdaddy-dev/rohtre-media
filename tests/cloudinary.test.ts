import { describe, expect, it } from "vitest";
import { isOurPublicId, isUploadKind } from "../src/lib/cloudinary/kinds";
import { apiSignature, stringToSign } from "../src/lib/cloudinary/sign";
import { cloudinaryUrl } from "../src/lib/cloudinary/url";

// Worked examples from Cloudinary's docs (API secret "abcd").
// verified: https://cloudinary.com/documentation/authentication_signatures
describe("Cloudinary signatures", () => {
  it("timestamp only", async () => {
    expect(await apiSignature({ timestamp: 1315060510 }, "abcd")).toBe("a21ad0f63beb4de2e5575204b79ab90bffb02c10");
  });

  it("sorts params and leaves out file, api_key, resource_type", async () => {
    const params = {
      timestamp: 1315060510,
      public_id: "sample_image",
      eager: "w_400,h_300,c_pad|w_260,h_200,c_crop",
      api_key: "1234",
      resource_type: "video",
      file: "x",
    };
    expect(stringToSign(params)).toBe(
      "eager=w_400,h_300,c_pad|w_260,h_200,c_crop&public_id=sample_image&timestamp=1315060510",
    );
    expect(await apiSignature(params, "abcd")).toBe("bfd09f95f331f558cbd1320e67aa8d488770583e");
  });
});

describe("upload rules", () => {
  it("accepts only known kinds", () => {
    expect(isUploadKind("image")).toBe(true);
    expect(isUploadKind("video")).toBe(true);
    expect(isUploadKind("raw")).toBe(false);
    expect(isUploadKind(undefined)).toBe(false);
  });

  it("only our own folder can be deleted", () => {
    expect(isOurPublicId("rohtre-media/images/abc-123")).toBe(true);
    expect(isOurPublicId("other/abc")).toBe(false);
    expect(isOurPublicId("rohtre-media/../x")).toBe(false);
    expect(isOurPublicId("rohtre-media/images/a b")).toBe(false);
  });
});

describe("delivery URLs", () => {
  it("always uses automatic format and quality", () => {
    expect(cloudinaryUrl("rohtre-media/images/x", {}, "demo")).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/rohtre-media/images/x",
    );
  });
  it("adds a responsive width", () => {
    expect(cloudinaryUrl("rohtre-media/images/x", { width: 640 }, "demo")).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_640,c_limit/rohtre-media/images/x",
    );
  });
});
