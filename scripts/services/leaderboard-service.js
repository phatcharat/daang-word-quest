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
  documentId,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ดึงผู้เล่นอันดับต้น ๆ เรียงตาม XP มากไปน้อย
// ถ้า XP เท่ากัน ใช้ uid (documentId) เป็นตัวตัดสินรอง เพื่อให้ลำดับ "คงที่" ทุกครั้งที่โหลด
// (สำคัญ: ต้องใช้ลำดับเดียวกันเป๊ะกับ getUserRank() ด้านล่าง ไม่งั้นอันดับจะขัดกันเอง)
export async function getTopUsers(topN = 20) {
  const q = query(
    collection(db, "users"),
    orderBy("xp", "desc"),
    orderBy(documentId(), "asc"),
    limit(topN)
  );
  const snap = await getDocs(q);

  return snap.docs.map((docSnap, index) => {
    const data = docSnap.data();
    return {
      uid: docSnap.id,
      rank: index + 1,
      name: data.displayName || data.email || "ผู้เล่นนิรนาม",
      xp: data.xp || 0,
      streak: data.streak || 0,
      lastPlayedDate: data.lastPlayedDate || null,
    };
  });
}

// หาลำดับอันดับจริงของผู้ใช้ (เผื่อกรณีไม่ติดอยู่ในลิสต์ topN)
// อันดับ = (จำนวนคนที่ XP มากกว่าเรา) + (จำนวนคนที่ XP เท่ากันแต่ uid มาก่อนเรา ตาม tie-break เดียวกับ getTopUsers) + 1
export async function getUserRank(xp, uid) {
  const higherQ = query(collection(db, "users"), where("xp", ">", xp || 0));
  const higherSnap = await getCountFromServer(higherQ);

  let tieCount = 0;
  if (uid) {
    const tieQ = query(
      collection(db, "users"),
      where("xp", "==", xp || 0),
      where(documentId(), "<", uid)
    );
    const tieSnap = await getCountFromServer(tieQ);
    tieCount = tieSnap.data().count;
  }

  return higherSnap.data().count + tieCount + 1;
}