import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

/* ─── Constants ─── */
const CATEGORIES = {
  subscription: { label: "訂閱服務", color: "#7c6ff5" },
  essential: { label: "必要支出", color: "#e85d75" },
  lifestyle: { label: "生活娛樂", color: "#4ecdc4" },
  tool: { label: "工具軟體", color: "#f5a623" },
  online: { label: "線上課程", color: "#45b7d1" },
};

const DEFAULT_SUBS = [
  { id: 1, name: "Notion", icon: "📝", price: 1000, cycle: "yearly", yearlyPrice: 12000, category: "tool", nextDate: "2026-10-15", status: "active", startDate: "2024-10-15" },
  { id: 2, name: "Spotify", icon: "🎵", price: 149, cycle: "monthly", category: "lifestyle", nextDate: "2026-04-05", status: "active", startDate: "2024-01-01" },
  { id: 3, name: "ChatGPT Plus", icon: "🤖", price: 660, cycle: "monthly", category: "tool", nextDate: "2026-04-12", status: "active", startDate: "2024-06-01" },
  { id: 4, name: "Netflix", icon: "🎬", price: 390, cycle: "monthly", category: "lifestyle", nextDate: "2026-04-18", status: "active", startDate: "2023-03-01" },
  { id: 5, name: "Perplexity Pro", icon: "🔍", price: 660, cycle: "monthly", category: "tool", nextDate: "2026-03-31", status: "active", startDate: "2025-06-01" },
  { id: 6, name: "iCloud+ 200GB", icon: "☁️", price: 90, cycle: "monthly", category: "essential", nextDate: "2026-04-01", status: "active", startDate: "2022-01-01" },
  { id: 7, name: "YouTube Premium", icon: "▶️", price: 199, cycle: "monthly", category: "lifestyle", nextDate: "2026-04-08", status: "active", startDate: "2024-08-01" },
  { id: 8, name: "Claude Pro", icon: "🧠", price: 660, cycle: "monthly", category: "tool", nextDate: "2026-04-15", status: "active", startDate: "2025-03-01" },
  { id: 9, name: "電信費", icon: "📱", price: 499, cycle: "monthly", category: "essential", nextDate: "2026-04-10", status: "active", startDate: "2021-06-01" },
];

const MONTHS = ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
const WEEKDAYS = ["日","一","二","三","四","五","六"];

/* ─── Helpers ─── */
function today() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysUntil(dateStr) {
  const t = today();
  const target = new Date(dateStr);
  return Math.ceil((target - t) / 86400000);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`;
}

function getMonthlyEquiv(sub) {
  if (sub.cycle === "yearly") return Math.round((sub.yearlyPrice || sub.price) / 12);
  return sub.price;
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

function isTodayDate(year, month, day) {
  const t = today();
  return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
}

/* ─── Donut Chart ─── */
function DonutChart({ data, total, label, size = 200 }) {
  const cx = size/2, cy = size/2, r = size*0.36, sw = size*0.13;
  let cum = -90;
  const arcs = data.map(d => {
    const pct = total > 0 ? d.value / total : 0;
    const start = cum;
    const sweep = pct * 360;
    cum += sweep;
    const rad = a => (a * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad(start));
    const y1 = cy + r * Math.sin(rad(start));
    const x2 = cx + r * Math.cos(rad(start + sweep));
    const y2 = cy + r * Math.sin(rad(start + sweep));
    return { ...d, path: `M ${x1} ${y1} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x2} ${y2}`, pct };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {total === 0 && <circle cx={cx} cy={cy} r={r} fill="none" stroke="#222" strokeWidth={sw} />}
      {arcs.map((a,i) => <path key={i} d={a.path} fill="none" stroke={a.color} strokeWidth={sw} strokeLinecap="butt" />)}
      <text x={cx} y={cy-5} textAnchor="middle" fill="#f0f0f0" fontSize={size*0.1} fontWeight="700">${total.toLocaleString()}</text>
      <text x={cx} y={cy+14} textAnchor="middle" fill="#888" fontSize={size*0.05}>{label}</text>
    </svg>
  );
}

/* ─── Bar Chart ─── */
function BarChart({ data, maxVal }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {data.map((d,i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:13, width:20, textAlign:"center" }}>{d.icon}</span>
          <span style={{ fontSize:12, color:"#ccc", width:85, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{d.name}</span>
          <div style={{ flex:1, height:18, background:"#1e1e24", borderRadius:4, overflow:"hidden" }}>
            <div style={{ width: maxVal > 0 ? `${(d.value/maxVal)*100}%` : "0%", height:"100%", background:`linear-gradient(90deg, ${d.color}, ${d.color}cc)`, borderRadius:4, transition:"width 0.5s ease" }} />
          </div>
          <span style={{ fontSize:12, color:"#aaa", width:55, textAlign:"right", fontVariantNumeric:"tabular-nums" }}>${d.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Status Badge ─── */
function StatusBadge({ days }) {
  if (days < 0) return <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:"#4a2030", color:"#ff6b8a" }}>已過期</span>;
  if (days <= 7) return <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:"#4a3520", color:"#ffaa44" }}>⚠ {days}天</span>;
  if (days <= 30) return <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:"#203a4a", color:"#5bc0eb" }}>{days}天</span>;
  return <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:"#1e2a1e", color:"#66cc77" }}>{days}天</span>;
}

/* ─── Add/Edit Modal ─── */
function SubModal({ initial, onClose, onSave }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(initial || { name:"", icon:"📦", price:"", cycle:"monthly", category:"tool", nextDate:"", startDate: new Date().toISOString().slice(0,10) });
  const set = (k,v) => setForm(p => ({...p, [k]:v}));
  const submit = () => {
    if (!form.name || !form.price || !form.nextDate) return;
    onSave({
      ...form,
      price: Number(form.price),
      yearlyPrice: form.cycle === "yearly" ? Number(form.price) : null,
      status: "active",
    });
    onClose();
  };
  const S = { background:"#1a1a22", border:"1px solid #333", borderRadius:6, padding:"9px 10px", color:"#eee", fontSize:14, width:"100%", boxSizing:"border-box", outline:"none" };
  const L = { fontSize:12, color:"#999", marginBottom:4, display:"block" };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:"calc(16px + env(safe-area-inset-top, 0px)) 16px calc(16px + env(safe-area-inset-bottom, 0px)) 16px" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#16161e", borderRadius:14, padding:24, width:"100%", maxWidth:380, border:"1px solid #2a2a35" }}>
        <h3 style={{ margin:"0 0 16px", color:"#f0f0f0", fontSize:17 }}>{isEdit ? "編輯訂閱" : "新增訂閱"}</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ flex:"0 0 60px" }}><label style={L}>圖示</label><input value={form.icon} onChange={e=>set("icon",e.target.value)} style={{...S, textAlign:"center"}} /></div>
            <div style={{ flex:1 }}><label style={L}>名稱</label><input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="服務名稱" style={S} /></div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ flex:1 }}><label style={L}>金額 (NT$)</label><input type="number" value={form.price} onChange={e=>set("price",e.target.value)} placeholder="0" style={S} /></div>
            <div style={{ flex:1 }}><label style={L}>週期</label><select value={form.cycle} onChange={e=>set("cycle",e.target.value)} style={S}><option value="monthly">月繳</option><option value="yearly">年繳</option></select></div>
          </div>
          <div><label style={L}>分類</label><select value={form.category} onChange={e=>set("category",e.target.value)} style={S}>{Object.entries(CATEGORIES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></div>
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ flex:1 }}><label style={L}>下次繳費</label><input type="date" value={form.nextDate} onChange={e=>set("nextDate",e.target.value)} style={S} /></div>
            <div style={{ flex:1 }}><label style={L}>開始日期</label><input type="date" value={form.startDate} onChange={e=>set("startDate",e.target.value)} style={S} /></div>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:4 }}>
            <button onClick={onClose} style={{ flex:1, padding:"10px 0", background:"#2a2a35", border:"none", borderRadius:8, color:"#aaa", cursor:"pointer", fontSize:14 }}>取消</button>
            <button onClick={submit} style={{ flex:1, padding:"10px 0", background:"#7c6ff5", border:"none", borderRadius:8, color:"#fff", cursor:"pointer", fontSize:14, fontWeight:600 }}>{isEdit ? "儲存" : "新增"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Confirm Dialog ─── */
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:"calc(16px + env(safe-area-inset-top, 0px)) 16px calc(16px + env(safe-area-inset-bottom, 0px)) 16px" }} onClick={onCancel}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#16161e", borderRadius:14, padding:24, width:"100%", maxWidth:320, border:"1px solid #2a2a35", textAlign:"center" }}>
        <p style={{ color:"#ddd", fontSize:14, marginBottom:20 }}>{message}</p>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onCancel} style={{ flex:1, padding:"10px 0", background:"#2a2a35", border:"none", borderRadius:8, color:"#aaa", cursor:"pointer", fontSize:14 }}>取消</button>
          <button onClick={onConfirm} style={{ flex:1, padding:"10px 0", background:"#e85d75", border:"none", borderRadius:8, color:"#fff", cursor:"pointer", fontSize:14, fontWeight:600 }}>確認刪除</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Tab Nav (Mobile) ─── */
const TABS = [
  { id: "list", icon: "📑", label: "列表" },
  { id: "calendar", icon: "📅", label: "日曆" },
  { id: "charts", icon: "📊", label: "圖表" },
];

/* ═══════════════════════════════════════════
   Main App
   ═══════════════════════════════════════════ */
export default function App() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("nextDate");
  const [modal, setModal] = useState(null); // null | "add" | sub object for edit
  const [confirmDel, setConfirmDel] = useState(null);
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [tab, setTab] = useState("list");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const fetchSubs = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('subscriptions').select('*');
      if (!error && data) setSubs(data);
      setLoading(false);
    };
    fetchSubs();
  }, []);

  const activeSubs = useMemo(() => subs.filter(s => s.status === "active"), [subs]);
  const monthlyTotal = useMemo(() => activeSubs.reduce((s,sub) => s + getMonthlyEquiv(sub), 0), [activeSubs]);

  const filtered = useMemo(() => {
    let list = filter === "all" ? activeSubs : activeSubs.filter(s => s.category === filter);
    if (sortBy === "nextDate") list = [...list].sort((a,b) => new Date(a.nextDate) - new Date(b.nextDate));
    else if (sortBy === "price") list = [...list].sort((a,b) => getMonthlyEquiv(b) - getMonthlyEquiv(a));
    else if (sortBy === "name") list = [...list].sort((a,b) => a.name.localeCompare(b.name));
    return list;
  }, [activeSubs, filter, sortBy]);

  const donutData = useMemo(() => {
    const map = {};
    activeSubs.forEach(s => {
      const cat = CATEGORIES[s.category];
      if (!map[s.category]) map[s.category] = { name: cat.label, color: cat.color, value: 0 };
      map[s.category].value += getMonthlyEquiv(s);
    });
    return Object.values(map).sort((a,b) => b.value - a.value);
  }, [activeSubs]);

  const barData = useMemo(() => {
    return [...activeSubs].sort((a,b) => getMonthlyEquiv(b) - getMonthlyEquiv(a)).map(s => ({
      name: s.name, icon: s.icon, value: getMonthlyEquiv(s), color: CATEGORIES[s.category].color,
    }));
  }, [activeSubs]);

  const barMax = barData.length ? barData[0].value : 1;

  const calDays = getCalendarDays(calYear, calMonth);
  const calEvents = useMemo(() => {
    const map = {};
    activeSubs.forEach(s => {
      const d = new Date(s.nextDate);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(s);
      }
    });
    return map;
  }, [activeSubs, calYear, calMonth]);

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y=>y-1); } else setCalMonth(m=>m-1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y=>y+1); } else setCalMonth(m=>m+1); };

  const saveSub = async (subObj) => {
    const existing = subs.find(s => s.id === subObj.id);
    const payload = {
      name: subObj.name,
      icon: subObj.icon,
      price: subObj.price,
      cycle: subObj.cycle,
      category: subObj.category,
      yearlyPrice: subObj.yearlyPrice || null,
      nextDate: subObj.nextDate,
      status: subObj.status || 'active',
      startDate: subObj.startDate
    };

    if (existing) {
      const { data, error } = await supabase.from('subscriptions').update(payload).eq('id', subObj.id).select().single();
      if (!error && data) setSubs(prev => prev.map(s => s.id === subObj.id ? data : s));
      else console.error(error);
    } else {
      const { data, error } = await supabase.from('subscriptions').insert([payload]).select().single();
      if (!error && data) setSubs(prev => [...prev, data]);
      else console.error(error);
    }
  };
  const deleteSub = async (id) => { 
    await supabase.from('subscriptions').delete().eq('id', id);
    setSubs(prev => prev.filter(s => s.id !== id)); 
    setConfirmDel(null); 
  };

  /* ─── Render Sections ─── */
  const renderSummary = () => (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:10, marginBottom:16 }}>
      {[
        { label:"每月總額", value:`$${monthlyTotal.toLocaleString()}`, color:"#7c6ff5" },
        { label:"訂閱數量", value:activeSubs.length, color:"#4ecdc4" },
        { label:"年度預估", value:`$${(monthlyTotal*12).toLocaleString()}`, color:"#f5a623" },
        { label:"日均花費", value:`$${Math.round(monthlyTotal/30)}`, color:"#e85d75" },
      ].map((c,i) => (
        <div key={i} style={{ background:"#16161e", borderRadius:10, padding:"12px 14px", border:"1px solid #1e1e28" }}>
          <div style={{ fontSize:11, color:"#777", marginBottom:3 }}>{c.label}</div>
          <div style={{ fontSize:19, fontWeight:700, color:c.color, fontVariantNumeric:"tabular-nums" }}>{c.value}</div>
        </div>
      ))}
    </div>
  );

  const renderList = () => (
    <div style={{ background:"#16161e", borderRadius:12, border:"1px solid #1e1e28", overflow:"hidden" }}>
      <div style={{ padding:"12px 14px 8px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:6 }}>
        <h2 style={{ margin:0, fontSize:14, fontWeight:600 }}>📑 訂閱列表</h2>
      </div>
      <div style={{ padding:"0 14px 8px", display:"flex", gap:4, flexWrap:"wrap" }}>
        {[{ k:"all", l:"全部" }, ...Object.entries(CATEGORIES).map(([k,v])=>({ k, l:v.label }))].map(f => (
          <button key={f.k} onClick={()=>setFilter(f.k)} style={{
            padding:"3px 10px", borderRadius:12, border:"none", fontSize:11, cursor:"pointer",
            background: filter===f.k ? "#7c6ff533" : "#1e1e28", color: filter===f.k ? "#a99ff8" : "#888",
          }}>{f.l}</button>
        ))}
      </div>
      <div style={{ padding:"0 14px 6px", display:"flex", gap:4 }}>
        {[{ k:"nextDate", l:"到期日" },{ k:"price", l:"金額" },{ k:"name", l:"名稱" }].map(s => (
          <button key={s.k} onClick={()=>setSortBy(s.k)} style={{
            padding:"2px 8px", borderRadius:4, border:"none", fontSize:10, cursor:"pointer",
            background: sortBy===s.k ? "#2a2a40" : "transparent", color: sortBy===s.k ? "#ccc" : "#555",
          }}>排序: {s.l}</button>
        ))}
      </div>
      <div>
        {filtered.map(sub => {
          const days = daysUntil(sub.nextDate);
          return (
            <div key={sub.id} style={{ display:"flex", alignItems:"center", padding:"10px 14px", borderTop:"1px solid #1a1a22", gap:10 }}
              onClick={() => setModal(sub)}>
              <span style={{ fontSize:18 }}>{sub.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:500, display:"flex", alignItems:"center", gap:6 }}>
                  {sub.name}
                  {sub.cycle === "yearly" && <span style={{ fontSize:9, color:"#f5a623", background:"#f5a62320", padding:"1px 5px", borderRadius:4 }}>年繳</span>}
                </div>
                <div style={{ fontSize:11, color:"#777", marginTop:2 }}>
                  <span style={{ color: CATEGORIES[sub.category]?.color }}>{CATEGORIES[sub.category]?.label}</span>
                  {" · "}{formatDate(sub.nextDate)}
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:14, fontWeight:600, fontVariantNumeric:"tabular-nums" }}>${getMonthlyEquiv(sub).toLocaleString()}</div>
                <div style={{ marginTop:2 }}><StatusBadge days={days} /></div>
              </div>
              <button onClick={e => { e.stopPropagation(); setConfirmDel(sub.id); }} style={{ background:"none", border:"none", color:"#444", cursor:"pointer", fontSize:16, padding:"4px 2px", lineHeight:1 }}>×</button>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ padding:28, textAlign:"center", color:"#555", fontSize:13 }}>沒有符合條件的訂閱</div>}
      </div>
    </div>
  );

  const renderCalendar = () => (
    <div style={{ background:"#16161e", borderRadius:12, border:"1px solid #1e1e28", padding:14 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <h2 style={{ margin:0, fontSize:14, fontWeight:600 }}>📅 繳費日曆</h2>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={prevMonth} style={{ background:"#1e1e28", border:"none", color:"#aaa", borderRadius:4, width:28, height:28, cursor:"pointer", fontSize:15 }}>‹</button>
          <span style={{ fontSize:13, fontWeight:500, minWidth:95, textAlign:"center" }}>{calYear}年 {MONTHS[calMonth]}</span>
          <button onClick={nextMonth} style={{ background:"#1e1e28", border:"none", color:"#aaa", borderRadius:4, width:28, height:28, cursor:"pointer", fontSize:15 }}>›</button>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:2 }}>
        {WEEKDAYS.map(w => <div key={w} style={{ textAlign:"center", fontSize:11, color:"#555", padding:"4px 0" }}>{w}</div>)}
        {calDays.map((day,i) => {
          const isT = day && isTodayDate(calYear, calMonth, day);
          return (
            <div key={i} style={{
              minHeight:52, padding:3, borderRadius:6, fontSize:12,
              background: isT ? "#7c6ff520" : day ? "#111118" : "transparent",
              border: isT ? "1px solid #7c6ff544" : "1px solid transparent",
            }}>
              {day && <>
                <span style={{ color: isT ? "#a99ff8" : "#777", fontSize:11, fontWeight: isT ? 600 : 400 }}>{day}</span>
                {calEvents[day] && <div style={{ marginTop:1 }}>
                  {calEvents[day].map((ev,j) => (
                    <div key={j} style={{ fontSize:8, padding:"1px 3px", borderRadius:3, marginTop:1, background: CATEGORIES[ev.category].color+"25", color: CATEGORIES[ev.category].color, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {ev.icon} {ev.name}
                    </div>
                  ))}
                </div>}
              </>}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCharts = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ background:"#16161e", borderRadius:12, border:"1px solid #1e1e28", padding:16 }}>
        <h2 style={{ margin:"0 0 8px", fontSize:14, fontWeight:600 }}>🍩 每月消費分佈</h2>
        <div style={{ display:"flex", justifyContent:"center" }}><DonutChart data={donutData} total={monthlyTotal} label="每月估計" size={180} /></div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:8, justifyContent:"center" }}>
          {donutData.map((d,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"#aaa" }}>
              <div style={{ width:8, height:8, borderRadius:2, background:d.color }} />{d.name} ${d.value.toLocaleString()}
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:"#16161e", borderRadius:12, border:"1px solid #1e1e28", padding:16 }}>
        <h2 style={{ margin:"0 0 12px", fontSize:14, fontWeight:600 }}>📊 月費排行</h2>
        <BarChart data={barData} maxVal={barMax} />
      </div>
      <div style={{ background:"#16161e", borderRadius:12, border:"1px solid #1e1e28", padding:16 }}>
        <h2 style={{ margin:"0 0 10px", fontSize:14, fontWeight:600 }}>📈 快速統計</h2>
        <div style={{ display:"flex", flexDirection:"column", gap:10, fontSize:13, color:"#bbb" }}>
          {[
            { l:"最高單項月費", v:`${barData[0]?.name || "-"} $${(barData[0]?.value||0).toLocaleString()}`, c:"#e85d75" },
            { l:"AI 工具佔比", v:`${monthlyTotal>0 ? Math.round(activeSubs.filter(s=>s.category==="tool").reduce((a,s)=>a+getMonthlyEquiv(s),0)/monthlyTotal*100) : 0}%`, c:"#f5a623" },
            { l:"日均花費", v:`$${Math.round(monthlyTotal/30)}/天`, c:"#4ecdc4" },
            { l:"年度總額", v:`$${(monthlyTotal*12).toLocaleString()}`, c:"#7c6ff5" },
          ].map((r,i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between" }}>
              <span>{r.l}</span><span style={{ color:r.c, fontWeight:600 }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:"#0e0e14", color:"#e8e8ee", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <p style={{ color:"#888" }}>雲端同步中...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight:"100vh", background:"#0e0e14", color:"#e8e8ee",
      fontFamily:"'Noto Sans TC', -apple-system, 'Helvetica Neue', sans-serif",
      paddingBottom: isMobile ? 70 : 24,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin:0; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#333; border-radius:3px; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .fade { animation: fadeIn 0.3s ease both; }
      `}</style>

      {modal !== null && (
        <SubModal
          initial={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSave={saveSub}
        />
      )}
      {confirmDel && (
        <ConfirmDialog
          message="確定要刪除這個訂閱嗎？"
          onConfirm={() => deleteSub(confirmDel)}
          onCancel={() => setConfirmDel(null)}
        />
      )}

      <div style={{ maxWidth:600, margin:"0 auto", padding:"calc(16px + env(safe-area-inset-top, 0px)) 16px 0" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div>
            <h1 style={{ margin:0, fontSize:20, fontWeight:700, letterSpacing:-0.5 }}>📋 訂閱追蹤</h1>
            <p style={{ margin:"2px 0 0", fontSize:12, color:"#555" }}>管理你的訂閱服務與定期支出</p>
          </div>
          <button onClick={() => setModal("add")} style={{
            background:"#7c6ff5", border:"none", borderRadius:8, padding:"8px 14px",
            color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer",
          }}>＋ 新增</button>
        </div>

        {renderSummary()}

        {/* Desktop: show all; Mobile: tabs */}
        {isMobile ? (
          <div className="fade" key={tab}>
            {tab === "list" && renderList()}
            {tab === "calendar" && renderCalendar()}
            {tab === "charts" && renderCharts()}
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {renderList()}
            {renderCalendar()}
            {renderCharts()}
          </div>
        )}

        <div style={{ textAlign:"center", marginTop:20, paddingBottom:8, fontSize:11, color:"#555" }}>
          Subscription Tracker · 資料儲存於 Supabase 雲端
        </div>
      </div>

      {/* Mobile Tab Bar */}
      {isMobile && (
        <div style={{
          position:"fixed", bottom:0, left:0, right:0, background:"#12121a", borderTop:"1px solid #1e1e28",
          display:"flex", justifyContent:"space-around", padding:"6px 0 env(safe-area-inset-bottom, 8px)",
          zIndex:100,
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"4px 12px",
              color: tab===t.id ? "#a99ff8" : "#555", transition:"color 0.2s",
            }}>
              <span style={{ fontSize:18 }}>{t.icon}</span>
              <span style={{ fontSize:10 }}>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
