"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    User, Mail, Lock, Phone, MapPin, Briefcase,
    Building2, Hash, Save, Camera, CheckCircle, AlertCircle,
} from "lucide-react";

type Role = "admin" | "dealer" | "staff";

interface FieldConfig {
    key: string;
    label: string;
    type?: string;
    icon: React.ReactNode;
    placeholder: string;
}

const FIELD_MAP: Record<Role, FieldConfig[]> = {
    admin: [
        { key: "ADMIN_NAME", label: "Full Name", icon: <User size={15} />, placeholder: "Your name", type: "text" },
        { key: "ADMIN_EMAIL", label: "Email", icon: <Mail size={15} />, placeholder: "Email address", type: "email" },
        { key: "ADMIN_PHONE", label: "Phone Number", icon: <Phone size={15} />, placeholder: "Phone number", type: "tel" },
        { key: "ADMIN_PASSWORD", label: "Password", icon: <Lock size={15} />, placeholder: "New password", type: "password" },
    ],
    dealer: [
        { key: "Dealer_Name", label: "Business Name", icon: <Building2 size={15} />, placeholder: "Business name", type: "text" },
        { key: "Dealer_Email", label: "Email", icon: <Mail size={15} />, placeholder: "Email address", type: "email" },
        { key: "Dealer_Number", label: "WhatsApp Number", icon: <Phone size={15} />, placeholder: "WhatsApp number", type: "tel" },
        { key: "Dealer_City", label: "City", icon: <MapPin size={15} />, placeholder: "City", type: "text" },
        { key: "Dealer_Address", label: "Address", icon: <MapPin size={15} />, placeholder: "Full address", type: "text" },
        { key: "Dealer_Pincode", label: "Pin Code", icon: <Hash size={15} />, placeholder: "Pin code", type: "text" },
        { key: "Dealer_Password", label: "Password", icon: <Lock size={15} />, placeholder: "New password", type: "password" },
    ],
    staff: [
        { key: "staff_name", label: "Full Name", icon: <User size={15} />, placeholder: "Your name", type: "text" },
        { key: "staff_designation", label: "Designation", icon: <Briefcase size={15} />, placeholder: "Job title", type: "text" },
        { key: "staff_location", label: "Location", icon: <MapPin size={15} />, placeholder: "Location", type: "text" },
        { key: "staff_password", label: "Password", icon: <Lock size={15} />, placeholder: "New password", type: "password" },
    ],
};

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://mirisoft.co.in/sas/dealerapi") + "/api";

const API_MAP: Record<Role, { fetch: (id: string) => string; update: (id: string) => string }> = {
    admin: { fetch: (id) => `${BACKEND_URL}/admininfo?id=${id}`, update: (id) => `${BACKEND_URL}/updateadmin?id=${id}` },
    dealer: { fetch: (id) => `${BACKEND_URL}/dealerinfo?id=${id}`, update: (id) => `${BACKEND_URL}/updateDealer?id=${id}` },
    staff: { fetch: (id) => `${BACKEND_URL}/staffinfo?id=${id}`, update: (id) => `${BACKEND_URL}/staffUpdate?id=${id}` },
};

const ID_KEY: Record<Role, string> = {
    admin: "ADMIN_ID", dealer: "Dealer_Id", staff: "staff_id",
};

const ROLE_LABEL: Record<Role, string> = {
    admin: "Administrator", dealer: "Dealer", staff: "Staff Member",
};

function resolveRole(): { role: Role; userData: Record<string, any> } | null {
    if (typeof window === "undefined") return null;
    try {
        // ── 1. staffData key (staff dashboard sets this) ──────────────────
        const staffRaw = localStorage.getItem("staffData");
        if (staffRaw) {
            const p = JSON.parse(staffRaw);
            if (p?.staff_id)
                return { role: p.staff_roletype === "0" ? "admin" : "staff", userData: p };
        }

        // ── 2. UserData key (set by login for all roles) ──────────────────
        const userRaw = localStorage.getItem("UserData");
        if (userRaw) {
            const p = JSON.parse(userRaw);
            // Dealer shape
            if (p?.Dealer_Id)
                return { role: "dealer", userData: p };
            // Staff shape
            if (p?.staff_id)
                return { role: p.staff_roletype === "0" ? "admin" : "staff", userData: p };
            // Admin shape — ADMIN_ID key  ← your actual data
            if (p?.ADMIN_ID)
                return { role: "admin", userData: p };
            // roletype flag fallback
            if (localStorage.getItem("roletype") === "3" && Object.keys(p).length > 0)
                return { role: "admin", userData: p };
        }

        // ── 3. Legacy AdminData / admin keys ─────────────────────────────
        const adminRaw = localStorage.getItem("AdminData") || localStorage.getItem("admin");
        if (adminRaw) {
            const p = JSON.parse(adminRaw);
            if (p && Object.keys(p).length > 0) return { role: "admin", userData: p };
        }
    } catch (_) { }
    return null;
}

function getInitials(name?: string) {
    if (!name?.trim()) return "??";
    return name.trim().split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function ProfilePage() {
    const router = useRouter();
    const [role, setRole] = useState<Role | null>(null);
    const [userId, setUserId] = useState<string>("");
    const [fields, setFields] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const resolved = resolveRole();
        if (!resolved) { router.push("/auth/login"); return; }
        const { role: r, userData } = resolved;
        setRole(r);
        const id = userData[ID_KEY[r]];
        setUserId(String(id));

        // Step 1: populate instantly from localStorage — no loading flicker
        const fromStorage: Record<string, string> = {};
        FIELD_MAP[r].forEach(f => {
            fromStorage[f.key] = userData[f.key] != null ? String(userData[f.key]) : "";
        });
        setFields(fromStorage);
        setLoading(false);

        // Step 2: silently refresh from the real backend in the background
        fetch(API_MAP[r].fetch(id))
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (!data) return; // API unreachable — keep localStorage values
                const d = data.data ?? {};
                const refreshed: Record<string, string> = {};
                FIELD_MAP[r].forEach(f => {
                    refreshed[f.key] = d[f.key] != null && d[f.key] !== ""
                        ? String(d[f.key])
                        : fromStorage[f.key];
                });
                setFields(refreshed);
            })
            .catch(() => {
                // Silently ignore — localStorage values already shown
            });
    }, []);

    const showToast = (type: "success" | "error", msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const handleChange = (key: string, value: string) => {
        setFields(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!role) return;
        setSaving(true);
        const form = new FormData();
        Object.entries(fields).forEach(([k, v]) => form.append(k, v));
        try {
            const res = await fetch(API_MAP[role].update(userId), { method: "POST", body: form });
            const data = await res.json();
            if (res.ok || data.msg) {
                if (data.data) {
                    localStorage.clear();
                    localStorage.setItem("status", "true");
                    localStorage.setItem("UserData", JSON.stringify(data.data));
                    localStorage.setItem("roletype", role === "admin" ? "3" : role === "dealer" ? "2" : "1");
                }
                showToast("success", data.msg ?? "Profile updated successfully.");
            } else {
                showToast("error", data.msg ?? "Something went wrong.");
            }
        } catch {
            showToast("error", "Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    // Pick display name from live userData (pre-fields) then from fields
    const displayName =
        fields["ADMIN_NAME"] ||
        fields["Dealer_Name"] ||
        fields["staff_name"] ||
        "User";
    const fieldDefs = role ? FIELD_MAP[role] : [];

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');

        .prof-root {
          min-height: 100vh;
          background: #080b12;
          font-family: 'DM Sans', sans-serif;
          padding: 40px 24px 80px;
          color: #e2e8f0;
        }

        /* ── Toast ── */
        .prof-toast {
          position: fixed; top: 24px; right: 24px; z-index: 999;
          display: flex; align-items: center; gap: 10px;
          padding: 13px 18px; border-radius: 14px;
          font-size: 13.5px; font-weight: 500;
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          animation: slideIn .25s ease;
          max-width: 340px;
        }
        .prof-toast.success { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #6ee7b7; }
        .prof-toast.error   { background: rgba(239,68,68,0.15);  border: 1px solid rgba(239,68,68,0.3);  color: #fca5a5; }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }

        /* ── Layout ── */
        .prof-wrap {
          max-width: 780px; margin: 0 auto;
        }

        /* ── Page header ── */
        .prof-header {
          display: flex; align-items: center; gap: 22px;
          margin-bottom: 36px;
        }
        .prof-avatar {
          width: 72px; height: 72px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #a78bfa 100%);
          display: flex; align-items: center; justify-content: center;
          font-family: 'DM Serif Display', serif;
          font-size: 26px; color: #fff;
          flex-shrink: 0;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.25), 0 0 24px rgba(99,102,241,0.15);
          position: relative;
        }
        .prof-avatar-edit {
          position: absolute; bottom: 0; right: 0;
          width: 22px; height: 22px; border-radius: 50%;
          background: #1e1b2e; border: 2px solid #6366f1;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #a5b4fc;
        }
        .prof-header-text h1 {
          font-family: 'DM Serif Display', serif;
          font-size: 26px; font-weight: 400; color: #fff;
          margin: 0 0 3px; letter-spacing: -.3px;
        }
        .prof-header-text p { margin: 0; font-size: 13px; color: #475569; }
        .prof-badge {
          display: inline-flex; align-items: center;
          padding: 2px 10px; border-radius: 20px;
          background: rgba(99,102,241,0.14); color: #818cf8;
          font-size: 11px; font-weight: 600; letter-spacing: .06em;
          text-transform: uppercase; margin-top: 5px;
        }

        /* ── Skeleton ── */
        .prof-skeleton { border-radius: 8px; background: rgba(255,255,255,0.05); animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }

        /* ── Card ── */
        .prof-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 32px;
        }
        .prof-card-title {
          font-size: 11px; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: #334155;
          margin: 0 0 22px;
        }

        /* ── Grid of fields ── */
        .prof-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 18px;
        }

        /* ── Field ── */
        .prof-field { display: flex; flex-direction: column; gap: 6px; }
        .prof-label {
          font-size: 11.5px; font-weight: 600; letter-spacing: .04em;
          text-transform: uppercase; color: #475569;
        }
        .prof-input-wrap {
          position: relative;
        }
        .prof-icon {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          color: #334155; pointer-events: none;
          display: flex; align-items: center;
        }
        .prof-input {
          width: 100%; padding: 11px 14px 11px 38px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          font-size: 13.5px; font-family: inherit;
          color: #e2e8f0;
          outline: none;
          transition: border-color .18s, background .18s, box-shadow .18s;
          box-sizing: border-box;
        }
        .prof-input::placeholder { color: #1e293b; }
        .prof-input:focus {
          border-color: rgba(99,102,241,0.5);
          background: rgba(99,102,241,0.05);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .prof-input:hover:not(:focus) {
          border-color: rgba(255,255,255,0.13);
          background: rgba(255,255,255,0.06);
        }

        /* ── Divider ── */
        .prof-divider {
          height: 1px; background: rgba(255,255,255,0.06);
          margin: 28px 0;
        }

        /* ── Actions ── */
        .prof-actions { display: flex; justify-content: flex-end; gap: 12px; }
        .prof-btn-cancel {
          padding: 11px 22px; border-radius: 12px;
          background: transparent; border: 1px solid rgba(255,255,255,0.1);
          font-size: 13.5px; font-family: inherit; font-weight: 500;
          color: #475569; cursor: pointer;
          transition: all .16s;
        }
        .prof-btn-cancel:hover { background: rgba(255,255,255,0.05); color: #94a3b8; }
        .prof-btn-save {
          padding: 11px 26px; border-radius: 12px;
          background: linear-gradient(135deg, #6366f1, #818cf8);
          border: none; font-size: 13.5px; font-family: inherit; font-weight: 600;
          color: #fff; cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          transition: all .18s;
          box-shadow: 0 4px 14px rgba(99,102,241,0.3);
        }
        .prof-btn-save:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99,102,241,0.4);
        }
        .prof-btn-save:disabled { opacity: .6; cursor: not-allowed; transform: none; }

        /* ── Spinner ── */
        .prof-spinner {
          width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Loading skeletons ── */
        .prof-sk-header { display:flex; gap:22px; align-items:center; margin-bottom:36px; }
        .prof-sk-circle { width:72px; height:72px; border-radius:50%; }
        .prof-sk-lines { flex:1; display:flex; flex-direction:column; gap:8px; }
        .prof-sk-line  { height:14px; border-radius:6px; }

        @media (max-width: 600px) {
          .prof-card { padding: 22px 18px; }
          .prof-grid { grid-template-columns: 1fr; }
          .prof-header h1 { font-size: 22px; }
        }
      `}</style>

            {/* Toast */}
            {toast && (
                <div className={`prof-toast ${toast.type}`}>
                    {toast.type === "success"
                        ? <CheckCircle size={16} />
                        : <AlertCircle size={16} />}
                    {toast.msg}
                </div>
            )}

            <div className="prof-root">
                <div className="prof-wrap">
                    <div className="mb-6">
                        <a
                            onClick={() => router.back()}   
                            className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                        >
                            ← Back to dashboard
                        </a>
                    </div>
                    {/* Header */}
                    {loading || !mounted ? (
                        <div className="prof-sk-header">
                            <div className="prof-skeleton prof-sk-circle" />
                            <div className="prof-sk-lines">
                                <div className="prof-skeleton prof-sk-line" style={{ width: "45%" }} />
                                <div className="prof-skeleton prof-sk-line" style={{ width: "30%" }} />
                            </div>
                        </div>
                    ) : (
                        <div className="prof-header">
                            <div className="prof-avatar">
                                {getInitials(displayName)}
                                <div className="prof-avatar-edit"><Camera size={11} /></div>
                            </div>
                            <div className="prof-header-text">
                                <h1>{displayName}</h1>
                                <p>Manage your account settings and profile information</p>
                                {role && <span className="prof-badge">{ROLE_LABEL[role]}</span>}
                            </div>
                        </div>
                    )}

                    {/* Card */}
                    <div className="prof-card">
                        <p className="prof-card-title">Profile Information</p>

                        {loading || !mounted ? (
                            <div className="prof-grid">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        <div className="prof-skeleton prof-sk-line" style={{ width: "35%", height: 11 }} />
                                        <div className="prof-skeleton" style={{ height: 44, borderRadius: 12 }} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="prof-grid">
                                    {fieldDefs.map(f => (
                                        <div key={f.key} className="prof-field">
                                            <label className="prof-label">{f.label}</label>
                                            <div className="prof-input-wrap">
                                                <span className="prof-icon">{f.icon}</span>
                                                <input
                                                    className="prof-input"
                                                    type={f.type ?? "text"}
                                                    placeholder={f.placeholder}
                                                    value={fields[f.key] ?? ""}
                                                    onChange={e => handleChange(f.key, e.target.value)}
                                                    autoComplete={f.type === "password" ? "new-password" : "off"}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="prof-divider" />

                                <div className="prof-actions">
                                    <button
                                        type="button"
                                        className="prof-btn-cancel"
                                        onClick={() => router.back()}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="prof-btn-save"
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <><div className="prof-spinner" /> Saving…</>
                                        ) : (
                                            <><Save size={14} /> Save Changes</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
}