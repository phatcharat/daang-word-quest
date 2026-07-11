// ===== components/quiz/quiz.js =====

import { auth } from "../../scripts/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { saveQuizIfBetter } from "../../scripts/services/quiz-progress-service.js";
import { getUserProfile } from "../../scripts/services/user-service.js";

window.appState = window.appState || {};

let currentLessonId = null;
let currentQuestions = [];
let currentIndex = 0;
let currentWordObj = null;
let currentQType = null;
let gameCorrectWords = [];
let gameWrongWords = [];
let gameXP = 0;
let currentUid = null;

function waitForAuthUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

async function initQuizScreen() {
  setupNextButtons();

  currentLessonId = Number(sessionStorage.getItem("daang_quiz_lessonId"));

  if (!currentLessonId) {
    window.location.href = "../quiz-lesson/quiz-lesson.html";
    return;
  }

  const user = await waitForAuthUser();
  currentUid = user?.uid || null;

  updateHeaderXp();

  if (!window.quizManager) {
    alert("❌ ไม่พบระบบจัดการ Quiz (quiz-manager.js) กรุณาโหลดหน้านี้ใหม่อีกครั้ง");
    return;
  }

  const lesson = await window.quizManager.getLesson(currentLessonId);

  if (!lesson || !lesson.words || lesson.words.length === 0) {
    alert("❌ ไม่พบบทเรียนนี้ กรุณาเลือกบทเรียนใหม่อีกครั้ง");
    window.location.href = "../quiz-lesson/quiz-lesson.html";
    return;
  }

  currentQuestions = lesson.words;
  currentIndex = 0;
  gameCorrectWords = [];
  gameWrongWords = [];
  gameXP = 0;

  document.getElementById("game-loading")?.classList.add("hidden");
  document.getElementById("quiz-content")?.classList.remove("hidden");

  loadQuestion();
}

async function updateHeaderXp() {
  const badge = document.getElementById("header-xp-badge");
  if (!badge) return;

  if (!currentUid) {
    badge.textContent = "⚡ 0 XP";
    return;
  }

  try {
    const profile = await getUserProfile(currentUid);
    badge.textContent = `⚡ ${profile?.xp || 0} XP`;
  } catch (err) {
    console.error("โหลด XP ของผู้ใช้ไม่สำเร็จ:", err);
    badge.textContent = "⚡ 0 XP";
  }
}

async function loadQuestion() {
  if (currentIndex >= currentQuestions.length) {
    finishQuiz();
    return;
  }

  hideBanners();

  currentWordObj = currentQuestions[currentIndex];
  currentQType = currentWordObj.qType;

  const progressText = document.getElementById("progress-text");
  if (progressText)
    progressText.innerText = `${currentIndex + 1}/${currentQuestions.length}`;

  const progressFill = document.getElementById("progress-fill");
  if (progressFill) {
    const percentage = ((currentIndex + 1) / currentQuestions.length) * 100;
    progressFill.style.width = `${percentage}%`;
  }

  const imgWrapper = document.getElementById("quiz-image-placeholder");
  const wordDisplay = document.getElementById("quiz-word-display");

  if (currentQType === "word2thai") {
    // โจทย์แบบที่ 1: โชว์คำดาอาง → ให้เลือกคำไทยที่ถูกต้อง (ไม่มีข้อความอธิบายแล้ว)
    if (imgWrapper) imgWrapper.classList.add("hidden");
    if (wordDisplay) {
      wordDisplay.classList.remove("hidden");
      wordDisplay.innerText = currentWordObj.daang;
    }
  } else {
    // โจทย์แบบที่ 2: โชว์รูปภาพ → ให้เลือกคำดาอางที่ถูกต้อง (ไม่มีข้อความอธิบายแล้ว)
    if (wordDisplay) wordDisplay.classList.add("hidden");
    if (imgWrapper) {
      imgWrapper.classList.remove("hidden");
      const emojiRaw = currentWordObj.emoji || "📝";
      const isImagePath = emojiRaw.includes("/") || emojiRaw.includes(".");
      const emojiContent = isImagePath ? `../../${emojiRaw}` : emojiRaw;

      imgWrapper.innerHTML = isImagePath
        ? `<img src="${emojiContent}" alt="${currentWordObj.thai}" style="max-width: 100%; max-height: 120px; object-fit: contain; display: block; margin: 0 auto;"/>`
        : `<span style="font-size: 80px; display: block; text-align: center; line-height: 120px;">${emojiContent}</span>`;
    }
  }

  const choices = await window.quizManager.generateChoices(currentWordObj, currentQType);
  renderChoices(choices);
}

function renderChoices(choices) {
  const grid = document.getElementById("choice-grid");
  if (!grid) return;

  grid.innerHTML = "";

  choices.forEach((choiceText) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.innerText = choiceText;
    btn.onclick = () => checkAnswer(choiceText, btn);
    grid.appendChild(btn);
  });
}

function checkAnswer(selectedValue, btnEl) {
  const correctValue =
    currentQType === "word2thai" ? currentWordObj.thai : currentWordObj.daang;

  const allBtns = document.querySelectorAll(".choice-btn");
  allBtns.forEach((b) => (b.disabled = true));

  const isCorrect = selectedValue === correctValue;

  allBtns.forEach((b) => {
    if (b.innerText === correctValue) {
      b.classList.add("correct-choice");
    } else if (b === btnEl && !isCorrect) {
      b.classList.add("wrong-choice");
    }
  });

  showFeedback(isCorrect, correctValue);
}

function showFeedback(isCorrect, correctValue) {
  showFeedbackBackdrop();
  const successBanner = document.getElementById("feedback-success");
  const errorBanner = document.getElementById("feedback-error");

  if (isCorrect) {
    gameXP += 10;
    gameCorrectWords.push(currentWordObj);

    if (successBanner) {
      const textLabel = successBanner.querySelector("p");
      if (textLabel) {
        textLabel.innerHTML = `ถูกต้อง! คำตอบคือ <strong>"${correctValue}"</strong>`;
      }
      successBanner.classList.remove("hidden");
      successBanner.style.setProperty("display", "flex", "important");
    }
  } else {
    gameWrongWords.push(currentWordObj);

    if (errorBanner) {
      const textLabel = errorBanner.querySelector("p");
      if (textLabel) {
        textLabel.innerHTML = `เฉลย: คำตอบที่ถูกต้องคือ <strong>"${correctValue}"</strong>`;
      }
      errorBanner.classList.remove("hidden");
      errorBanner.style.setProperty("display", "flex", "important");
    }
  }
}

function ensureFeedbackBackdrop() {
  let backdrop = document.getElementById("feedback-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "feedback-backdrop";
    backdrop.className = "feedback-backdrop";
    document.body.appendChild(backdrop);
  }
  return backdrop;
}

function showFeedbackBackdrop() {
  ensureFeedbackBackdrop().classList.add("show");
}

function hideFeedbackBackdrop() {
  document.getElementById("feedback-backdrop")?.classList.remove("show");
}

function hideBanners() {
  const successBanner = document.getElementById("feedback-success");
  const errorBanner = document.getElementById("feedback-error");
  if (successBanner) {
    successBanner.classList.add("hidden");
    successBanner.style.display = "none";
  }
  if (errorBanner) {
    errorBanner.classList.add("hidden");
    errorBanner.style.display = "none";
  }
  hideFeedbackBackdrop();
}

function setupNextButtons() {
  const btnNextSuccess = document.querySelector("#feedback-success .btn-next");
  if (btnNextSuccess) {
    btnNextSuccess.onclick = (e) => {
      e.preventDefault();
      currentIndex++;
      loadQuestion();
    };
  }

  const btnNextError = document.querySelector("#feedback-error .btn-next");
  if (btnNextError) {
    btnNextError.onclick = (e) => {
      e.preventDefault();
      currentIndex++;
      loadQuestion();
    };
  }
}

async function finishQuiz() {
  document.querySelector(".feedback-banner.success")?.classList.add("hidden");
  document.querySelector(".feedback-banner.error")?.classList.add("hidden");
  document.getElementById("quiz-content")?.classList.add("hidden");

  const loadingText = document.getElementById("game-loading-text");
  if (loadingText) loadingText.textContent = "กำลังบันทึกผลคะแนน...";
  document.getElementById("game-loading")?.classList.remove("hidden");

  const total = currentQuestions.length;
  const correct = gameCorrectWords.length;
  const wrong = gameWrongWords.length;
  const score = gameXP;

  let xpAwarded = score;
  let totalXp = null;

  if (currentUid) {
    try {
      const saveResult = await saveQuizIfBetter(currentUid, currentLessonId, {
        score,
        correct,
        wrong,
        total,
      });
      xpAwarded = saveResult.xpAwarded;

      const profile = await getUserProfile(currentUid);
      totalXp = profile?.xp ?? null;
    } catch (err) {
      console.error("บันทึกผล Quiz ไม่สำเร็จ:", err);
    }
  }

  const resultPayload = {
    mode: "quiz",
    categoryName: "Quiz 4 ตัวเลือก",
    lessonId: currentLessonId,
    correct,
    wrong,
    total,
    score,
    xpAwarded,
    totalXp,
    correctWords: gameCorrectWords.map((w) => ({ daang: w.daang, thai: w.thai })),
    wrongWords: gameWrongWords.map((w) => ({ daang: w.daang, thai: w.thai })),
  };

  sessionStorage.setItem("daang_lastResult", JSON.stringify(resultPayload));
  window.location.href = "../result/result.html";
}

document.addEventListener("DOMContentLoaded", initQuizScreen);
window.initQuizScreen = initQuizScreen;