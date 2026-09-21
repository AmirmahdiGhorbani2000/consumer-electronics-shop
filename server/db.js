require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ce_shop";
const MONGO_OPTIONS = {
  autoIndex: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 20,
  minPoolSize: 5,
};

const state = {
  connected: false,
  lastError: null,
  retries: 0,
};

async function connect() {
  try {
    await mongoose.connect(MONGO_URI, MONGO_OPTIONS);
    state.connected = true;
    state.lastError = null;
    state.retries = 0;
    console.log("[DB] MongoDB connected:", mongoose.connection.host);
  } catch (err) {
    state.connected = false;
    state.lastError = err.message;
    state.retries += 1;
    console.error(`[DB] Connection failed (retry ${state.retries}):`, err.message);
    setTimeout(connect, Math.min(30000, 1000 * 2 ** state.retries));
  }
}

function disconnect() {
  return mongoose.connection.close().then(() => {
    state.connected = false;
    console.log("[DB] MongoDB disconnected");
  });
}

function getStatus() {
  const readyState = mongoose.connection.readyState;
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  return {
    connected: state.connected,
    readyState: states[readyState] || "unknown",
    host: mongoose.connection.host || null,
    database: mongoose.connection.name || null,
    retries: state.retries,
    lastError: state.lastError,
  };
}

function healthCheck() {
  return mongoose.connection.db.admin().ping().then(() => true).catch(() => false);
}

mongoose.connection.on("connected", () => {
  state.connected = true;
  console.log("[DB] Event: connected");
});

mongoose.connection.on("disconnected", () => {
  state.connected = false;
  console.log("[DB] Event: disconnected");
});

mongoose.connection.on("reconnected", () => {
  state.connected = true;
  console.log("[DB] Event: reconnected");
});

mongoose.connection.on("error", (err) => {
  state.lastError = err.message;
  console.error("[DB] Event: error:", err.message);
});

process.on("SIGINT", async () => {
  await disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await disconnect();
  process.exit(0);
});

module.exports = {
  mongoose,
  connect,
  disconnect,
  getStatus,
  healthCheck,
  state,
};
