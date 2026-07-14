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
// ถ้า XP เท่ากัน ใช้ "createdAt" (เวลาสมัครสมาชิก) เป็นตัวตัดสินรอง เรียงเก่า -> ใหม่
// เพื่อให้คนสมัครใหม่สุด (XP เท่ากัน เช่น 0 ทั้งคู่) ตกไปอยู่ท้ายแถวของกลุ่มที่ XP เท่ากันเสมอ
// (สำคัญ: ต้องใช้ลำดับเดียวกันเป๊ะกับ getUserRank() ด้านล่าง ไม่งั้นอันดับจะขัดกันเอง)
export async function getTopUsers(topN = 20) {
  const q = query(
    collection(db, "users"),
    orderBy("xp", "desc"),
    orderBy("createdAt", "asc"),
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
      createdAt: data.createdAt || null,
    };
  });
}

// หาลำดับอันดับจริงของผู้ใช้ (เผื่อกรณีไม่ติดอยู่ในลิสต์ topN)
// อันดับ = (จำนวนคนที่ XP มากกว่าเรา)
//        + (จำนวนคนที่ XP เท่ากันแต่สมัครสมาชิก "ก่อน" เรา ตาม tie-break เดียวกับ getTopUsers)
//        + 1
// ต้องส่ง createdAt ของผู้ใช้เข้ามาด้วย (ดึงจาก users/{uid}.createdAt) แทนการใช้ uid แบบเดิม
export async function getUserRank(xp, createdAt) {
  const higherQ = query(collection(db, "users"), where("xp", ">", xp || 0));
  const higherSnap = await getCountFromServer(higherQ);

  let tieCount = 0;
  if (createdAt) {
    const tieQ = query(
      collection(db, "users"),
      where("xp", "==", xp || 0),
      where("createdAt", "<", createdAt)
    );
    const tieSnap = await getCountFromServer(tieQ);
    tieCount = tieSnap.data().count;
  }

  return higherSnap.data().count + tieCount + 1;
}