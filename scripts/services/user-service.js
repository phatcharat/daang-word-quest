// scripts/services/user-service.js

import { db } from "../firebase.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

export async function getUserProfile(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}
