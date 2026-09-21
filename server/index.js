require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ce_shop";
const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";
const ZARINPAL_MERCHANT = process.env.ZARINPAL_MERCHANT || "testproject19se2026";
const ZARINPAL_REQUEST = "https://api.zarinpal.com/pg/v4/payment/request.json";
const ZARINPAL_VERIFY = "https://api.zarinpal.com/pg/v4/payment/verify.json";
const ZARINPAL_START = "https://www.zarinpal.com/pg/StartPay/";

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 60000, max: 120 }));
app.use(express.static(path.join(__dirname, "..", "client")));

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("[DB] MongoDB connected"))
  .catch((err) => console.error("[DB] MongoDB error:", err.message));

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    cart: [{ productId: mongoose.Schema.Types.ObjectId, qty: Number }],
  },
  { timestamps: true }
);

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    brand: { type: String, required: true },
    category: {
      type: String,
      enum: ["mobile", "laptop", "tv", "audio", "camera", "console"],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0 },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
  },
  { timestamps: true }
);

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        qty: Number,
        price: Number,
      },
    ],
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "shipped", "delivered"],
      default: "pending",
    },
    authority: { type: String, default: "" },
    refId: { type: String, default: "" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
const Product = mongoose.model("Product", ProductSchema);
const Order = mongoose.model("Order", OrderSchema);

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

const auth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  next();
};

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Missing fields" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already used" });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });
    res.json({ token: signToken(user), user: { id: user._id, name, email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    res.json({
      token: signToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/auth/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

app.get("/api/products", async (req, res) => {
  const { category, search, sort } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (search) filter.title = { $regex: search, $options: "i" };
  const sortBy =
    sort === "price" ? { price: 1 } : sort === "-price" ? { price: -1 } : { createdAt: -1 };
  const products = await Product.find(filter).sort(sortBy);
  res.json(products);
});

app.get("/api/products/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json(product);
});

app.post("/api/products", auth, adminOnly, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/products/:id", auth, adminOnly, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json(product);
});

app.delete("/api/products/:id", auth, adminOnly, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.post("/api/orders", auth, async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: "Empty cart" });

    let total = 0;
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ error: "Product not found" });
      total += product.price * item.qty;
    }

    const order = await Order.create({ userId: req.user.id, items, total });
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/orders/my", auth, async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).populate("items.productId");
  res.json(orders);
});

app.get("/api/orders", auth, adminOnly, async (req, res) => {
  const orders = await Order.find().populate("items.productId").populate("userId", "-password");
  res.json(orders);
});

app.post("/api/payment/request/:orderId", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const payload = {
      merchant_id: ZARINPAL_MERCHANT,
      amount: order.total,
      callback_url: `${req.protocol}://${req.get("host")}/api/payment/verify`,
      description: `Order ${order._id}`,
    };

    const { data } = await axios.post(ZARINPAL_REQUEST, payload, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
    });

    if (data?.data?.authority) {
      order.authority = data.data.authority;
      await order.save();
      return res.json({ url: `${ZARINPAL_START}${data.data.authority}` });
    }
    res.status(502).json({ error: "Zarinpal request failed", details: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/payment/verify", async (req, res) => {
  try {
    const { Authority, Status } = req.query;
    if (Status !== "OK") return res.redirect("/payment-failed.html");

    const order = await Order.findOne({ authority: Authority });
    if (!order) return res.redirect("/payment-failed.html");

    const payload = {
      merchant_id: ZARINPAL_MERCHANT,
      amount: order.total,
      authority: Authority,
    };

    const { data } = await axios.post(ZARINPAL_VERIFY, payload, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
    });

    if (data?.data?.ref_id) {
      order.status = "paid";
      order.refId = String(data.data.ref_id);
      await order.save();
      return res.redirect(`/payment-success.html?ref=${data.data.ref_id}`);
    }

    order.status = "failed";
    await order.save();
    res.redirect("/payment-failed.html");
  } catch (err) {
    res.redirect("/payment-failed.html");
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true, uptime: process.uptime() }));

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, req, res, next) => {
  console.error("[ERR]", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`[SRV] ConsumerElectronics backend running on :${PORT}`);
});
