// ===== components/quiz-lesson/quiz-lesson.js =====

import { auth } from "../../scripts/firebase.js";
import { getQuizProgress } from "../../scripts/services/quiz-progress-service.js";

async function init() {
  const listEl = document.getElementById("lessonList");
  const uid = auth.currentUser?.uid;

  const lessons = await window.quizManager.getLessons();

  if (lessons.length === 0) {
    listEl.innerHTML = `
      <div class="lesson-empty">
        <i class="fa-solid fa-box-open"></i>
        ยังไม่มีบทเรียน Quiz
      </div>
    `;
    return;
  }

  for (const lesson of lessons) {
    const progress = await getQuizProgress(uid, lesson.lessonId);

    const card = document.createElement("button");
    card.className = `lesson-card${progress ? " completed" : ""}`;
    card.innerHTML = `
      <div class="lesson-number">${lesson.lessonId}</div>
      <div class="lesson-info">
        <h3>บทที่ ${lesson.lessonId}</h3>
        <p><i class="fa-solid fa-list-ul"></i> ${lesson.words.length} คำศัพท์</p>
      </div>
      <div class="lesson-status">
        ${progress ? `<span class="score-chip"><i class="fa-solid fa-star"></i> ${progress.bestScore}</span>` : ""}
        <span class="lesson-action ${progress ? "review" : "start"}">
          ${progress ? "ทบทวน" : "เริ่มเรียน"} <i class="fa-solid fa-chevron-right"></i>
        </span>
      </div>
    `;

    card.addEventListener("click", () => {
      sessionStorage.setItem("daang_quiz_lessonId", lesson.lessonId);
      window.location.href = "../quiz/quiz.html";
    });

    listEl.appendChild(card);
  }
}

document.addEventListener("DOMContentLoaded", init);