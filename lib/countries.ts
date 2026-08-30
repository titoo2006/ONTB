/**
 * Nationality options for checkout.
 *
 * PRD_Phase1.md Screen 3 requires nationality as a dropdown, because the admin
 * dashboard reports a nationality breakdown (context.md §2). Stored as ISO
 * 3166-1 alpha-2, matching the `char(2)` column on bookings.
 *
 * Names are resolved with Intl.DisplayNames rather than hardcoded, so the list
 * translates itself when a second locale is added (Rule 13) and we never
 * maintain 200-odd country names by hand.
 *
 * SECURITY.md §8 — nationality is collected because the operator reports on it.
 * It is the only demographic field we collect, and the admin breakdown must stay
 * aggregate-only; this list must not become a filter for looking guests up.
 */

const ISO_ALPHA2_CODES =
  "AD AE AF AG AI AL AM AO AR AT AU AW AZ BA BB BD BE BF BG BH BI BJ BM BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MO MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PR PS PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW".split(
    " ",
  );

export interface CountryOption {
  code: string;
  name: string;
}

/** True if a submitted value is a country code we actually offer (Rule 10). */
export function isSupportedCountryCode(code: string): boolean {
  return ISO_ALPHA2_CODES.includes(code.toUpperCase());
}

/**
 * The dropdown options, alphabetical by displayed name.
 *
 * Falls back to the raw code if Intl.DisplayNames is unavailable, so the form is
 * still usable rather than showing a list of blanks.
 */
export function getCountryOptions(locale = "en"): CountryOption[] {
  let display: Intl.DisplayNames | null = null;
  try {
    display = new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    display = null;
  }

  return ISO_ALPHA2_CODES.map((code) => ({
    code,
    name: display?.of(code) ?? code,
  })).sort((a, b) => a.name.localeCompare(b.name, locale));
}
