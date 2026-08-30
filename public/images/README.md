# Photography drop-in

No yacht photography exists yet (context.md §9). Everything here is wired but
empty — components render a designed fallback until real files arrive.

## What to add

| Slot | How it is set | Recommended file |
|---|---|---|
| Homepage hero | `NEXT_PUBLIC_HERO_IMAGE_URL` in `.env.local` | `hero.jpg`, landscape, min 2000×1100, ≤400KB |
| Trip cards | `yachts.image_url` column, per yacht | landscape, min 900×600, ≤200KB |

To use a local file for the hero, drop it in this folder and set:

```
NEXT_PUBLIC_HERO_IMAGE_URL=/images/hero.jpg
```

To set yacht photos, update the rows rather than the code:

```sql
update yachts set image_url = '/images/nile-empress.jpg' where name = 'Nile Empress';
```

## Before shipping any image

- **Licensing.** Every image needs a licence that covers commercial use on a
  booking site. Stock used for staging must be cleared or replaced before launch.
- **Remote hosts.** If `image_url` points at another domain, add that domain to
  `images.remotePatterns` in `next.config.mjs` or Next will refuse to load it.
- **Weight.** These load on a phone on hotel wifi, often abroad. Compress hard.
- **Honesty.** Do not use photography of yachts that are not the client's two
  boats. A guest who books what they saw and boards something else is a refund
  argument we have no policy for (context.md §8).
