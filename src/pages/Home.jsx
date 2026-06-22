import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getProducts } from "../firebase/products";

import "./Home.css";

const PHONE_NUMBER = "+995555770599";
const PHONE_DISPLAY = "+995 555 77 05 99";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      try {
        const data = await getProducts();

        if (!mounted) return;

        const featuredProducts = data.filter((product) => product.featured);

        setProducts(
          featuredProducts.length > 0
            ? featuredProducts.slice(0, 4)
            : data.slice(0, 4)
        );
      } catch (error) {
        console.error(error);

        if (mounted) {
          setProducts([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="home-page">
      <header className="home-header">
        <div className="home-container home-header__content">
          <Link to="/" className="home-logo">
            LOBGE
          </Link>

          <nav className="home-nav">
            <Link to="/">მთავარი</Link>
            <Link to="/catalog">კატალოგი</Link>
            <Link to="/admin/login">Admin</Link>
          </nav>
        </div>
      </header>

      <section className="home-hero">
        <div className="home-container home-hero__content">
          <div className="home-hero__text">
            <p className="home-eyebrow">პროდუქტების კატალოგი</p>

            <h1>
              იპოვე პროდუქტი,
              <span> რომელიც გჭირდება</span>
            </h1>

            <p>
              დაათვალიერე ჩვენი კატალოგი, იხილე პროდუქტის სრული აღწერა,
              ფოტოები და მარტივად გააზიარე სასურველი პროდუქტი.
            </p>

            <div className="home-hero__buttons">
              <Link to="/catalog" className="home-button home-button--primary">
                კატალოგის ნახვა
                <span>→</span>
              </Link>

              <a
                href={`tel:${PHONE_NUMBER}`}
                className="home-button home-button--secondary"
              >
                დარეკვა
                <span>{PHONE_DISPLAY}</span>
              </a>
            </div>
          </div>

          <div className="home-hero__visual">
            <div className="home-hero__circle home-hero__circle--top" />
            <div className="home-hero__circle home-hero__circle--bottom" />

            <div className="home-hero__visual-card">
              <span>LOBGE</span>
              <strong>CATALOGUE</strong>
              <p>აირჩიე შენთვის სასურველი პროდუქტი</p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-products">
        <div className="home-container">
          <div className="home-section-header">
            <div>
              <p className="home-eyebrow">კატალოგიდან</p>
              <h2>რჩეული პროდუქტები</h2>
            </div>

            <Link to="/catalog" className="home-all-link">
              ყველა პროდუქტი →
            </Link>
          </div>

          {loading ? (
            <div className="home-state">პროდუქტები იტვირთება...</div>
          ) : products.length > 0 ? (
            <div className="home-products-grid">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="home-product-card"
                >
                  <div className="home-product-card__image-wrap">
                    <div className="home-product-card__fallback">
                      ფოტო არ არის
                    </div>

                    {product.mainImage && (
                      <img
                        src={product.mainImage}
                        alt={product.name}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>

                  <div className="home-product-card__body">
                    <h3>{product.name || "პროდუქტი"}</h3>

                    <p>
                      {product.fullDescription ||
                        "იხილე პროდუქტის სრული აღწერა და დამატებითი ფოტოები."}
                    </p>

                    <div>
                      <span>დეტალურად</span>
                      <span>→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="home-state">
              <h3>პროდუქტები ჯერ არ არის დამატებული</h3>
              <p>დაამატე პროდუქტი Admin Panel-იდან.</p>
            </div>
          )}
        </div>
      </section>

      <section className="home-contact">
        <div className="home-container">
          <div className="home-contact__box">
            <div>
              <p className="home-eyebrow">დაგვიკავშირდი</p>
              <h2>გაინტერესებს კონკრეტული პროდუქტი?</h2>
              <span>
                დაგვირეკე და მიიღე დამატებითი ინფორმაცია პროდუქციის შესახებ.
              </span>
            </div>

            <a href={`tel:${PHONE_NUMBER}`} className="home-call-button">
              <span>☎</span>
              {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-container home-footer__content">
          <strong>LOBGE</strong>
          <span>© {new Date().getFullYear()} ყველა უფლება დაცულია.</span>
        </div>
      </footer>
    </main>
  );
}