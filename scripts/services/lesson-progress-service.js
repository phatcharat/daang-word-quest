import { db } from "../firebase.js";
import {
  doc,
  getDoc,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

export async function getProgress(uid, category, lessonId) {
  if (!uid) return null;
  const ref = doc(
    db,
    "users",
    uid,
    "lessonProgress",
    `${category}_${lessonId}`,
  );
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// บันทึกผล: เล่นได้หลายรอบ แต่ XP รวมจะนับจาก "คะแนนสูงสุด" ของบทเรียนนั้นเท่านั้น
// เช่น รอบแรกได้ 20 (ได้ +20 XP) รอบสองได้ 100 (ได้ +80 XP ส่วนต่าง) รวมแล้ว XP จากบทนี้ = 100 ไม่ใช่ 120
// ถ้ารอบใหม่ทำคะแนนได้น้อยกว่าหรือเท่าคะแนนที่ดีที่สุดเดิม จะไม่มีการบวก XP เพิ่มเลย
// ใช้ Firestore transaction เพื่อให้การอ่าน-เปรียบเทียบ-เขียนเป็น atomic ป้องกันการนับซ้ำ/คลาดเคลื่อน
export async function saveIfBetter(uid, category, lessonId, result) {
  // result = { score, correct, wrong, total }
  if (!uid) return { xpAwarded: 0, isNewBest: false };

  const progressRef = doc(
    db,
    "users",
    uid,
    "lessonProgress",
    `${category}_${lessonId}`,
  );
  const userRef = doc(db, "users", uid);

  return runTransaction(db, async (transaction) => {
    const progressSnap = await transaction.get(progressRef);
    const userSnap = await transaction.get(userRef);

    const prevBest = progressSnap.exists()
      ? progressSnap.data().bestScore || 0
      : 0;
    const currentXp = userSnap.exists() ? userSnap.data().xp || 0 : 0;
    const isFirstTime = !progressSnap.exists();

    if (result.score <= prevBest) {
      return { xpAwarded: 0, isNewBest: false, isFirstTime: false };
    }

    const delta = result.score - prevBest;

    transaction.set(progressRef, {
      category,
      lessonId,
      bestScore: result.score,
      correct: result.correct,
      wrong: result.wrong,
      total: result.total,
      completedAt: Date.now(),
    });
    transaction.set(userRef, { xp: currentXp + delta }, { merge: true });

    return { xpAwarded: delta, isNewBest: true, isFirstTime };
  });
}
