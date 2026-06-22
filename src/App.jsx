import { useState, useEffect, useRef } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import {
  Wallet, Search, ChevronLeft, ChevronRight, RefreshCw, RotateCw,
  ArrowUpRight, ArrowDownLeft, CreditCard, Sparkles,
  ArrowLeftRight, Send, Loader2, AlertCircle, Pencil, Check, X, Plus,
  LogOut, MessageSquare, Trash2, BarChart2, Calendar, Download, Scissors,
} from "lucide-react";
import { fetchReport, askAI, saveOverride, fetchProfiles, verifyPin, submitSMS, fetchSMSInbox, deleteSMSEntry, fetchInsights, fetchBudget, saveBudget, fetchMonthly, saveAdjustment, deleteAdjustment } from "./api";
import { getCategoryConfig, CATEGORY_NAMES, fmt, formatDateLong } from "./constants";
import { exportTable } from "./export";

// ─── Auth Screens ─────────────────────────────────────────────────────────────

const PROFILE_COLORS = ["#C8A951", "#3B82F6", "#A855F7", "#22C55E"];

function ProfileSelect({ onSelect }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetchProfiles()
      .then(setProfiles)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--gold-dim)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Wallet size={26} style={{ color: "var(--gold)" }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 6 }}>Who's tracking?</div>
        <div style={{ fontSize: 13, color: "var(--w30)" }}>Select your profile to continue</div>
      </div>

      {loading && <Loader2 size={28} className="spin" style={{ color: "var(--gold)" }} />}
      {err && <div style={{ fontSize: 13, color: "var(--red)", textAlign: "center", maxWidth: 280 }}>{err}</div>}

      {!loading && !err && (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
          {profiles.map((p, i) => {
            const color = PROFILE_COLORS[i % PROFILE_COLORS.length];
            const initials = p.name.slice(0, 2).toUpperCase();
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                  background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20,
                  padding: "28px 32px", cursor: "pointer", fontFamily: "inherit",
                  transition: "border-color 0.2s, transform 0.1s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = "scale(1.03)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "scale(1)"; }}
              >
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: color + "22", border: `2px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 26, fontWeight: 600, color }}>{initials}</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 500, color: "var(--w)" }}>{p.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PinEntry({ profile, onSuccess, onBack }) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  useEffect(() => { inputRefs[0].current?.focus(); }, []);

  function handleDigit(index, value) {
    if (!/^\d?$/.test(value)) return;
    const next = [...pin];
    next[index] = value;
    setPin(next);
    setError("");
    if (value && index < 3) inputRefs[index + 1].current?.focus();
    if (next.every(d => d !== "") && value) {
      submitPin(next.join(""));
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  }

  async function submitPin(code) {
    setLoading(true);
    setError("");
    try {
      const result = await verifyPin(profile.id, code);
      localStorage.setItem("token", result.token);
      localStorage.setItem("profile", JSON.stringify(result.profile));
      onSuccess(result.profile);
    } catch (e) {
      setError(e.message || "Incorrect PIN");
      setPin(["", "", "", ""]);
      setTimeout(() => inputRefs[0].current?.focus(), 50);
    }
    setLoading(false);
  }

  const color = PROFILE_COLORS[0];
  const initials = profile.name.slice(0, 2).toUpperCase();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: color + "22", border: `2px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <span style={{ fontSize: 26, fontWeight: 600, color }}>{initials}</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>{profile.name}</div>
        <div style={{ fontSize: 13, color: "var(--w30)" }}>Enter your 4-digit PIN</div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {pin.map((digit, i) => (
          <input
            key={i}
            ref={inputRefs[i]}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            disabled={loading}
            style={{
              width: 56, height: 64, textAlign: "center", fontSize: 24, fontWeight: 600,
              borderRadius: 14, border: `2px solid ${error ? "var(--red)" : digit ? "var(--gold)" : "var(--border)"}`,
              background: "var(--card)", color: "var(--w)", fontFamily: "inherit",
              transition: "border-color 0.15s",
            }}
          />
        ))}
      </div>

      {loading && <Loader2 size={20} className="spin" style={{ color: "var(--gold)", marginBottom: 12 }} />}
      {error && <div style={{ fontSize: 13, color: "var(--red)", marginBottom: 12 }}>{error}</div>}

      <button
        onClick={onBack}
        style={{ fontSize: 13, color: "var(--w30)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}
      >
        ← Back to profiles
      </button>
    </div>
  );
}

// ─── Shared UI Components ─────────────────────────────────────────────────────

function SummaryCard({ icon: Icon, label, value, colorVar }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `var(--${colorVar}-bg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} style={{ color: `var(--${colorVar})` }} />
        </div>
        <span style={{ fontSize: 11, color: "var(--w30)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 400 }}>₹{fmt(value)}</div>
    </div>
  );
}

function CategoryRow({ cat, maxTotal }) {
  const { icon: Icon, color } = getCategoryConfig(cat.name);
  return (
    <div className="cat-row">
      <div className="cat-icon" style={{ background: color + "15" }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{cat.name}</div>
            <div style={{ fontSize: 11, color: "var(--w30)", marginTop: 2 }}>{cat.count} txn{cat.count > 1 ? "s" : ""}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>₹{fmt(cat.total)}</div>
            <div style={{ fontSize: 11, color, marginTop: 2 }}>{cat.percentage}%</div>
          </div>
        </div>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${(cat.total / maxTotal) * 100}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
        </div>
      </div>
    </div>
  );
}

function TransactionRow({ txn, onEditCategory, onAdjust }) {
  const { icon: Icon, color } = getCategoryConfig(txn.category);
  const isDebit = txn.type === "debit";
  const isBill = txn.category === "Bill Payment";
  const adj = txn.adjustment;
  const effective = adj ? txn.amount - adj.amount : txn.amount;
  // Only spend (debit, non-bill) can be cancelled out.
  const canAdjust = isDebit && !isBill && onAdjust;

  return (
    <div className="txn-row">
      <div className="cat-icon" style={{ background: color + "15" }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{txn.merchant}</div>
        <div style={{ fontSize: 12, color: "var(--w30)", marginTop: 2 }}>
          {txn.category}
          {isBill && <span className="pill" style={{ background: "var(--blue-bg)", color: "var(--blue)", marginLeft: 6 }}>BILL</span>}
          {" · "}{txn.bank} · {txn.cardType} · {txn.time || "—"}
        </div>
        {txn.merchantVPA && <div style={{ fontSize: 11, color: "var(--w10)", marginTop: 2 }}>{txn.merchantVPA}</div>}
        {adj && (
          <div style={{ fontSize: 11, color: "var(--gold)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
            <Scissors size={11} /> −₹{fmt(adj.amount)}{adj.reason ? ` · ${adj.reason}` : ""}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: isBill ? "var(--blue)" : isDebit ? "var(--red)" : "var(--green)" }}>
            {isDebit ? "-" : "+"}₹{fmt(effective)}
          </div>
          {adj && (
            <div style={{ fontSize: 11, color: "var(--w30)", textDecoration: "line-through" }}>₹{fmt(txn.amount)}</div>
          )}
        </div>
        {canAdjust && (
          <button onClick={() => onAdjust(txn)} title="Cancel out an amount"
            style={{ width: 28, height: 28, borderRadius: 8, background: adj ? "var(--gold-dim)" : "var(--w10)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Scissors size={12} style={{ color: adj ? "var(--gold)" : "var(--w30)" }} />
          </button>
        )}
        <button onClick={() => onEditCategory(txn)} style={{ width: 28, height: 28, borderRadius: 8, background: "var(--w10)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Pencil size={12} style={{ color: "var(--w30)" }} />
        </button>
      </div>
    </div>
  );
}

function AdjustModal({ txn, onSave, onDelete, onClose }) {
  const existing = txn.adjustment;
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [reason, setReason] = useState(existing?.reason || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) { alert("Enter an amount to cancel out"); return; }
    if (value > txn.amount) { alert(`Can't cancel out more than ₹${fmt(txn.amount)}`); return; }
    setSaving(true);
    try {
      await saveAdjustment(txn.hash, txn.date, value, reason.trim());
      onSave();
    } catch (e) { alert("Failed: " + e.message); setSaving(false); }
  }

  async function handleRemove() {
    setSaving(true);
    try { await deleteAdjustment(txn.hash); onDelete(); }
    catch (e) { alert("Failed: " + e.message); setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="card" style={{ padding: 24, maxWidth: 360, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}><Scissors size={16} style={{ color: "var(--gold)" }} /> Cancel out</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--w30)" }}><X size={20} /></button>
        </div>

        <div style={{ fontSize: 13, color: "var(--w50)", marginBottom: 4 }}>Transaction</div>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>{txn.merchant} · ₹{fmt(txn.amount)}</div>

        <div style={{ fontSize: 13, color: "var(--w50)", marginBottom: 8 }}>Amount to subtract</div>
        <input type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Max ₹${fmt(txn.amount)}`} style={{ width: "100%", marginBottom: 16 }} autoFocus />

        <div style={{ fontSize: 13, color: "var(--w50)", marginBottom: 8 }}>Justification</div>
        <input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. cash returned on Jun 6" style={{ width: "100%", marginBottom: 16 }} />

        <div style={{ fontSize: 11, color: "var(--w30)", marginBottom: 16 }}>
          This reduces the day's spend, monthly OUT, and your budget bar.
        </div>

        <button onClick={handleSave} disabled={saving}
          style={{ width: "100%", padding: "12px", background: "var(--gold)", color: "#0A0A0A", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: saving ? 0.5 : 1 }}>
          {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
          {saving ? "Saving..." : "Save"}
        </button>
        {existing && (
          <button onClick={handleRemove} disabled={saving}
            style={{ width: "100%", marginTop: 10, padding: "10px", background: "transparent", color: "var(--red)", border: "1px solid var(--border)", borderRadius: 12, cursor: "pointer", fontSize: 13, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Trash2 size={14} /> Remove cancel-out
          </button>
        )}
      </div>
    </div>
  );
}

function CategoryModal({ txn, onSave, onClose }) {
  const [selected, setSelected] = useState(txn.category);
  const [custom, setCustom] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const category = showCustom ? custom.trim() : selected;
    if (!category) return;
    setSaving(true);
    try {
      await saveOverride(txn.merchant, category);
      onSave(txn.merchant, category);
    } catch (e) {
      alert("Failed to save: " + e.message);
    }
    setSaving(false);
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="card" style={{ padding: 24, maxWidth: 360, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Edit Category</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--w30)" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ fontSize: 13, color: "var(--w50)", marginBottom: 4 }}>Merchant</div>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16 }}>{txn.merchant}</div>

        <div style={{ fontSize: 13, color: "var(--w50)", marginBottom: 8 }}>Select category</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {CATEGORY_NAMES.map(name => {
            const { color } = getCategoryConfig(name);
            const isActive = selected === name && !showCustom;
            return (
              <button key={name} onClick={() => { setSelected(name); setShowCustom(false); }}
                style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, border: `1px solid ${isActive ? color : "var(--w10)"}`, background: isActive ? color + "20" : "transparent", color: isActive ? color : "var(--w50)", cursor: "pointer", fontFamily: "inherit" }}>
                {name}
              </button>
            );
          })}
          <button onClick={() => setShowCustom(true)}
            style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, border: `1px solid ${showCustom ? "var(--gold)" : "var(--w10)"}`, background: showCustom ? "var(--gold-dim)" : "transparent", color: showCustom ? "var(--gold)" : "var(--w50)", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
            <Plus size={12} /> Custom
          </button>
        </div>

        {showCustom && (
          <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="Type custom category..." style={{ width: "100%", marginBottom: 16 }} autoFocus />
        )}

        <div style={{ fontSize: 11, color: "var(--w30)", marginBottom: 16 }}>
          This will apply to all future transactions from "{txn.merchant}"
        </div>

        <button onClick={handleSave} disabled={saving || (!selected && !custom.trim())}
          style={{ width: "100%", padding: "12px", background: "var(--gold)", color: "#0A0A0A", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: saving ? 0.5 : 1 }}>
          {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

// ─── Monthly Budget Bar ───────────────────────────────────────────────────────

function BudgetBar({ data, onEdit }) {
  // Not loaded yet
  if (!data) return null;

  const { budget = 0, spent = 0, monthLabel = "" } = data;

  // No budget set → prompt
  if (!budget || budget <= 0) {
    return (
      <button
        onClick={onEdit}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 14px", marginBottom: 14, background: "var(--gold-dim)", border: "1px dashed var(--gold)", borderRadius: 12, color: "var(--gold)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 500 }}
      >
        <Plus size={14} /> Set a monthly budget
      </button>
    );
  }

  const pct = Math.round((spent / budget) * 100);
  const fill = Math.min(pct, 100);
  const over = spent > budget;
  const remaining = budget - spent;

  // gold → amber → red
  const color = pct >= 100 ? "var(--red)" : pct >= 75 ? "#F59E0B" : "var(--gold)";

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
        <span style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: "var(--w30)" }}>
          {monthLabel} budget
        </span>
        <button onClick={onEdit} style={{ fontSize: 11, color: "var(--gold)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
          Edit
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>
          ₹{fmt(spent)} <span style={{ color: "var(--w30)", fontWeight: 400 }}>of ₹{fmt(budget)}</span>
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color }}>{pct}%</span>
      </div>

      <div style={{ height: 8, borderRadius: 4, background: "var(--w10)", overflow: "hidden" }}>
        <div className="budget-fill" style={{ width: `${fill}%`, height: "100%", borderRadius: 4, background: color, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
      </div>

      <div style={{ fontSize: 11, marginTop: 6, color: over ? "var(--red)" : "var(--w30)" }}>
        {over ? `⚠ ₹${fmt(Math.abs(remaining))} over budget` : `₹${fmt(remaining)} left`}
      </div>
    </div>
  );
}

function BudgetModal({ current, onSave, onClose }) {
  const [value, setValue] = useState(current > 0 ? String(current) : "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return;
    setSaving(true);
    try {
      const result = await saveBudget(n);
      onSave(result);
    } catch (e) {
      alert("Failed to save: " + e.message);
    }
    setSaving(false);
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="card" style={{ padding: 24, maxWidth: 340, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Monthly Budget</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--w30)" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ fontSize: 13, color: "var(--w50)", marginBottom: 8 }}>Set your spending limit for the month</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
          <span style={{ fontSize: 22, color: "var(--w30)" }}>₹</span>
          <input
            type="number"
            inputMode="numeric"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            placeholder="15000"
            autoFocus
            style={{ flex: 1, fontSize: 20, fontWeight: 500, padding: "10px 14px" }}
          />
        </div>

        <button onClick={handleSave} disabled={saving || value === ""}
          style={{ width: "100%", padding: 12, background: "var(--gold)", color: "#0A0A0A", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: saving || value === "" ? 0.5 : 1 }}>
          {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
          {saving ? "Saving..." : "Save Budget"}
        </button>
      </div>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────

function HomePage({ data, date, setEditTxn, setAdjustTxn }) {
  const summary = data?.summary || {};
  const txns = data?.transactions || [];
  const bills = data?.billPayments || [];
  const categories = data?.categories || [];
  const maxCat = categories[0]?.total || 1;

  if (txns.length === 0 && bills.length === 0) {
    return (
      <div style={{ padding: "0 20px" }} className="fade-in">
        <div className="card" style={{ padding: "40px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🤷</div>
          <div style={{ fontSize: 14, color: "var(--w50)" }}>{data.message || "No transactions"}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 20px" }} className="fade-in">
      {/* Hero total */}
      <div className="card glow" style={{ padding: 24, marginBottom: 14, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, var(--gold-dim) 0%, transparent 70%)" }} />
        <div style={{ fontSize: 12, color: "var(--w30)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Total spent</div>
        <div style={{ fontSize: 38, fontWeight: 300, letterSpacing: -1 }}><span style={{ color: "var(--w30)", fontSize: 24 }}>₹</span>{fmt(summary.totalSpent)}</div>
        <div style={{ fontSize: 13, color: "var(--w30)", marginTop: 8 }}>
          {summary.debitCount} txn{summary.debitCount !== 1 ? "s" : ""} · {formatDateLong(date)}
          {summary.totalBillPayment > 0 && <span style={{ color: "var(--blue)", marginLeft: 6 }}>· excl. ₹{fmt(summary.totalBillPayment)} bills</span>}
        </div>
      </div>

      {/* Summary mini-cards */}
      {(() => {
        const showIn = summary.totalCredit > 0;
        const showBills = summary.totalBillPayment > 0;
        const cols = 1 + (showIn ? 1 : 0) + (showBills ? 1 : 0);
        return (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10, marginBottom: 24 }}>
            <SummaryCard icon={ArrowUpRight} label="Out" value={summary.totalSpent} colorVar="red" />
            {showIn && <SummaryCard icon={ArrowDownLeft} label="In" value={summary.totalCredit} colorVar="green" />}
            {showBills && <SummaryCard icon={CreditCard} label="Bills" value={summary.totalBillPayment} colorVar="blue" />}
          </div>
        );
      })()}

      {/* Category breakdown */}
      {categories.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>Where it went</div>
          <div className="card" style={{ padding: "6px 20px" }}>
            {categories.map(cat => <CategoryRow key={cat.name} cat={cat} maxTotal={maxCat} />)}
          </div>
        </div>
      )}

      {/* Recent transactions → link to /transactions page */}
      {txns.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 500 }}>Transactions</div>
            <Link to="/transactions" style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              See all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="card">
            {txns.slice(0, 5).map((t, i) => <TransactionRow key={i} txn={t} onEditCategory={setEditTxn} onAdjust={setAdjustTxn} />)}
          </div>
        </div>
      )}

      {/* Insights quick-link */}
      <Link
        to="/insights"
        style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, textDecoration: "none", marginBottom: 8 }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--gold-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <BarChart2 size={18} style={{ color: "var(--gold)" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--w)" }}>Spending Insights</div>
          <div style={{ fontSize: 12, color: "var(--w30)", marginTop: 2 }}>Analyse across date ranges</div>
        </div>
        <ChevronRight size={16} style={{ color: "var(--w30)" }} />
      </Link>
    </div>
  );
}

// ─── Transactions Page ────────────────────────────────────────────────────────

function TransactionsPage({ data, setEditTxn, setAdjustTxn, date }) {
  const [search, setSearch] = useState("");
  const [fType, setFType] = useState("all");
  const [fBank, setFBank] = useState("all");
  const [showExport, setShowExport] = useState(false);

  if (!data) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }} className="fade-in">
        <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>No data yet</div>
        <div style={{ fontSize: 13, color: "var(--w30)", marginBottom: 20 }}>Pick a date and fetch from home</div>
        <Link to="/" style={{ fontSize: 13, color: "var(--gold)", textDecoration: "none" }}>← Go to Home</Link>
      </div>
    );
  }

  const allTxns = [...(data.transactions || []), ...(data.billPayments || [])];
  const bankList = [...new Set(allTxns.map(t => t.bank))];
  const filtered = allTxns.filter(t => {
    if (search && !t.merchant.toLowerCase().includes(search.toLowerCase())) return false;
    if (fType === "debit" && t.type !== "debit") return false;
    if (fType === "credit" && t.type !== "credit") return false;
    if (fType === "bill" && t.category !== "Bill Payment") return false;
    if (fBank !== "all" && t.bank !== fBank) return false;
    return true;
  });

  function handleExport(fmt) {
    setShowExport(false);
    if (filtered.length === 0) return;
    const headers = ["Date", "Merchant", "Category", "Type", "Amount", "Bank", "Card", "Time"];
    const rows = filtered.map(t => [
      date, t.merchant, t.category, t.type, t.amount, t.bank || "", t.cardType || "", t.time || "",
    ]);
    exportTable(fmt, {
      filename: `transactions-${date}`,
      title: `Transactions — ${date} (amounts in INR)`,
      headers, rows,
    }).catch(e => alert("Export failed: " + e.message));
  }

  return (
    <div style={{ padding: "0 20px" }} className="fade-in">
      {showExport && <ExportMenu onPick={handleExport} onClose={() => setShowExport(false)} />}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: 14, top: 12, color: "var(--w30)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ width: "100%", paddingLeft: 36 }} />
        </div>
        <select value={fType} onChange={e => setFType(e.target.value)} style={{ width: 80, paddingRight: 8 }}>
          <option value="all">All</option><option value="debit">Spent</option>
          <option value="credit">Received</option><option value="bill">Bills</option>
        </select>
        <select value={fBank} onChange={e => setFBank(e.target.value)} style={{ width: 80, paddingRight: 8 }}>
          <option value="all">Banks</option>
          {bankList.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <button onClick={() => setShowExport(true)} disabled={filtered.length === 0} title="Export"
          style={{ width: 40, flexShrink: 0, borderRadius: 12, background: "var(--gold-dim)", border: "1px solid var(--gold)", color: "var(--gold)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: filtered.length === 0 ? 0.4 : 1 }}>
          <Download size={16} />
        </button>
      </div>
      <div style={{ fontSize: 12, color: "var(--w30)", marginBottom: 14 }}>
        {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
      </div>
      <div className="card">
        {filtered.length === 0
          ? <div style={{ padding: 40, textAlign: "center", color: "var(--w30)", fontSize: 13 }}>No matching transactions</div>
          : filtered.map((t, i) => <TransactionRow key={i} txn={t} onEditCategory={setEditTxn} onAdjust={setAdjustTxn} />)
        }
      </div>
    </div>
  );
}

// ─── Export format picker ─────────────────────────────────────────────────────

function ExportMenu({ onPick, onClose }) {
  const opts = [
    { fmt: "csv", label: "CSV", desc: "Comma-separated (.csv)" },
    { fmt: "excel", label: "Excel", desc: "Spreadsheet (.xlsx)" },
    { fmt: "pdf", label: "PDF", desc: "Document (.pdf)" },
  ];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ padding: 20, maxWidth: 320, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Export as</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--w30)" }}><X size={20} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {opts.map(o => (
            <button key={o.fmt} onClick={() => onPick(o.fmt)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--w10)", border: "1px solid var(--border)", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--gold-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Download size={16} style={{ color: "var(--gold)" }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--w)" }}>{o.label}</div>
                <div style={{ fontSize: 11, color: "var(--w30)" }}>{o.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Monthly Page ─────────────────────────────────────────────────────────────

function MonthlyPage() {
  const pad = n => String(n).padStart(2, "0");
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() + 1 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showExport, setShowExport] = useState(false);

  const monthStr = `${ym.y}-${pad(ym.m)}`;
  const monthLabel = new Date(ym.y, ym.m - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });

  useEffect(() => {
    let active = true;
    setLoading(true); setError(null);
    fetchMonthly(monthStr)
      .then(d => { if (active) setResult(d); })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [monthStr]);

  function shiftMonth(delta) {
    setYm(({ y, m }) => {
      let nm = m + delta, ny = y;
      if (nm < 1) { nm = 12; ny--; }
      if (nm > 12) { nm = 1; ny++; }
      return { y: ny, m: nm };
    });
  }

  function handleExport(fmt) {
    setShowExport(false);
    if (!result || result.days.length === 0) return;
    const headers = ["Date", "In", "Out", "Bill Payment"];
    const rows = result.days.map(d => [d.date, d.in, d.out, d.bill]);
    rows.push(["Total", result.totals.in, result.totals.out, result.totals.bill]);
    exportTable(fmt, {
      filename: `expenses-${monthStr}`,
      title: `Expenses — ${monthLabel} (amounts in INR)`,
      headers, rows,
    }).catch(e => alert("Export failed: " + e.message));
  }

  const days = result?.days || [];
  const totals = result?.totals || { in: 0, out: 0, bill: 0 };

  return (
    <div style={{ padding: "0 20px" }} className="fade-in">
      {showExport && <ExportMenu onPick={handleExport} onClose={() => setShowExport(false)} />}

      {/* Month selector + export */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <button onClick={() => shiftMonth(-1)} style={{ width: 34, height: 34, borderRadius: 9, background: "var(--card)", border: "1px solid var(--border)", color: "var(--w50)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={18} /></button>
        <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 500 }}>{monthLabel}</div>
        <button onClick={() => shiftMonth(1)} style={{ width: 34, height: 34, borderRadius: 9, background: "var(--card)", border: "1px solid var(--border)", color: "var(--w50)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={18} /></button>
        <button onClick={() => setShowExport(true)} disabled={days.length === 0} title="Export"
          style={{ width: 34, height: 34, borderRadius: 9, background: "var(--gold-dim)", border: "1px solid var(--gold)", color: "var(--gold)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: days.length === 0 ? 0.4 : 1 }}>
          <Download size={16} />
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40 }}><Loader2 size={24} className="spin" style={{ color: "var(--gold)" }} /></div>}
      {error && <div style={{ padding: "12px 16px", background: "var(--red-bg)", borderRadius: 12, color: "var(--red)", fontSize: 13 }}>{error}</div>}

      {!loading && !error && (
        <>
          {/* Totals summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            <SummaryCard icon={ArrowDownLeft} label="In" value={totals.in} colorVar="green" />
            <SummaryCard icon={ArrowUpRight} label="Out" value={totals.out} colorVar="red" />
            <SummaryCard icon={CreditCard} label="Bills" value={totals.bill} colorVar="blue" />
          </div>

          {days.length === 0 ? (
            <div className="card" style={{ padding: "40px 20px", textAlign: "center", color: "var(--w30)", fontSize: 13 }}>
              No transactions cached for {monthLabel}.
            </div>
          ) : (
            <div className="card" style={{ overflow: "hidden" }}>
              {/* header row */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 11, color: "var(--w30)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                <div>Date</div>
                <div style={{ textAlign: "right", color: "var(--green)" }}>In</div>
                <div style={{ textAlign: "right", color: "var(--red)" }}>Out</div>
                <div style={{ textAlign: "right", color: "var(--blue)" }}>Bill</div>
              </div>
              {days.map((d, i) => {
                const day = new Date(d.date + "T00:00:00");
                const label = `${day.getDate()} ${day.toLocaleString("en-US", { weekday: "short" })}`;
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", padding: "11px 16px", borderBottom: i < days.length - 1 ? "1px solid var(--w10)" : "none", fontSize: 13, alignItems: "center" }}>
                    <div style={{ fontWeight: 500 }}>{label}</div>
                    <div style={{ textAlign: "right", color: d.in ? "var(--green)" : "var(--w10)" }}>{d.in ? fmt(d.in) : "—"}</div>
                    <div style={{ textAlign: "right", color: d.out ? "var(--w80)" : "var(--w10)" }}>{d.out ? fmt(d.out) : "—"}</div>
                    <div style={{ textAlign: "right", color: d.bill ? "var(--blue)" : "var(--w10)" }}>{d.bill ? fmt(d.bill) : "—"}</div>
                  </div>
                );
              })}
              {/* totals row */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", padding: "12px 16px", borderTop: "1px solid var(--border)", fontSize: 13, fontWeight: 600, background: "var(--w10)" }}>
                <div>Total</div>
                <div style={{ textAlign: "right", color: "var(--green)" }}>{fmt(totals.in)}</div>
                <div style={{ textAlign: "right", color: "var(--red)" }}>{fmt(totals.out)}</div>
                <div style={{ textAlign: "right", color: "var(--blue)" }}>{fmt(totals.bill)}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── SMS Page ─────────────────────────────────────────────────────────────────

function SmsPage({ date }) {
  const [text, setText] = useState("");
  const [smsDate, setSmsDate] = useState(date);
  const [entries, setEntries] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [lastResult, setLastResult] = useState(undefined);

  useEffect(() => {
    setSmsDate(date);
    loadEntries(date);
  }, [date]);

  async function loadEntries(d) {
    setLoadingEntries(true);
    try { setEntries(await fetchSMSInbox(d)); } catch {}
    setLoadingEntries(false);
  }

  async function handleSubmit() {
    if (!text.trim()) return;
    setSaving(true);
    setLastResult(null);
    try {
      const result = await submitSMS(text.trim(), smsDate);
      setLastResult(result.parsed);
      setText("");
      await loadEntries(smsDate);
    } catch (e) {
      alert("Failed: " + e.message);
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    try {
      await deleteSMSEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      alert("Failed to delete: " + e.message);
    }
  }

  return (
    <div style={{ padding: "0 20px" }} className="fade-in">
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Add SMS manually</div>
        <div style={{ fontSize: 12, color: "var(--w30)", marginBottom: 14 }}>Paste a bank SMS — it will be encrypted and included in your report</div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="e.g. Sent Rs.500 from Kotak Bank AC X5658 to merchant@upi"
          rows={4}
          style={{ width: "100%", marginBottom: 12, fontFamily: "inherit", fontSize: 13, resize: "vertical", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--w)", padding: "10px 14px", boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--w30)", marginBottom: 4 }}>Date</div>
            <input type="date" value={smsDate} onChange={e => setSmsDate(e.target.value)} style={{ width: "100%" }} />
          </div>
        </div>
        {lastResult !== undefined && lastResult !== null && (
          <div style={{ padding: "10px 14px", background: "var(--green-bg)", borderRadius: 10, marginBottom: 12, fontSize: 13 }}>
            ✅ Parsed: {lastResult.type === "debit" ? "-" : "+"}₹{lastResult.amount} · {lastResult.merchant} · {lastResult.bank}
          </div>
        )}
        {lastResult === null && lastResult !== undefined && (
          <div style={{ padding: "10px 14px", background: "var(--w10)", borderRadius: 10, marginBottom: 12, fontSize: 13, color: "var(--w50)" }}>
            ⚠️ Saved but could not parse transaction — SMS format may not be supported
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={saving || !text.trim()}
          style={{ width: "100%", padding: 12, background: "var(--gold)", color: "#0A0A0A", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: saving || !text.trim() ? 0.5 : 1 }}
        >
          {saving ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
          {saving ? "Saving..." : "Save SMS"}
        </button>
      </div>

      {loadingEntries && <div style={{ textAlign: "center", padding: 20 }}><Loader2 size={20} className="spin" style={{ color: "var(--gold)" }} /></div>}

      {!loadingEntries && entries.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: "var(--w30)", marginBottom: 10 }}>{entries.length} saved for {smsDate}</div>
          <div className="card">
            {entries.map((entry, i) => (
              <div key={entry.id} style={{ padding: "14px 20px", borderBottom: i < entries.length - 1 ? "1px solid var(--border)" : "none", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--gold-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MessageSquare size={16} style={{ color: "var(--gold)" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {entry.parsed ? (
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      <span style={{ color: entry.parsed.type === "debit" ? "var(--red)" : "var(--green)" }}>{entry.parsed.type === "debit" ? "-" : "+"}₹{fmt(entry.parsed.amount)}</span>
                      {" · "}{entry.parsed.merchant}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "var(--w50)" }}>Could not parse</div>
                  )}
                  <div style={{ fontSize: 11, color: "var(--w30)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.preview}</div>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--w30)", flexShrink: 0, padding: 4, display: "flex", alignItems: "center" }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loadingEntries && entries.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 20px", color: "var(--w30)", fontSize: 13 }}>
          No SMS saved for {smsDate}
        </div>
      )}
    </div>
  );
}

// ─── Insights Page ────────────────────────────────────────────────────────────

function InsightsPage() {
  const pad = n => String(n).padStart(2, "0");
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const monthAgo = new Date(today); monthAgo.setDate(today.getDate() - 30);
  const monthAgoStr = `${monthAgo.getFullYear()}-${pad(monthAgo.getMonth() + 1)}-${pad(monthAgo.getDate())}`;

  const [from, setFrom] = useState(monthAgoStr);
  const [to, setTo] = useState(todayStr);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("merchant");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMissing, setShowMissing] = useState(false);

  async function handleSearch() {
    setLoading(true); setError(null); setResult(null);
    try {
      const params = { from, to };
      if (query.trim()) {
        if (mode === "merchant") params.merchant = query.trim();
        else params.category = query.trim();
      }
      setResult(await fetchInsights(params));
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div style={{ padding: "0 20px" }} className="fade-in">
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 14 }}>Spending Insights</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--w30)", marginBottom: 4 }}>From</div>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: "100%" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--w30)", marginBottom: 4 }}>To</div>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: "100%" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {["merchant", "category"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, border: `1px solid ${mode === m ? "var(--gold)" : "var(--w10)"}`, background: mode === m ? "var(--gold-dim)" : "transparent", color: mode === m ? "var(--gold)" : "var(--w50)", cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>
              {m}
            </button>
          ))}
        </div>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <Search size={15} style={{ position: "absolute", left: 14, top: 12, color: "var(--w30)" }} />
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} placeholder={mode === "merchant" ? "e.g. Swiggy, Zomato, Blinkit..." : "e.g. Food Delivery, Bill Payment..."} style={{ width: "100%", paddingLeft: 36 }} />
        </div>
        {mode === "merchant" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {["Swiggy", "Zomato", "Blinkit", "CRED", "Amazon", "Zepto"].map(m => (
              <button key={m} className="chip" onClick={() => setQuery(m)}>{m}</button>
            ))}
          </div>
        )}
        <button onClick={handleSearch} disabled={loading} style={{ width: "100%", padding: 12, background: "var(--gold)", color: "#0A0A0A", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: loading ? 0.5 : 1 }}>
          {loading ? <Loader2 size={16} className="spin" /> : <BarChart2 size={16} />}
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <div style={{ padding: "12px 16px", background: "var(--red-bg)", borderRadius: 12, color: "var(--red)", fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {result && (
        <div className="fade-in">
          <div className="card glow" style={{ padding: 24, marginBottom: 14, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, var(--gold-dim) 0%, transparent 70%)" }} />
            <div style={{ fontSize: 12, color: "var(--w30)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
              Total spent{query ? ` on "${query}"` : ""}
            </div>
            <div style={{ fontSize: 38, fontWeight: 300, letterSpacing: -1 }}><span style={{ color: "var(--w30)", fontSize: 24 }}>₹</span>{fmt(result.total)}</div>
            <div style={{ fontSize: 13, color: "var(--w30)", marginTop: 8 }}>{result.count} transaction{result.count !== 1 ? "s" : ""} · {result.from} → {result.to}</div>
            <div style={{ fontSize: 12, color: "var(--w30)", marginTop: 4 }}>{result.cachedDates.length} days cached{result.missingDates.length > 0 ? `, ${result.missingDates.length} missing` : ""}</div>
          </div>

          {result.missingDates.length > 0 && (
            <div style={{ padding: "12px 16px", background: "var(--gold-dim)", border: "1px solid var(--gold)33", borderRadius: 12, marginBottom: 14, fontSize: 12 }}>
              <div style={{ color: "var(--gold)", fontWeight: 500, marginBottom: 2 }}>⚠ {result.missingDates.length} day{result.missingDates.length !== 1 ? "s" : ""} not cached yet</div>
              <div style={{ color: "var(--w30)", marginBottom: 6 }}>Open those dates in the dashboard to fetch and cache them.</div>
              <button onClick={() => setShowMissing(v => !v)} style={{ fontSize: 11, color: "var(--gold)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                {showMissing ? "Hide ▲" : "Show dates ▼"}
              </button>
              {showMissing && <div style={{ marginTop: 6, color: "var(--w30)", lineHeight: 1.8, fontSize: 11 }}>{result.missingDates.join(" · ")}</div>}
            </div>
          )}

          {result.merchantBreakdown.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>By merchant</div>
              <div className="card" style={{ padding: "6px 20px" }}>
                {result.merchantBreakdown.map((m, i) => (
                  <div key={i} style={{ padding: "12px 0", borderBottom: i < result.merchantBreakdown.length - 1 ? "1px solid var(--border)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{m.merchant}</div>
                      <div style={{ fontSize: 11, color: "var(--w30)", marginTop: 2 }}>{m.count} txn{m.count !== 1 ? "s" : ""}</div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: "var(--red)" }}>₹{fmt(m.total)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!result.filter.merchant && result.categoryBreakdown.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 10 }}>By category</div>
              <div className="card" style={{ padding: "6px 20px" }}>
                {result.categoryBreakdown.map((c, i) => {
                  const { color } = getCategoryConfig(c.category);
                  return (
                    <div key={i} style={{ padding: "12px 0", borderBottom: i < result.categoryBreakdown.length - 1 ? "1px solid var(--border)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color }}>{c.category}</div>
                        <div style={{ fontSize: 11, color: "var(--w30)", marginTop: 2 }}>{c.count} txn{c.count !== 1 ? "s" : ""}</div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 500 }}>₹{fmt(c.total)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {result.count === 0 && (
            <div className="card" style={{ padding: "40px 20px", textAlign: "center", color: "var(--w30)", fontSize: 13 }}>
              No transactions found. Fetch more dates in the dashboard first.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AI Page ──────────────────────────────────────────────────────────────────

function AiPage({ data, msgs, setMsgs, inp, setInp, busy, handleAsk }) {
  return (
    <div style={{ padding: "0 20px" }} className="fade-in">
      <div className="card" style={{ padding: 20, minHeight: 420, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", marginBottom: 14 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 14 }}>
              {m.role === "assistant" && <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--gold-dim)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10, flexShrink: 0, marginTop: 2 }}><Sparkles size={16} style={{ color: "var(--gold)" }} /></div>}
              <div className="bubble" style={{ background: m.role === "user" ? "var(--gold)" : "var(--w10)", color: m.role === "user" ? "#0A0A0A" : "var(--w80)", borderBottomRightRadius: m.role === "user" ? 4 : 18, borderBottomLeftRadius: m.role === "assistant" ? 4 : 18, fontWeight: m.role === "user" ? 500 : 400 }}>{m.content}</div>
            </div>
          ))}
          {busy && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--gold-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Sparkles size={16} style={{ color: "var(--gold)" }} /></div><div className="bubble" style={{ background: "var(--w10)", color: "var(--w30)", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}><Loader2 size={14} className="spin" /> Thinking...</div></div>}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {["Food spend?", "Biggest expense?", "Which card most?", "Am I overspending?"].map(q => <button className="chip" key={q} onClick={() => setInp(q)}>{q}</button>)}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAsk()} placeholder="Ask anything..." style={{ flex: 1 }} />
          <button onClick={handleAsk} disabled={busy || !inp.trim() || !data} style={{ padding: "10px 20px", background: "var(--gold)", color: "#0A0A0A", border: "none", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, fontFamily: "inherit", opacity: busy || !data ? 0.4 : 1 }}><Send size={15} /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Cartoon Loading Animation ───────────────────────────────────────────────

function LoadingAnimation({ date, hasGmail = true }) {
  const firstStep = hasGmail ? "Parsing emails" : "Reading SMS inbox";
  return (
    <div style={{ padding: "44px 20px 36px", textAlign: "center" }} className="fade-in">
      <svg viewBox="0 0 220 185" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ width: 220, height: 185, display: "block", margin: "0 auto 22px", overflow: "visible" }}>

        {/* ── Box body ── */}
        <rect x="80" y="118" width="92" height="60" rx="8" fill="#1A1A1A" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
        <line x1="126" y1="118" x2="126" y2="178" stroke="rgba(200,169,81,0.12)" strokeWidth="2"/>
        <line x1="80" y1="148" x2="172" y2="148" stroke="rgba(200,169,81,0.08)" strokeWidth="1.5"/>
        <rect x="94" y="128" width="44" height="26" rx="5" fill="rgba(200,169,81,0.06)" stroke="rgba(200,169,81,0.18)" strokeWidth="1"/>
        <text x="116" y="145" textAnchor="middle" fontSize="9" fill="rgba(200,169,81,0.65)" fontFamily="system-ui, sans-serif">BANK</text>

        {/* ── Box lid (bounces open) ── */}
        <g className="cart-lid">
          <rect x="75" y="106" width="102" height="17" rx="6" fill="#222" stroke="rgba(255,255,255,0.09)" strokeWidth="1.5"/>
          <rect x="112" y="99" width="24" height="9" rx="3" fill="#282828" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
        </g>

        {/* ── Receipt 1 — flies straight up ── */}
        <g className="cart-receipt-1">
          <rect x="104" y="78" width="24" height="32" rx="3" fill="#1C1C1C" stroke="rgba(255,255,255,0.13)" strokeWidth="1.2"/>
          <line x1="109" y1="87" x2="124" y2="87" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
          <line x1="109" y1="92" x2="124" y2="92" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
          <line x1="109" y1="97" x2="119" y2="97" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
          <text x="116" y="86" textAnchor="middle" fontSize="8" fill="rgba(200,169,81,0.55)" fontFamily="system-ui">₹</text>
        </g>

        {/* ── Receipt 2 — flies up-right ── */}
        <g className="cart-receipt-2">
          <rect x="152" y="80" width="21" height="27" rx="3" fill="#1C1C1C" stroke="rgba(0,200,83,0.22)" strokeWidth="1.2"/>
          <line x1="156" y1="88" x2="169" y2="88" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
          <line x1="156" y1="93" x2="169" y2="93" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
          <line x1="156" y1="98" x2="164" y2="98" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
        </g>

        {/* ── Receipt 3 — flies up-left ── */}
        <g className="cart-receipt-3">
          <rect x="70" y="82" width="21" height="27" rx="3" fill="#1C1C1C" stroke="rgba(59,130,246,0.25)" strokeWidth="1.2"/>
          <line x1="74" y1="90" x2="87" y2="90" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
          <line x1="74" y1="95" x2="87" y2="95" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
          <line x1="74" y1="100" x2="83" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
        </g>

        {/* ── Robot body ── */}
        <rect x="16" y="118" width="40" height="50" rx="11" fill="#1A1A1A" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
        <rect x="24" y="131" width="24" height="15" rx="4" fill="rgba(200,169,81,0.07)" stroke="rgba(200,169,81,0.18)" strokeWidth="1"/>
        <circle cx="36" cy="138" r="3.5" fill="rgba(200,169,81,0.35)"/>
        <rect x="22" y="152" width="8" height="5" rx="2" fill="rgba(255,255,255,0.06)"/>
        <rect x="42" y="152" width="8" height="5" rx="2" fill="rgba(255,255,255,0.06)"/>

        {/* ── Robot head ── */}
        <rect x="13" y="79" width="46" height="42" rx="13" fill="#1E1E1E" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"/>
        {/* Antenna */}
        <line x1="36" y1="79" x2="36" y2="68" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="36" cy="65" r="4" fill="#C8A951" className="cart-antenna"/>

        {/* Eyes (gold rectangular screens) */}
        <rect x="18" y="88" width="13" height="9" rx="3" fill="rgba(200,169,81,0.1)" stroke="rgba(200,169,81,0.35)" strokeWidth="1"/>
        <rect x="41" y="88" width="13" height="9" rx="3" fill="rgba(200,169,81,0.1)" stroke="rgba(200,169,81,0.35)" strokeWidth="1"/>
        <rect className="cart-eyes" x="20" y="90" width="9" height="5" rx="1.5" fill="#C8A951"/>
        <rect className="cart-eyes" x="43" y="90" width="9" height="5" rx="1.5" fill="#C8A951"/>

        {/* Mouth grill lines */}
        <line x1="21" y1="106" x2="51" y2="106" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="24" y1="110" x2="48" y2="110" stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeLinecap="round"/>
        <line x1="27" y1="114" x2="45" y2="114" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeLinecap="round"/>

        {/* ── Arm reaching toward box ── */}
        <g className="cart-arm">
          <path d="M 54 130 Q 66 126 80 128" stroke="rgba(255,255,255,0.18)" strokeWidth="9" strokeLinecap="round" fill="none"/>
          <circle cx="82" cy="128" r="7" fill="#1E1E1E" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2"/>
          <line x1="78" y1="124" x2="86" y2="132" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="86" y1="124" x2="78" y2="132" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeLinecap="round"/>
        </g>

        {/* Sparkles */}
        <text x="174" y="70" fontSize="12" fill="rgba(200,169,81,0.4)" className="cart-receipt-1">✦</text>
        <text x="60" y="58" fontSize="10" fill="rgba(59,130,246,0.4)" className="cart-receipt-2">✦</text>
        <text x="188" y="102" fontSize="8" fill="rgba(0,200,83,0.4)" className="cart-receipt-3">✦</text>
      </svg>

      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Pulling your transactions...</div>
      <div style={{ fontSize: 12, color: "var(--w30)", marginBottom: 18 }}>{formatDateLong(date)}</div>

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
        {[[firstStep, "cart-dot-1"], ["AI categorising", "cart-dot-2"], ["Building report", "cart-dot-3"]].map(([label, cls]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--w30)" }}>
            <div className={cls} style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--gold)" }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page Transition Wrapper ──────────────────────────────────────────────────

function PageTransition({ children }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-slide">
      {children}
    </div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

function BottomNav() {
  const location = useLocation();
  const items = [
    { path: "/", label: "Home", icon: Wallet },
    { path: "/transactions", label: "Activity", icon: ArrowLeftRight },
    { path: "/monthly", label: "Monthly", icon: Calendar },
    { path: "/insights", label: "Insights", icon: BarChart2 },
    { path: "/sms", label: "SMS", icon: MessageSquare },
    { path: "/ai", label: "AI", icon: Sparkles },
  ];
  return (
    <div className="nav">
      {items.map(({ path, label, icon: Icon }) => {
        const active = location.pathname === path;
        return (
          <Link key={path} to={path} className={`nav-btn ${active ? "active" : ""}`} style={{ textDecoration: "none" }}>
            <Icon size={22} />
            <span style={{ fontWeight: active ? 500 : 400 }}>{label}</span>
            {active && <div style={{ width: 4, height: 4, borderRadius: 2, background: "var(--gold)", marginTop: 2 }} />}
          </Link>
        );
      })}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [authView, setAuthView] = useState(() => {
    const token = localStorage.getItem("token");
    const profile = localStorage.getItem("profile");
    return token && profile ? "dashboard" : "profiles";
  });
  const [currentProfile, setCurrentProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem("profile")); } catch { return null; }
  });
  const [pendingProfile, setPendingProfile] = useState(null);
  const idleTimerRef = useRef(null);
  const IDLE_TIMEOUT = 15 * 60 * 1000;

  useEffect(() => {
    function handleExpiry() {
      setCurrentProfile(null);
      setAuthView("profiles");
      setData(null);
      setError(null);
    }
    window.addEventListener("auth-expired", handleExpiry);
    return () => window.removeEventListener("auth-expired", handleExpiry);
  }, []);

  useEffect(() => {
    if (authView !== "dashboard") return;
    function resetTimer() {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        localStorage.clear();
        setCurrentProfile(null);
        setPendingProfile(null);
        setAuthView("profiles");
        setData(null);
        setError(null);
      }, IDLE_TIMEOUT);
    }
    const events = ["mousemove", "mousedown", "keypress", "touchstart", "scroll", "click"];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      clearTimeout(idleTimerRef.current);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [authView]);

  function handleProfileSelect(profile) {
    setPendingProfile(profile);
    setAuthView("pin");
  }

  function handlePinSuccess(profile) {
    setCurrentProfile(profile);
    setAuthView("dashboard");
  }

  function handleLogout() {
    localStorage.clear();
    setCurrentProfile(null);
    setPendingProfile(null);
    setAuthView("profiles");
    setData(null);
    setError(null);
    setBudget(null);
  }

  // Dashboard state
  const [date, setDate] = useState(() => {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [msgs, setMsgs] = useState([{ role: "assistant", content: "Hey! Pick a date and fetch your report. Then ask me anything." }]);
  const [inp, setInp] = useState("");
  const [busy, setBusy] = useState(false);
  const [editTxn, setEditTxn] = useState(null);
  const [adjustTxn, setAdjustTxn] = useState(null);
  const [budget, setBudget] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  async function refreshBudget() {
    try { setBudget(await fetchBudget()); } catch {}
  }

  // Load budget when entering the dashboard
  useEffect(() => {
    if (authView !== "dashboard") return;
    refreshBudget();
  }, [authView]);

  async function handleFetch(refresh = false) {
    setLoading(true); setError(null); setData(null);
    try {
      const result = await fetchReport(date, refresh);
      setData(result);
      setMsgs([{ role: "assistant", content: `Report loaded for ${formatDateLong(date)}! ${result.transactions.length} transactions, ₹${fmt(result.summary.totalSpent)} spent. Ask me anything.` }]);
      refreshBudget();
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  function shiftDate(days) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + days);
    const pad = n => String(n).padStart(2, "0");
    const dStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    if (dStr <= todayStr) setDate(dStr);
  }

  async function handleAsk() {
    if (!inp.trim() || !data) return;
    const q = inp.trim(); setInp("");
    setMsgs(p => [...p, { role: "user", content: q }]);
    setBusy(true);
    try {
      const answer = await askAI(q, data.transactions);
      setMsgs(p => [...p, { role: "assistant", content: answer }]);
    } catch { setMsgs(p => [...p, { role: "assistant", content: "Can't reach server. Try again." }]); }
    setBusy(false);
  }

  function handleCategorySave(merchant, newCategory) {
    if (data) {
      const updated = { ...data };
      const all = [
        ...updated.transactions.map(t => t.merchant === merchant ? { ...t, category: newCategory } : t),
        ...updated.billPayments.map(t => t.merchant === merchant ? { ...t, category: newCategory } : t),
      ];
      updated.billPayments = all.filter(t => t.category === "Bill Payment");
      updated.transactions = all.filter(t => t.category !== "Bill Payment");

      const debits = updated.transactions.filter(t => t.type === "debit");
      const totalSpent = Math.round(debits.reduce((s, t) => s + t.amount, 0));
      const totalBillPayment = Math.round(updated.billPayments.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0));
      const totalCredit = Math.round(updated.transactions.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0));

      const catMap = {};
      debits.forEach(t => {
        if (!catMap[t.category]) catMap[t.category] = { total: 0, count: 0 };
        catMap[t.category].total += t.amount;
        catMap[t.category].count++;
      });
      updated.categories = Object.entries(catMap)
        .map(([name, v]) => ({ name, total: Math.round(v.total), count: v.count, percentage: totalSpent > 0 ? Math.round((v.total / totalSpent) * 100) : 0 }))
        .sort((a, b) => b.total - a.total);

      updated.summary = { ...updated.summary, totalSpent, totalBillPayment, totalCredit, debitCount: debits.length };
      setData(updated);
    }
    setEditTxn(null);
    refreshBudget();
  }

  // ── Auth screens ────────────────────────────────────────────────────────────
  if (authView === "profiles") {
    return <ProfileSelect onSelect={handleProfileSelect} />;
  }

  if (authView === "pin") {
    return (
      <PinEntry
        profile={pendingProfile}
        onSuccess={handlePinSuccess}
        onBack={() => setAuthView("profiles")}
      />
    );
  }

  // ── Dashboard layout ─────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 110 }}>
      {editTxn && <CategoryModal txn={editTxn} onSave={handleCategorySave} onClose={() => setEditTxn(null)} />}
      {adjustTxn && (
        <AdjustModal
          txn={adjustTxn}
          onSave={() => { setAdjustTxn(null); handleFetch(); }}
          onDelete={() => { setAdjustTxn(null); handleFetch(); }}
          onClose={() => setAdjustTxn(null)}
        />
      )}
      {showBudgetModal && (
        <BudgetModal
          current={budget?.budget || 0}
          onSave={(result) => { setBudget(result); setShowBudgetModal(false); }}
          onClose={() => setShowBudgetModal(false)}
        />
      )}

      {/* Sticky header */}
      <div className="sticky-header" style={{ padding: "max(20px, env(safe-area-inset-top)) 20px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--gold-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wallet size={20} style={{ color: "var(--gold)" }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 500 }}>Expense Tracker</div>
              {currentProfile && (
                <div style={{ fontSize: 11, color: "var(--w30)", marginTop: 1, display: "flex", alignItems: "center", gap: 6 }}>
                  {currentProfile.name}
                  <span className="pill" style={{ background: "var(--gold-dim)", color: "var(--gold)" }}>
                    {currentProfile.hasGmail !== false ? "Gmail" : "SMS only"}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Switch profile"
            style={{ width: 36, height: 36, borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", color: "var(--w30)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Date controls — shown on home & transactions, hidden on insights/sms/ai */}
        <DateControls date={date} setDate={setDate} shiftDate={shiftDate} handleFetch={handleFetch} loading={loading} data={data} />
      </div>

      {/* Loading / error / empty */}
      {loading && <LoadingAnimation date={date} hasGmail={currentProfile?.hasGmail !== false} />}
      {error && !loading && (
        <div style={{ padding: "40px 20px", textAlign: "center" }} className="fade-in">
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--red-bg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}><AlertCircle size={28} style={{ color: "var(--red)" }} /></div>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: "var(--w50)", lineHeight: 1.6, maxWidth: 300, margin: "0 auto", whiteSpace: "pre-wrap" }}>{error}</div>
          <button onClick={handleFetch} style={{ marginTop: 20, padding: "10px 24px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--gold)", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 500 }}>Try again</button>
        </div>
      )}

      {/* Page routes */}
      {!loading && !error && (
        <PageTransition>
        <Routes>
          <Route path="/" element={
            <div className="fade-in">
              {/* Monthly budget — home only, scrolls with the page */}
              <div style={{ padding: "0 20px" }}>
                <BudgetBar data={budget} onEdit={() => setShowBudgetModal(true)} />
              </div>
              {data
                ? <HomePage data={data} date={date} setEditTxn={setEditTxn} setAdjustTxn={setAdjustTxn} />
                : <div style={{ padding: "40px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
                    <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>Pick a date & hit Fetch</div>
                    <div style={{ fontSize: 13, color: "var(--w30)" }}>Your daily expense report will appear here</div>
                  </div>}
            </div>
          } />
          <Route path="/transactions" element={<TransactionsPage data={data} setEditTxn={setEditTxn} setAdjustTxn={setAdjustTxn} date={date} />} />
          <Route path="/monthly" element={<MonthlyPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/sms" element={<SmsPage date={date} />} />
          <Route path="/ai" element={<AiPage data={data} msgs={msgs} setMsgs={setMsgs} inp={inp} setInp={setInp} busy={busy} handleAsk={handleAsk} />} />
        </Routes>
        </PageTransition>
      )}

      <BottomNav />
    </div>
  );
}

// ─── Date Controls (separated to use useLocation) ─────────────────────────────

function DateControls({ date, setDate, shiftDate, handleFetch, loading, data }) {
  const location = useLocation();
  const hideOnRoutes = ["/insights", "/sms", "/ai"];
  if (hideOnRoutes.includes(location.pathname)) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={() => shiftDate(-1)} style={{ width: 36, height: 36, borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", color: "var(--w50)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={18} /></button>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: 500 }} />
      <button onClick={() => shiftDate(1)} style={{ width: 36, height: 36, borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", color: "var(--w50)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={18} /></button>
      <button onClick={() => handleFetch(false)} disabled={loading} style={{ padding: "8px 20px", background: "var(--gold)", color: "#0A0A0A", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, opacity: loading ? 0.5 : 1 }}>
        {loading ? <Loader2 size={15} className="spin" /> : <RefreshCw size={15} />} {loading ? "Loading" : "Fetch"}
      </button>
      <button
        onClick={() => handleFetch(true)}
        disabled={loading}
        title="Refresh — re-fetch from Gmail and sync new transactions"
        style={{ width: 36, height: 36, borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", color: data ? "var(--gold)" : "var(--w30)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: loading ? 0.5 : 1, flexShrink: 0 }}
      >
        <RotateCw size={15} />
      </button>
    </div>
  );
}
