import { useEffect, useMemo, useState } from "react";
import {
  getCategories,
  addCategory,
  deleteCategory,
} from "../../firebase/categories";

import "./Categories.css";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return categories;

    return categories.filter((category) =>
      category.name?.toLowerCase().includes(query)
    );
  }, [categories, search]);

  const handleAdd = async (event) => {
    event.preventDefault();

    const categoryName = name.trim();

    if (!categoryName) {
      alert("Please enter a category name.");
      return;
    }

    const alreadyExists = categories.some(
      (category) =>
        category.name?.trim().toLowerCase() === categoryName.toLowerCase()
    );

    if (alreadyExists) {
      alert("This category already exists.");
      return;
    }

    setSaving(true);

    try {
      await addCategory(categoryName);
      setName("");
      await load();
    } catch (err) {
      console.error(err);
      alert("Unable to add category. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Delete "${category.name}" category?`
    );

    if (!confirmed) return;

    setDeletingId(category.id);

    try {
      await deleteCategory(category.id);
      await load();
    } catch (err) {
      console.error(err);
      alert("Unable to delete category.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <section className="categories-page">
      <header className="categories-page__header">
        <div>
          <p className="categories-page__eyebrow">Catalogue organization</p>

          <h1 className="categories-page__title">Categories</h1>

          <p className="categories-page__subtitle">
            Create and manage product groups for your catalogue.
          </p>
        </div>

        <div className="categories-page__count">
          <span>Total categories</span>
          <strong>{categories.length}</strong>
        </div>
      </header>

      <section className="categories-layout">
        <aside className="categories-create-card">
          <p className="categories-create-card__label">New category</p>

          <h2>Add a category</h2>

          <p>
            Categories help customers find products faster in your catalogue.
          </p>

          <form onSubmit={handleAdd} className="categories-create-form">
            <label>
              <span>Category name</span>

              <input
                type="text"
                placeholder="For example: Home Appliances"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={saving}
              />
            </label>

            <button
              type="submit"
              className="categories-button categories-button--primary"
              disabled={saving}
            >
              {saving ? "Adding..." : "+ Add category"}
            </button>
          </form>
        </aside>

        <section className="categories-list-card">
          <div className="categories-list-card__header">
            <div>
              <h2>All categories</h2>
              <p>
                Showing {filteredCategories.length} of {categories.length}
              </p>
            </div>

            <input
              className="categories-search"
              type="search"
              placeholder="Search categories..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {error && (
            <div className="categories-error">
              <span>{error}</span>

              <button type="button" onClick={load}>
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div className="categories-empty">Loading categories...</div>
          ) : (
            <>
              <div className="categories-list">
                {filteredCategories.map((category) => {
                  const isDeleting = deletingId === category.id;
                  const initial = category.name?.charAt(0).toUpperCase() || "?";

                  return (
                    <article key={category.id} className="category-item">
                      <div className="category-item__icon">{initial}</div>

                      <div className="category-item__content">
                        <h3>{category.name}</h3>
                        <p>Product category</p>
                      </div>

                      <button
                        type="button"
                        className="categories-button categories-button--danger"
                        onClick={() => handleDelete(category)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </article>
                  );
                })}
              </div>

              {filteredCategories.length === 0 && (
                <div className="categories-empty">
                  <h3>No categories found</h3>

                  <p>
                    {search
                      ? "Try another search term."
                      : "Add your first category from the form."}
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </section>
    </section>
  );
}