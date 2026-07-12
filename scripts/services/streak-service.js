// scripts/services/streak-service.js
// จัดการ Streak (จำนวนวันเล่นต่อเนื่อง) แยกไฟล์เดียว
// ให้ game.js และ quiz.js เรียกใช้ logic เดียวกัน ไม่ต้องก็อปโค้ดซ้ำ
//
// กติกา:
// - นับ 1 ครั้งต่อ 1 วัน (เล่นกี่บทก็ตามในวันเดียวกัน นับแค่ครั้งแรก)
// - เล่นวันนี้ต่อจากเมื่อวาน (lastPlayedDate = เมื่อวาน) -> streak + 1
// - เล่นวันนี้ไปแล้ว (lastPlayedDate = วันนี้) -> streak เท่าเดิม ไม่นับซ้ำ
// - ขาดช่วง (lastPlayedDate เก่ากว่าเมื่อวาน หรือไม่เคยเล่นมาก่อน) -> เริ่มนับใหม่จาก 1
//   (นับ 1 เพราะเล่นวันนี้แล้ว ส่วนตอน "ยังไม่ได้เล่น" ของวันนั้น ให้ใช้ computeDisplayStreak แสดงเป็น 0 แทน)

import { db } from "../firebase.js";
import {
  doc,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ----- Helper: แปลง Date เป็น "YYYY-MM-DD" ตามเวลาท้องถิ่นเครื่อง (กันปัญหาข้ามวันจาก UTC) -----
function toLocalDateString(date) {
  const tzOffsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

function getTodayString() {
  return toLocalDateString(new Date());
}

function getYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalDateString(d);
}

// เรียกทุกครั้งที่ "จบบทเรียน" (ไม่ว่าคะแนนเท่าไหร่) ทั้งโหมดสะกดคำและ Quiz
// ใช้ transaction กันเคสเล่นพร้อมกันหลายแท็บ/นับซ้ำ
export async function recordPlaySession(uid) {
  if (!uid) return null;

  const userRef = doc(db, "users", uid);
  const today = getTodayString();
  const yesterday = getYesterdayString();

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef);
    const data = snap.exists() ? snap.data() : {};

    const prevStreak = data.streak || 0;
    const prevLastPlayed = data.lastPlayedDate || null;

    let newStreak;

    if (prevLastPlayed === today) {
      // เล่นไปแล้ววันนี้ ไม่นับซ้ำ
      newStreak = prevStreak;
    } else if (prevLastPlayed === yesterday) {
      // ต่อเนื่องจากเมื่อวาน บวกเพิ่ม 1
      newStreak = prevStreak + 1;
    } else {
      // ขาดช่วง (หรือเล่นครั้งแรก) เริ่มนับใหม่จาก 1
      newStreak = 1;
    }

    transaction.set(
      userRef,
      { streak: newStreak, lastPlayedDate: today },
      { merge: true },
    );

    return newStreak;
  });
}

// ----- ใช้ตอน "แสดงผล" เท่านั้น ไม่เขียน Firestore -----
// เผื่อกรณีขาดช่วงไปแล้วแต่ยังไม่ได้กดเล่นวันนี้ ให้หน้าจอโชว์ 0 ทันที
// (ค่าจริงใน Firestore จะถูกอัปเดตเป็น 1 ตอนเล่นรอบถัดไปผ่าน recordPlaySession)
export function computeDisplayStreak(streak, lastPlayedDate) {
  if (!lastPlayedDate) return 0;

  const today = getTodayString();
  const yesterday = getYesterdayString();

  if (lastPlayedDate === today || lastPlayedDate === yesterday) {
    return streak || 0;
  }

  return 0;
}