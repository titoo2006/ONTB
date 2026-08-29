/**
 * ⚠️ TEMPORARY HAND-WRITTEN STAND-IN — replace with the generated file.
 *
 * This file is normally generated (`npm run db:types`). That requires a linked
 * Supabase project, which does not exist yet, and without a Database generic every
 * supabase-js query returns `any` — which would violate CLAUDE.md Rule 5 across the
 * whole services layer.
 *
 * So this is hand-transcribed from
 * supabase/migrations/20260829120000_phase1_core_schema.sql. It is authoritative
 * for nothing: the migration is. The moment the project is linked, run
 * `npm run db:types` and let it overwrite this file wholesale.
 *
 * NOTE — every row shape below is a `type` alias, never an `interface`. postgrest-js
 * constrains rows to `Record<string, unknown>`, and TypeScript gives type aliases an
 * implicit index signature while interfaces get none. Declaring these as interfaces
 * silently resolves every query result to `never` rather than producing an error at
 * the point of the mistake.
 */

export type BookingStatusDb =
  | "pending_payment"
  | "confirmed"
  | "checked_in"
  | "expired"
  | "cancelled";

export type TripInstanceStatusDb = "scheduled" | "departed" | "cancelled";
export type PaymentStatusDb = "initiated" | "succeeded" | "failed";
export type AdminRoleDb = "super_admin" | "staff";

export type YachtRow = {
  id: string;
  name: string;
  capacity: number;
  image_url: string | null;
  active: boolean;
  created_at: string;
};

export type TripInstanceRow = {
  id: string;
  yacht_id: string;
  trip_date: string;
  departure_time: string;
  capacity: number;
  seats_booked: number;
  status: TripInstanceStatusDb;
  created_at: string;
  updated_at: string;
};

export type BookingRow = {
  id: string;
  booking_code: string;
  trip_instance_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  nationality: string;
  headcount: number;
  guest_price_usd_cents: number;
  charged_amount_piasters: number;
  fx_rate_snapshot_micros: number;
  owner_share_piasters: number;
  platform_share_piasters: number;
  status: BookingStatusDb;
  expires_at: string | null;
  checked_in_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentRow = {
  id: string;
  booking_id: string;
  gateway: string;
  gateway_reference: string;
  amount_piasters: number;
  status: PaymentStatusDb;
  raw_gateway_response: unknown;
  created_at: string;
  updated_at: string;
};

export type OrganizerUserRow = {
  id: string;
  user_id: string;
  assigned_yacht_id: string | null;
  active: boolean;
  created_at: string;
};

export type AdminUserRow = {
  id: string;
  user_id: string;
  role: AdminRoleDb;
  active: boolean;
  created_at: string;
};

export type AuditLogRow = {
  id: string;
  actor: string | null;
  actor_type: string;
  action: string;
  entity: string;
  entity_id: string | null;
  meta: unknown;
  created_at: string;
};

type TableShape<TRow extends Record<string, unknown>> = {
  Row: TRow;
  Insert: Partial<TRow>;
  Update: Partial<TRow>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      yachts: TableShape<YachtRow>;
      trip_instances: TableShape<TripInstanceRow>;
      bookings: TableShape<BookingRow>;
      payments: TableShape<PaymentRow>;
      organizer_users: TableShape<OrganizerUserRow>;
      admin_users: TableShape<AdminUserRow>;
      audit_log: TableShape<AuditLogRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      booking_status: BookingStatusDb;
      trip_instance_status: TripInstanceStatusDb;
      payment_status: PaymentStatusDb;
      admin_role: AdminRoleDb;
    };
    CompositeTypes: Record<string, never>;
  };
};
