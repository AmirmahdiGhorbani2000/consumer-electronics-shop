import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { api } from "./api.jsx";
import "./style.css";

function Navbar({ cartCount, onCart, onLogin, user, onAdmin, onHome }) {
  const [query, setQuery] = useState("");
  return (
    <nav className="navbar">
      <div className="container">
        <a className="logo" onClick={onHome}>⚡ ElectronicShop</a>
        <div className="search-bar">
          <span>🔍</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجوی محصول..." />
        </div>
        <div className="nav-actions">
          {user?.role === "admin" && <button className="nav-btn" onClick={onAdmin}>⚙️</button>}
          <button className="nav-btn" onClick={onLogin}>👤</button>
          <button className="nav-btn" onClick={onCart}>🛒
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <div className="hero">
      <h1>خرید لوازم الکترونیکی</h1>
      <p>بهترین قیمت‌ها برای موبایل، لپ‌تاپ، تلویزیون و لوازم جانبی</p>
      <div className="hero-stats">
        <div className="hero-stat"><strong>۵۰۰+</strong><span>محصول متنوع</span></div>
        <div className="hero-stat"><strong>۵۰K+</strong><span>مشتری راضی</span></div>
        <div className="hero-stat"><strong>۲۴/۷</strong><span>پشتیبانی</span></div>
        <div className="hero-stat"><strong>۱۰۰٪</strong><span>ضمانت اصالت</span></div>
      </div>
    </div>
  );
}

const categoryNames = { mobile:"موبایل", laptop:"لپ‌تاپ", tv:"تلویزیون", audio:"صوتی", camera:"دوربین", console:"کنسول بازی" };

function CategoryBar({ categories, current, onSelect }) {
  return (
    <div className="categories">
      {categories.map((c) => (
        <span key={c} className={`category-chip ${c === current ? "active" : ""}`} onClick={() => onSelect(c)}>
          {c === "all" ? "همه" : categoryNames[c] || c}
        </span>
      ))}
    </div>
  );
}

function ProductCard({ product, onAdd }) {
  return (
    <div className="product-card">
      <div className="product-image">{product.image || "📦"}</div>
      <div className="product-body">
        <div className="product-brand">{product.brand}</div>
        <div className="product-title">{product.title}</div>
        <div className="product-rating">{"★".repeat(Math.round(product.rating))} {product.rating}</div>
        <div className="product-price">{Number(product.price).toLocaleString("fa-IR")} تومان</div>
        <div className="product-actions">
          <button className="btn-add" onClick={() => onAdd(product)}>افزودن به سبد</button>
        </div>
      </div>
    </div>
  );
}

function ProductGrid({ products, onAdd }) {
  if (!products.length) return <div className="empty">محصولی یافت نشد</div>;
  return (
    <div className="products-grid">
      {products.map((p) => <ProductCard key={p._id} product={p} onAdd={onAdd} />)}
    </div>
  );
}

function CartModal({ cart, open, onClose, onCheckout }) {
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  if (!open) return null;
  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>🛒 سبد خرید</h3>
        {cart.length === 0 ? <div className="empty">سبد خرید خالی است</div> : cart.map((c) => (
          <div key={c._id} className="cart-item">
            <span>{c.image} {c.title} × {c.qty}</span>
            <span>{(c.price * c.qty).toLocaleString("fa-IR")}</span>
          </div>
        ))}
        <div className="cart-total">{total.toLocaleString("fa-IR")} تومان</div>
        <button className="btn btn-primary btn-block" onClick={onCheckout}>پرداخت با زرین‌پال</button>
        <button className="btn btn-outline btn-block" style={{marginTop: 8}} onClick={onClose}>ادامه خرید</button>
      </div>
    </div>
  );
}

function LoginModal({ open, onClose, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  if (!open) return null;
  return (
    <div className="modal-overlay show" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>ورود / ثبت‌نام</h3>
        <div className="form-group">
          <label>ایمیل</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </div>
        <div className="form-group">
          <label>رمز عبور</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
        </div>
        <button className="btn btn-primary btn-block" onClick={() => onLogin(email, password)}>ورود</button>
        <button className="btn btn-outline btn-block" style={{marginTop: 8}} onClick={onClose}>انصراف</button>
      </div>
    </div>
  );
}

function AdminPanel({ products, onAdd, onDelete }) {
  const [form, setForm] = useState({ title:"", brand:"", category:"mobile", price:"", stock:"", image:"📦" });
  return (
    <div className="container">
      <h2 className="section-title">⚙️ پنل مدیریت</h2>
      <div className="admin-panel">
        <h3 style={{marginBottom: 14}}>افزودن محصول</h3>
        <div className="admin-form">
          <input value={form.title} onChange={(e) => setForm({...form, title:e.target.value})} placeholder="عنوان" />
          <input value={form.brand} onChange={(e) => setForm({...form, brand:e.target.value})} placeholder="برند" />
          <select value={form.category} onChange={(e) => setForm({...form, category:e.target.value})}>
            {Object.entries(categoryNames).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input value={form.price} onChange={(e) => setForm({...form, price:e.target.value})} type="number" placeholder="قیمت" />
          <input value={form.stock} onChange={(e) => setForm({...form, stock:e.target.value})} type="number" placeholder="موجودی" />
          <input value={form.image} onChange={(e) => setForm({...form, image:e.target.value})} placeholder="آیکون" />
          <button onClick={() => { onAdd(form); setForm({ title:"", brand:"", category:"mobile", price:"", stock:"", image:"📦" }); }}>➕ افزودن</button>
        </div>
      </div>
      <div className="admin-panel">
        <h3 style={{marginBottom: 14}}>لیست محصولات</h3>
        <div className="admin-list">
          {products.map((p) => (
            <div key={p._id} className="admin-row">
              <span>{p.image} {p.title} — {Number(p.price).toLocaleString("fa-IR")}</span>
              <button onClick={() => onDelete(p._id)}>حذف</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return <div className="toast">{message}</div>;
}

const fallbackProducts = [
  { _id:"1", title:"گوشی سامسونگ Galaxy S24", brand:"Samsung", category:"mobile", price:45000000, stock:15, image:"📱", rating:4.8 },
  { _id:"2", title:"آیفون ۱۵ پرو مکس", brand:"Apple", category:"mobile", price:85000000, stock:8, image:"📱", rating:4.9 },
  { _id:"3", title:"لپ‌تاپ MacBook Pro M3", brand:"Apple", category:"laptop", price:95000000, stock:5, image:"💻", rating:5.0 },
  { _id:"4", title:"لپ‌تاپ ایسوس ROG", brand:"Asus", category:"laptop", price:65000000, stock:12, image:"💻", rating:4.7 },
  { _id:"5", title:"تلویزیون ال‌جی OLED", brand:"LG", category:"tv", price:55000000, stock:20, image:"📺", rating:4.6 },
  { _id:"6", title:"هدفون سونی XM5", brand:"Sony", category:"audio", price:12000000, stock:30, image:"🎧", rating:4.9 },
];

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [cartOpen, setCartOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    api.getProducts().then(setProducts).catch(() => setProducts(fallbackProducts));
  }, []);

  const showToast = useCallback((m) => {
    setToast(m);
    setTimeout(() => setToast(""), 2000);
  }, []);

  const categories = useMemo(() => ["all", ...new Set(products.map((p) => p.category))], [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (search) list = list.filter((p) => p.title.includes(search) || p.brand.includes(search));
    return list;
  }, [products, category, search]);

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c._id === product._id);
      if (existing) return prev.map((c) => c._id === product._id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...product, qty: 1 }];
    });
    showToast("به سبد اضافه شد");
  }, [showToast]);

  const handleLogin = useCallback(async (email, password) => {
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      setLoginOpen(false);
      showToast("خوش آمدید");
    } catch {
      showToast("ورود ناموفق");
    }
  }, [showToast]);

  const handleCheckout = useCallback(async () => {
    if (!cart.length) return showToast("سبد خرید خالی است");
    if (!user) { setCartOpen(false); setLoginOpen(true); return; }
    try {
      const order = await api.createOrder(cart.map((c) => ({ productId: c._id, qty: c.qty })));
      const pay = await api.requestPayment(order._id);
      if (pay.url) window.location.href = pay.url;
    } catch {
      showToast("حالت نمایشی — بدون پرداخت واقعی");
      setCart([]);
      setCartOpen(false);
    }
  }, [cart, user, showToast]);

  const handleAddProduct = useCallback((form) => {
    const product = {
      _id: Date.now().toString(),
      title: form.title,
      brand: form.brand,
      category: form.category,
      price: Number(form.price),
      stock: Number(form.stock) || 0,
      image: form.image,
      rating: 4.5,
    };
    setProducts((prev) => [...prev, product]);
    showToast("محصول اضافه شد");
  }, [showToast]);

  const handleDeleteProduct = useCallback((id) => {
    if (!confirm("حذف شود؟")) return;
    setProducts((prev) => prev.filter((p) => p._id !== id));
    showToast("حذف شد");
  }, [showToast]);

  return (
    <>
      <Navbar
        cartCount={cartCount}
        onCart={() => setCartOpen(true)}
        onLogin={() => setLoginOpen(true)}
        onAdmin={() => setPage("admin")}
        onHome={() => setPage("home")}
        user={user}
      />
      {page === "home" ? (
        <>
          <Hero />
          <div className="container">
            <h2 className="section-title">📦 دسته‌بندی‌ها</h2>
            <CategoryBar categories={categories} current={category} onSelect={setCategory} />
            <h2 className="section-title">🔥 محصولات</h2>
            <ProductGrid products={filtered} onAdd={addToCart} />
          </div>
        </>
      ) : (
        <AdminPanel products={products} onAdd={handleAddProduct} onDelete={handleDeleteProduct} />
      )}
      <div className="footer">
        <p>© ۲۰۲۶ ElectronicShop — تمامی حقوق محفوظ است</p>
      </div>
      <CartModal cart={cart} open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={handleCheckout} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={handleLogin} />
      <Toast message={toast} />
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
