import { auth } from "../../scripts/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getUserProfile } from "../../scripts/services/user-service.js";
import { computeDisplayStreak } from "../../scripts/services/streak-service.js";

function waitForAuthUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

function initHomeScreen() {

    // ไฮไลต์ปุ่ม Home
    document.querySelectorAll(".nav-item")
        .forEach(btn => btn.classList.remove("active"));

    document
        .querySelector("[onclick=\"navigateTo('home')\"]")
        ?.classList.add("active");

    const quizBtn = document.getElementById("quiz-btn");
    const spellBtn = document.getElementById("spell-btn");

    quizBtn?.addEventListener("click", () => {
        navigateTo("quizLesson");
    });

    spellBtn?.addEventListener("click", () => {
        navigateTo("spelling");
    });

    loadHeaderStats();
}

// ดึง XP/Streak จริงจาก Firestore มาแสดง แทนตัวเลขคงที่เดิม (1000 XP / 1 วัน)
async function loadHeaderStats() {
  const fireEl = document.getElementById("home-fire-stat");
  const xpEl = document.getElementById("home-xp-stat");
  const greetEl = document.getElementById("home-greet-name");

  const user = await waitForAuthUser();
  if (!user) return; // auth-guard จะจัดการ redirect ไป login เอง

  if (greetEl) greetEl.textContent = user.displayName || user.email || "ผู้เล่น";

  try {
    const profile = await getUserProfile(user.uid);
    const xp = profile?.xp ?? 0;
    const displayStreak = computeDisplayStreak(
      profile?.streak ?? 0,
      profile?.lastPlayedDate ?? null,
    );

    if (fireEl) fireEl.textContent = `🔥 ${displayStreak} วัน`;
    if (xpEl) xpEl.textContent = `⚡ ${xp} XP`;
  } catch (err) {
    console.error("โหลดสถิติหน้า Home ไม่สำเร็จ:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
    initHomeScreen();
});

window.initHomeScreen = initHomeScreen;