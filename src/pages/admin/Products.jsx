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
      setError("Unable to load products. Please try again.");
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
      "No category"
    );
  };

  const totalProducts = products.length;
  const featuredCount = products.filter((product) => product.featured).length;
  const activeListings = products.filter(
    (product) => product.name && product.mainImage
  ).length;

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const categoryName = getCategoryName(product.categoryId).toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        product.name?.toLowerCase().includes(normalizedSearch) ||
        product.fullDescription?.toLowerCase().includes(normalizedSearch) ||
        product.shortDescription?.toLowerCase().includes(normalizedSearch) ||
        categoryName.includes(normalizedSearch);

      const matchesCategory =
        !selectedCategory || product.categoryId === selectedCategory;

      const matchesFeatured =
        featuredFilter === "all" ||
        (featuredFilter === "featured" && product.featured) ||
        (featuredFilter === "normal" && !product.featured);

      return matchesSearch && matchesCategory && matchesFeatured;
    });
  }, [products, categories, search, selectedCategory, featuredFilter]);

  const openAdd = () => {
    setEditMode(false);
    setForm(createEmptyForm());
    setOpen(true);
  };

  const openEdit = (product) => {
    const existingImages = Array.isArray(product.images)
      ? product.images.filter(
          (image) => image && image !== product.mainImage
        )
      : [];

    setEditMode(true);
    setForm({
      id: product.id,
      name: product.name || "",
      fullDescription: product.fullDescription || "",
      mainImage: product.mainImage || "",
      image1: existingImages[0] || "",
      image2: existingImages[1] || "",
      image3: existingImages[2] || "",
      image4: existingImages[3] || "",
      categoryId: product.categoryId || "",
      featured: Boolean(product.featured),
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
      window.alert("Please fill in Product Name and Main Image URL.");
      return;
    }

    const additionalImages = [
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
      images: additionalImages,
      categoryId: form.categoryId || null,
      featured: Boolean(form.featured),
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
      window.alert("Unable to save product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleFeatured = async (product) => {
    setBusyProductId(product.id);

    try {
      await updateProduct(product.id, {
        featured: !product.featured,
      });

      await load();
    } catch (err) {
      console.error(err);
      window.alert("Unable to update featured status.");
    } finally {
      setBusyProductId("");
    }
  };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Delete "${product.name}" permanently?`
    );

    if (!confirmed) return;

    setBusyProductId(product.id);

    try {
      await deleteProduct(product.id);
      await load();
    } catch (err) {
      console.error(err);
      window.alert("Unable to delete product.");
    } finally {
      setBusyProductId("");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setFeaturedFilter("all");
  };

  const hasActiveFilters =
    search || selectedCategory || featuredFilter !== "all";

  return (
    <section className="products-page">
      <header className="products-page__header">
        <div>
          <p className="products-page__eyebrow">Inventory control</p>
          <h1 className="products-page__title">Product Management</h1>
          <p className="products-page__subtitle">
            Manage products, categories, featured listings and catalogue
            visibility from one place.
          </p>
        </div>

        <button
          type="button"
          className="products-button products-button--primary"
          onClick={openAdd}
        >
          + Add product
        </button>
      </header>

      <section className="products-stats">
        <article className="products-stat-card">
          <span>Total products</span>
          <strong>{totalProducts}</strong>
          <small>All catalogue items</small>
        </article>

        <article className="products-stat-card">
          <span>Featured</span>
          <strong>{featuredCount}</strong>
          <small>Shown on the homepage</small>
        </article>

        <article className="products-stat-card">
          <span>Categories</span>
          <strong>{categories.length}</strong>
          <small>Available product groups</small>
        </article>

        <article className="products-stat-card">
          <span>Active listings</span>
          <strong>{activeListings}</strong>
          <small>Products with name and image</small>
        </article>
      </section>

      <section className="products-controls">
        <input
          className="products-control"
          type="search"
          placeholder="Search products, descriptions or categories..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="products-control"
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
        >
          <option value="">All categories</option>
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
          <option value="all">All products</option>
          <option value="featured">Featured only</option>
          <option value="normal">Not featured</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            className="products-button products-button--secondary"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
      </section>

      <div className="products-page__result-count">
        Showing {filteredProducts.length} of {products.length} products
      </div>

      {error && (
        <div className="products-error">
          <span>{error}</span>
          <button type="button" onClick={load}>
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="products-loading">Loading products...</div>
      ) : (
        <>
          <div className="products-grid">
            {filteredProducts.map((product) => {
              const category = getCategoryName(product.categoryId);
              const isBusy = busyProductId === product.id;

              return (
                <article key={product.id} className="product-card">
                  <div className="product-card__image-wrap">
                    <div className="product-card__image-fallback">
                      No image
                    </div>

                    {product.mainImage && (
                      <img
                        className="product-card__image"
                        src={product.mainImage}
                        alt={product.name}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    )}

                    <div className="product-card__badges">
                      {product.featured && (
                        <span className="product-card__badge product-card__badge--featured">
                          ★ Featured
                        </span>
                      )}
                    </div>
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
                        {category}
                      </span>
                    </div>

                    <p className="product-card__description">
                      {product.fullDescription ||
                        product.shortDescription ||
                        "No description available."}
                    </p>

                    <footer className="product-card__footer">
                      <button
                        type="button"
                        className="products-button products-button--secondary"
                        onClick={() => openEdit(product)}
                        disabled={isBusy}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="products-button products-button--secondary"
                        onClick={() => toggleFeatured(product)}
                        disabled={isBusy}
                      >
                        {product.featured ? "Unfeature" : "Feature"}
                      </button>

                      <button
                        type="button"
                        className="products-button products-button--danger"
                        onClick={() => handleDelete(product)}
                        disabled={isBusy}
                      >
                        Delete
                      </button>
                    </footer>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="products-empty">
              <h2>No products found</h2>
              <p>Change the filters or add a new product.</p>

              {hasActiveFilters ? (
                <button
                  type="button"
                  className="products-button products-button--secondary"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              ) : (
                <button
                  type="button"
                  className="products-button products-button--primary"
                  onClick={openAdd}
                >
                  + Add first product
                </button>
              )}
            </div>
          )}
        </>
      )}

      {open && (
        <div
          className="products-modal-backdrop"
          onMouseDown={closeModal}
        >
          <div
            className="products-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="products-modal__header">
              <div>
                <p className="products-page__eyebrow">
                  {editMode ? "Update item" : "New listing"}
                </p>
                <h2 id="product-modal-title">
                  {editMode ? "Edit Product" : "Add Product"}
                </h2>
              </div>

              <button
                type="button"
                className="products-modal__close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="products-form__grid">
                <label className="products-form__field">
                  <span>Product name *</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder="Product name"
                  />
                </label>

                <label className="products-form__field">
                  <span>Main image URL *</span>
                  <input
                    type="url"
                    value={form.mainImage}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        mainImage: event.target.value,
                      })
                    }
                    placeholder="https://..."
                  />
                </label>

                <label className="products-form__field">
                  <span>Category</span>
                  <select
                    value={form.categoryId}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        categoryId: event.target.value,
                      })
                    }
                  >
                    <option value="">Select category</option>
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
                  <span>Show on homepage as featured</span>
                </label>
              </div>

              {form.mainImage && (
                <div className="products-form__preview">
                  <img
                    src={form.mainImage}
                    alt="Main product preview"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}

              <label className="products-form__field products-form__field--full">
                <span>Full description</span>
                <textarea
                  rows="5"
                  value={form.fullDescription}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      fullDescription: event.target.value,
                    })
                  }
                  placeholder="Describe the product in detail..."
                />
              </label>

              <div className="products-form__grid">
                {["image1", "image2", "image3", "image4"].map(
                  (field, index) => (
                    <label key={field} className="products-form__field">
                      <span>Additional image {index + 1}</span>
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
                  Cancel
                </button>

                <button
                  type="submit"
                  className="products-button products-button--primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editMode
                    ? "Save changes"
                    : "Add product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}