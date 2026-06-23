import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "../../firebase/products";

import { getCategories } from "../../firebase/categories";

import "./Products.css";

const createEmptyForm = () => ({
  id: null,
  name: "",
  fullDescription: "",
  mainImage: "",
  image1: "",
  image2: "",
  image3: "",
  image4: "",
  categoryId: "",
  featured: false,
  seasonal: false,
});

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("all");

  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(createEmptyForm());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyProductId, setBusyProductId] = useState("");
  const [error, setError] = useState("");

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
      setError("პროდუქტების ჩატვირთვა ვერ მოხერხდა.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const getCategoryName = (categoryId) => {
    return (
      categories.find((category) => category.id === categoryId)?.name ||
      "კატეგორიის გარეშე"
    );
  };

  const featuredCount = products.filter((product) => product.featured).length;

  const seasonalCount = products.filter(
    (product) => product.seasonal
  ).length;

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const categoryName = getCategoryName(product.categoryId).toLowerCase();

      const matchesSearch =
        !query ||
        product.name?.toLowerCase().includes(query) ||
        product.fullDescription?.toLowerCase().includes(query) ||
        categoryName.includes(query);

      const matchesCategory =
        !selectedCategory || product.categoryId === selectedCategory;

      const matchesFeatured =
        featuredFilter === "all" ||
        (featuredFilter === "featured" && product.featured) ||
        (featuredFilter === "normal" && !product.featured);

      return matchesSearch && matchesCategory && matchesFeatured;
    });
  }, [products, search, selectedCategory, featuredFilter, categories]);

  const openAdd = () => {
    setEditMode(false);
    setForm(createEmptyForm());
    setOpen(true);
  };

  const openEdit = (product) => {
    const additionalImages = Array.isArray(product.images)
      ? product.images.filter((image) => image && image !== product.mainImage)
      : [];

    setEditMode(true);

    setForm({
      id: product.id,
      name: product.name || "",
      fullDescription: product.fullDescription || "",
      mainImage: product.mainImage || "",
      image1: additionalImages[0] || "",
      image2: additionalImages[1] || "",
      image3: additionalImages[2] || "",
      image4: additionalImages[3] || "",
      categoryId: product.categoryId || "",
      featured: Boolean(product.featured),
      seasonal: Boolean(product.seasonal),
    });

    setOpen(true);
  };

  const closeModal = () => {
    if (!saving) {
      setOpen(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const mainImage = form.mainImage.trim();

    if (!name || !mainImage) {
      alert("შეავსე პროდუქტის სახელი და მთავარი ფოტოს ბმული.");
      return;
    }

    const images = [
      form.image1,
      form.image2,
      form.image3,
      form.image4,
    ]
      .map((image) => image.trim())
      .filter(Boolean);

    const payload = {
      name,
      fullDescription: form.fullDescription.trim(),
      mainImage,
      images,
      categoryId: form.categoryId || null,
      featured: Boolean(form.featured),
      seasonal: Boolean(form.seasonal),
    };

    setSaving(true);

    try {
      if (editMode) {
        await updateProduct(form.id, payload);
      } else {
        await addProduct(payload);
      }

      setOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      alert("პროდუქტის შენახვა ვერ მოხერხდა.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSeasonal = async (product) => {
    setBusyProductId(product.id);

    try {
      await updateProduct(product.id, {
        seasonal: !product.seasonal,
      });

      await load();
    } catch (err) {
      console.error(err);
      alert("პროდუქტის სტატუსის შეცვლა ვერ მოხერხდა.");
    } finally {
      setBusyProductId("");
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `წავშალოთ პროდუქტი "${product.name}"?`
    );

    if (!confirmed) return;

    setBusyProductId(product.id);

    try {
      await deleteProduct(product.id);
      await load();
    } catch (err) {
      console.error(err);
      alert("პროდუქტის წაშლა ვერ მოხერხდა.");
    } finally {
      setBusyProductId("");
    }
  };

  return (
    <section className="products-page">
      <header className="products-page__header">
        <div>
          <p className="products-page__eyebrow">ინვენტარის მართვა</p>
          <h1 className="products-page__title">პროდუქტები</h1>
          <p className="products-page__subtitle">
            დაამატე, დაარედაქტირე და მონიშნე აქტუალური პროდუქტები.
          </p>
        </div>

        <button
          type="button"
          className="products-button products-button--primary"
          onClick={openAdd}
        >
          + პროდუქტის დამატება
        </button>
      </header>

      <section className="products-stats">
        <article className="products-stat-card">
          <span>სულ პროდუქტი</span>
          <strong>{products.length}</strong>
          <small>კატალოგში არსებული პროდუქცია</small>
        </article>

        <article className="products-stat-card">
          <span>მთავარ გვერდზე</span>
          <strong>{featuredCount}</strong>
          <small>რჩეული პროდუქტები</small>
        </article>

        <article className="products-stat-card">
          <span>მოთხოვნადი</span>
          <strong>{seasonalCount}</strong>
          <small>ამ დროისთვის აქტუალური</small>
        </article>

        <article className="products-stat-card">
          <span>კატეგორიები</span>
          <strong>{categories.length}</strong>
          <small>პროდუქტის ჯგუფები</small>
        </article>
      </section>

      <section className="products-controls">
        <input
          className="products-control"
          type="search"
          placeholder="მოძებნე პროდუქტი..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="products-control"
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
        >
          <option value="">ყველა კატეგორია</option>

          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          className="products-control"
          value={featuredFilter}
          onChange={(event) => setFeaturedFilter(event.target.value)}
        >
          <option value="all">ყველა პროდუქტი</option>
          <option value="featured">მთავარ გვერდზე</option>
          <option value="normal">არ არის მთავარ გვერდზე</option>
        </select>
      </section>

      <div className="products-page__result-count">
        ნაჩვენებია {filteredProducts.length} / {products.length} პროდუქტი
      </div>

      {error && (
        <div className="products-error">
          <span>{error}</span>

          <button type="button" onClick={load}>
            თავიდან ცდა
          </button>
        </div>
      )}

      {loading ? (
        <div className="products-loading">პროდუქტები იტვირთება...</div>
      ) : (
        <>
          <div className="products-grid">
            {filteredProducts.map((product) => {
              const isBusy = busyProductId === product.id;

              return (
                <article key={product.id} className="product-card">
                  <div className="product-card__image-wrap">
                    <div className="product-card__image-fallback">
                      ფოტო არ არის
                    </div>

                    {product.mainImage && (
                      <img
                        src={product.mainImage}
                        alt={product.name}
                        className="product-card__image"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    )}

                    {(product.featured || product.seasonal) && (
                      <div className="product-card__badges">
                        {product.featured && (
                          <span className="product-card__badge product-card__badge--featured">
                            მთავარ გვერდზე
                          </span>
                        )}

                        {product.seasonal && (
                          <span className="product-card__badge product-card__badge--featured">
                            მოთხოვნადი
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="product-card__body">
                    <div className="product-card__heading">
                      <Link
                        to={`/product/${product.id}`}
                        className="product-card__title"
                      >
                        {product.name}
                      </Link>

                      <span className="product-card__category">
                        {getCategoryName(product.categoryId)}
                      </span>
                    </div>

                    <p className="product-card__description">
                      {product.fullDescription ||
                        "აღწერა ჯერ არ არის დამატებული."}
                    </p>

                    <footer className="product-card__footer">
                      <button
                        type="button"
                        className="products-button products-button--secondary"
                        onClick={() => openEdit(product)}
                        disabled={isBusy}
                      >
                        რედაქტირება
                      </button>

                      <button
                        type="button"
                        className="products-button products-button--secondary"
                        onClick={() => toggleSeasonal(product)}
                        disabled={isBusy}
                      >
                        {product.seasonal
                          ? "მოთხოვნადიდან ამოღება"
                          : "მოთხოვნადი"}
                      </button>

                      <button
                        type="button"
                        className="products-button products-button--danger"
                        onClick={() => handleDelete(product)}
                        disabled={isBusy}
                      >
                        წაშლა
                      </button>
                    </footer>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="products-empty">
              <h2>პროდუქტი ვერ მოიძებნა</h2>
              <p>შეცვალე ძებნის ტექსტი ან დაამატე ახალი პროდუქტი.</p>
            </div>
          )}
        </>
      )}

      {open && (
        <div className="products-modal-backdrop" onMouseDown={closeModal}>
          <div
            className="products-modal"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="products-modal__header">
              <div>
                <p className="products-page__eyebrow">
                  {editMode ? "პროდუქტის განახლება" : "ახალი პროდუქტი"}
                </p>

                <h2>{editMode ? "პროდუქტის რედაქტირება" : "პროდუქტის დამატება"}</h2>
              </div>

              <button
                type="button"
                className="products-modal__close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="products-form__grid">
                <label className="products-form__field">
                  <span>პროდუქტის სახელი *</span>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder="პროდუქტის სახელი"
                  />
                </label>

                <label className="products-form__field">
                  <span>მთავარი ფოტო *</span>

                  <input
                    type="url"
                    value={form.mainImage}
                    onChange={(event) =>
                      setForm({ ...form, mainImage: event.target.value })
                    }
                    placeholder="https://..."
                  />
                </label>

                <label className="products-form__field">
                  <span>კატეგორია</span>

                  <select
                    value={form.categoryId}
                    onChange={(event) =>
                      setForm({ ...form, categoryId: event.target.value })
                    }
                  >
                    <option value="">აირჩიე კატეგორია</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="products-form__checkbox">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        featured: event.target.checked,
                      })
                    }
                  />

                  <span>გამოჩნდეს მთავარ გვერდზე</span>
                </label>

                <label className="products-form__checkbox">
                  <input
                    type="checkbox"
                    checked={form.seasonal}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        seasonal: event.target.checked,
                      })
                    }
                  />

                  <span>მოთხოვნადი პროდუქტი</span>
                </label>
              </div>

              <label className="products-form__field products-form__field--full">
                <span>სრული აღწერა</span>

                <textarea
                  rows="5"
                  value={form.fullDescription}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      fullDescription: event.target.value,
                    })
                  }
                  placeholder="პროდუქტის სრული აღწერა..."
                />
              </label>

              <div className="products-form__grid">
                {["image1", "image2", "image3", "image4"].map(
                  (field, index) => (
                    <label key={field} className="products-form__field">
                      <span>დამატებითი ფოტო {index + 1}</span>

                      <input
                        type="url"
                        value={form[field]}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            [field]: event.target.value,
                          })
                        }
                        placeholder="https://..."
                      />
                    </label>
                  )
                )}
              </div>

              <div className="products-modal__actions">
                <button
                  type="button"
                  className="products-button products-button--secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  გაუქმება
                </button>

                <button
                  type="submit"
                  className="products-button products-button--primary"
                  disabled={saving}
                >
                  {saving
                    ? "ინახება..."
                    : editMode
                    ? "ცვლილებების შენახვა"
                    : "პროდუქტის დამატება"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}