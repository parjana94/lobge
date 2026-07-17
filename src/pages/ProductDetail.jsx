import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";
import { getProduct, getProducts } from "../firebase/products";
import { getCategories } from "../firebase/categories";

import "./ProductDetail.css";

const PHONE_NUMBER = "+995555770599";
const PHONE_DISPLAY = "+995 555 77 05 99";

export default function ProductDetail() {
  const { id } = useParams();
  const { user, role } = useContext(AuthContext);
  const isAdmin = Boolean(user && role === "admin");

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [categories, setCategories] = useState([]);

  const [activeImage, setActiveImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(false);
  const [priceModel, setPriceModel] = useState("");
  const [priceResults, setPriceResults] = useState([]);
  const [priceLookupStatus, setPriceLookupStatus] = useState("idle");

  useEffect(() => {
    if (isAdmin) return;

    setPriceModel("");
    setPriceResults([]);
    setPriceLookupStatus("idle");
  }, [isAdmin]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const currentProduct = await getProduct(id);

      if (!currentProduct || !currentProduct.name) {
        setProduct(null);
        setRelated([]);
        setCategories([]);
        setActiveImage("");
        return;
      }

      const [allProducts, categoryData] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);

      const sameCategoryProducts = allProducts.filter(
        (item) =>
          item.id !== currentProduct.id &&
          item.categoryId &&
          item.categoryId === currentProduct.categoryId
      );

      const fallbackProducts = allProducts.filter(
        (item) =>
          item.id !== currentProduct.id &&
          !sameCategoryProducts.some(
            (relatedItem) => relatedItem.id === item.id
          )
      );

      const allImages = Array.from(
        new Set(
          [currentProduct.mainImage, ...(currentProduct.images || [])].filter(
            Boolean
          )
        )
      );

      setProduct(currentProduct);
      setCategories(categoryData);
      setRelated([...sameCategoryProducts, ...fallbackProducts].slice(0, 4));
      setActiveImage(allImages[0] || "");
    } catch (err) {
      console.error(err);
      setError("პროდუქტის ჩატვირთვა ვერ მოხერხდა.");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const images = useMemo(() => {
    if (!product) return [];

    return Array.from(
      new Set([product.mainImage, ...(product.images || [])].filter(Boolean))
    );
  }, [product]);

  const categoryName = useMemo(() => {
    if (!product) return "";

    return (
      categories.find((category) => category.id === product.categoryId)?.name ||
      "კატეგორიის გარეშე"
    );
  }, [categories, product]);

  const activeImageIndex = Math.max(images.indexOf(activeImage), 0);

  const showNextImage = useCallback(() => {
    if (images.length < 2) return;

    const nextIndex = (activeImageIndex + 1) % images.length;
    setActiveImage(images[nextIndex]);
  }, [activeImageIndex, images]);

  const showPreviousImage = useCallback(() => {
    if (images.length < 2) return;

    const previousIndex =
      (activeImageIndex - 1 + images.length) % images.length;

    setActiveImage(images[previousIndex]);
  }, [activeImageIndex, images]);

  useEffect(() => {
    if (!lightbox) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setLightbox(false);
      if (event.key === "ArrowRight") showNextImage();
      if (event.key === "ArrowLeft") showPreviousImage();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightbox, showNextImage, showPreviousImage]);

  const productUrl =
    typeof window !== "undefined" ? window.location.href : "";

  const shareText = `${product?.name || "პროდუქტი"}\n${productUrl}`;

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    shareText
  )}`;

  const viberShareUrl = `viber://forward?text=${encodeURIComponent(
    shareText
  )}`;

  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    productUrl
  )}`;

  const handleMessengerShare = async () => {
    const shareData = {
      title: product?.name || "პროდუქტი",
      text: product?.name || "პროდუქტი",
      url: productUrl,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }

    const messengerShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      productUrl
    )}`;

    window.open(messengerShareUrl, "_blank", "noopener,noreferrer");
  };

  const handlePriceLookup = async (event) => {
    event.preventDefault();

    const model = priceModel.trim();
    if (!model || priceLookupStatus === "loading") return;

    if (!user) {
      setPriceResults([]);
      setPriceLookupStatus("session-ended");
      return;
    }

    if (role !== "admin") {
      setPriceResults([]);
      setPriceLookupStatus("unauthorized");
      return;
    }

    setPriceLookupStatus("loading");
    setPriceResults([]);

    let token;
    try {
      token = await user.getIdToken(true);
    } catch {
      setPriceLookupStatus("session-ended");
      return;
    }

    try {
      const response = await fetch("/api/price-lookup", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model }),
      });

      if (response.status === 401) {
        setPriceLookupStatus("session-ended");
        return;
      }

      if (response.status === 403) {
        setPriceLookupStatus("unauthorized");
        return;
      }

      if (!response.ok) {
        setPriceLookupStatus("error");
        return;
      }

      const payload = await response.json();
      const results = Array.isArray(payload.results) ? payload.results : [];

      setPriceResults(results);
      setPriceLookupStatus(results.length ? "success" : "not-found");
    } catch {
      setPriceLookupStatus("error");
    }
  };

  const formatPrice = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return "—";

    return new Intl.NumberFormat("ka-GE", {
      style: "currency",
      currency: "GEL",
      minimumFractionDigits: 2,
    }).format(number);
  };

  if (loading) {
    return (
      <main className="product-detail-page">
        <div className="product-detail-state">პროდუქტი იტვირთება...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="product-detail-page">
        <div className="product-detail-state">
          <h1>დაფიქსირდა პრობლემა</h1>
          <p>{error}</p>

          <button type="button" onClick={load}>
            თავიდან ცდა
          </button>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="product-detail-page">
        <div className="product-detail-state">
          <h1>პროდუქტი ვერ მოიძებნა</h1>
          <p>შესაძლოა პროდუქტი წაშლილია ან ბმული არასწორია.</p>

          <Link to="/catalog">კატალოგში დაბრუნება</Link>
        </div>
      </main>
    );
  }

  const catalogPath = product.categoryId
    ? `/catalog?category=${encodeURIComponent(product.categoryId)}`
    : "/catalog";

  return (
    <main className="product-detail-page">
      <section className="product-detail-container">
        <nav className="product-detail-nav" aria-label="პროდუქტის ნავიგაცია">
          <Link to="/" className="product-detail-nav__link">
            მთავარზე
          </Link>

          <Link to={catalogPath} className="product-detail-nav__link">
            ← კატალოგში დაბრუნება
          </Link>
        </nav>

        <section className="product-detail-hero">
          <div className="product-detail-left-column">
            <div className="product-gallery">
              <div className="product-gallery__main-wrap">
                <button
                  type="button"
                  className="product-gallery__main-button"
                  onClick={() => activeImage && setLightbox(true)}
                  disabled={!activeImage}
                  aria-label="პროდუქტის ფოტოს გადიდება"
                >
                  <div className="product-gallery__main-frame">
                    <div className="product-gallery__fallback">
                      ფოტო არ არის
                    </div>

                    {activeImage && (
                      <img
                        src={activeImage}
                        alt={product.name}
                        className="product-gallery__main-image"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>

                  {activeImage && (
                    <span className="product-gallery__zoom">
                      ფოტოს გადიდება ⤢
                    </span>
                  )}
                </button>
              </div>

              {images.length > 1 && (
                <div className="product-gallery__thumbnails">
                  {images.map((image, index) => (
                    <button
                      type="button"
                      key={`${image}-${index}`}
                      className={`product-gallery__thumbnail ${
                        activeImage === image
                          ? "product-gallery__thumbnail--active"
                          : ""
                      }`}
                      onClick={() => setActiveImage(image)}
                      aria-label={`ფოტო ${index + 1}`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {related.length > 0 && (
              <section className="product-related">
                <div className="product-related__header">
                  <div>
                    <p>კატალოგიდან</p>
                    <h2>მსგავსი პროდუქტები</h2>
                  </div>

                  <Link to="/catalog">ყველა →</Link>
                </div>

                <div className="product-related__grid">
                  {related.map((relatedProduct) => {
                    const relatedCategory =
                      categories.find(
                        (category) =>
                          category.id === relatedProduct.categoryId
                      )?.name || "კატეგორიის გარეშე";

                    return (
                      <Link
                        key={relatedProduct.id}
                        to={`/product/${relatedProduct.id}`}
                        className="product-related-card"
                      >
                        <div className="product-related-card__image-wrap">
                          <div className="product-related-card__fallback">
                            ფოტო არ არის
                          </div>

                          {relatedProduct.mainImage && (
                            <img
                              src={relatedProduct.mainImage}
                              alt={relatedProduct.name}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                        </div>

                        <div className="product-related-card__body">
                          <span>{relatedCategory}</span>

                          <h3>{relatedProduct.name}</h3>

                          <div>
                            <span>ნახვა</span>
                            <span>→</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <aside className="product-info">
            <p className="product-info__eyebrow">{categoryName}</p>

            <h1 className="product-info__title">{product.name}</h1>

            <div className="product-info__divider" />

            <p className="product-info__description">
              {product.fullDescription ||
                product.shortDescription ||
                "პროდუქტის დეტალური აღწერა ჯერ არ არის დამატებული."}
            </p>

            <div className="product-info__facts">
              <div>
                <span>კატეგორია</span>
                <strong>{categoryName}</strong>
              </div>

              <div>
                <span>ფოტოები</span>
                <strong>{images.length}</strong>
              </div>
            </div>

            <section className="product-info__contact-section">
              <p className="product-info__contact-label">
                დაგვიკავშირდი
              </p>

              <a
                href={`tel:${PHONE_NUMBER}`}
                className="product-contact-call"
              >
                <span className="product-contact-call__icon">☎</span>

                <span>
                  <small>დარეკვა</small>
                  <strong>{PHONE_DISPLAY}</strong>
                </span>

                <span className="product-contact-call__arrow">→</span>
              </a>

              <p className="product-info__share-label">
                გააზიარე პროდუქტი
              </p>

              <div className="product-info__share-buttons">
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="product-share-button product-share-button--whatsapp"
                >
                  WhatsApp
                </a>

                <a
                  href={viberShareUrl}
                  className="product-share-button product-share-button--viber"
                >
                  Viber
                </a>

                <button
                  type="button"
                  onClick={handleMessengerShare}
                  className="product-share-button product-share-button--messenger"
                >
                  Messenger
                </button>

                <a
                  href={facebookShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="product-share-button product-share-button--facebook"
                >
                  Facebook-ზე გაზიარება
                </a>
              </div>
            </section>

            {isAdmin && (
              <section
                className="product-price-lookup"
                aria-labelledby="product-price-lookup-title"
              >
                <p className="product-price-lookup__privacy">მხოლოდ ადმინისტრატორისთვის</p>
                <h2 id="product-price-lookup-title">ფასის მოძებნა</h2>

                <form
                  className="product-price-lookup__controls"
                  onSubmit={handlePriceLookup}
                >
                  <input
                    type="text"
                    placeholder="ჩაწერე მოდელი"
                    aria-label="მოდელი"
                    value={priceModel}
                    onChange={(event) => setPriceModel(event.target.value)}
                    maxLength={100}
                    autoComplete="off"
                    disabled={priceLookupStatus === "loading"}
                  />
                  <button
                    type="submit"
                    disabled={
                      !priceModel.trim() || priceLookupStatus === "loading"
                    }
                  >
                    {priceLookupStatus === "loading" ? "იძებნება..." : "ძებნა"}
                  </button>
                </form>

                {priceLookupStatus === "not-found" && (
                  <p className="product-price-lookup__message">ვერ მოიძებნა</p>
                )}

                {priceLookupStatus === "unauthorized" && (
                  <p className="product-price-lookup__message product-price-lookup__message--error">
                    ადმინისტრატორის წვდომა არ გაქვს.
                  </p>
                )}

                {priceLookupStatus === "session-ended" && (
                  <p className="product-price-lookup__message product-price-lookup__message--error">
                    სესია დასრულდა. თავიდან გაიარე ავტორიზაცია.
                  </p>
                )}

                {priceLookupStatus === "error" && (
                  <p className="product-price-lookup__message product-price-lookup__message--error">
                    ფასის მოძებნა ვერ მოხერხდა. სცადე მოგვიანებით.
                  </p>
                )}

                {priceLookupStatus === "success" && (
                  <div className="product-price-lookup__table-wrap">
                    <table className="product-price-lookup__table">
                      <thead>
                        <tr>
                          <th>მოდელი</th>
                          <th>შესყიდვა</th>
                          <th>გაყიდვა</th>
                          <th>მარაგი</th>
                          <th>წყარო</th>
                        </tr>
                      </thead>
                      <tbody>
                        {priceResults.map((result, index) => (
                          <tr key={`${result.model}-${result.source_file || index}`}>
                            <td>{result.model || "—"}</td>
                            <td>{formatPrice(result.purchase_price)}</td>
                            <td>{formatPrice(result.selling_price)}</td>
                            <td>{result.stock || "—"}</td>
                            <td>{result.source_file || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            <Link to={catalogPath} className="product-info__catalog-link">
              სხვა პროდუქტების ნახვა
              <span>→</span>
            </Link>
          </aside>
        </section>
      </section>

      {lightbox && (
        <div
          className="product-lightbox"
          onMouseDown={() => setLightbox(false)}
        >
          <div
            className="product-lightbox__dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="product-lightbox__close"
              onClick={() => setLightbox(false)}
              aria-label="დახურვა"
            >
              ×
            </button>

            {images.length > 1 && (
              <button
                type="button"
                className="product-lightbox__nav product-lightbox__nav--previous"
                onClick={showPreviousImage}
                aria-label="წინა ფოტო"
              >
                ←
              </button>
            )}

            <img
              src={activeImage}
              alt={product.name}
              className="product-lightbox__image"
            />

            {images.length > 1 && (
              <button
                type="button"
                className="product-lightbox__nav product-lightbox__nav--next"
                onClick={showNextImage}
                aria-label="შემდეგი ფოტო"
              >
                →
              </button>
            )}

            <div className="product-lightbox__count">
              {activeImageIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
