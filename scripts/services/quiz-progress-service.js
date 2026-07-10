// scripts/services/quiz-progress-service.js
// เก็บความคืบหน้าของโหมด Quiz แยก subcollection จากสะกดคำ (quizProgress vs lessonProgress)
// แต่ยังคงหลักการคำนวน XP เดียวกันเป๊ะ: บวกเข้า users/{uid}.xp ก้อนเดียวกัน

import { db } from "../firebase.js";
import {
  doc,
  getDoc,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

export async function getQuizProgress(uid, lessonId) {
  if (!uid) return null;
  const ref = doc(db, "users", uid, "quizProgress", `${lessonId}`);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// หลักการเหมือน saveIfBetter() ของสะกดคำทุกประการ:
// XP รวมนับจากคะแนนสูงสุดของบทนั้นเท่านั้น เล่นซ้ำได้แต่ไม่ได้ XP เพิ่มถ้าคะแนนไม่ดีขึ้น
export async function saveQuizIfBetter(uid, lessonId, result) {
  // result = { score, correct, wrong, total }
  if (!uid) return { xpAwarded: 0, isNewBest: false };

  const progressRef = doc(db, "users", uid, "quizProgress", `${lessonId}`);
  const userRef = doc(db, "users", uid);

  return runTransaction(db, async (transaction) => {
    const progressSnap = await transaction.get(progressRef);
    const userSnap = await transaction.get(userRef);

    const prevBest = progressSnap.exists() ? progressSnap.data().bestScore || 0 : 0;
    const currentXp = userSnap.exists() ? userSnap.data().xp || 0 : 0;
    const isFirstTime = !progressSnap.exists();

    if (result.score <= prevBest) {
      return { xpAwarded: 0, isNewBest: false, isFirstTime: false };
    }

    const delta = result.score - prevBest;

    transaction.set(progressRef, {
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