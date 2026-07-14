// scripts/services/avatar-service.js
// จัดการชุด Avatar สำเร็จรูป (ไอคอน/อิโมจิ) แทนการอัปโหลดรูปจริง
// เก็บแค่ "avatarId" ที่ผู้ใช้เลือกไว้ใน Firestore users/{uid}.avatarId

import { db } from "../firebase.js";
import {
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

export const AVATAR_LIST = [
  { id: "cat",     emoji: "🐱", color: "#F5A623" },
  { id: "dog",     emoji: "🐶", color: "#4A90E2" },
  { id: "fox",     emoji: "🦊", color: "#E8734A" },
  { id: "panda",   emoji: "🐼", color: "#1ABC75" },
  { id: "lion",    emoji: "🦁", color: "#FFC107" },
  { id: "koala",   emoji: "🐨", color: "#9E9E9E" },
  { id: "owl",     emoji: "🦉", color: "#8B5CF6" },
  { id: "penguin", emoji: "🐧", color: "#22B8CF" },
];

export const DEFAULT_AVATAR_ID = "cat";

export function getAvatarById(avatarId) {
  return (
    AVATAR_LIST.find((a) => a.id === avatarId) ||
    AVATAR_LIST.find((a) => a.id === DEFAULT_AVATAR_ID)
  );
}

// บันทึก avatarId ที่เลือกลง Firestore (merge เพื่อไม่ทับฟิลด์อื่น)
export async function saveAvatarSelection(uid, avatarId) {
  if (!uid) return;
  await setDoc(doc(db, "users", uid), { avatarId }, { merge: true });
}