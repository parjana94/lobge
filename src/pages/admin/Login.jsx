import { useState } from "react";
import { loginAdmin } from "../../firebase/auth";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await loginAdmin(email, password);
      navigate("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <div className="admin-login-brand">
          <span>LOBGE</span>
          <p>Product Catalogue Admin</p>
        </div>

        <div className="admin-login-heading">
          <p>შიდა პანელი</p>
          <h1 id="admin-login-title">Admin Login</h1>
        </div>

        <form className="admin-login-form" onSubmit={handleLogin}>
          <label>
            <span>Email</span>
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label>
            <span>Password</span>
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>

          {error && <p className="admin-login-error">{error}</p>}
        </form>
      </section>
    </main>
  );
}
