"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { HERO_ROTATION_MS, type HeroImage } from "@/lib/media";

/**
 * Rotating hero background.
 *
 * REDUCED MOTION — the important part. DESIGN.md §10 collapses CSS transitions
 * and animations when the OS asks for reduced motion, but that rule has NO
 * effect on a JavaScript timer: a setInterval swapping images would keep
 * swapping regardless, which is precisely the kind of movement someone with
 * vestibular sensitivity is asking us to stop. So the gate is in JS, via
 * matchMedia, and it shows the first image statically instead. The listener
 * means a guest who changes the setting mid-visit is respected without a reload.
 *
 * CROPPING — object-cover scales and crops, never distorts. Three of the four
 * expected sources are portrait (4:5) in a wide hero, so most of their height is
 * discarded by definition; `focalPoint` chooses which band survives.
 *
 * When HERO_IMAGES is empty this renders the gradient treatment alone, so the
 * hero is never broken by absent photography (context.md §9).
 */
export function HeroCarousel({ images }: { images: HeroImage[] }) {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);

    const onChange = (event: MediaQueryListEvent) =>
      setReducedMotion(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    // No timer at all when motion is reduced, or when there is nothing to
    // rotate between. Not a paused timer — no timer.
    if (reducedMotion || images.length < 2) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, HERO_ROTATION_MS);

    return () => window.clearInterval(timer);
  }, [reducedMotion, images.length]);

  return (
    <div aria-hidden="true" className="absolute inset-0">
      {/* Always present, and always beneath the photography: it is the fallback
          when there are no images, and the ground that guarantees contrast if
          one fails to load (DESIGN.md §9.2). */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-deep to-deep" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary-light/30 to-transparent" />
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

      {images.map((image, i) => (
        <Image
          key={image.src}
          src={image.src}
          alt=""
          fill
          // First image is the LCP candidate; the rest can wait.
          priority={i === 0}
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: image.focalPoint }}
          className={`transition-opacity duration-slow ease-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
