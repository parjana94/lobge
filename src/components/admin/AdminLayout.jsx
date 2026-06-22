import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logoutAdmin } from "../../firebase/auth";

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      navigate("/admin/login");
    } catch (error) {
      console.error(error);
      alert("ლოგაუთი ვერ შესრულდა.");
    }
  };

  const getNavLinkStyle = ({ isActive }) => ({
    ...styles.navLink,
    ...(isActive ? styles.navLinkActive : {}),
  });

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.brandIcon}>L</div>

          <h2 style={styles.brandTitle}>Lobge Admin</h2>

          <p style={styles.brandSubtitle}>
            Manage your catalogue
          </p>
        </div>

        <nav style={styles.nav}>
          <NavLink to="/admin/products" style={getNavLinkStyle}>
            <span style={styles.navIcon}>📦</span>
            Products
          </NavLink>

          <NavLink to="/admin/categories" style={getNavLinkStyle}>
            <span style={styles.navIcon}>📂</span>
            Categories
          </NavLink>
        </nav>

        <div style={styles.sidebarBottom}>
          <button onClick={handleLogout} style={styles.logoutButton}>
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh",
    background: "#f7f8fb",
    fontFamily: "Inter, Arial, sans-serif",
  },

  sidebar: {
    width: 260,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    padding: 22,
    background: "#111827",
    color: "#ffffff",
    boxSizing: "border-box",
  },

  brandIcon: {
    width: 42,
    height: 42,
    display: "grid",
    placeItems: "center",
    marginBottom: 16,
    borderRadius: 12,
    background: "#2563eb",
    color: "#ffffff",
    fontSize: 20,
    fontWeight: 800,
    boxShadow: "0 10px 20px rgba(37, 99, 235, 0.28)",
  },

  brandTitle: {
    margin: 0,
    fontSize: 21,
    fontWeight: 800,
    letterSpacing: "-0.03em",
  },

  brandSubtitle: {
    margin: "7px 0 34px",
    color: "#94a3b8",
    fontSize: 13,
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  navLink: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: "12px 14px",
    borderRadius: 12,
    color: "#cbd5e1",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 700,
    transition: "0.2s ease",
  },

  navLinkActive: {
    background: "#2563eb",
    color: "#ffffff",
    boxShadow: "0 10px 20px rgba(37, 99, 235, 0.22)",
  },

  navIcon: {
    width: 20,
    textAlign: "center",
    fontSize: 16,
  },

  sidebarBottom: {
    marginTop: "auto",
    paddingTop: 24,
  },

  logoutButton: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    border: "1px solid rgba(248, 113, 113, 0.35)",
    borderRadius: 12,
    background: "rgba(239, 68, 68, 0.1)",
    color: "#fca5a5",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },

  main: {
    flex: 1,
    minWidth: 0,
    background: "#f7f8fb",
  },
};