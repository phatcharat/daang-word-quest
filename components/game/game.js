// ===== components/game/game.js =====

import { auth } from "../../scripts/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { saveIfBetter } from "../../scripts/services/lesson-progress-service.js";
import { getUserProfile } from "../../scripts/services/user-service.js";

// ตัวป้องกันแอปพัง: ตรวจสอบและสร้าง appState สำรองไว้เสมอกันสคริปต์หยุดทำงาน
window.appState = window.appState || {};

const categoryTitleMap = {
  items: "สิ่งของ/เครื่องใช้",
  animal: "สัตว์/สิ่งมีชีวิต",
  fruit: "ผักและผลไม้",
  body: "อวัยวะในร่างกาย",
};

let currentCategory = null;
let currentLessonId = null;
let currentQuestions = [];
let currentIndex = 0;
let currentWordObj = null;
let gameCorrectWords = [];
let gameWrongWords = [];
let gameXP = 0;
let currentUid = null;

// Firebase Auth คืนสถานะล็อกอินแบบอะซิงโครนัส จึงต้องรอให้ auth เช็คสถานะเสร็จก่อน
// มิฉะนั้น auth.currentUser อาจเป็น null ชั่วขณะแม้ผู้ใช้จะ login อยู่จริง ทำให้ XP ขึ้นต้นเป็น 0 ผิด ๆ
function waitForAuthUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

// 🌟 ฟังก์ชันพิเศษฉบับแก้ไข: แยกสีปุ่ม "คำต่อไป" ตอนตอบผิดให้เป็นสีแดงสด
function injectQuizPopupStyles() {
  if (document.getElementById("spelling-quiz-popup-style-fix")) return;

  const styleTag = document.createElement("style");
  styleTag.id = "spelling-quiz-popup-style-fix";
  styleTag.innerHTML = `
        /* ===================================================
           🚫 [REMOVE BOTTOM NAV] สั่งซ่อนแถบเมนูด้านล่างในหน้าเกมและหน้าสรุปผล
           =================================================== */
        .game-page .bottom-nav,
        .quiz-play-page .bottom-nav,
        .summary-page .bottom-nav,
        .quiz-summary-page .bottom-nav,
        div:not(.quiz-page):not(.spelling-page) > .bottom-nav {
            display: none !important;
        }

        /* ===================================================
           🎨 ดีไซน์กล่องป๊อปอัพแจ้งผล (ตอบถูก/ตอบผิด) สไตล์ Quiz
           =================================================== */
        #feedback-success, #feedback-error {
            position: fixed !important;
            bottom: 30px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: 90% !important;
            max-width: 500px !important;
            background: #FFFFFF !important;
            border: 1px solid #EAEAEA !important;
            border-radius: 24px !important;
            padding: 24px !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
            box-sizing: border-box !important;
            z-index: 99999 !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            display: none;
        }

        /* หัวข้อป๊อปอัพ */
        #feedback-success h3, #feedback-error h3 {
            font-size: 18px !important;
            font-weight: 700 !important;
            margin: 0 0 10px 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 8px !important;
        }

        #feedback-success h3 { color: #22C55E !important; }
        #feedback-error h3 { color: #EF4444 !important; }

        /* ข้อความเฉลยภาษาดาอางตรงกลาง */
        #feedback-success p, #feedback-error p {
            font-size: 14px !important;
            color: #4A5568 !important;
            margin: 0 0 20px 0 !important;
            line-height: 1.5 !important;
        }

        #feedback-success p strong, #feedback-error p strong {
            color: #1A202C !important;
            font-weight: 700 !important;
        }

        /* 👑 สไตล์พื้นฐานร่วมกันของปุ่ม "คำต่อไป" ทั้งสองสถานะ */
        #feedback-success .btn-next, #feedback-error .btn-next {
            color: #FFFFFF !important;
            border: none !important;
            padding: 14px 20px !important;
            width: 100% !important;
            border-radius: 16px !important;
            font-size: 16px !important;
            font-weight: 700 !important;
            cursor: pointer !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 8px !important;
            transition: background 0.2s, transform 0.1s !important;
        }

        /* 🟩 [SUCCESS] ปุ่มตอนตอบ "ถูก" บังคับเป็นสีเขียว */
        #feedback-success .btn-next {
            background: #22C55E !important;
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2) !important;
        }
        #feedback-success .btn-next:active {
            transform: scale(0.98) !important;
            background: #16A34A !important;
        }

        /* 🟥 [ERROR] ปุ่มตอนตอบ "ผิด" หรือ "กดข้าม" บังคับเปลี่ยนเป็นสีแดงสด */
        #feedback-error .btn-next {
            background: #EF4444 !important;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2) !important;
        }
        #feedback-error .btn-next:active {
            transform: scale(0.98) !important;
            background: #DC2626 !important; /* สีแดงเข้มขึ้นเวลาเอานิ้วกด */
        }
    `;
  document.head.appendChild(styleTag);
}

// 1. ฟังก์ชันเริ่มต้นโหลดหน้าเกมสะกดคำศัพท์ โดยใช้บทเรียนที่ผู้ใช้เลือกจากหน้า Lesson
async function initGameScreen() {
  injectQuizPopupStyles();
  setupGameEventListeners();

  currentCategory = sessionStorage.getItem("daang_category");
  currentLessonId = Number(sessionStorage.getItem("daang_lessonId"));

  if (!currentCategory || !currentLessonId) {
    // ไม่มีบทเรียนถูกเลือกไว้ ย้อนกลับไปหน้าเลือกหมวดหมู่
    window.location.href = "../spelling/spelling.html";
    return;
  }

  const catSpan = document.getElementById("current-category");
  if (catSpan) {
    catSpan.innerText = categoryTitleMap[currentCategory] || currentCategory;
  }

  // รอให้ Firebase Auth คืนสถานะก่อน เพื่อให้ได้ uid ที่ถูกต้องจริง ๆ
  const user = await waitForAuthUser();
  currentUid = user?.uid || null;

  // แสดง XP จริงของผู้ใช้บนหัวข้อเกม (เริ่มต้นที่ 0 หากยังไม่เคยเล่น)
  updateHeaderXp();

  if (!window.lessonManager) {
    alert(
      "❌ ไม่พบระบบจัดการบทเรียน (lesson-manager.js) กรุณาโหลดหน้านี้ใหม่อีกครั้ง",
    );
    return;
  }

  const lesson = await window.lessonManager.getLesson(
    currentCategory,
    currentLessonId,
  );

  if (!lesson || !lesson.words || lesson.words.length === 0) {
    alert("❌ ไม่พบบทเรียนนี้ กรุณาเลือกบทเรียนใหม่อีกครั้ง");
    window.location.href = "../lesson/lesson.html";
    return;
  }

  // ใช้คำศัพท์ตามลำดับที่กำหนดไว้ในบทเรียนเสมอ ไม่สุ่มสำหรับคำถาม
  // เพื่อให้เนื้อหาของแต่ละบทเรียนคงที่เดิมทุกครั้งที่เล่น (ไม่ใช่ของสุ่มที่เกิดขึ้นใหม่ทุกรอบ)
  currentQuestions = [...lesson.words];

  currentIndex = 0;
  gameCorrectWords = [];
  gameWrongWords = [];
  gameXP = 0;

  if (window.appState && window.appState.session) {
    window.appState.session.score = 0;
    window.appState.session.current = 0;
  }

  // ข้อมูลพร้อมแล้ว ซ่อนหน้าโหลดแล้วค่อยเปิดเนื้อหาจริง กันหน้าจอกระพริบ/ข้อมูลตั้งต้นแวบขึ้นมาวูบเดียว
  document.getElementById("game-loading")?.classList.add("hidden");
  document.getElementById("quiz-content")?.classList.remove("hidden");

  loadQuestion();
}

// ดึง XP ของผู้ใช้จาก Firestore มาแสดงที่หัวข้อหน้าเกม
// ผู้ใช้ใหม่ที่ยังไม่เคยเล่นจะเห็น XP เป็น 0 ตามค่าเริ่มต้นที่ตั้งไว้ตอนสมัคร
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

// 2. ฟังก์ชันจัดเตรียมโจทย์ข้อปัจจุบันขึ้นหน้าจอ
function loadQuestion() {
  if (currentIndex >= currentQuestions.length) {
    finishLesson();
    return;
  }

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

  const btnCheck = document.getElementById("btn-check");
  const btnSkip = document.getElementById("btn-skip");
  if (btnCheck) btnCheck.disabled = false;
  if (btnSkip) btnSkip.disabled = false;

  const inputField = document.getElementById("answer-input");
  if (inputField) {
    inputField.value = "";
    inputField.disabled = false;
    inputField.focus();
  }

  currentWordObj = currentQuestions[currentIndex];

  const progressText = document.querySelector(".progress-text");
  if (progressText)
    progressText.innerText = `${currentIndex + 1}/${currentQuestions.length}`;

  const progressFill = document.querySelector(".progress-fill");
  if (progressFill) {
    const percentage = ((currentIndex + 1) / currentQuestions.length) * 100;
    progressFill.style.width = `${percentage}%`;
  }

  const imageWrapper = document.querySelector(".image-placeholder");
  if (imageWrapper && currentWordObj) {
    const emojiRaw = currentWordObj.emoji || "📝";
    const isImagePath = emojiRaw.includes("/") || emojiRaw.includes(".");

    // ไฟล์รูปใน data/words.json เก็บ path เป็น "assets/icons/xxx.jpg" (อ้างอิงจาก root ของโปรเจกต์)
    // แต่หน้านี้ถูกโหลดจาก components/game/game.html จึงต้องเติม "../../" เพื่อให้อ้างอิงหน้าโฟลดเดอร์ root ได้ถูกต้อง
    const emojiContent = isImagePath ? `../../${emojiRaw}` : emojiRaw;

    if (isImagePath) {
      imageWrapper.innerHTML = `<img src="${emojiContent}" alt="${currentWordObj.thai}" style="max-width: 100%; max-height: 120px; object-fit: contain; display: block; margin: 0 auto;"/>`;
    } else {
      imageWrapper.innerHTML = `<span style="font-size: 80px; display: block; text-align: center; line-height: 120px;">${emojiContent}</span>`;
    }
  }
}

// 3. ฟังก์ชันตรวจคำตอบ
function checkUserAnswer() {
  const inputField = document.getElementById("answer-input");
  const btnCheck = document.getElementById("btn-check");
  const btnSkip = document.getElementById("btn-skip");

  if (!inputField) return;

  if (!currentWordObj) {
    alert("⚠️ ระบบยังโหลดคลังคำศัพท์ไม่สำเร็จ ไม่สามารถตรวจคำตอบได้ครับ!");
    return;
  }

  const userAnswer = inputField.value.trim().toLowerCase();
  if (!userAnswer) {
    alert("โปรดพิมพ์คำตอบก่อนตรวจนะครับ!");
    return;
  }

  inputField.disabled = true;
  if (btnCheck) btnCheck.disabled = true;
  if (btnSkip) btnSkip.disabled = true;

  if (currentWordObj && currentWordObj.daang) {
    if (userAnswer === currentWordObj.daang.toLowerCase().trim()) {
      showFeedback(true);
    } else {
      showFeedback(false);
    }
  }
}

// 4. ฟังก์ชันผูก Event Listener ของปุ่มกดต่าง ๆ
function setupGameEventListeners() {
  const btnCheck = document.getElementById("btn-check");
  const btnSkip = document.getElementById("btn-skip");
  const inputField = document.getElementById("answer-input");

  if (btnCheck) {
    btnCheck.onclick = (e) => {
      e.preventDefault();
      checkUserAnswer();
    };
  }
  if (inputField) {
    inputField.onkeyup = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        checkUserAnswer();
      }
    };
  }

  if (btnSkip) {
    btnSkip.onclick = (e) => {
      e.preventDefault();
      const inputF = document.getElementById("answer-input");
      if (inputF) inputF.disabled = true;
      if (btnCheck) btnCheck.disabled = true;
      btnSkip.disabled = true;
      showFeedback(false, true);
    };
  }

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

// 5. ฟังก์ชันแสดงแบนเนอร์แจ้งผลลัพธ์ ถูก/ผิด
function showFeedback(isCorrect, isSkipped = false) {
  const successBanner = document.getElementById("feedback-success");
  const errorBanner = document.getElementById("feedback-error");

  if (isCorrect) {
    gameXP += 10;
    gameCorrectWords.push(currentWordObj);
    if (successBanner) {
      const titleLabel = successBanner.querySelector("h3");
      if (titleLabel) {
        titleLabel.innerHTML = `<i class="fa-solid fa-circle-check"></i> ถูกต้อง! +10 XP`;
      }

      const textLabel = successBanner.querySelector("p");
      if (textLabel) {
        textLabel.innerHTML = `ถูกต้อง! ภาษาดาอางคือ <strong>"${currentWordObj.daang.trim()}"</strong> [${currentWordObj.thai.trim()}]`;
      }

      const btnNext = successBanner.querySelector(".btn-next");
      if (btnNext) {
        btnNext.innerHTML = `คำต่อไป <i class="fa-solid fa-arrow-right"></i>`;
      }

      successBanner.classList.remove("hidden");
      successBanner.style.setProperty("display", "flex", "important");
    }
  } else {
    // ตอบผิดหรือข้าม ถือเป็นคำตอบผิดทั้งคู่ นับรวมเป็นคำตอบผิด
    gameWrongWords.push(currentWordObj);

    if (errorBanner) {
      const titleLabel = errorBanner.querySelector("h3");
      if (titleLabel) {
        titleLabel.innerHTML = isSkipped
          ? `<i class="fa-solid fa-circle-minus"></i> ข้ามคำถามข้อนี้`
          : `<i class="fa-solid fa-circle-xmark"></i> ไม่ถูกต้อง! +0 XP`;
      }

      const textLabel = errorBanner.querySelector("p");
      if (textLabel) {
        textLabel.innerHTML = `เฉลย: ภาษาดาอางคือ <strong>"${currentWordObj.daang.trim()}"</strong> [${currentWordObj.thai.trim()}]`;
      }

      const btnNext = errorBanner.querySelector(".btn-next");
      if (btnNext) {
        btnNext.innerHTML = `คำต่อไป <i class="fa-solid fa-arrow-right"></i>`;
      }

      errorBanner.classList.remove("hidden");
      errorBanner.style.setProperty("display", "flex", "important");
    }
  }
}

// 6. ฟังก์ชันจบบทเรียน: คำนวณคะแนน บันทึกลง Firestore (เพื่อไปโผล่ในหน้า Leaderboard/Profile)
//    แล้วส่งต่อไปยังหน้าสรุปผล (Result)
async function finishLesson() {
  // ซ่อนเนื้อหาคำถาม/แบนเนอร์แจ้งผลทันที แล้วโชว์สถานะกำลังบันทึกแทน
  // กันหน้าจอค้างเนื้อหาเก่าค้างอยู่ซักพักขณะรอบันทึกลง Firestore (สาเหตุของอาการ"กระพริบหน้าจอ")
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
      const saveResult = await saveIfBetter(
        currentUid,
        currentCategory,
        currentLessonId,
        {
          score,
          correct,
          wrong,
          total,
        },
      );
      xpAwarded = saveResult.xpAwarded;

      const profile = await getUserProfile(currentUid);
      totalXp = profile?.xp ?? null;
    } catch (err) {
      console.error("บันทึกผลบทเรียนไม่สำเร็จ:", err);
    }
  }

  const resultPayload = {
    category: currentCategory,
    categoryName: categoryTitleMap[currentCategory] || currentCategory,
    lessonId: currentLessonId,
    correct,
    wrong,
    total,
    score,
    xpAwarded,
    totalXp,
    correctWords: gameCorrectWords.map((w) => ({
      daang: w.daang,
      thai: w.thai,
    })),
    wrongWords: gameWrongWords.map((w) => ({ daang: w.daang, thai: w.thai })),
  };

  sessionStorage.setItem("daang_lastResult", JSON.stringify(resultPayload));

  window.location.href = "../result/result.html";
}

document.addEventListener("DOMContentLoaded", initGameScreen);

window.initGameScreen = initGameScreen;
