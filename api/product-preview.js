import { getApps, initializeApp } from "firebase/app";
import { doc, getDoc, getFirestore } from "firebase/firestore";

const FALLBACK_TITLE = "LOB.GE";
const CREAM = "#f6f0e5";
const NAVY = "#102a43";

const escapeXml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const safeImageUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
};

const getFirebaseConfig = () => ({
  apiKey: process.env.VITE_API_KEY,
  authDomain: process.env.VITE_AUTH_DOMAIN,
  projectId: process.env.VITE_PROJECT_ID,
  storageBucket: process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_ID,
});

const titleLines = (value) => {
  const words = String(value || FALLBACK_TITLE).trim().split(/\s+/);
  const lines = [];

  for (const word of words) {
    const current = lines.at(-1);
    if (!current || (current.length + word.length + 1 > 26 && lines.length < 3)) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${current} ${word}`;
    }
  }

  if (lines.length > 3) {
    lines[2] = `${lines.slice(2).join(" ").slice(0, 24).trimEnd()}…`;
    lines.length = 3;
  }

  return lines;
};

const renderImage = ({ name, image }) => {
  const lines = titleLines(name);
  const title = lines
    .map(
      (line, index) =>
        `<tspan x="680" dy="${index === 0 ? 0 : 68}">${escapeXml(line)}</tspan>`,
    )
    .join("");
  const productImage = image
    ? `<image href="${escapeXml(image)}" x="70" y="70" width="540" height="490" preserveAspectRatio="xMidYMid meet" />`
    : `<text x="340" y="325" text-anchor="middle" fill="${NAVY}" opacity="0.24" font-family="Arial, sans-serif" font-size="42" font-weight="700">LOB.GE</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${CREAM}" />
  <rect x="0" y="0" width="28" height="630" fill="${NAVY}" />
  <rect x="55" y="55" width="570" height="520" rx="24" fill="#ffffff" />
  ${productImage}
  <text x="680" y="116" fill="${NAVY}" font-family="Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="3">LOB.GE</text>
  <rect x="680" y="142" width="92" height="6" rx="3" fill="${NAVY}" />
  <text x="680" y="235" fill="${NAVY}" font-family="Arial, sans-serif" font-size="54" font-weight="700">${title}</text>
  <text x="680" y="548" fill="${NAVY}" font-family="Arial, sans-serif" font-size="25">www.lob.ge</text>
</svg>`;
};

export default async function handler(request, response) {
  const rawProductId = Array.isArray(request.query.productId)
    ? request.query.productId[0]
    : request.query.productId;
  const productId = String(rawProductId || "").trim();
  let name = FALLBACK_TITLE;
  let image = "";

  if (productId && productId.length <= 150) {
    try {
      const config = getFirebaseConfig();
      if (config.apiKey && config.projectId) {
        const app = getApps()[0] || initializeApp(config);
        const snapshot = await getDoc(doc(getFirestore(app), "products", productId));
        if (snapshot.exists()) {
          const product = snapshot.data();
          name = product.name || FALLBACK_TITLE;
          image = safeImageUrl(product.mainImage);
        }
      }
    } catch (error) {
      console.error("Unable to load product preview image", error);
    }
  }

  response.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  response.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.status(200).send(renderImage({ name, image }));
}
