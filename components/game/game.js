async function initGameScreen() {
  const category = window.appState.session.category;

  const lessonId = window.appState.session.lessonId;

  const lesson = await window.lessonManager.getLesson(category, lessonId);

  window.appState.session.questions = lesson.words;

  window.appState.session.current = 0;

  loadQuestion();

  document.getElementById("checkBtn").addEventListener("click", checkAnswer);
}

function loadQuestion() {
  const session = window.appState.session;

  const word = session.questions[session.current];
  const categoryMap = {
    animal: "หมวดสัตว์/สิ่งมีชีวิต",
    fruit: "หมวดผักและผลไม้",
    body: "หมวดอวัยวะในร่างกาย",
    items: "หมวดสิ่งของ/เครื่องใช้",
  };
  const percent = ((session.current + 1) / session.questions.length) * 100;

  document.getElementById("progressFill").style.width = `${percent}%`;

  document.getElementById("categoryName").textContent =
    categoryMap[window.appState.session.category];
  const imageContainer = document.getElementById("questionImage");

  const isImageFile =
    word.emoji.includes(".png") ||
    word.emoji.includes(".jpg") ||
    word.emoji.includes(".jpeg") ||
    word.emoji.includes(".svg");

  if (isImageFile) {
    imageContainer.innerHTML = `
            <img
                src="${word.emoji}"
                alt="${word.thai}"
                class="question-img"
            >
        `;
  } else {
    imageContainer.innerHTML = `
            <div class="emoji-display">
                ${word.emoji}
            </div>
        `;
  }

  document.getElementById("questionCounter").textContent =
    `${session.current + 1}/${session.questions.length}`;

  document.getElementById("answerInput").value = "";
}

function checkAnswer() {
  const session = window.appState.session;

  const word = session.questions[session.current];

  const input = document.getElementById("answerInput").value.trim();

  const correct = input === word.daang;

  const feedback = document.getElementById("feedbackCard");

  feedback.style.display = "block";

  if (correct) {
    session.correct++;
    session.score += 10;
    session.xpEarned += 10;

    feedback.innerHTML = `
            <h3>
            ✓ ถูกต้อง! +10 XP
            </h3>

            <p>
            คำตอบคือ "${word.daang}"
            </p>

            <button onclick="nextQuestion()">
                คำถัดไป
            </button>
        `;
  } else {
    session.wrong++;

    session.missed.push(word);

    feedback.innerHTML = `
            <h3>
            ✗ ไม่ถูกต้อง
            </h3>

            <p>
            คำตอบที่ถูกคือ
            "${word.daang}"
            </p>

            <button onclick="nextQuestion()">
                คำถัดไป
            </button>
        `;
  }
}

function nextQuestion() {
  const session = window.appState.session;

  session.current++;

  document.getElementById("feedbackCard").style.display = "none";

  if (session.current >= session.questions.length) {
    navigateTo("result");
    return;
  }

  loadQuestion();
}

window.initGameScreen = initGameScreen;
