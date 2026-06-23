import { Routes, Route } from "react-router-dom";

import Login from "./pages/admin/Login";
import Products from "./pages/admin/Products";
import Categories from "./pages/admin/Categories";

import AdminLayout from "./components/admin/AdminLayout";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

import Catalog from "./pages/Catalog";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";

function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/product/:id" element={<ProductDetail />} />

        {/* Admin login */}
        <Route path="/admin/login" element={<Login />} />

        {/* Admin panel */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;