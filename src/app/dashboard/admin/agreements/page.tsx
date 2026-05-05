// app/admin/agreements/page.tsx
// Server Component — fetches data at request time (no "use client" needed)

import { getAllAgreements } from "@/Store/termsStore";
import { AgreementRecord } from "../../../types/route";

export const dynamic = "force-dynamic"; // Always fetch fresh data

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default function AdminAgreementsPage() {
  const records: AgreementRecord[] = getAllAgreements();

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Terms &amp; Conditions — Acceptance Log
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Admin view · {records.length} user{records.length !== 1 ? "s" : ""} on record
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-slate-900 text-white rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>

        {/* Empty state */}
        {records.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">No agreements yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Records will appear here once users accept the Terms &amp; Conditions.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    User
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    User ID
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Accepted At
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => (
                  <tr
                    key={record.userId}
                    className="hover:bg-slate-50 transition-colors duration-100"
                  >
                    {/* User info */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{record.userName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{record.email}</p>
                      </div>
                    </td>

                    {/* User ID */}
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {record.userId}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(record.acceptedAt)}
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Agreed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Table footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-400">
                Showing {records.length} record{records.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}