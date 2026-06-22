import { db } from "./config";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

const colRef = collection(db, "products");

// 📦 GET ALL
export const getProducts = async () => {
  const q = query(colRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};

// 📦 GET ONE
export const getProduct = async (id) => {
  const snap = await getDoc(doc(db, "products", id));

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data(),
  };
};

// ➕ ADD
export const addProduct = async (data) => {
  return await addDoc(colRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
};

// ✏️ UPDATE
export const updateProduct = async (id, data) => {
  return await updateDoc(doc(db, "products", id), data);
};

// ❌ DELETE
export const deleteProduct = async (id) => {
  return await deleteDoc(doc(db, "products", id));
};