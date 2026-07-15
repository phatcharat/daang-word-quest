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

async function loadHeaderStats() {
  const fireEl = document.getElementById("spelling-fire-stat");
  const xpEl = document.getElementById("spelling-xp-stat");

  const user = await waitForAuthUser();
  if (!user) return; // auth-guard จะจัดการ redirect ไป login เอง

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
    console.error("โหลดสถิติหน้า Spelling ไม่สำเร็จ:", err);
  }
}

function initSpellingScreen() {
  document.querySelectorAll(".category-card").forEach(card => {
    card.addEventListener("click", () => {
      const category = card.dataset.category;
      sessionStorage.setItem("daang_category", category);
      window.location.href = "../lesson/lesson.html";
    });
  });

  loadHeaderStats();
}

window.initSpellingScreen = initSpellingScreen;
document.addEventListener("DOMContentLoaded", initSpellingScreen);