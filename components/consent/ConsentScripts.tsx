import Script from "next/script";
import { cookies } from "next/headers";
import {
  CONSENT_COOKIE_NAME,
  parseConsentCookie,
  type ConsentState,
} from "@/lib/analytics/consent";

/**
 * Injects vendor scripts — and only after consent.
 *
 * This is a SERVER component on purpose. It reads the consent cookie and simply
 * does not render the script tag when consent is absent, so the Pixel and
 * PostHog snippets never reach the browser at all. Rendering them and then
 * calling some "disable" API would not be consent-gating: by then the script has
 * executed, set its own cookies, and made its first request.
 *
 * The two categories are independent. Analytics consent loads PostHog; marketing
 * consent loads the Meta Pixel. Accepting one never implies the other.
 */

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
/** EU host — data residency was a condition of choosing PostHog Cloud. */
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

export function ConsentScripts() {
  const raw = cookies().get(CONSENT_COOKIE_NAME)?.value;
  const consent: ConsentState | null = parseConsentCookie(raw);

  const loadMarketing = consent?.marketing === true && Boolean(PIXEL_ID);
  const loadAnalytics = consent?.analytics === true && Boolean(POSTHOG_KEY);

  return (
    <>
      {loadMarketing ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');
          `}
        </Script>
      ) : null}

      {loadAnalytics ? (
        <Script id="posthog" strategy="afterInteractive">
          {`
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){
function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]);t[e]=function(){
t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type=
"text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName(
"script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",
u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),
t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},
o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),
n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init('${POSTHOG_KEY}', {
  api_host: '${POSTHOG_HOST}',
  persistence: 'localStorage+cookie',
  autocapture: true,
  capture_pageview: true,
  /* SECURITY.md §8 — masking is not optional. Autocapture and session replay
     otherwise hoover guest names, emails and phone numbers off the checkout
     form straight into a third party. */
  mask_all_element_attributes: true,
  session_recording: {
    maskAllInputs: true,
    maskTextSelector: '[data-ph-mask]'
  }
});
          `}
        </Script>
      ) : null}
    </>
  );
}
