import { useState, useEffect } from "react";
import { api } from "../../api";
import { toast } from "sonner";
import { Plus, Trash2, Edit3, CheckCircle, Smartphone, CreditCard, Building2, X, Save, AlertCircle, Wifi, WifiOff } from "lucide-react";

export const METHOD_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; placeholder: string; hint: string }> = {
  JazzCash:  { label: "JazzCash",  color: "#dc2626", bg: "#fef2f2", icon: Smartphone,   placeholder: "03XX-XXXXXXX",             hint: "JazzCash mobile account number" },
  Easypaisa: { label: "Easypaisa", color: "#059669", bg: "#f0fdf4", icon: CreditCard,   placeholder: "03XX-XXXXXXX",             hint: "Easypaisa mobile account number" },
  Bank:      { label: "Bank",      color: "#2563eb", bg: "#eff6ff", icon: Building2,    placeholder: "PK00 XXXX 0000 0000 0000 00", hint: "IBAN or account number" },
};

export interface PaymentMethod {
  id: number;
  method_type: string;
  account_title: string;
  account_number: string;
  bank_name?: string;
  instructions?: string;
  is_active: boolean;
}

const LS_KEY = "scholariq_teacher_payment_methods";

function lsLoad(): PaymentMethod[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function lsSave(methods: PaymentMethod[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(methods));
}
function lsNextId(methods: PaymentMethod[]) {
  return methods.length > 0 ? Math.max(...methods.map(m => m.id)) + 1 : 1;
}

// Also export so CoursesPage can read teacher's local payment methods
export function getLocalPaymentMethods(): PaymentMethod[] { return lsLoad(); }

const EMPTY_FORM = { method_type: "JazzCash", account_title: "", account_number: "", bank_name: "", instructions: "" };

export function TeacherPaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [usingLocal, setUsingLocal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.teacher.getPaymentMethods();
      const arr = Array.isArray(data) ? data : data.methods ?? [];
      setMethods(arr);
      setUsingLocal(false);
    } catch (err: any) {
      // Backend not ready → use localStorage
      const local = lsLoad();
      setMethods(local);
      setUsingLocal(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ ...EMPTY_FORM }); setEditId(null); setShowForm(true); };
  const openEdit = (m: PaymentMethod) => {
    setForm({ method_type: m.method_type, account_title: m.account_title, account_number: m.account_number, bank_name: m.bank_name ?? "", instructions: m.instructions ?? "" });
    setEditId(m.id); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm({ ...EMPTY_FORM }); };

  const handleSave = async () => {
    if (!form.account_title.trim()) { toast.error("Account title is required"); return; }
    if (!form.account_number.trim()) { toast.error("Account number is required"); return; }
    if (form.method_type === "Bank" && !form.bank_name?.trim()) { toast.error("Bank name is required"); return; }
    setSaving(true);
    try {
      if (usingLocal) {
        // localStorage mode
        const current = lsLoad();
        if (editId) {
          const updated = current.map(m => m.id === editId ? { ...m, ...form } : m);
          lsSave(updated); setMethods(updated);
          toast.success("Payment method updated");
        } else {
          const newM: PaymentMethod = { id: lsNextId(current), ...form, is_active: true } as PaymentMethod;
          const updated = [...current, newM];
          lsSave(updated); setMethods(updated);
          toast.success("Payment method added");
        }
        closeForm();
      } else {
        // Real backend
        if (editId) {
          await api.teacher.updatePaymentMethod(editId, form);
          toast.success("Payment method updated");
        } else {
          await api.teacher.addPaymentMethod(form as any);
          toast.success("Payment method added");
        }
        closeForm(); await load();
      }
    } catch (err: any) {
      // If backend fails mid-session, fall back to local
      if ((err as any)?.status === 404) {
        setUsingLocal(true);
        toast.info("Switching to local storage mode");
        setSaving(false);
        await handleSave();
        return;
      }
      toast.error(err.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this payment method?")) return;
    setDeletingId(id);
    try {
      if (usingLocal) {
        const updated = lsLoad().filter(m => m.id !== id);
        lsSave(updated); setMethods(updated);
        toast.success("Payment method deleted");
      } else {
        await api.teacher.deletePaymentMethod(id);
        toast.success("Payment method deleted");
        setMethods(prev => prev.filter(m => m.id !== id));
      }
    } catch (err: any) { toast.error(err.message || "Failed to delete"); }
    finally { setDeletingId(null); }
  };

  const cfg = METHOD_CONFIG[form.method_type];

  if (loading) return (
    <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8", fontSize: 14 }}>Loading...</div>
  );

  return (
    <div>
      <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", margin: 0 }}>My Payment Methods</h3>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Students see these details when paying for your courses</p>
        </div>
        <button onClick={openAdd}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 12, background: "linear-gradient(135deg,#f4c44e,#e8b43a)", border: "none", color: "#1e293b", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 12px rgba(244,196,78,0.35)" }}>
          <Plus size={16} /> Add Method
        </button>
      </div>

      {/* Mode banner */}
      <div style={{ display: "flex", gap: 10, padding: "11px 16px", background: usingLocal ? "#fffbeb" : "#f0fdf4", border: `1px solid ${usingLocal ? "#fde68a" : "#bbf7d0"}`, borderRadius: 12, marginBottom: 22 }}>
        {usingLocal ? <WifiOff size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} /> : <Wifi size={15} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />}
        <p style={{ fontSize: 12, color: usingLocal ? "#92400e" : "#166534", margin: 0, lineHeight: 1.6 }}>
          {usingLocal
            ? <><strong>Demo mode</strong> — Backend API not available yet. Methods are saved locally in your browser. They'll migrate to the server once the backend endpoint is ready.</>
            : <><strong>Live mode</strong> — Connected to backend. Methods are saved on the server.</>}
        </p>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, marginBottom: 24, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", animation: "slideDown 0.25s ease" }}>
          <div style={{ padding: "18px 24px", background: "linear-gradient(135deg,#1e3a7a,#162f6a)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{editId ? "Edit Payment Method" : "Add Payment Method"}</span>
            <button onClick={closeForm} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={15} />
            </button>
          </div>

          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Method type */}
            {!editId && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 10 }}>Payment Method Type</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {Object.entries(METHOD_CONFIG).map(([key, c]) => {
                    const Icon = c.icon; const sel = form.method_type === key;
                    return (
                      <button key={key} onClick={() => setForm(f => ({ ...f, method_type: key }))}
                        style={{ padding: "14px 8px", borderRadius: 14, border: `2px solid ${sel ? c.color : "#e2e8f0"}`, background: sel ? c.bg : "#fafafa", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <Icon size={22} color={c.color} />
                        <span style={{ fontSize: 12, fontWeight: 800, color: sel ? c.color : "#64748b" }}>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Account Title */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>Account Title / Name <span style={{ color: "#ef4444" }}>*</span></label>
              <input value={form.account_title} onChange={e => setForm(f => ({ ...f, account_title: e.target.value }))}
                placeholder="e.g. Muhammad Ali"
                style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, color: "#1e293b", background: "#f8fafc", outline: "none", boxSizing: "border-box" }}
                onFocus={e => (e.target.style.borderColor = "#f4c44e")} onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
            </div>

            {/* Bank Name */}
            {form.method_type === "Bank" && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>Bank Name <span style={{ color: "#ef4444" }}>*</span></label>
                <input value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))}
                  placeholder="e.g. Meezan Bank, HBL, UBL"
                  style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, color: "#1e293b", background: "#f8fafc", outline: "none", boxSizing: "border-box" }}
                  onFocus={e => (e.target.style.borderColor = "#f4c44e")} onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
              </div>
            )}

            {/* Account Number */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
                {form.method_type === "Bank" ? "Account Number / IBAN" : "Mobile Number"} <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))}
                placeholder={cfg?.placeholder}
                style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, color: "#1e293b", background: "#f8fafc", outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
                onFocus={e => (e.target.style.borderColor = "#f4c44e")} onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>{cfg?.hint}</p>
            </div>

            {/* Instructions */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>Instructions <span style={{ color: "#94a3b8", fontWeight: 500 }}>(optional)</span></label>
              <textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                placeholder="e.g. Send exact amount. Write your name in remarks." rows={2}
                style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 13, color: "#1e293b", background: "#f8fafc", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
                onFocus={e => (e.target.style.borderColor = "#f4c44e")} onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={closeForm} style={{ flex: 1, padding: "11px", border: "1.5px solid #e2e8f0", borderRadius: 10, background: "#fff", color: "#64748b", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 2, padding: "11px", border: "none", borderRadius: 10, background: "linear-gradient(135deg,#f4c44e,#e8b43a)", color: "#1e293b", fontWeight: 800, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: saving ? 0.7 : 1 }}>
                <Save size={15} /> {saving ? "Saving..." : editId ? "Update" : "Add Method"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Methods List */}
      {methods.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", background: "#f8fafc", borderRadius: 16, border: "2px dashed #e2e8f0" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>No payment methods yet</div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>Add your JazzCash, Easypaisa, or Bank details so students can pay you</div>
          <button onClick={openAdd} style={{ padding: "10px 24px", borderRadius: 10, background: "linear-gradient(135deg,#f4c44e,#e8b43a)", border: "none", color: "#1e293b", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            + Add First Method
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {methods.map(m => {
            const c = METHOD_CONFIG[m.method_type] ?? METHOD_CONFIG.Bank;
            const Icon = c.icon;
            return (
              <div key={m.id} style={{ background: "#fff", border: `1.5px solid ${c.color}25`, borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={22} color={c.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>{c.label}</span>
                    {m.bank_name && <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>— {m.bank_name}</span>}
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#059669", background: "#d1fae5", padding: "2px 8px", borderRadius: 100 }}>Active</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "#1e3a7a", fontFamily: "monospace", letterSpacing: "0.04em" }}>{m.account_number}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{m.account_title}</div>
                  {m.instructions && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, fontStyle: "italic" }}>{m.instructions}</div>}
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => openEdit(m)} style={{ width: 36, height: 36, borderRadius: 10, background: "#f1f5f9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    title="Edit" onMouseOver={e => (e.currentTarget.style.background = "#e2e8f0")} onMouseOut={e => (e.currentTarget.style.background = "#f1f5f9")}>
                    <Edit3 size={15} color="#64748b" />
                  </button>
                  <button onClick={() => handleDelete(m.id)} disabled={deletingId === m.id}
                    style={{ width: 36, height: 36, borderRadius: 10, background: "#fef2f2", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: deletingId === m.id ? 0.5 : 1 }}
                    title="Delete" onMouseOver={e => (e.currentTarget.style.background = "#fecaca")} onMouseOut={e => (e.currentTarget.style.background = "#fef2f2")}>
                    <Trash2 size={15} color="#ef4444" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
