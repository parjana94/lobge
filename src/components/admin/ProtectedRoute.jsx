import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, role, loading } = useContext(AuthContext);

  if (loading) return <p>Loading...</p>;

  if (!user || role !== "admin") {
    return <Navigate to="/admin/login" />;
  }

  return children;
}