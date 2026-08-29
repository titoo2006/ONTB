/**
 * SECURITY.md "Cross-Reference: Audit Logging".
 *
 * Every state-changing action on a booking writes an audit_log row:
 * creation, payment confirmation, check-in, expiry. Actor, action, entity,
 * entity_id, timestamp, metadata.
 *
 * This is what makes a disputed check-in or a payment discrepancy investigable
 * after the fact instead of argued from memory.
 *
 * Insert-only from server-side actions. Never updated, never deleted (Rule 9).
 *
 * SCAFFOLD STUB.
 */

// TODO(scaffold): recordAuditEvent().
export {};
