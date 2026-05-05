"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import moment from "moment";
import { useRewardStore, type RewardEntry, type DealerRewardSummary } from "@/Store/rewardStore";
import { Star, Users, TrendingUp, Award, ChevronDown, ChevronRight, Trash2, X, ShieldAlert } from "lucide-react";

function isAdmin(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem("roletype") === "3") return true;
    const u = localStorage.getItem("UserData");
    if (u) { const p = JSON.parse(u); if (p?.staff_roletype === "0") return true; }
    const a = localStorage.getItem("AdminData") || localStorage.getItem("admin");
    if (a) { const p = JSON.parse(a); if (p && Object.keys(p).length > 0) return true; }
  } catch {}
  return false;
}

const fmtRs = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function StatusPill({ status }: { status: RewardEntry["status"] }) {
  return status === "active" ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 border border-red-200 text-red-600">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400"/>Cancelled
    </span>
  );
}

function ConfirmClear({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:"rgba(15,23,42,0.5)", backdropFilter:"blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-4">
          <Trash2 size={15} className="text-red-500"/>
        </div>
        <h3 className="text-[15px] font-bold text-gray-900">Clear all rewards?</h3>
        <p className="text-[13px] text-gray-500 mt-1.5">
          All points for <span className="font-semibold text-gray-800">{name}</span> will be permanently deleted.
        </p>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[13px] font-semibold transition-colors flex items-center justify-center gap-2">
            <Trash2 size={12}/> Clear
          </button>
        </div>
      </div>
    </div>
  );
}

function DealerRow({ summary, rank, onClear }: { summary: DealerRewardSummary; rank: number; onClear: () => void }) {
  const [open, setOpen] = useState(false);
  const cancelled = summary.entries.filter(e => e.status === "cancelled").length;

  return (
    <>
      <tr onClick={() => setOpen(v => !v)}
        className={`border-b border-gray-100 cursor-pointer transition-colors ${open ? "bg-amber-50/40" : "hover:bg-amber-50/20"}`}>
        <td className="px-5 py-4">
          {rank <= 3 ? (
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${rank===1?"bg-amber-400 text-white":rank===2?"bg-gray-300 text-gray-700":"bg-amber-100 text-amber-700"}`}>{rank}</div>
          ) : <span className="text-[12px] font-mono text-gray-400">{rank}</span>}
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0">
              {summary.dealerName.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2)}
            </div>
            <div>
              <div className="text-[13px] font-semibold text-gray-900">{summary.dealerName}</div>
              <div className="text-[10px] text-gray-400 font-mono">ID: {summary.dealerId}</div>
            </div>
          </div>
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            <Star size={13} className="text-amber-400 fill-amber-400"/>
            <span className="text-[14px] font-bold text-amber-700 font-mono">{fmtRs(summary.totalPoints)}</span>
          </div>
        </td>
        <td className="px-5 py-4">
          <div className="text-[12.5px] text-gray-700">{summary.activeOrders} qualifying</div>
          {cancelled > 0 && <div className="text-[10.5px] text-red-400 mt-0.5">{cancelled} cancelled</div>}
        </td>
        <td className="px-5 py-4 text-[11.5px] text-gray-400 font-mono whitespace-nowrap">
          {summary.entries[0] ? moment(summary.entries[0].createdAt).format("DD MMM YYYY") : "—"}
        </td>
        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <button onClick={onClear}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-lg transition-all shadow-sm">
              <Trash2 size={10}/> Clear
            </button>
            <span className="text-gray-300 pointer-events-none">
              {open ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}
            </span>
          </div>
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={6} className="px-5 py-4 bg-amber-50/30 border-b border-amber-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Order Breakdown</p>
            <div className="space-y-2">
              {summary.entries.map(e => (
                <div key={e.id}
                  className={`flex items-center justify-between rounded-xl px-4 py-2.5 border ${e.status==="active"?"bg-white border-gray-100":"bg-gray-50 border-gray-100 opacity-55"}`}>
                  <div className="flex items-center gap-5 flex-wrap">
                    <span className="font-mono text-[11.5px] font-bold text-indigo-700">
                      OM/{new Date(e.createdAt).getFullYear()}/{e.orderId}
                    </span>
                    <span className="text-[12px] text-gray-500">
                      Total: <span className="font-semibold text-gray-800 font-mono">{fmtRs(e.orderTotal)}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-[12px] font-bold text-amber-700 flex items-center gap-1">
                      <Star size={10} className="fill-amber-400 text-amber-400"/>+{fmtRs(e.points)}
                    </span>
                    <StatusPill status={e.status}/>
                    <span className="text-[10.5px] text-gray-400 font-mono hidden sm:block">
                      {moment(e.createdAt).format("DD MMM, h:mm a")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminRewardsPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<"checking"|"ok"|"denied">("checking");
  const [search,   setSearch]    = useState("");
  const [clearing, setClearing]  = useState<string|null>(null);

  const getAllSummaries = useRewardStore(s => s.getAllSummaries);
  const clearDealer    = useRewardStore(s => s.clearDealer);
  const entries        = useRewardStore(s => s.entries);

  useEffect(() => {
    if (isAdmin()) { setAuthState("ok"); }
    else {
      setAuthState("denied");
      const t = setTimeout(() => router.replace("/dashboard/admin"), 2500);
      return () => clearTimeout(t);
    }
  }, [router]);

  const summaries    = getAllSummaries();
  const filtered     = search.trim() ? summaries.filter(s => s.dealerName.toLowerCase().includes(search.toLowerCase()) || s.dealerId.includes(search)) : summaries;
  const totalPoints  = summaries.reduce((s, d) => s + d.totalPoints, 0);
  const totalDealers = summaries.length;
  const totalOrders  = entries.filter(e => e.status === "active").length;
  const clearingName = summaries.find(s => s.dealerId === clearing)?.dealerName ?? "";

  if (authState === "denied") return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
      <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
        <ShieldAlert size={28} className="text-red-400"/>
      </div>
      <h2 className="text-[16px] font-bold text-gray-900">Admin Access Only</h2>
      <p className="text-[13px] text-gray-500 text-center">You don't have permission. Redirecting…</p>
    </div>
  );

  if (authState === "checking") return (
    <div className="flex items-center justify-center min-h-[60vh] gap-2 text-gray-400 text-sm">
      <div className="w-4 h-4 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin"/>
      Verifying access…
    </div>
  );

  return (
    <div className="px-6 py-6 max-w-[1200px] mx-auto" style={{fontFamily:"'DM Sans',sans-serif"}}>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
              <Star size={16} className="text-white fill-white"/>
            </div>
            Dealer Reward Points
          </h1>
          <p className="text-[13px] text-gray-400 mt-1">Accumulated reward credits per dealer · Admin only</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dealer…"
              className="pl-9 pr-4 py-2 text-[12.5px] border border-gray-200 rounded-xl bg-white outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all w-52 placeholder:text-gray-300"/>
          </div>
          {search && <button onClick={() => setSearch("")} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50"><X size={12}/></button>}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {[
          {label:"Total Points Issued", value:fmtRs(totalPoints), sub:"active orders only",   icon:<Star size={15} className="fill-amber-400 text-amber-400"/>, bg:"bg-amber-50", border:"border-l-amber-400", text:"text-amber-800"},
          {label:"Qualifying Dealers",  value:totalDealers,        sub:"earned at least once", icon:<Users size={15} className="text-indigo-500"/>,               bg:"bg-indigo-50",border:"border-l-indigo-400",text:"text-indigo-800"},
          {label:"Qualifying Orders",   value:totalOrders,          sub:"orders ≥ ₹1,00,000",  icon:<TrendingUp size={15} className="text-emerald-500"/>,          bg:"bg-emerald-50",border:"border-l-emerald-400",text:"text-emerald-800"},
        ].map(c => (
          <div key={c.label} className={`bg-white border border-gray-200 border-l-4 ${c.border} rounded-2xl p-5 hover:shadow-sm transition-all`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.bg}`}>{c.icon}</div>
            <div className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{c.label}</div>
            <div className={`text-[26px] font-bold leading-none ${c.text}`} style={{fontFamily:"'DM Mono',monospace"}}>{c.value}</div>
            <div className="text-[11px] text-gray-400 mt-1.5">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Rules */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {["Orders ≥ ₹1,00,000 qualify","0.5% of order value → reward","Points cancelled if order deleted","Validity: not configured yet"].map(t => (
          <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-[11px] text-amber-700 font-medium">
            <Star size={9} className="fill-amber-300 text-amber-400"/>{t}
          </span>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100 text-[12px] text-amber-800 font-medium">
          <Award size={14} className="text-amber-500"/> Admin view only — dealers cannot access this panel.
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
              <Star size={24} className="text-amber-200"/>
            </div>
            <p className="text-[13px] text-gray-400 font-medium">
              {search ? "No dealers match your search" : "No reward points issued yet"}
            </p>
            <p className="text-[12px] text-gray-300">Points are earned on orders ≥ ₹1,00,000</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-amber-50/60 border-b border-amber-100">
                  {["Rank","Dealer","Total Points","Orders","Last Earned","Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10.5px] font-bold uppercase tracking-wider text-amber-800 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <DealerRow key={s.dealerId} summary={s} rank={i+1} onClear={() => setClearing(s.dealerId)}/>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-wrap gap-2 text-[11.5px] text-gray-400">
            <span>{filtered.length} dealer{filtered.length!==1?"s":""} · {fmtRs(totalPoints)} total outstanding</span>
            <span className="italic">Validity period: not yet configured</span>
          </div>
        )}
      </div>

      {clearing && (
        <ConfirmClear
          name={clearingName}
          onConfirm={() => { clearDealer(clearing); setClearing(null); }}
          onClose={() => setClearing(null)}
        />
      )}
    </div>
  );
}