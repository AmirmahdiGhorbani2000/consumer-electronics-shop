require("dotenv").config();
const axios = require("axios");

const MERCHANT_ID = process.env.ZARINPAL_MERCHANT || "testproject19se2026";
const SANDBOX = process.env.ZARINPAL_SANDBOX === "true";
const BASE = SANDBOX
  ? "https://sandbox.zarinpal.com/pg"
  : "https://api.zarinpal.com/pg";
const START_PAY = SANDBOX
  ? "https://sandbox.zarinpal.com/pg/StartPay/"
  : "https://www.zarinpal.com/pg/StartPay/";

const REQUEST_URL = `${BASE}/v4/payment/request.json`;
const VERIFY_URL = `${BASE}/v4/payment/verify.json`;

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function validateAmount(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 1000 || n > 500000000) {
    throw new Error("Amount must be between 1000 and 500,000,000 Rials");
  }
  return Math.floor(n);
}

function validateCallback(url) {
  if (typeof url !== "string" || !/^https?:\/\//.test(url)) {
    throw new Error("Callback URL must be a valid http(s) URL");
  }
  return url;
}

async function createPayment({ amount, callbackUrl, description = "", metadata = {} }) {
  const safeAmount = validateAmount(amount);
  const safeCallback = validateCallback(callbackUrl);

  const payload = {
    merchant_id: MERCHANT_ID,
    amount: safeAmount,
    callback_url: safeCallback,
    description: String(description).slice(0, 255),
    metadata,
  };

  const { data } = await axios.post(REQUEST_URL, payload, { headers: DEFAULT_HEADERS });

  if (data?.data?.code === 100 && data?.data?.authority) {
    return {
      success: true,
      authority: data.data.authority,
      paymentUrl: `${START_PAY}${data.data.authority}`,
      raw: data.data,
    };
  }

  return {
    success: false,
    error: data?.errors?.message || "Payment request failed",
    code: data?.errors?.code || -1,
    raw: data,
  };
}

async function verifyPayment({ authority, amount }) {
  const safeAmount = validateAmount(amount);
  if (typeof authority !== "string" || authority.length < 10) {
    throw new Error("Invalid authority");
  }

  const payload = {
    merchant_id: MERCHANT_ID,
    amount: safeAmount,
    authority,
  };

  const { data } = await axios.post(VERIFY_URL, payload, { headers: DEFAULT_HEADERS });

  const code = data?.data?.code;

  if (code === 100 || code === 101) {
    return {
      success: true,
      refId: String(data.data.ref_id),
      cardPan: data.data.card_pan || null,
      cardHash: data.data.card_hash || null,
      fee: data.data.fee || 0,
      alreadyVerified: code === 101,
      raw: data.data,
    };
  }

  return {
    success: false,
    error: data?.errors?.message || "Payment verification failed",
    code: data?.errors?.code || -1,
    raw: data,
  };
}

async function getPaymentStatus(authority) {
  if (typeof authority !== "string") throw new Error("Invalid authority");
  try {
    const result = await verifyPayment({ authority, amount: 1000 });
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function parseCallback(query) {
  const { Authority, Status } = query || {};
  return {
    authority: Authority || null,
    status: Status || null,
    isOk: Status === "OK",
    isNok: Status === "NOK",
  };
}

module.exports = {
  MERCHANT_ID,
  SANDBOX,
  REQUEST_URL,
  VERIFY_URL,
  START_PAY,
  createPayment,
  verifyPayment,
  getPaymentStatus,
  parseCallback,
  validateAmount,
  validateCallback,
};
