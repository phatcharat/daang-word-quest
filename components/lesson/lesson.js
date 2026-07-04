import { auth } from "../../scripts/firebase.js";
import { getProgress } from "../../scripts/services/lesson-progress-service.js";

const categoryMeta = {
  animal: {
    title: "หมวดสัตว์/สิ่งมีชีวิต",
    subtitle: "เรียนรู้ชื่อสัตว์และสิ่งมีชีวิต",
    icon: "fa-paw",
    color: "blue",
  },
  fruit: {
    title: "หมวดผักและผลไม้",
    subtitle: "คำศัพท์หมวดอาหารและพืชผัก",
    icon: "fa-apple-whole",
    color: "green",
  },
  body: {
    title: "หมวดอวัยวะในร่างกาย",
    subtitle: "เรียนรู้ส่วนต่าง ๆ ของร่างกาย",
    icon: "fa-person",
    color: "cyan",
  },
  items: {
    title: "หมวดสิ่งของ/เครื่องใช้",
    subtitle: "คำศัพท์เกี่ยวกับสิ่งของในชีวิตประจำวัน",
    icon: "fa-bag-shopping",
    color: "orange",
  },
};

async function init() {
  const category = sessionStorage.getItem("daang_category");
  if (!category) {
    window.location.href = "../spelling/spelling.html";
    return;
  }

  const meta = categoryMeta[category] || {
    title: category,
    subtitle: "",
    icon: "fa-book",
    color: "",
  };

  document.getElementById("categoryTitle").textContent = meta.title;
  document.getElementById("categorySubtitle").textContent = meta.subtitle;

  const iconBadge = document.getElementById("categoryIconBadge");
  iconBadge.classList.add(meta.color);
  document.getElementById("categoryIcon").className = `fa-solid ${meta.icon}`;

  const lessons = await window.lessonManager.getLessons(category);
  const uid = auth.currentUser?.uid;
  const listEl = document.getElementById("lessonList");

  if (lessons.length === 0) {
    listEl.innerHTML = `
      <div class="lesson-empty">
        <i class="fa-solid fa-box-open"></i>
        ยังไม่มีบทเรียนในหมวดนี้
      </div>
    `;
    return;
  }

  for (const lesson of lessons) {
    const progress = await getProgress(uid, category, lesson.lessonId);

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
      sessionStorage.setItem("daang_lessonId", lesson.lessonId);
      window.location.href = "../game/game.html";
    });

    listEl.appendChild(card);
  }
}

document.addEventListener("DOMContentLoaded", init);
