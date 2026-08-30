/**
 * Where photography comes from, and what happens when there isn't any.
 *
 * context.md §9: no usable yacht photography exists yet. Every image slot in the
 * UI is therefore optional — components render a designed fallback treatment
 * when a source is absent, never a broken image and never an empty box.
 *
 * TO ADD REAL PHOTOGRAPHY (no code change beyond this file):
 *   - Hero: drop files in public/images/hero/ and list them in HERO_IMAGES.
 *   - Trip cards: set the `yachts.image_url` column. Cards use it automatically.
 */

export interface HeroImage {
  /** Path under public/, e.g. "/images/hero/01-exterior.jpg". */
  src: string;
  /**
   * CSS object-position for the crop.
   *
   * Every hero image is cropped with object-cover, which scales and crops
   * without ever distorting. On a PORTRAIT source in a wide hero that discards
   * most of the height, so this chooses which band survives.
   *
   * "center" keeps the middle. Use e.g. "center 30%" to bias upward when the
   * subject sits high in frame, or "center 70%" to bias downward. Tune these by
   * looking at the rendered hero, not by guessing from the file.
   */
  focalPoint: string;
}

/**
 * Hero background images, rotated in this order.
 *
 * EMPTY BY DESIGN (2026-08-31). Four candidate files were supplied and rejected.
 *
 * NOT an ownership problem — corrected 2026-08-31: "Nile Booking", "Nile Maxim"
 * and "The Pharaohs Cruising Restaurants" are all the CLIENT'S OWN brands, not a
 * competitor's. They were rejected for two other reasons:
 *
 *   1. A booking phone number is burned into the pixels. Putting a manual
 *      booking channel on the homepage undercuts the entire reason this platform
 *      exists — a guest who calls instead of booking online is a guest the
 *      online channel did not convert.
 *   2. Burned-in Arabic marketing copy can never be localised (Rule 13), for an
 *      audience that is ~90% foreign tourists.
 *
 * A fifth issue applied to one file: it was a Cairo skyline with no boat in it.
 * And cropping could not rescue any of them — the logos and text sit in the exact
 * middle band a wide crop keeps.
 *
 * While this array is empty the hero renders its gradient treatment, which is a
 * holding position rather than the design (DESIGN.md §9.1).
 *
 * BEFORE ADDING ANY IMAGE HERE, it must be:
 *   - the client's own boats (DESIGN.md §9.1)
 *   - free of logos, phone numbers, and any burned-in text
 *   - licensed for commercial use
 *
 * Expected order once available: exterior (day), buffet, dining interior,
 * exterior (night).
 */
export const HERO_IMAGES: HeroImage[] = [
  // { src: "/images/hero/01-exterior.jpg", focalPoint: "center" },
  // { src: "/images/hero/02-buffet.jpg",   focalPoint: "center" },
  // { src: "/images/hero/03-dining.jpg",   focalPoint: "center" },
  // { src: "/images/hero/04-night.jpg",    focalPoint: "center" },
];

/** How long each hero image is shown, in milliseconds. */
export const HERO_ROTATION_MS = 3000;
