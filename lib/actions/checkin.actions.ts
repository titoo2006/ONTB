"use server";

/**
 * Screens 7 and 8 — organizer booking lookup and check-in.
 *
 * CLAUDE.md Rule 18 / SECURITY.md §4 — this is a system-controlled write surface.
 * Who may trigger it: an authenticated, ACTIVE organizer assigned to the booking's
 * yacht (or unassigned = all yachts). Never a guest, never an unauthenticated
 * caller. The role is read from the Supabase session only.
 *
 * SCAFFOLD STUB.
 */

// TODO(scaffold): searchBookingByCodeAction(), checkInBookingAction().
export {};
