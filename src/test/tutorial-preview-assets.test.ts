import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const tutorialAssetRoot = path.resolve(process.cwd(), "public", "tutorials");
const tutorialPreviewIds = [
  "swatches",
  "filtering",
  "harmony",
  "accessibility",
] as const;

describe("tutorial preview assets", () => {
  it("includes a valid 1200 by 675 WebP preview for every tutorial", async () => {
    for (const id of tutorialPreviewIds) {
      const assetPath = path.join(tutorialAssetRoot, `${id}.webp`);
      expect(existsSync(assetPath), id).toBe(true);

      const metadata = await sharp(assetPath).metadata();
      expect(metadata.format, id).toBe("webp");
      expect(metadata.width, id).toBe(1200);
      expect(metadata.height, id).toBe(675);
    }
  });
});
