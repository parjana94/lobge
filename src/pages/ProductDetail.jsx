import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getProduct, getProducts } from "../firebase/products";
import { getCategories } from "../firebase/categories";

import "./ProductDetail.css";

const PHONE_NUMBER = "+995555770599";
const PHONE_DISPLAY = "+995 555 77 05 99";

export default function ProductDetail() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [categories, setCategories] = useState([]);

  const [activeImage, setActiveImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(false);

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
              </div>
            </section>

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
