// lib/termsStore.ts
// In a real app, replace this with a DB call (e.g. Prisma, Supabase, etc.)
// This module acts as a singleton in-memory store for Next.js server context.

import { AgreementRecord } from "../app/types/route";

// Global store persists across requests in the same server process
const globalStore = global as typeof global & {
  agreementRecords?: AgreementRecord[];
};

if (!globalStore.agreementRecords) {
  globalStore.agreementRecords = [];
}

export function saveAgreement(record: AgreementRecord): void {
  // Prevent duplicates — update if user already exists
  const idx = globalStore.agreementRecords!.findIndex(
    (r) => r.userId === record.userId
  );
  if (idx !== -1) {
    globalStore.agreementRecords![idx] = record;
  } else {
    globalStore.agreementRecords!.push(record);
  }
}

export function getAllAgreements(): AgreementRecord[] {
  return globalStore.agreementRecords ?? [];
}

export function hasUserAgreed(userId: string): boolean {
  return globalStore.agreementRecords!.some((r) => r.userId === userId);
}