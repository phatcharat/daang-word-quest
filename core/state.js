/* ===== core/state.js =====
   Global state กลางที่ทุก component อ่าน/เขียนผ่าน window.appState
   เก็บข้อมูล user, การเลือกโหมด/หมวด, และ session ของรอบเกมปัจจุบัน

   หลักการ: ไฟล์นี้ "ไม่มี" logic คำนวณ (เช่นคิด XP, เช็ค streak)
            หน้าที่ของไฟล์นี้คือเป็นที่เก็บค่ากลางเฉย ๆ ส่วน logic จริง
            อยู่ใน core/firebase.js (อ่าน/เขียน Firestore) และไฟล์ของแต่ละ component
*/

window.appState = {
  // ----- ข้อมูลผู้ใช้ (เติมค่าจริงหลัง login สำเร็จ โดย core/firebase.js) -----
  currentUser: null,     // { uid, displayName, email }
  streak: 0,              // จำนวนวันเล่นต่อเนื่อง
  xp: 0,                  // XP สะสมทั้งหมด
  lastPlayedDate: null,   // ISO date string "YYYY-MM-DD" ใช้เช็ค streak

  // ----- ค่าที่เลือกไว้ก่อนเริ่มเกม (ตั้งจากหน้า Home) -----
  selectedMode: null,      // "quiz" | "spelling" | "listening"
  selectedCategory: "all", // "all" | "items" | "animal" | "body" | "fruit"

  // ----- session ของรอบเกมปัจจุบัน (รีเซ็ตทุกครั้งที่เริ่มเกมใหม่) -----
  session: {
    questions: [],
    current: 0,

    lessonId: 1,
    category: null,

    score: 0,
    xpEarned: 0,

    correct: 0,
    wrong: 0,

    hearts: 5,

    missed: [],

    answered: false
  },
};

// ----- Helper: รีเซ็ต session ก่อนเริ่มเกมใหม่ทุกครั้ง -----
function resetSession() {
  window.appState.session = {
    questions: [],
    current: 0,
    score: 0,
    streakInRound: 0,
    maxStreakInRound: 0,
    correct: 0,
    wrong: 0,
    missed: [],
    answered: false,
    quizSubMode: null,
  };
}

// ----- Helper: เซฟค่า currentUser ลง state (เรียกจาก core/firebase.js หลัง login) -----
function setCurrentUser(userData) {
  window.appState.currentUser    = userData.user || null;
  window.appState.streak         = userData.streak ?? 0;
  window.appState.xp             = userData.xp ?? 0;
  window.appState.lastPlayedDate = userData.lastPlayedDate ?? null;
}

// ----- Helper: ล้าง state ทั้งหมดตอน logout -----
function clearAppState() {
  window.appState.currentUser    = null;
  window.appState.streak         = 0;
  window.appState.xp             = 0;
  window.appState.lastPlayedDate = null;
  window.appState.selectedMode   = null;
  window.appState.selectedCategory = "all";
  resetSession();
}