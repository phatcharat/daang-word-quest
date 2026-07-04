// scripts/services/leaderboard-service.js

import { db } from "../firebase.js";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  getCountFromServer,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ดึงผู้เล่นอันดับต้น ๆ เรียงตาม XP มากไปน้อย
export async function getTopUsers(topN = 20) {
  const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(topN));
  const snap = await getDocs(q);

  return snap.docs.map((docSnap, index) => {
    const data = docSnap.data();
    return {
      uid: docSnap.id,
      rank: index + 1,
      name: data.displayName || data.email || "ผู้เล่นนิรนาม",
      xp: data.xp || 0,
      streak: data.streak || 0,
    };
  });
}

// หาลำดับอันดับจริงของผู้ใช้ (เผื่อกรณีไม่ติดอยู่ในลิสต์ topN)
// อันดับ = จำนวนคนที่ XP มากกว่าเรา + 1
export async function getUserRank(xp) {
  const q = query(collection(db, "users"), where("xp", ">", xp || 0));
  const snap = await getCountFromServer(q);
  return snap.data().count + 1;
}
