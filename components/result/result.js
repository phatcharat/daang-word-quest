// ===== components/result/result.js =====

function initResultScreen() {
  const raw = sessionStorage.getItem("daang_lastResult");

  if (!raw) {
    // ไม่มีข้อมูลผลลัพธ์ (เช่นเข้าหน้านี้ตรง ๆ โดยไม่ได้เล่นเกมมาก่อน)
    window.location.href = "../spelling/spelling.html";
    return;
  }

  let result;
  try {
    result = JSON.parse(raw);
  } catch (err) {
    window.location.href = "../spelling/spelling.html";
    return;
  }

  const {
    categoryName,
    lessonId,
    correct = 0,
    wrong = 0,
    total = 0,
    score = 0,
    xpAwarded = 0,
    totalXp = null,
    correctWords = [],
    wrongWords = [],
  } = result;

  document.getElementById("qsSubtitle").textContent =
    `บทที่ ${lessonId} • ${categoryName || ""}`;
  document.getElementById("qsScore").textContent = score;
  document.getElementById("qsCorrect").textContent = correct;
  document.getElementById("qsWrong").textContent = wrong;
  document.getElementById("qsXpAwarded").textContent = `+${xpAwarded} XP`;

  const totalXpEl = document.getElementById("qsTotalXp");
  if (totalXpEl) {
    totalXpEl.textContent =
      totalXp !== null && totalXp !== undefined
        ? `XP สะสมทั้งหมดของคุณตอนนี้: ${totalXp} XP`
        : "";
  }

  const titleEl = document.getElementById("qsTitle");
  if (titleEl) {
    const percent = total > 0 ? (correct / total) * 100 : 0;
    titleEl.textContent =
      percent === 100
        ? "เยี่ยมมาก! ตอบถูกครบ 100% 🎉"
        : percent >= 70
          ? "เก่งมาก! 🎉"
          : percent >= 40
            ? "ทำได้ดี ลองอีกครั้งนะ 💪"
            : "ไม่เป็นไร ลองใหม่อีกครั้งนะ 🙂";
  }

  renderBadges("qsCorrectBadges", correctWords, "badge-green");
  renderBadges("qsWrongBadges", wrongWords, "badge-red");

  const mode = result.mode === "quiz" ? "quiz" : "spelling";

  document.getElementById("qsRetryBtn")?.addEventListener("click", () => {
    window.location.href =
      mode === "quiz" ? "../quiz/quiz.html" : "../game/game.html";
  });

  document.getElementById("qsBackBtn")?.addEventListener("click", () => {
    window.location.href =
      mode === "quiz" ? "../quiz-lesson/quiz-lesson.html" : "../lesson/lesson.html";
  });
}

function renderBadges(containerId, words, badgeClass) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!words || words.length === 0) {
    container.innerHTML = `<span class="qs-empty-info">ไม่มี</span>`;
    return;
  }

  container.innerHTML = words
    .map(
      (word) =>
        `<span class="qs-pill-badge ${badgeClass}">${word.daang}${word.thai ? ` (${word.thai})` : ""}</span>`,
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", initResultScreen);
window.initResultScreen = initResultScreen;
