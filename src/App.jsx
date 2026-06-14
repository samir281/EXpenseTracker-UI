import { useState } from "react";
import {
  Wallet, Search, ChevronLeft, ChevronRight, RefreshCw,
  ArrowUpRight, ArrowDownLeft, CreditCard, Sparkles,
  ArrowLeftRight, Send, Loader2, AlertCircle, Pencil, Check, X, Plus,
} from "lucide-react";
import { fetchReport, askAI, saveOverride } from "./api";
import { getCategoryConfig, CATEGORY_NAMES, fmt, formatDateLong } from "./constants";

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

function TransactionRow({ txn, onEditCategory }) {
  const { icon: Icon, color } = getCategoryConfig(txn.category);
  const isDebit = txn.type === "debit";
  const isBill = txn.category === "Bill Payment";

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
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: isBill ? "var(--blue)" : isDebit ? "var(--red)" : "var(--green)" }}>
            {isDebit ? "-" : "+"}₹{fmt(txn.amount)}
          </div>
        </div>
        <button onClick={() => onEditCategory(txn)} style={{ width: 28, height: 28, borderRadius: 8, background: "var(--w10)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Pencil size={12} style={{ color: "var(--w30)" }} />
        </button>
      </div>
    </div>
  );
}

// Category Edit Modal
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

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("home");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [fType, setFType] = useState("all");
  const [fBank, setFBank] = useState("all");
  const [msgs, setMsgs] = useState([{ role: "assistant", content: "Hey! Pick a date and fetch your report. Then ask me anything." }]);
  const [inp, setInp] = useState("");
  const [busy, setBusy] = useState(false);
  const [editTxn, setEditTxn] = useState(null);

  async function handleFetch() {
    setLoading(true); setError(null); setData(null);
    try {
      const result = await fetchReport(date);
      setData(result);
      setMsgs([{ role: "assistant", content: `Report loaded for ${formatDateLong(date)}! ${result.transactions.length} transactions, ₹${fmt(result.summary.totalSpent)} spent. Ask me anything.` }]);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  function shiftDate(days) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + days);
    if (d <= new Date()) setDate(d.toISOString().split("T")[0]);
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
    // Update local state so UI reflects the change immediately
    if (data) {
      const updated = { ...data };
      updated.transactions = updated.transactions.map(t =>
        t.merchant === merchant ? { ...t, category: newCategory } : t
      );
      updated.billPayments = updated.billPayments.map(t =>
        t.merchant === merchant ? { ...t, category: newCategory } : t
      );
      // Recalculate categories
      const debits = updated.transactions.filter(t => t.type === "debit" && t.category !== "Bill Payment");
      const totalSpent = Math.round(debits.reduce((s, t) => s + t.amount, 0));
      const catMap = {};
      debits.forEach(t => {
        if (!catMap[t.category]) catMap[t.category] = { total: 0, count: 0 };
        catMap[t.category].total += t.amount;
        catMap[t.category].count++;
      });
      updated.categories = Object.entries(catMap)
        .map(([name, v]) => ({ name, total: Math.round(v.total), count: v.count, percentage: totalSpent > 0 ? Math.round((v.total / totalSpent) * 100) : 0 }))
        .sort((a, b) => b.total - a.total);
      updated.summary.totalSpent = totalSpent;
      setData(updated);
    }
    setEditTxn(null);
  }

  const txns = data?.transactions || [];
  const bills = data?.billPayments || [];
  const summary = data?.summary || {};
  const categories = data?.categories || [];
  const maxCat = categories[0]?.total || 1;
  const allTxns = [...txns, ...bills];
  const bankList = [...new Set(allTxns.map(t => t.bank))];
  const filtered = allTxns.filter(t => {
    if (search && !t.merchant.toLowerCase().includes(search.toLowerCase())) return false;
    if (fType === "debit" && t.type !== "debit") return false;
    if (fType === "credit" && t.type !== "credit") return false;
    if (fType === "bill" && t.category !== "Bill Payment") return false;
    if (fBank !== "all" && t.bank !== fBank) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 80 }}>

      {/* Category Edit Modal */}
      {editTxn && <CategoryModal txn={editTxn} onSave={handleCategorySave} onClose={() => setEditTxn(null)} />}

      {/* Header */}
      <div style={{ padding: "24px 20px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--gold-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wallet size={20} style={{ color: "var(--gold)" }} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 500 }}>Expense Tracker</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => shiftDate(-1)} style={{ width: 36, height: 36, borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", color: "var(--w50)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={18} /></button>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: 500 }} />
          <button onClick={() => shiftDate(1)} style={{ width: 36, height: 36, borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", color: "var(--w50)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={18} /></button>
          <button onClick={handleFetch} disabled={loading} style={{ padding: "8px 20px", background: "var(--gold)", color: "#0A0A0A", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, opacity: loading ? 0.5 : 1 }}>
            {loading ? <Loader2 size={15} className="spin" /> : <RefreshCw size={15} />} {loading ? "Loading" : "Fetch"}
          </button>
        </div>
      </div>

      {/* States */}
      {loading && (
        <div style={{ padding: "60px 20px", textAlign: "center" }} className="fade-in">
          <Loader2 size={36} className="spin" style={{ color: "var(--gold)", marginBottom: 16 }} />
          <div style={{ fontSize: 14, color: "var(--w50)" }}>Fetching transactions for {formatDateLong(date)}...</div>
          <div style={{ fontSize: 12, color: "var(--w30)", marginTop: 6 }}>Regex parsing → AI categorizing → Building report</div>
        </div>
      )}
      {error && !loading && (
        <div style={{ padding: "40px 20px", textAlign: "center" }} className="fade-in">
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--red-bg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}><AlertCircle size={28} style={{ color: "var(--red)" }} /></div>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: "var(--w50)", lineHeight: 1.6, maxWidth: 300, margin: "0 auto", whiteSpace: "pre-wrap" }}>{error}</div>
          <button onClick={handleFetch} style={{ marginTop: 20, padding: "10px 24px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--gold)", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 500 }}>Try again</button>
        </div>
      )}
      {!data && !loading && !error && (
        <div style={{ padding: "60px 20px", textAlign: "center" }} className="fade-in">
          <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>Pick a date & hit Fetch</div>
          <div style={{ fontSize: 13, color: "var(--w30)" }}>Your daily expense report will appear here</div>
        </div>
      )}

      {/* HOME */}
      {data && !loading && tab === "home" && (
        <div style={{ padding: "0 20px" }} className="fade-in">
          {txns.length === 0 && bills.length === 0 ? (
            <div className="card" style={{ padding: "40px 20px", textAlign: "center" }}><div style={{ fontSize: 32, marginBottom: 12 }}>🤷</div><div style={{ fontSize: 14, color: "var(--w50)" }}>{data.message || "No transactions"}</div></div>
          ) : (<>
            <div className="card glow" style={{ padding: 24, marginBottom: 14, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, var(--gold-dim) 0%, transparent 70%)" }} />
              <div style={{ fontSize: 12, color: "var(--w30)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Total spent</div>
              <div style={{ fontSize: 38, fontWeight: 300, letterSpacing: -1 }}><span style={{ color: "var(--w30)", fontSize: 24 }}>₹</span>{fmt(summary.totalSpent)}</div>
              <div style={{ fontSize: 13, color: "var(--w30)", marginTop: 8 }}>{summary.debitCount} txn{summary.debitCount !== 1 ? "s" : ""} · {formatDateLong(date)}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: summary.billPaymentCount > 0 ? "1fr 1fr 1fr" : "1fr 1fr", gap: 10, marginBottom: 24 }}>
              <SummaryCard icon={ArrowUpRight} label="Out" value={summary.totalSpent} colorVar="red" />
              <SummaryCard icon={ArrowDownLeft} label="In" value={summary.totalCredit} colorVar="green" />
              {summary.billPaymentCount > 0 && <SummaryCard icon={CreditCard} label="Bills" value={summary.totalBillPayment} colorVar="blue" />}
            </div>

            {categories.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>Where it went</div>
                <div className="card" style={{ padding: "6px 20px" }}>
                  {categories.map(cat => <CategoryRow key={cat.name} cat={cat} maxTotal={maxCat} />)}
                </div>
              </div>
            )}

            {txns.length > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>Transactions</div>
                  <button onClick={() => setTab("transactions")} style={{ fontSize: 12, color: "var(--gold)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>See all <ChevronRight size={14} /></button>
                </div>
                <div className="card">
                  {txns.slice(0, 5).map((t, i) => <TransactionRow key={i} txn={t} onEditCategory={setEditTxn} />)}
                </div>
              </div>
            )}
          </>)}
        </div>
      )}

      {/* TRANSACTIONS */}
      {data && !loading && tab === "transactions" && (
        <div style={{ padding: "0 20px" }} className="fade-in">
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: 14, top: 12, color: "var(--w30)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ width: "100%", paddingLeft: 36 }} />
            </div>
            <select value={fType} onChange={e => setFType(e.target.value)} style={{ width: 90, paddingRight: 8 }}><option value="all">All</option><option value="debit">Spent</option><option value="credit">Received</option><option value="bill">Bills</option></select>
            <select value={fBank} onChange={e => setFBank(e.target.value)} style={{ width: 90, paddingRight: 8 }}><option value="all">All banks</option>{bankList.map(b => <option key={b} value={b}>{b}</option>)}</select>
          </div>
          <div style={{ fontSize: 12, color: "var(--w30)", marginBottom: 14 }}>{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</div>
          <div className="card">
            {filtered.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: "var(--w30)", fontSize: 13 }}>No matching transactions</div>
              : filtered.map((t, i) => <TransactionRow key={i} txn={t} onEditCategory={setEditTxn} />)}
          </div>
        </div>
      )}

      {/* AI CHAT */}
      {data && !loading && tab === "insights" && (
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
      )}

      {/* Nav */}
      <div className="nav">
        {[{ id: "home", label: "Home", icon: Wallet }, { id: "transactions", label: "Activity", icon: ArrowLeftRight }, { id: "insights", label: "AI", icon: Sparkles }].map(t => {
          const Icon = t.icon; const active = tab === t.id;
          return <button key={t.id} className={`nav-btn ${active ? "active" : ""}`} onClick={() => setTab(t.id)}><Icon size={22} /><span style={{ fontWeight: active ? 500 : 400 }}>{t.label}</span>{active && <div style={{ width: 4, height: 4, borderRadius: 2, background: "var(--gold)", marginTop: 2 }} />}</button>;
        })}
      </div>
    </div>
  );
}