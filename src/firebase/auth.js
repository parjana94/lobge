import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./config";

export const loginAdmin = async (email, password) => {
  const userCred = await signInWithEmailAndPassword(auth, email, password);

  const uid = userCred.user.uid;

  const userDoc = await getDoc(doc(db, "users", uid));

  if (!userDoc.exists() || userDoc.data().role !== "admin") {
    await signOut(auth);
    throw new Error("Not authorized as admin");
  }

  return userCred.user;
};

export const logoutAdmin = () => {
  return signOut(auth);
};