/**
 * Where photography comes from, and what happens when there isn't any.
 *
 * context.md §9: no yacht photography exists yet. Every image slot in the UI is
 * therefore optional — components render a designed fallback treatment when a
 * source is absent, never a broken image and never an empty box.
 *
 * TO ADD REAL PHOTOGRAPHY (no code change required for cards):
 *   - Trip cards read `yachts.image_url`. Set that column and cards use it.
 *   - The hero reads NEXT_PUBLIC_HERO_IMAGE_URL, or falls back to a file
 *     dropped at public/images/hero.jpg (see public/images/README.md).
 *
 * If a remote host is used rather than a local file, its domain must be added to
 * `images.remotePatterns` in next.config.mjs before next/image will load it.
 */

/** Local path used when no env override is set. May simply not exist yet. */
export const DEFAULT_HERO_IMAGE_PATH = "/images/hero.jpg";

/**
 * The hero background image, or null to use the CSS treatment.
 *
 * Returns null unless explicitly configured — we do not point at a local file
 * that may not exist, because a 404'd hero image is worse than a designed
 * gradient. Set NEXT_PUBLIC_HERO_IMAGE_URL to turn photography on.
 */
export function getHeroImageUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_HERO_IMAGE_URL;
  return configured && configured.trim().length > 0 ? configured : null;
}
