import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { getProducts } from "../firebase/products";
import { getCategories } from "../firebase/categories";

import "./Catalog.css";

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);

  const selectedCategory = searchParams.get("category") || "all";

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [productData, categoryData] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);

      setProducts(productData);
      setCategories(categoryData);
    } catch (err) {
      console.error(err);
      setError("კატალოგის ჩატვირთვა ვერ მოხერხდა.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!mobileCategoryOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileCategoryOpen]);

  const categoryMap = useMemo(() => {
    return new Map(
      categories.map((category) => [category.id, category.name])
    );
  }, [categories]);

  const getCategoryName = (categoryId) => {
    return categoryMap.get(categoryId) || "კატეგორიის გარეშე";
  };

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const categoryName = getCategoryName(product.categoryId).toLowerCase();

      const matchesCategory =
        selectedCategory === "all" ||
        product.categoryId === selectedCategory;

      const matchesSearch =
        !query ||
        product.name?.toLowerCase().includes(query) ||
        product.fullDescription?.toLowerCase().includes(query) ||
        product.shortDescription?.toLowerCase().includes(query) ||
        categoryName.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, search, categoryMap]);

  const clearFilters = () => {
    setSearchParams({});
    setSearch("");
  };

  const selectCategory = (categoryId) => {
    setSearchParams(categoryId === "all" ? {} : { category: categoryId });
    setMobileCategoryOpen(false);
  };

  const activeCategoryName =
    selectedCategory === "all"
      ? "ყველა კატეგორია"
      : getCategoryName(selectedCategory);

  return (
    <main className="catalog-page">
      <section className="catalog-container">
        <nav className="catalog-top-nav" aria-label="ძირითადი ნავიგაცია">
          <Link to="/" className="catalog-top-nav__brand">
            LOBGE
          </Link>

          <div className="catalog-top-nav__links">
            <Link to="/">მთავარი</Link>
            <span aria-current="page">კატალოგი</span>
          </div>
        </nav>

        <header className="catalog-hero">
          <div className="catalog-hero__watermark">LOBGE</div>

          <div className="catalog-hero__content">
            <p className="catalog-hero__eyebrow">პროდუქტების კატალოგი</p>

            <h1 className="catalog-hero__title">
              აღმოაჩინე ჩვენი
              <span>პროდუქტები</span>
            </h1>

            <p className="catalog-hero__subtitle">
              დაათვალიერე ჩვენი კატალოგი, მოძებნე სასურველი პროდუქტი და
              გაეცანი სრულ ინფორმაციას ერთ სივრცეში.
            </p>
          </div>

          <div className="catalog-hero__meta">
            <div>
              <strong>{products.length}</strong>
              <span>პროდუქტი</span>
            </div>

            <div>
              <strong>{categories.length}</strong>
              <span>კატეგორია</span>
            </div>

            <div className="catalog-hero__current-category">
              <small>მიმდინარე არჩევანი</small>
              <span>{activeCategoryName}</span>
            </div>
          </div>
        </header>

        <section className="catalog-toolbar">
          <div className="catalog-search-wrap">
            <span className="catalog-search-icon">⌕</span>

            <input
              className="catalog-search"
              type="search"
              placeholder="მოძებნე პროდუქტი..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {search && (
              <button
                type="button"
                className="catalog-search-clear"
                onClick={() => setSearch("")}
                aria-label="ძებნის გასუფთავება"
              >
                ×
              </button>
            )}
          </div>

          <div className="catalog-result-count">
            ნაჩვენებია {filteredProducts.length} / {products.length} პროდუქტი
          </div>
        </section>

        <section className="catalog-filter-section">
          <div className="catalog-filter-section__label">
            კატეგორიები
          </div>

          <button
            type="button"
            className="catalog-mobile-category-trigger"
            onClick={() => setMobileCategoryOpen(true)}
          >
            <span>კატეგორიები</span>
            <strong>{activeCategoryName}</strong>
          </button>

          <div className="catalog-filters">
            <button
              type="button"
              className={`catalog-filter-button ${
                selectedCategory === "all"
                  ? "catalog-filter-button--active"
                  : ""
              }`}
              onClick={() => selectCategory("all")}
            >
              ყველა პროდუქტი
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`catalog-filter-button ${
                  selectedCategory === category.id
                    ? "catalog-filter-button--active"
                    : ""
                }`}
                onClick={() => selectCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </section>

        {mobileCategoryOpen && (
          <div
            className="catalog-category-drawer-shell"
            role="presentation"
          >
            <button
              type="button"
              className="catalog-category-drawer-overlay"
              aria-label="კატეგორიების დახურვა"
              onClick={() => setMobileCategoryOpen(false)}
            />

            <aside
              className="catalog-category-drawer"
              aria-label="კატეგორიები"
            >
              <div className="catalog-category-drawer__header">
                <div>
                  <p>ფილტრი</p>
                  <h2>კატეგორიები</h2>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileCategoryOpen(false)}
                >
                  დახურვა
                </button>
              </div>

              <div className="catalog-category-drawer__list">
                <button
                  type="button"
                  className={`catalog-category-drawer__option ${
                    selectedCategory === "all"
                      ? "catalog-category-drawer__option--active"
                      : ""
                  }`}
                  onClick={() => selectCategory("all")}
                >
                  ყველა პროდუქტი
                </button>

                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={`catalog-category-drawer__option ${
                      selectedCategory === category.id
                        ? "catalog-category-drawer__option--active"
                        : ""
                    }`}
                    onClick={() => selectCategory(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </aside>
          </div>
        )}

        {error && (
          <div className="catalog-error">
            <span>{error}</span>

            <button type="button" onClick={load}>
              თავიდან ცდა
            </button>
          </div>
        )}

        {loading ? (
          <div className="catalog-empty">კატალოგი იტვირთება...</div>
        ) : (
          <>
            <section className="catalog-grid">
              {filteredProducts.map((product) => {
                const categoryName = getCategoryName(product.categoryId);

                return (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="catalog-product-card"
                  >
                    <div className="catalog-product-card__image-wrap">
                      <div className="catalog-product-card__image-frame">
                        <div className="catalog-product-card__image-fallback">
                          ფოტო არ არის
                        </div>

                        {product.mainImage && (
                          <img
                            src={product.mainImage}
                            alt={product.name}
                            className="catalog-product-card__image"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                      </div>
                    </div>

                    <div className="catalog-product-card__body">
                      <span className="catalog-product-card__category">
                        {categoryName}
                      </span>

                      <h2 className="catalog-product-card__title">
                        {product.name}
                      </h2>

                      <p className="catalog-product-card__description">
                        {product.fullDescription ||
                          product.shortDescription ||
                          "იხილე პროდუქტის დეტალური აღწერა და დამატებითი ფოტოები."}
                      </p>

                      <div className="catalog-product-card__footer">
                        <span>პროდუქტის ნახვა</span>
                        <span className="catalog-product-card__arrow">→</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </section>

            {filteredProducts.length === 0 && (
              <div className="catalog-empty">
                <h2>პროდუქტი ვერ მოიძებნა</h2>

                <p>შეცვალე ძებნის ტექსტი ან აირჩიე სხვა კატეგორია.</p>

                <button
                  type="button"
                  className="catalog-clear-button"
                  onClick={clearFilters}
                >
                  ფილტრების გასუფთავება
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
