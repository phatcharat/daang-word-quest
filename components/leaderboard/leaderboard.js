import { auth } from "../../scripts/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getTopUsers,
  getUserRank,
} from "../../scripts/services/leaderboard-service.js";
import { getUserProfile } from "../../scripts/services/user-service.js";
import { computeDisplayStreak } from "../../scripts/services/streak-service.js";

const TOP_N = 20;

// รอให้ Firebase Auth เช็คสถานะล็อกอินเสร็จก่อน (กันปัญหา auth.currentUser เป็น null ตอนหน้าเพิ่งโหลด)
function waitForAuthUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

async function initLeaderboardScreen() {
  console.log("🏆 หน้า Leaderboard ทำงานแล้ว");

  // ไฮไลต์ปุ่มเมนูให้ถูกต้อง
  document
    .querySelectorAll(".nav-item")
    .forEach((btn) => btn.classList.remove("active"));
  document
  .querySelector('[onclick="navigateTo(\'leaderboard\')"]')
  ?.classList.add("active");

  const listBox = document.getElementById("leaderboard-list-box");

  // ✅ จุดที่แก้: รอ auth ให้พร้อมก่อน แทนที่จะอ่าน auth.currentUser ทันที
  const user = await waitForAuthUser();
  const uid = user?.uid || null;

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

  // แปลง streak ดิบให้เป็น streak ที่ "แสดงผลจริง" (รีเซตเป็น 0 ถ้าขาดช่วงไปแล้ว)
  const usersWithFlag = topUsers.map((u) => ({
    ...u,
    streak: computeDisplayStreak(u.streak, u.lastPlayedDate),
    isCurrentUser: !!uid && u.uid === uid,
  }));

  renderLeaderboard(usersWithFlag);
  await renderMyStats(uid, usersWithFlag);
}

async function renderMyStats(uid, topUsers) {
  if (!uid) return;

  let me = topUsers.find((u) => u.isCurrentUser);
  let rank;

  if (!me) {
    // ผู้ใช้ไม่ติด Top 20 ดึงข้อมูลของตัวเองแล้วคำนวณอันดับจริงแยกต่างหาก
    const profile = await getUserProfile(uid);
    if (!profile) return;

    rank = await getUserRank(profile.xp || 0, profile.createdAt || null);
    me = {
      name: profile.displayName || profile.email || "ฉัน",
      xp: profile.xp || 0,
      streak: computeDisplayStreak(profile.streak || 0, profile.lastPlayedDate || null),
    };
  } else {
    rank = me.rank;
  }

  const myRank = document.getElementById("lb-my-rank");
  const myXp = document.getElementById("lb-my-xp");

  if (myRank) myRank.textContent = `${rank}`;
  if (myXp) myXp.textContent = `${me.xp} XP`;

  const stickyBar = document.getElementById("lb-sticky-user");
  if (stickyBar) {
    if (rank > TOP_N) {
      document.getElementById("lb-sticky-rank").textContent = `#${rank}`;
      document.getElementById("lb-sticky-name").textContent = `${me.name} (คุณ)`;
      document.getElementById("lb-sticky-xp").textContent = `${me.xp} XP`;
      stickyBar.classList.remove("hidden");
    } else {
      stickyBar.classList.add("hidden");
    }
  }
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
    row.className = `lb-row ${user.isCurrentUser ? "row-highlight" : ""}`;

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