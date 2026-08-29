import { useState, useEffect, useRef } from "react";

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  brown: "#8B5A2B",
  brownDark: "#6B3F1A",
  brownLight: "#C49A6C",
  brownPale: "#F5EDE0",
  gold: "#D4AF37",
  white: "#FFFFFF",
  shadow: "0 4px 24px rgba(139,90,43,0.13)",
  cardShadow: "0 2px 12px rgba(139,90,43,0.10)",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #f8f3ed; }
  .si-app { min-height: 100vh; }
  .si-sidebar { width: 220px; min-height: 100vh; background: ${T.brownDark}; position: fixed; top:0; left:0; z-index:100; display:flex; flex-direction:column; }
  .si-sidebar-logo { padding: 24px 20px 16px; border-bottom: 1px solid rgba(255,255,255,0.12); }
  .si-sidebar-logo h2 { color: ${T.gold}; font-size: 15px; font-weight:700; line-height:1.3; }
  .si-sidebar-logo p { color: rgba(255,255,255,0.55); font-size:11px; margin-top:3px; }
  .si-nav { flex:1; padding: 12px 0; }
  .si-nav-item { display:flex; align-items:center; gap:10px; padding: 11px 20px; cursor:pointer; color: rgba(255,255,255,0.72); font-size:13.5px; font-weight:500; transition:all .18s; border-left: 3px solid transparent; }
  .si-nav-item:hover { background: rgba(255,255,255,0.07); color:#fff; }
  .si-nav-item.active { background: rgba(212,175,55,0.15); color:${T.gold}; border-left-color:${T.gold}; }
  .si-nav-icon { font-size:17px; width:20px; text-align:center; }
  .si-sidebar-footer { padding:16px 20px; border-top:1px solid rgba(255,255,255,0.10); }
  .si-logout-btn { width:100%; padding:9px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:rgba(255,255,255,0.7); border-radius:7px; cursor:pointer; font-size:13px; font-weight:500; transition:all .18s; }
  .si-logout-btn:hover { background:rgba(220,53,69,0.25); color:#ff8a8a; border-color:rgba(220,53,69,0.4); }
  .si-main { margin-left:220px; min-height:100vh; }
  .si-topbar { background:${T.brown}; padding:14px 28px; display:flex; align-items:center; justify-content:space-between; box-shadow:${T.shadow}; }
  .si-topbar-title { color:#fff; font-size:17px; font-weight:700; }
  .si-topbar-right { display:flex; align-items:center; gap:16px; }
  .si-topbar-time { color:rgba(255,255,255,0.85); font-size:13px; text-align:right; }
  .si-topbar-avatar { width:34px; height:34px; border-radius:50%; background:${T.gold}; display:flex; align-items:center; justify-content:center; color:${T.brownDark}; font-weight:700; font-size:14px; }
  .si-content { padding:24px 28px; }
  .si-card { background:#fff; border-radius:12px; box-shadow:${T.cardShadow}; border:1px solid rgba(139,90,43,0.08); }
  .si-stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
  .si-stat { background:#fff; border-radius:12px; padding:20px; box-shadow:${T.cardShadow}; border:1px solid rgba(139,90,43,0.08); position:relative; overflow:hidden; }
  .si-stat::before { content:''; position:absolute; top:0; right:0; width:60px; height:60px; border-radius:0 12px 0 60px; background:${T.brownPale}; }
  .si-stat-icon { font-size:22px; margin-bottom:10px; }
  .si-stat-val { font-size:26px; font-weight:700; color:${T.brownDark}; }
  .si-stat-label { font-size:12px; color:#999; margin-top:2px; font-weight:500; }
  .si-section-head { display:flex; align-items:center; justify-content:space-between; padding:18px 20px; border-bottom:1px solid ${T.brownPale}; }
  .si-section-title { font-size:15px; font-weight:700; color:${T.brownDark}; }
  .si-btn { padding:8px 16px; border-radius:7px; border:none; cursor:pointer; font-size:13px; font-weight:600; transition:all .18s; }
  .si-btn-primary { background:${T.brown}; color:#fff; }
  .si-btn-primary:hover { background:${T.brownDark}; }
  .si-btn-success { background:#198754; color:#fff; }
  .si-btn-success:hover { background:#157347; }
  .si-btn-danger { background:#dc3545; color:#fff; }
  .si-btn-danger:hover { background:#b02a37; }
  .si-btn-gold { background:${T.gold}; color:${T.brownDark}; }
  .si-btn-gold:hover { background:#b8962e; color:#fff; }
  .si-btn-outline { background:transparent; border:1.5px solid ${T.brown}; color:${T.brown}; }
  .si-btn-outline:hover { background:${T.brownPale}; }
  .si-btn-sm { padding:5px 11px; font-size:12px; }
  table { width:100%; border-collapse:collapse; }
  th { background:${T.brownPale}; color:${T.brownDark}; font-size:12px; font-weight:700; padding:10px 14px; text-align:left; }
  td { padding:10px 14px; font-size:13px; color:#333; border-bottom:1px solid #f3ede4; }
  tr:last-child td { border-bottom:none; }
  tr:hover td { background:#fdf9f4; }
  .si-badge { display:inline-block; padding:3px 9px; border-radius:20px; font-size:11px; font-weight:600; }
  .si-badge-low { background:#fff3cd; color:#856404; }
  .si-badge-ok { background:#d1e7dd; color:#0a3622; }
  .si-badge-empty { background:#f8d7da; color:#842029; }
  input, select, textarea { width:100%; padding:9px 12px; border:1.5px solid #ddd; border-radius:7px; font-size:13.5px; font-family:inherit; outline:none; transition:border .18s; }
  input:focus, select:focus, textarea:focus { border-color:${T.brown}; }
  label { font-size:13px; font-weight:600; color:${T.brownDark}; margin-bottom:5px; display:block; }
  .si-form-group { margin-bottom:14px; }
  .si-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:1000; display:flex; align-items:center; justify-content:center; }
  .si-modal { background:#fff; border-radius:14px; padding:28px; width:480px; max-width:95vw; box-shadow:0 8px 40px rgba(0,0,0,0.18); }
  .si-modal-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
  .si-modal-title { font-size:16px; font-weight:700; color:${T.brownDark}; }
  .si-close { background:none; border:none; font-size:20px; cursor:pointer; color:#999; line-height:1; }
  .si-close:hover { color:${T.brownDark}; }
  .si-login-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, ${T.brownDark} 0%, ${T.brown} 60%, ${T.brownLight} 100%); }
  .si-login-card { background:rgba(255,255,255,0.97); border-radius:18px; padding:40px; width:380px; box-shadow:0 12px 48px rgba(0,0,0,0.25); }
  .si-login-logo { text-align:center; margin-bottom:28px; }
  .si-login-logo h1 { color:${T.brownDark}; font-size:20px; font-weight:800; }
  .si-login-logo p { color:#888; font-size:12.5px; margin-top:4px; }
  .si-search { padding:8px 12px; border:1.5px solid #ddd; border-radius:7px; font-size:13px; outline:none; width:220px; }
  .si-search:focus { border-color:${T.brown}; }
  .si-tabs { display:flex; gap:6px; padding:16px 20px 0; }
  .si-tab { padding:8px 16px; border-radius:7px 7px 0 0; border:none; cursor:pointer; font-size:13px; font-weight:600; background:${T.brownPale}; color:${T.brown}; transition:all .18s; }
  .si-tab.active { background:${T.brown}; color:#fff; }
  .si-alert { padding:10px 14px; border-radius:8px; font-size:13px; font-weight:500; margin-bottom:14px; }
  .si-alert-success { background:#d1e7dd; color:#0a3622; }
  .si-alert-danger { background:#f8d7da; color:#842029; }
  .si-scroll { max-height:420px; overflow-y:auto; }
  .si-empty { text-align:center; padding:40px; color:#aaa; font-size:14px; }
  .si-input-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  @media(max-width:900px){
    .si-sidebar{width:60px;} .si-nav-item span{display:none;} .si-main{margin-left:60px;} .si-stat-grid{grid-template-columns:1fr 1fr;}
  }
`;

// ─── DATA ────────────────────────────────────────────────────────────────────
const PRODUCTS_INIT = [
  {id:1,name:"Hammer",price:250,stock:20,cat:"Tools"},
  {id:2,name:"Claw Hammer",price:280,stock:18,cat:"Tools"},
  {id:3,name:"Screwdriver Flat",price:120,stock:30,cat:"Tools"},
  {id:4,name:"Phillips Screwdriver",price:130,stock:28,cat:"Tools"},
  {id:5,name:"Adjustable Wrench",price:350,stock:15,cat:"Tools"},
  {id:6,name:"Pipe Wrench",price:450,stock:10,cat:"Tools"},
  {id:7,name:"Pliers",price:180,stock:25,cat:"Tools"},
  {id:8,name:"Long Nose Pliers",price:200,stock:22,cat:"Tools"},
  {id:9,name:"Combination Pliers",price:220,stock:20,cat:"Tools"},
  {id:10,name:"Hand Saw",price:300,stock:12,cat:"Tools"},
  {id:11,name:"Hack Saw",price:350,stock:10,cat:"Tools"},
  {id:12,name:"Measuring Tape",price:150,stock:35,cat:"Tools"},
  {id:13,name:"Level Bar",price:400,stock:8,cat:"Tools"},
  {id:14,name:"Chisel",price:170,stock:18,cat:"Tools"},
  {id:15,name:"Wood Plane",price:500,stock:6,cat:"Tools"},
  {id:16,name:"Electric Drill",price:2500,stock:7,cat:"Power Tools"},
  {id:17,name:"Drill Bit Set",price:450,stock:14,cat:"Power Tools"},
  {id:18,name:"Angle Grinder",price:2800,stock:5,cat:"Power Tools"},
  {id:19,name:"Cutting Disc",price:90,stock:50,cat:"Power Tools"},
  {id:20,name:"Cement",price:290,stock:100,cat:"Construction"},
  {id:21,name:"Sand",price:50,stock:200,cat:"Construction"},
  {id:22,name:"Gravel",price:70,stock:180,cat:"Construction"},
  {id:23,name:"Hollow Block",price:25,stock:500,cat:"Construction"},
  {id:24,name:"PVC Pipe ½\"",price:160,stock:40,cat:"Plumbing"},
  {id:25,name:"PVC Pipe 1\"",price:220,stock:35,cat:"Plumbing"},
  {id:26,name:"Elbow Connector",price:25,stock:80,cat:"Plumbing"},
  {id:27,name:"Tee Connector",price:30,stock:70,cat:"Plumbing"},
  {id:28,name:"Water Valve",price:180,stock:20,cat:"Plumbing"},
  {id:29,name:"Faucet",price:250,stock:18,cat:"Plumbing"},
  {id:30,name:"Water Hose",price:450,stock:12,cat:"Plumbing"},
  {id:31,name:"Nails 1\"",price:80,stock:300,cat:"Fasteners"},
  {id:32,name:"Nails 2\"",price:90,stock:280,cat:"Fasteners"},
  {id:33,name:"Concrete Nails",price:150,stock:150,cat:"Fasteners"},
  {id:34,name:"Wood Screw",price:120,stock:200,cat:"Fasteners"},
  {id:35,name:"Roofing Screw",price:140,stock:180,cat:"Fasteners"},
  {id:36,name:"Electrical Wire",price:1200,stock:25,cat:"Electrical"},
  {id:37,name:"Extension Cord",price:350,stock:20,cat:"Electrical"},
  {id:38,name:"Light Bulb LED",price:180,stock:45,cat:"Electrical"},
  {id:39,name:"Switch",price:120,stock:30,cat:"Electrical"},
  {id:40,name:"Outlet",price:130,stock:28,cat:"Electrical"},
  {id:41,name:"Circuit Breaker",price:650,stock:10,cat:"Electrical"},
  {id:42,name:"Paint Brush",price:90,stock:40,cat:"Paint"},
  {id:43,name:"Paint Roller",price:180,stock:25,cat:"Paint"},
  {id:44,name:"Paint 1 Liter",price:350,stock:30,cat:"Paint"},
  {id:45,name:"Paint 4 Liters",price:1200,stock:15,cat:"Paint"},
  {id:46,name:"Door Knob",price:300,stock:22,cat:"Hardware"},
  {id:47,name:"Padlock",price:250,stock:18,cat:"Hardware"},
  {id:48,name:"Hinges",price:100,stock:50,cat:"Hardware"},
  {id:49,name:"Wheelbarrow",price:2200,stock:4,cat:"Equipment"},
  {id:50,name:"Shovel",price:400,stock:16,cat:"Equipment"},
];

const MUNICIPALITIES = ["Bongao","Panglima Sugala","Simunul","Sibutu","Sitangkai","South Ubian","Tandubas","Turtle Islands","Languyan","Sapa-Sapa","Mapun"];
const BONGAO_BRGY = ["Tubig Mampallam","Poblacion","Tandu Banak","Tubig Boh","Luuk Pandan","Tubig Tanah","Pagasinan","Karungdong"];

const SQL_SCHEMA = `-- ════════════════════════════════════════
-- SMART INVENTORY SYSTEM — DATABASE SCHEMA
-- Main Branch: Tubig Mampallam, Bongao, Tawi-Tawi
-- ════════════════════════════════════════

CREATE TABLE users (
  user_id   INT AUTO_INCREMENT PRIMARY KEY,
  username  VARCHAR(50)  NOT NULL UNIQUE,
  password  VARCHAR(255) NOT NULL,
  role      VARCHAR(20)  DEFAULT 'staff'
);

CREATE TABLE products (
  product_id   INT AUTO_INCREMENT PRIMARY KEY,
  product_name VARCHAR(100)    NOT NULL,
  category     VARCHAR(50),
  price        DECIMAL(10,2)   NOT NULL,
  stock        INT             DEFAULT 0
);

CREATE TABLE customers (
  customer_id    INT AUTO_INCREMENT PRIMARY KEY,
  fullname       VARCHAR(100) NOT NULL,
  address        VARCHAR(200),
  contact_number VARCHAR(20)
);

CREATE TABLE transactions (
  transaction_id   INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number   VARCHAR(20)   NOT NULL,
  customer_id      INT,
  product_id       INT,
  quantity         INT           NOT NULL,
  total_amount     DECIMAL(10,2) NOT NULL,
  transaction_date DATE,
  transaction_time TIME,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
  FOREIGN KEY (product_id)  REFERENCES products(product_id)
);

CREATE TABLE stock_history (
  history_id   INT AUTO_INCREMENT PRIMARY KEY,
  product_id   INT,
  old_stock    INT,
  added_qty    INT,
  new_stock    INT,
  date_added   DATE,
  time_added   TIME,
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Default admin (change password after first login):
INSERT INTO users (username, password, role)
VALUES ('admin', SHA2('change_this_password', 256), 'admin');`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n) => "₱" + Number(n).toLocaleString("en-PH", {minimumFractionDigits:0});
const now = () => { const d=new Date(); return { date: d.toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"}), time: d.toLocaleTimeString("en-PH",{hour:"2-digit",minute:"2-digit"}), inv: "INV"+String(d.getTime()).slice(-6) }; };
const stockBadge = (s) => s===0 ? <span className="si-badge si-badge-empty">Out of Stock</span> : s<=5 ? <span className="si-badge si-badge-low">Low Stock</span> : <span className="si-badge si-badge-ok">In Stock</span>;

// ─── CLOCK ───────────────────────────────────────────────────────────────────
function Clock() {
  const [t,setT]=useState(now());
  useEffect(()=>{const i=setInterval(()=>setT(now()),30000);return()=>clearInterval(i);},[]);
  return <div className="si-topbar-time"><div style={{fontWeight:700}}>{t.time}</div><div style={{fontSize:11,opacity:.8}}>{t.date}</div></div>;
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
function Login({onLogin}) {
  const [u,setU]=useState(""); const [p,setP]=useState(""); const [err,setErr]=useState(""); const [show,setShow]=useState(false);
  const handle = () => {
    if(u==="admin" && p==="Hardware@2026") { onLogin(u); }
    else setErr("Invalid username or password.");
  };
  return (
    <div className="si-login-wrap">
      <div className="si-login-card">
        <div className="si-login-logo">
          <div style={{fontSize:36,marginBottom:8}}>🔧</div>
          <h1>Smart Inventory</h1>
          <p>Hardware Supply Management System</p>
          <p style={{fontSize:11,color:"#aaa",marginTop:4}}>Tubig Mampallam, Bongao, Tawi-Tawi</p>
        </div>
        {err && <div className="si-alert si-alert-danger">{err}</div>}
        <div className="si-form-group">
          <label>Username</label>
          <input value={u} onChange={e=>setU(e.target.value)} placeholder="Enter username" onKeyDown={e=>e.key==="Enter"&&handle()} />
        </div>
        <div className="si-form-group">
          <label>Password</label>
          <div style={{position:"relative"}}>
            <input type={show?"text":"password"} value={p} onChange={e=>setP(e.target.value)} placeholder="Enter password" onKeyDown={e=>e.key==="Enter"&&handle()} />
            <button onClick={()=>setShow(!show)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#888",fontSize:16}}>{show?"🙈":"👁️"}</button>
          </div>
        </div>
        <button className="si-btn si-btn-primary" style={{width:"100%",padding:12,fontSize:14,marginTop:4}} onClick={handle}>Sign In</button>
        <p style={{textAlign:"center",fontSize:11,color:"#bbb",marginTop:18}}>© 2026 Smart Inventory System</p>
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({products,transactions}) {
  const totalStock = products.reduce((a,p)=>a+p.stock,0);
  const totalSales = transactions.reduce((a,t)=>a+t.amount,0);
  return (
    <div>
      <div className="si-stat-grid">
        {[
          {icon:"📦",val:products.length,label:"Total Products"},
          {icon:"🏪",val:totalStock.toLocaleString(),label:"Total Stocks"},
          {icon:"💰",val:fmt(totalSales),label:"Total Sales"},
          {icon:"🧾",val:transactions.length,label:"Transactions"},
        ].map((s,i)=>(
          <div className="si-stat" key={i}>
            <div className="si-stat-icon">{s.icon}</div>
            <div className="si-stat-val">{s.val}</div>
            <div className="si-stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div className="si-card">
          <div className="si-section-head"><span className="si-section-title">⚠️ Low Stock Alerts</span></div>
          <div className="si-scroll">
            {products.filter(p=>p.stock<=5).length===0
              ? <div className="si-empty">All stocks are sufficient</div>
              : <table><thead><tr><th>Product</th><th>Stock</th><th>Status</th></tr></thead><tbody>
                  {products.filter(p=>p.stock<=5).map(p=>(
                    <tr key={p.id}><td>{p.name}</td><td>{p.stock}</td><td>{stockBadge(p.stock)}</td></tr>
                  ))}
                </tbody></table>}
          </div>
        </div>
        <div className="si-card">
          <div className="si-section-head"><span className="si-section-title">🕐 Recent Transactions</span></div>
          <div className="si-scroll">
            {transactions.length===0
              ? <div className="si-empty">No transactions yet</div>
              : <table><thead><tr><th>Invoice</th><th>Customer</th><th>Total</th></tr></thead><tbody>
                  {[...transactions].reverse().slice(0,8).map((t,i)=>(
                    <tr key={i}><td>{t.invoice}</td><td>{t.customer}</td><td style={{color:"#198754",fontWeight:600}}>{fmt(t.amount)}</td></tr>
                  ))}
                </tbody></table>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
function Products({products,setProducts}) {
  const [search,setSearch]=useState(""); const [modal,setModal]=useState(null);
  const [form,setForm]=useState({name:"",price:"",stock:"",cat:"Tools"});
  const cats=["Tools","Power Tools","Construction","Plumbing","Fasteners","Electrical","Paint","Hardware","Equipment"];
  const filtered = products.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||p.cat.toLowerCase().includes(search.toLowerCase()));
  const openEdit=(p)=>{ setForm({name:p.name,price:p.price,stock:p.stock,cat:p.cat}); setModal({type:"edit",id:p.id}); };
  const openAdd=()=>{ setForm({name:"",price:"",stock:"",cat:"Tools"}); setModal({type:"add"}); };
  const save=()=>{
    if(!form.name||!form.price) return;
    if(modal.type==="add"){
      const nid=Math.max(...products.map(p=>p.id))+1;
      setProducts([...products,{id:nid,name:form.name,price:Number(form.price),stock:Number(form.stock)||0,cat:form.cat}]);
    } else {
      setProducts(products.map(p=>p.id===modal.id?{...p,name:form.name,price:Number(form.price),stock:Number(form.stock),cat:form.cat}:p));
    }
    setModal(null);
  };
  const del=(id)=>{ if(window.confirm("Delete this product?")) setProducts(products.filter(p=>p.id!==id)); };
  return (
    <div className="si-card">
      <div className="si-section-head">
        <span className="si-section-title">📦 Product Inventory ({products.length})</span>
        <div style={{display:"flex",gap:10}}>
          <input className="si-search" placeholder="Search products…" value={search} onChange={e=>setSearch(e.target.value)} />
          <button className="si-btn si-btn-primary" onClick={openAdd}>+ Add Product</button>
        </div>
      </div>
      <div className="si-scroll">
        <table>
          <thead><tr><th>ID</th><th>Product Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(p=>(
              <tr key={p.id}>
                <td style={{color:"#aaa",fontSize:12}}>{p.id}</td>
                <td style={{fontWeight:500}}>{p.name}</td>
                <td><span className="si-badge" style={{background:T.brownPale,color:T.brownDark}}>{p.cat}</span></td>
                <td style={{fontWeight:600,color:T.brownDark}}>{fmt(p.price)}</td>
                <td>{p.stock}</td>
                <td>{stockBadge(p.stock)}</td>
                <td><div style={{display:"flex",gap:5}}>
                  <button className="si-btn si-btn-outline si-btn-sm" onClick={()=>openEdit(p)}>Edit</button>
                  <button className="si-btn si-btn-danger si-btn-sm" onClick={()=>del(p.id)}>Del</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && <div className="si-modal-overlay"><div className="si-modal">
        <div className="si-modal-head">
          <span className="si-modal-title">{modal.type==="add"?"Add New Product":"Edit Product"}</span>
          <button className="si-close" onClick={()=>setModal(null)}>×</button>
        </div>
        <div className="si-form-group"><label>Product Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
        <div className="si-input-row">
          <div className="si-form-group"><label>Price (₱)</label><input type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} /></div>
          <div className="si-form-group"><label>Initial Stock</label><input type="number" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} /></div>
        </div>
        <div className="si-form-group"><label>Category</label>
          <select value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})}>
            {cats.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button className="si-btn si-btn-outline" onClick={()=>setModal(null)}>Cancel</button>
          <button className="si-btn si-btn-primary" onClick={save}>Save</button>
        </div>
      </div></div>}
    </div>
  );
}

// ─── ADD STOCK ───────────────────────────────────────────────────────────────
function AddStock({products,setProducts,history,setHistory}) {
  const [sel,setSel]=useState(""); const [qty,setQty]=useState(""); const [msg,setMsg]=useState(null);
  const prod = products.find(p=>p.id===Number(sel));
  const handle=()=>{
    if(!sel||!qty||Number(qty)<=0) return;
    const old=prod.stock; const added=Number(qty); const nw=old+added;
    setProducts(products.map(p=>p.id===prod.id?{...p,stock:nw}:p));
    const {date,time}=now();
    setHistory([...history,{product:prod.name,old,added,nw,date,time}]);
    setMsg(`✅ Stock updated: ${prod.name} — ${old} → ${nw} pcs`);
    setSel(""); setQty("");
    setTimeout(()=>setMsg(null),4000);
  };
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <div className="si-card" style={{padding:24}}>
        <div className="si-section-title" style={{marginBottom:18}}>➕ Replenish Stock</div>
        {msg && <div className="si-alert si-alert-success">{msg}</div>}
        <div className="si-form-group"><label>Select Product</label>
          <select value={sel} onChange={e=>setSel(e.target.value)}>
            <option value="">-- Choose product --</option>
            {products.map(p=><option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
          </select>
        </div>
        {prod && <div style={{background:T.brownPale,borderRadius:8,padding:14,marginBottom:14}}>
          <div style={{fontSize:13,color:T.brownDark}}>
            <div><b>Product:</b> {prod.name}</div>
            <div><b>Category:</b> {prod.cat}</div>
            <div><b>Price:</b> {fmt(prod.price)}</div>
            <div><b>Current Stock:</b> <span style={{fontWeight:700,color:qty?T.brown:"inherit"}}>{prod.stock} pcs</span></div>
            {qty&&Number(qty)>0&&<div style={{marginTop:6,fontWeight:700,color:"#198754"}}>After Update: {prod.stock+Number(qty)} pcs</div>}
          </div>
        </div>}
        <div className="si-form-group"><label>Quantity to Add</label><input type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)} placeholder="Enter quantity" /></div>
        <button className="si-btn si-btn-success" style={{width:"100%"}} onClick={handle}>Update Stock</button>
      </div>
      <div className="si-card">
        <div className="si-section-head"><span className="si-section-title">📋 Stock History</span></div>
        <div className="si-scroll">
          {history.length===0
            ? <div className="si-empty">No stock updates yet</div>
            : <table><thead><tr><th>Product</th><th>Old</th><th>Added</th><th>New</th><th>Date</th></tr></thead><tbody>
                {[...history].reverse().map((h,i)=>(
                  <tr key={i}>
                    <td>{h.product}</td>
                    <td>{h.old}</td>
                    <td style={{color:"#198754",fontWeight:600}}>+{h.added}</td>
                    <td style={{fontWeight:700}}>{h.nw}</td>
                    <td style={{fontSize:11,color:"#aaa"}}>{h.date}</td>
                  </tr>
                ))}
              </tbody></table>}
        </div>
      </div>
    </div>
  );
}

// ─── TRANSACTIONS / POS ──────────────────────────────────────────────────────
function Transactions({products,setProducts,customers,transactions,setTransactions}) {
  const [tab,setTab]=useState("pos");
  const [cust,setCust]=useState(""); const [custName,setCustName]=useState(""); const [selProd,setSelProd]=useState(""); const [qty,setQty]=useState(""); const [cart,setCart]=useState([]); const [msg,setMsg]=useState(null);
  const addToCart=()=>{
    const p=products.find(x=>x.id===Number(selProd));
    if(!p||!qty||Number(qty)<=0) return;
    if(Number(qty)>p.stock){setMsg({type:"danger",text:"Insufficient stock!"});return;}
    const exist=cart.find(c=>c.id===p.id);
    if(exist){
      const newQty=exist.qty+Number(qty);
      if(newQty>p.stock){setMsg({type:"danger",text:"Exceeds available stock!"});return;}
      setCart(cart.map(c=>c.id===p.id?{...c,qty:newQty,total:p.price*newQty}:c));
    } else {
      setCart([...cart,{id:p.id,name:p.name,price:p.price,qty:Number(qty),total:p.price*Number(qty)}]);
    }
    setSelProd(""); setQty(""); setMsg(null);
  };
  const removeItem=(id)=>setCart(cart.filter(c=>c.id!==id));
  const grand=cart.reduce((a,c)=>a+c.total,0);
  const checkout=()=>{
    if(cart.length===0||(!cust&&!custName)) return;
    const {date,time,inv}=now();
    const name=custName||(customers.find(c=>c.id===Number(cust))?.name)||"Walk-in";
    cart.forEach(item=>{
      setTransactions(prev=>[...prev,{invoice:inv,customer:name,product:item.name,qty:item.qty,amount:item.total,date,time}]);
      setProducts(prev=>prev.map(p=>p.id===item.id?{...p,stock:p.stock-item.qty}:p));
    });
    setMsg({type:"success",text:`✅ Transaction ${inv} completed! Total: ${fmt(grand)}`});
    setCart([]); setCust(""); setCustName("");
    setTimeout(()=>setMsg(null),5000);
  };
  return (
    <div className="si-card">
      <div className="si-tabs">
        {["pos","history"].map(t=><button key={t} className={`si-tab${tab===t?" active":""}`} onClick={()=>setTab(t)}>{t==="pos"?"🛒 Point of Sale":"🧾 Transaction History"}</button>)}
      </div>
      <div style={{padding:20}}>
        {tab==="pos"&&<>
          {msg&&<div className={`si-alert si-alert-${msg.type}`}>{msg.text}</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div>
              <div className="si-form-group"><label>Customer (select or type)</label>
                <select value={cust} onChange={e=>{setCust(e.target.value);setCustName("");}}>
                  <option value="">Walk-in / New</option>
                  {customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {!cust&&<div className="si-form-group"><label>Customer Name</label><input value={custName} onChange={e=>setCustName(e.target.value)} placeholder="Walk-in customer name" /></div>}
              <div className="si-input-row">
                <div className="si-form-group"><label>Product</label>
                  <select value={selProd} onChange={e=>setSelProd(e.target.value)}>
                    <option value="">-- Select --</option>
                    {products.filter(p=>p.stock>0).map(p=><option key={p.id} value={p.id}>{p.name} — {fmt(p.price)} ({p.stock} left)</option>)}
                  </select>
                </div>
                <div className="si-form-group"><label>Quantity</label><input type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)} /></div>
              </div>
              <button className="si-btn si-btn-gold" onClick={addToCart}>Add to Cart</button>
            </div>
            <div>
              <div style={{background:T.brownPale,borderRadius:10,padding:14,minHeight:180}}>
                <div style={{fontWeight:700,marginBottom:10,color:T.brownDark}}>🛒 Cart</div>
                {cart.length===0?<div style={{color:"#aaa",fontSize:13}}>No items yet</div>:
                  cart.map(c=><div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid rgba(139,90,43,0.1)"}}>
                    <div><div style={{fontSize:13,fontWeight:600}}>{c.name}</div><div style={{fontSize:12,color:"#888"}}>×{c.qty} @ {fmt(c.price)}</div></div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontWeight:700,color:T.brownDark}}>{fmt(c.total)}</span><button className="si-btn si-btn-danger si-btn-sm" onClick={()=>removeItem(c.id)}>×</button></div>
                  </div>)
                }
                {cart.length>0&&<div style={{marginTop:12,fontWeight:700,fontSize:16,color:T.brownDark,textAlign:"right"}}>Total: {fmt(grand)}</div>}
              </div>
              <button className="si-btn si-btn-success" style={{width:"100%",marginTop:12,padding:11}} onClick={checkout} disabled={cart.length===0}>Checkout & Record Sale</button>
            </div>
          </div>
        </>}
        {tab==="history"&&<div className="si-scroll">
          {transactions.length===0?<div className="si-empty">No transactions recorded yet</div>:
            <table><thead><tr><th>Invoice</th><th>Customer</th><th>Product</th><th>Qty</th><th>Total</th><th>Date</th><th>Time</th></tr></thead>
              <tbody>{[...transactions].reverse().map((t,i)=>(
                <tr key={i}><td style={{fontWeight:600,color:T.brownDark}}>{t.invoice}</td><td>{t.customer}</td><td>{t.product}</td><td>{t.qty}</td><td style={{color:"#198754",fontWeight:700}}>{fmt(t.amount)}</td><td style={{fontSize:12}}>{t.date}</td><td style={{fontSize:12}}>{t.time}</td></tr>
              ))}</tbody>
            </table>}
        </div>}
      </div>
    </div>
  );
}

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────
function Customers({customers,setCustomers}) {
  const [modal,setModal]=useState(false); const [form,setForm]=useState({name:"",address:"",contact:"",muni:"",brgy:""});
  const [search,setSearch]=useState(""); const [edit,setEdit]=useState(null);
  const open=(c=null)=>{ setEdit(c); setForm(c?{name:c.name,address:c.address,contact:c.contact,muni:c.muni||"",brgy:c.brgy||""}:{name:"",address:"",contact:"",muni:"",brgy:""}); setModal(true); };
  const save=()=>{
    const addr=form.muni==="Bongao"&&form.brgy?`${form.brgy}, Bongao, Tawi-Tawi`:form.muni?`${form.muni}, Tawi-Tawi`:form.address;
    if(edit){ setCustomers(customers.map(c=>c.id===edit.id?{...c,name:form.name,address:addr,contact:form.contact,muni:form.muni,brgy:form.brgy}:c)); }
    else { const nid=customers.length?Math.max(...customers.map(c=>c.id))+1:1; setCustomers([...customers,{id:nid,name:form.name,address:addr,contact:form.contact,muni:form.muni,brgy:form.brgy}]); }
    setModal(false);
  };
  const del=(id)=>{ if(window.confirm("Delete customer?")) setCustomers(customers.filter(c=>c.id!==id)); };
  const filtered=customers.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="si-card">
      <div className="si-section-head">
        <span className="si-section-title">👥 Customer Directory ({customers.length})</span>
        <div style={{display:"flex",gap:10}}>
          <input className="si-search" placeholder="Search customers…" value={search} onChange={e=>setSearch(e.target.value)} />
          <button className="si-btn si-btn-primary" onClick={()=>open()}>+ Add Customer</button>
        </div>
      </div>
      <div className="si-scroll">
        {filtered.length===0?<div className="si-empty">No customers yet</div>:
          <table><thead><tr><th>ID</th><th>Full Name</th><th>Address</th><th>Contact</th><th>Actions</th></tr></thead>
            <tbody>{filtered.map(c=>(
              <tr key={c.id}><td style={{color:"#aaa"}}>{c.id}</td><td style={{fontWeight:600}}>{c.name}</td><td style={{fontSize:12,color:"#666"}}>{c.address}</td><td>{c.contact}</td>
                <td><div style={{display:"flex",gap:5}}>
                  <button className="si-btn si-btn-outline si-btn-sm" onClick={()=>open(c)}>Edit</button>
                  <button className="si-btn si-btn-danger si-btn-sm" onClick={()=>del(c.id)}>Del</button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>}
      </div>
      {modal&&<div className="si-modal-overlay"><div className="si-modal">
        <div className="si-modal-head"><span className="si-modal-title">{edit?"Edit Customer":"Add Customer"}</span><button className="si-close" onClick={()=>setModal(false)}>×</button></div>
        <div className="si-form-group"><label>Full Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
        <div className="si-form-group"><label>Contact Number</label><input value={form.contact} onChange={e=>setForm({...form,contact:e.target.value})} placeholder="09XXXXXXXXX" /></div>
        <div className="si-form-group"><label>Municipality</label>
          <select value={form.muni} onChange={e=>setForm({...form,muni:e.target.value,brgy:""})}>
            <option value="">-- Select Municipality --</option>
            {MUNICIPALITIES.map(m=><option key={m}>{m}</option>)}
          </select>
        </div>
        {form.muni==="Bongao"&&<div className="si-form-group"><label>Barangay (Bongao)</label>
          <select value={form.brgy} onChange={e=>setForm({...form,brgy:e.target.value})}>
            <option value="">-- Select Barangay --</option>
            {BONGAO_BRGY.map(b=><option key={b}>{b}</option>)}
          </select>
        </div>}
        {!form.muni&&<div className="si-form-group"><label>Address</label><input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} /></div>}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button className="si-btn si-btn-outline" onClick={()=>setModal(false)}>Cancel</button>
          <button className="si-btn si-btn-primary" onClick={save}>Save</button>
        </div>
      </div></div>}
    </div>
  );
}

// ─── SQL SCHEMA ──────────────────────────────────────────────────────────────
function Schema() {
  const [copied,setCopied]=useState(false);
  const copy=()=>{ navigator.clipboard.writeText(SQL_SCHEMA); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return (
    <div className="si-card">
      <div className="si-section-head">
        <span className="si-section-title">🗄️ Database Schema (MySQL)</span>
        <button className="si-btn si-btn-gold" onClick={copy}>{copied?"✅ Copied!":"📋 Copy SQL"}</button>
      </div>
      <pre style={{padding:20,fontSize:12.5,lineHeight:1.7,color:"#333",overflowX:"auto",background:"#fdf9f4",margin:0,borderRadius:"0 0 12px 12px"}}>{SQL_SCHEMA}</pre>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(null);
  const [page,setPage]=useState("dashboard");
  const [products,setProducts]=useState(PRODUCTS_INIT);
  const [customers,setCustomers]=useState([
    {id:1,name:"Abdullah Hassan",address:"Tubig Mampallam, Bongao, Tawi-Tawi",contact:"09123456789",muni:"Bongao",brgy:"Tubig Mampallam"},
    {id:2,name:"Ali Hassan",address:"Poblacion, Bongao, Tawi-Tawi",contact:"09187654321",muni:"Bongao",brgy:"Poblacion"},
  ]);
  const [transactions,setTransactions]=useState([
    {invoice:"INV001",customer:"Ali Hassan",product:"Hammer",qty:2,amount:500,date:"Jun 16, 2026",time:"09:15 AM"},
    {invoice:"INV002",customer:"Abdullah Hassan",product:"Cement",qty:5,amount:1450,date:"Jun 16, 2026",time:"10:30 AM"},
  ]);
  const [stockHistory,setStockHistory]=useState([]);

  if(!user) return <><style>{css}</style><Login onLogin={u=>setUser(u)} /></>;

  const NAV=[
    {id:"dashboard",icon:"📊",label:"Dashboard"},
    {id:"products",icon:"📦",label:"Products"},
    {id:"stock",icon:"➕",label:"Add Stock"},
    {id:"transactions",icon:"🛒",label:"Transactions"},
    {id:"customers",icon:"👥",label:"Customers"},
    {id:"schema",icon:"🗄️",label:"DB Schema"},
  ];
  const TITLES={dashboard:"Dashboard",products:"Product Inventory",stock:"Stock Management",transactions:"Sales & Transactions",customers:"Customer Directory",schema:"Database Schema"};

  return (
    <>
      <style>{css}</style>
      <div className="si-app">
        <div className="si-sidebar">
          <div className="si-sidebar-logo">
            <div style={{fontSize:24,marginBottom:6}}>🔧</div>
            <h2>Smart Inventory</h2>
            <p>Hardware Supply Mgmt</p>
          </div>
          <div className="si-nav">
            {NAV.map(n=>(
              <div key={n.id} className={`si-nav-item${page===n.id?" active":""}`} onClick={()=>setPage(n.id)}>
                <span className="si-nav-icon">{n.icon}</span>
                <span>{n.label}</span>
              </div>
            ))}
          </div>
          <div className="si-sidebar-footer">
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:11,marginBottom:8,textAlign:"center"}}>Logged in as <b style={{color:T.gold}}>{user}</b></div>
            <button className="si-logout-btn" onClick={()=>setUser(null)}>🚪 Sign Out</button>
          </div>
        </div>
        <div className="si-main">
          <div className="si-topbar">
            <span className="si-topbar-title">{TITLES[page]}</span>
            <div className="si-topbar-right">
              <Clock />
              <div className="si-topbar-avatar">{user[0].toUpperCase()}</div>
            </div>
          </div>
          <div className="si-content">
            {page==="dashboard"&&<Dashboard products={products} transactions={transactions} />}
            {page==="products"&&<Products products={products} setProducts={setProducts} />}
            {page==="stock"&&<AddStock products={products} setProducts={setProducts} history={stockHistory} setHistory={setStockHistory} />}
            {page==="transactions"&&<Transactions products={products} setProducts={setProducts} customers={customers} transactions={transactions} setTransactions={setTransactions} />}
            {page==="customers"&&<Customers customers={customers} setCustomers={setCustomers} />}
            {page==="schema"&&<Schema />}
          </div>
        </div>
      </div>
    </>
  );
}
