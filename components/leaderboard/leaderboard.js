import { auth } from "../../scripts/firebase.js";
import {
  getTopUsers,
  getUserRank,
} from "../../scripts/services/leaderboard-service.js";
import { getUserProfile } from "../../scripts/services/user-service.js";

const TOP_N = 20;

async function initLeaderboardScreen() {
  console.log("🏆 หน้า Leaderboard ทำงานแล้ว");

  // ไฮไลต์ปุ่มเมนูให้ถูกต้อง
  document
    .querySelectorAll(".nav-item")
    .forEach((btn) => btn.classList.remove("active"));
  document.querySelector('[data-nav="leaderboard"]')?.classList.add("active");

  const uid = auth.currentUser?.uid;
  const listBox = document.getElementById("leaderboard-list-box");

  let topUsers = [];
  try {
    topUsers = await getTopUsers(TOP_N);
  } catch (err) {
    console.error("โหลดกระดานผู้นำไม่สำเร็จ:", err);
    if (listBox) {
      listBox.innerHTML = `<p class="lb-empty-state">ไม่สามารถโหลดกระดานผู้นำได้ในขณะนี้</p>`;
    }
    return;
  }

  const usersWithFlag = topUsers.map((user) => ({
    ...user,
    isCurrentUser: !!uid && user.uid === uid,
  }));

  renderLeaderboard(usersWithFlag);
  await renderMyStats(uid, usersWithFlag);
}

async function renderMyStats(uid, topUsers) {
  if (!uid) return;

  let me = topUsers.find((u) => u.isCurrentUser);

  if (!me) {
    // ผู้ใช้ไม่ติดอันดับต้น ๆ ดึงข้อมูลของตัวเองแล้วคำนวณอันดับจริงแยกต่างหาก
    const profile = await getUserProfile(uid);
    if (!profile) return;

    const rank = await getUserRank(profile.xp || 0);
    me = {
      name: profile.displayName || profile.email || "ฉัน",
      xp: profile.xp || 0,
      streak: profile.streak || 0,
      rank,
    };
  }

  const headerStreak = document.getElementById("lb-header-streak");
  const headerXp = document.getElementById("lb-header-xp");
  const avatarLetter = document.getElementById("lb-avatar-letter");
  const myRank = document.getElementById("lb-my-rank");
  const myXp = document.getElementById("lb-my-xp");

  if (headerStreak) headerStreak.textContent = `🔥 ${me.streak} วัน`;
  if (headerXp) headerXp.textContent = `⚡ ${me.xp} XP`;
  if (avatarLetter)
    avatarLetter.textContent = (me.name || "?").trim().charAt(0).toUpperCase();
  if (myRank) myRank.textContent = me.rank ? `${me.rank}` : "-";
  if (myXp) myXp.textContent = `${me.xp} XP`;
}

function renderLeaderboard(usersList) {
  const listBox = document.getElementById("leaderboard-list-box");
  if (!listBox) return;

  listBox.innerHTML = ""; // ล้างหน้าจอเก่าออกก่อน

  if (usersList.length === 0) {
    listBox.innerHTML = `<p class="lb-empty-state">ยังไม่มีผู้เล่นในกระดานผู้นำ</p>`;
    return;
  }

  usersList.forEach((user) => {
    const row = document.createElement("div");
    // ถ้าเป็นแถวของตัวเอง (isCurrentUser = true) จะแถมคลาสพิเศษเพื่อทำไฮไลต์พื้นหลังสีม่วงตามรูป
    row.className = `lb-row ${user.isCurrentUser ? "row-highlight" : ""}`;

    // จัดการเรื่องไอคอนเหรียญรางวัลอันดับ 1, 2, 3
    let rankBadge = `<span class="lb-number">${user.rank}</span>`;
    if (user.rank === 1) rankBadge = `<span class="lb-medal-icon">🥇</span>`;
    else if (user.rank === 2)
      rankBadge = `<span class="lb-medal-icon">🥈</span>`;
    else if (user.rank === 3)
      rankBadge = `<span class="lb-medal-icon">🥉</span>`;

    row.innerHTML = `
            <div class="lb-row-left">
                ${rankBadge}
                <div class="lb-user-details">
                    <span class="lb-name">${user.name}${user.isCurrentUser ? " (คุณ)" : ""}</span>
                    <span class="lb-streak">🔥 ${user.streak} วัน</span>
                </div>
            </div>
            <div class="lb-row-right">
                <span class="lb-xp-pill">${user.xp} XP</span>
            </div>
        `;

    listBox.appendChild(row);
  });
}

document.addEventListener("DOMContentLoaded", initLeaderboardScreen);
window.initLeaderboardScreen = initLeaderboardScreen;
