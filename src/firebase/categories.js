import { db } from "./config";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";

const colRef = collection(db, "categories");

// 📦 GET ALL
export const getCategories = async () => {
  const q = query(colRef, orderBy("name", "asc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};

// ➕ ADD
export const addCategory = async (name) => {
  return await addDoc(colRef, { name });
};

// ❌ DELETE
export const deleteCategory = async (id) => {
  return await deleteDoc(doc(db, "categories", id));
};