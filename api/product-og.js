import { getApps, initializeApp } from "firebase/app";
import { doc, getDoc, getFirestore } from "firebase/firestore";

const SITE_URL = "https://www.lob.ge";
const FALLBACK_TITLE = "LOB.GE | საყოფაცხოვრებო ტექნიკა";
const FALLBACK_DESCRIPTION = "პროდუქტების კატალოგი თქვენი სახლისთვის";
const FALLBACK_IMAGE = `${SITE_URL}/og-lobge.jpg`;

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const getFirebaseConfig = () => ({
  apiKey: process.env.VITE_API_KEY,
  authDomain: process.env.VITE_AUTH_DOMAIN,
  projectId: process.env.VITE_PROJECT_ID,
  storageBucket: process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_ID,
});

const renderPage = ({ title, description, image, canonicalUrl }) => `<!doctype html>
<html lang="ka">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="LOB.GE" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
  </head>
  <body></body>
</html>`;

export default async function handler(request, response) {
  const rawProductId = Array.isArray(request.query.productId)
    ? request.query.productId[0]
    : request.query.productId;
  const productId = String(rawProductId || "").trim();
  const canonicalUrl = `${SITE_URL}/product/${encodeURIComponent(productId)}`;

  let title = FALLBACK_TITLE;
  let description = FALLBACK_DESCRIPTION;
  let image = productId
    ? `${SITE_URL}/api/product-preview?productId=${encodeURIComponent(productId)}`
    : FALLBACK_IMAGE;

  if (productId && productId.length <= 150) {
    try {
      const config = getFirebaseConfig();

      if (config.apiKey && config.projectId) {
        const app = getApps()[0] || initializeApp(config);
        const snapshot = await getDoc(doc(getFirestore(app), "products", productId));

        if (snapshot.exists()) {
          const product = snapshot.data();
          title = product.name || FALLBACK_TITLE;
          description =
            product.fullDescription ||
            product.shortDescription ||
            FALLBACK_DESCRIPTION;
        }
      }
    } catch (error) {
      console.error("Unable to load product preview", error);
    }
  }

  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  response.status(200).send(renderPage({ title, description, image, canonicalUrl }));
}
