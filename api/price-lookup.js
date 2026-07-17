const MAX_MODEL_LENGTH = 100;
const MAX_RESULTS = 20;
const DEFAULT_MAX_FALLBACK_SCAN = 10000;
const FALLBACK_PAGE_SIZE = 1000;
const SELLING_PRICE_MULTIPLIER = 1.8;

const normalizeModel = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "");

const sendJson = (response, status, payload) => {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.status(status).json(payload);
};

const getBearerToken = (request) => {
  const authorization = request.headers.authorization || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
};

const parseBody = (body) => {
  if (typeof body === "string") return JSON.parse(body);
  return body && typeof body === "object" ? body : {};
};

// No Admin SDK is used here: Identity Toolkit validates the ID token, then
// Firestore REST applies the project's rules while reading the caller's role.
// This requires the same own-user-document read that AuthContext already uses.
const verifyFirebaseUser = async (token, apiKey) => {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
      apiKey
    )}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken: token }),
    }
  );

  if (!response.ok) return null;

  const payload = await response.json();
  return payload.users?.[0] || null;
};

const getFirebaseRole = async ({ projectId, uid, token }) => {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      projectId
    )}/databases/(default)/documents/users/${encodeURIComponent(uid)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) return null;

  const document = await response.json();
  return document.fields?.role?.stringValue || null;
};

const getPriceDatabaseConfig = () => {
  const url = String(process.env.PRICE_DB_SUPABASE_URL || "").replace(/\/$/, "");
  const key = String(process.env.PRICE_DB_SUPABASE_KEY || "");
  const table = String(process.env.PRICE_DB_SUPABASE_TABLE || "products");
  const configuredScanLimit = Number(process.env.PRICE_DB_MAX_FALLBACK_SCAN);
  const maxFallbackScan = Number.isInteger(configuredScanLimit)
    ? Math.min(Math.max(configuredScanLimit, 1000), 50000)
    : DEFAULT_MAX_FALLBACK_SCAN;

  if (!url || !key || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) return null;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:") return null;
  } catch {
    return null;
  }

  return { url, key, table, maxFallbackScan };
};

const querySupabase = async (config, query) => {
  const response = await fetch(
    `${config.url}/rest/v1/${encodeURIComponent(config.table)}?${query}`,
    {
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        Accept: "application/json",
      },
    }
  );

  const payload = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, payload };
};

const queryByModelKey = async (config, normalizedModel) => {
  const fields =
    "model,model_key,purchase_price,retail_price,price,base_price,stock,source_file";
  const query = new URLSearchParams({
    select: fields,
    model_key: `eq.${normalizedModel}`,
    limit: String(MAX_RESULTS),
  });

  return querySupabase(config, query.toString());
};

const modelKeyIsUnavailable = (result) => {
  if (result.ok) return false;
  const errorText = JSON.stringify(result.payload || {}).toLowerCase();
  return errorText.includes("model_key") && result.status >= 400;
};

const queryWithNormalizedFallback = async (config, normalizedModel) => {
  const fields =
    "model,purchase_price,retail_price,price,base_price,stock,source_file";
  const matches = [];

  for (
    let offset = 0;
    offset < config.maxFallbackScan && matches.length < MAX_RESULTS;
    offset += FALLBACK_PAGE_SIZE
  ) {
    const limit = Math.min(
      FALLBACK_PAGE_SIZE,
      config.maxFallbackScan - offset
    );
    const query = new URLSearchParams({
      select: fields,
      limit: String(limit),
      offset: String(offset),
    });
    const result = await querySupabase(config, query.toString());

    if (!result.ok || !Array.isArray(result.payload)) return result;

    matches.push(
      ...result.payload.filter(
        (row) => normalizeModel(row.model) === normalizedModel
      )
    );

    if (result.payload.length < limit) break;
  }

  return { ok: true, status: 200, payload: matches.slice(0, MAX_RESULTS) };
};

const toMoney = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const calculateSellingPrice = (row) => {
  const prices = [
    row.base_price,
    row.purchase_price,
    row.retail_price,
    row.price,
  ]
    .map(toMoney)
    .filter((value) => value !== null && value > 0);

  if (!prices.length) return null;
  // Matches the confirmed price-app rule: lowest positive price × 1.8.
  return Math.round(Math.min(...prices) * SELLING_PRICE_MULTIPLIER * 100) / 100;
};

const sanitizeResult = (row) => ({
  model: String(row.model || ""),
  purchase_price: toMoney(row.purchase_price),
  selling_price: calculateSellingPrice(row),
  stock: row.stock === null || row.stock === undefined ? null : String(row.stock),
  source_file: row.source_file ? String(row.source_file) : null,
});

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  let body;
  try {
    body = parseBody(request.body);
  } catch {
    return sendJson(response, 400, { error: "Invalid JSON body" });
  }

  const rawModel = typeof body.model === "string" ? body.model.trim() : "";
  const normalizedModel = normalizeModel(rawModel);

  if (
    !rawModel ||
    rawModel.length > MAX_MODEL_LENGTH ||
    !normalizedModel ||
    normalizedModel.length > MAX_MODEL_LENGTH
  ) {
    return sendJson(response, 400, { error: "Invalid model" });
  }

  const authorization = request.headers.authorization || "";
  if (!authorization) {
    return sendJson(response, 401, {
      code: "missing_token",
      error: "Authentication token is required",
    });
  }

  const token = getBearerToken(request);
  if (!token) {
    return sendJson(response, 401, {
      code: "invalid_token",
      error: "Invalid authentication token",
    });
  }

  const firebaseApiKey = process.env.VITE_API_KEY;
  const firebaseProjectId = process.env.VITE_PROJECT_ID;
  if (!firebaseApiKey || !firebaseProjectId) {
    return sendJson(response, 500, { error: "Server authentication is not configured" });
  }

  try {
    const firebaseUser = await verifyFirebaseUser(token, firebaseApiKey);
    if (!firebaseUser?.localId || firebaseUser.disabled) {
      return sendJson(response, 401, {
        code: "invalid_token",
        error: "Invalid or expired authentication token",
      });
    }

    const role = await getFirebaseRole({
      projectId: firebaseProjectId,
      uid: firebaseUser.localId,
      token,
    });

    if (role !== "admin") {
      return sendJson(response, 403, {
        code: "not_admin",
        error: "Admin access required",
      });
    }

    const priceDatabase = getPriceDatabaseConfig();
    if (!priceDatabase) {
      return sendJson(response, 500, { error: "Price database is not configured" });
    }

    let lookup = await queryByModelKey(priceDatabase, normalizedModel);
    if (modelKeyIsUnavailable(lookup)) {
      lookup = await queryWithNormalizedFallback(
        priceDatabase,
        normalizedModel
      );
    }

    if (!lookup.ok || !Array.isArray(lookup.payload)) {
      return sendJson(response, 502, { error: "Price database request failed" });
    }

    const results = lookup.payload
      .filter((row) => normalizeModel(row.model) === normalizedModel)
      .slice(0, MAX_RESULTS)
      .map(sanitizeResult);

    return sendJson(response, 200, { results });
  } catch {
    return sendJson(response, 500, { error: "Unable to complete price lookup" });
  }
}
