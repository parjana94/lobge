import { useState } from "react";
import { addProduct } from "../../firebase/products";

export default function ProductFormModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    shortDescription: "",
    fullDescription: "",
    mainImage: "",
    images: "",
    category: "",
    featured: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async () => {
    try {
      await addProduct({
        name: form.name,
        shortDescription: form.shortDescription,
        fullDescription: form.fullDescription,
        mainImage: form.mainImage,
        images: form.images.split(",").map((img) => img.trim()),
        category: form.category,
        featured: form.featured,
      });

      onSuccess();
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        
        <h2>➕ Add Product</h2>

        <input name="name" placeholder="Name" onChange={handleChange} />
        <input name="shortDescription" placeholder="Short description" onChange={handleChange} />
        <textarea name="fullDescription" placeholder="Full description" onChange={handleChange} />

        <input name="mainImage" placeholder="Main image URL" onChange={handleChange} />

        <input
          name="images"
          placeholder="Extra images (comma separated)"
          onChange={handleChange}
        />

        <input name="category" placeholder="Category" onChange={handleChange} />

        <label>
          <input type="checkbox" name="featured" onChange={handleChange} />
          Featured
        </label>

        <div style={{ marginTop: 10 }}>
          <button onClick={handleSubmit}>Save</button>
          <button onClick={onClose} style={{ marginLeft: 10 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modalStyle = {
  background: "white",
  padding: 20,
  borderRadius: 12,
  width: 400,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};