"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppError, toAppError } from "@/lib/errors";
import { isValidBookingCode } from "@/lib/booking-code";
import {
  checkInBooking,
  findBookingByCode,
  getOrganizerIdentity,
  listTodayTripsForOrganizer,
} from "@/lib/services/organizer.service";
import type {
  CheckInResult,
  OrganizerBooking,
  OrganizerTrip,
} from "@/lib/services/organizer.service";

/**
 * Organizer server actions — Screens 6, 7 and 8.
 *
 * Rule 6: pages call these; these call services; only services touch Supabase.
 * Rule 10: the role is read from the authenticated Supabase session only, never
 * from a param, header, or anything the client can set.
 */

export type SignInResult = { ok: true } | { ok: false; code: string };

/**
 * Screen 6 — organizer sign-in.
 *
 * Two checks, and the second matters: a valid Supabase user is not necessarily
 * an organizer. Someone with an account for another part of the system must not
 * land on the check-in screen. Both failures return the SAME generic error, so
 * this cannot be used to discover which addresses are organizer accounts.
 */
export async function signInOrganizerAction(
  email: string,
  password: string,
): Promise<SignInResult> {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, code: AppError.ORGANIZER.SIGN_IN_FAILED.code };
  }

  const organizer = await getOrganizerIdentity();
  if (!organizer) {
    // Signed in, but not an organizer. Sign them straight back out rather than
    // leaving a session that grants nothing but looks like it might.
    await supabase.auth.signOut();
    return { ok: false, code: AppError.ORGANIZER.SIGN_IN_FAILED.code };
  }

  redirect("/organizer/check-in");
}

export async function signOutOrganizerAction(): Promise<void> {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/organizer/login");
}

/** Screen 7 — today's sailings panel. Returns [] when not an organizer. */
export async function getTodayTripsAction(): Promise<OrganizerTrip[]> {
  const organizer = await getOrganizerIdentity();
  if (!organizer) return [];
  return listTodayTripsForOrganizer(organizer.assignedYachtId);
}

export type FindBookingResult =
  | { ok: true; booking: OrganizerBooking }
  | { ok: false; code: string };

/**
 * Screen 7 — look up a booking code.
 *
 * A malformed code is treated exactly like a missing one. The organizer sees
 * "not found" either way, which is both simpler at the pier and avoids
 * confirming anything about which codes are structurally valid.
 */
export async function findBookingAction(
  rawCode: string,
): Promise<FindBookingResult> {
  const organizer = await getOrganizerIdentity();
  if (!organizer) {
    return { ok: false, code: AppError.ORGANIZER.NOT_AUTHORIZED.code };
  }

  const bookingCode = rawCode.trim().toUpperCase();
  if (!isValidBookingCode(bookingCode)) {
    return { ok: false, code: AppError.ORGANIZER.BOOKING_NOT_FOUND.code };
  }

  const booking = await findBookingByCode(bookingCode);
  if (!booking) {
    return { ok: false, code: AppError.ORGANIZER.BOOKING_NOT_FOUND.code };
  }

  return { ok: true, booking };
}

export type CheckInActionResult =
  | { ok: true; result: CheckInResult }
  | { ok: false; code: string };

/**
 * Screen 8 — perform the check-in.
 *
 * Rule 18 / SECURITY.md §4 — this is a system-controlled write surface. The
 * database function re-validates the caller's organizer status and the booking's
 * state; nothing here is trusted to have checked first.
 */
export async function checkInBookingAction(
  rawCode: string,
): Promise<CheckInActionResult> {
  const organizer = await getOrganizerIdentity();
  if (!organizer) {
    return { ok: false, code: AppError.ORGANIZER.NOT_AUTHORIZED.code };
  }

  const bookingCode = rawCode.trim().toUpperCase();
  if (!isValidBookingCode(bookingCode)) {
    return { ok: false, code: AppError.ORGANIZER.BOOKING_NOT_FOUND.code };
  }

  try {
    const result = await checkInBooking(bookingCode);
    // The today's-sailings counts on the search screen are now stale.
    revalidatePath("/organizer/check-in");
    return { ok: true, result };
  } catch (err) {
    const appErr = toAppError(err);
    console.error(`[${appErr.code}] ${appErr.file} → ${appErr.function}`);
    return { ok: false, code: appErr.code };
  }
}
