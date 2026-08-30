import "server-only";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { AppError, appError } from "@/lib/errors";
import { applyFxBuffer } from "@/lib/money";

const FILE = "lib/services/fx.service.ts";

/**
 * The USD -> EGP rate used at checkout.
 *
 * Read through the SERVICE ROLE, not the anon client: fx_rates has RLS enabled
 * with no policies and no grants, so nothing reachable from a browser can read
 * it. It is internal pricing config and the guest has no reason to see the raw
 * rate or the margin on it.
 *
 * The table is append-only — changing the rate means inserting a row. This reads
 * the newest row that has taken effect.
 */

/**
 * How long a rate may go unreviewed before the dashboard flags it.
 *
 * Deliberately a warning, never a block. A stale-but-plausible rate charging
 * slightly wrong is a far better outcome than checkout refusing every booking
 * because nobody updated a number — the risk being managed here is that nobody
 * NOTICES, not that the number drifts.
 */
export const FX_RATE_STALE_AFTER_DAYS = 14;

export interface FxRate {
  /** Raw rate, EGP per USD × 1,000,000. */
  rateMicros: number;
  /** Margin buffer in basis points (300 = 3%). */
  bufferBps: number;
  /** Rate with the buffer applied — what a booking is actually charged at. */
  effectiveRateMicros: number;
  effectiveFrom: string;
  ageDays: number;
  /** True past FX_RATE_STALE_AFTER_DAYS. Surface it; do not act on it. */
  isStale: boolean;
}

export async function getCurrentFxRate(): Promise<FxRate> {
  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("fx_rates")
    .select("rate_micros, buffer_bps, effective_from")
    .lte("effective_from", new Date().toISOString())
    .order("effective_from", { ascending: false })
    .limit(1);

  if (error) {
    throw appError(AppError.FX.RATE_UNAVAILABLE, FILE, "getCurrentFxRate");
  }

  const row = data?.[0];
  if (!row) {
    // No rate at all. Checkout must not invent one — see the error's comment.
    throw appError(AppError.FX.RATE_UNAVAILABLE, FILE, "getCurrentFxRate");
  }

  const effectiveFrom = new Date(row.effective_from);
  const ageDays = Math.floor(
    (Date.now() - effectiveFrom.getTime()) / (1000 * 60 * 60 * 24),
  );

  return {
    rateMicros: row.rate_micros,
    bufferBps: row.buffer_bps,
    effectiveRateMicros: applyFxBuffer(row.rate_micros, row.buffer_bps),
    effectiveFrom: row.effective_from,
    ageDays,
    isStale: ageDays > FX_RATE_STALE_AFTER_DAYS,
  };
}
