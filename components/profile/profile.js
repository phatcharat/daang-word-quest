// ===== components/profile/profile.js =====

import { auth } from "../../scripts/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getUserProfile } from "../../scripts/services/user-service.js";

window.appState = window.appState || {};

const DEFAULT_AVATAR = "../../assets/images/mycattt.jpg";

function waitForAuthUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

async function initProfileScreen() {
  console.log("👤 ระบบหน้า Profile พร้อมทำงานแล้ว!");

  // Skeleton กันจอว่างระหว่างรอ auth
  window.appState.user = window.appState.user || {
    name: "กำลังโหลด...",
    email: "...",
    avatar: DEFAULT_AVATAR,
    streak: 0,
    rank: 0,
  };

  toggleProfileMode("view");
  renderUpdatedProfileData();

  const user = await waitForAuthUser();
  if (!user) return; // auth-guard จะจัดการ redirect ไป login เอง

  // 🚀 จุดสำคัญ: ชื่อ/รูป/อีเมล มาจาก auth.currentUser โดยตรง
  // ไม่ต้องรอ Firestore round-trip เลย ทำให้ขึ้นแทบจะทันทีที่ auth พร้อม
  window.appState.user.name = user.displayName || user.email || "ผู้ใช้";
  window.appState.user.email = user.email || "";
  window.appState.user.avatar = user.photoURL || DEFAULT_AVATAR;
  renderUpdatedProfileData();

  // ส่วน streak/rank ยังต้องพึ่ง Firestore แต่ไม่บล็อกการแสดงชื่อ/อีเมลด้านบนแล้ว
  // (ทำงานเบื้องหลัง อัปเดตหน้าจออีกทีเมื่อโหลดเสร็จ)
  loadFirestoreStats(user.uid);
}

async function loadFirestoreStats(uid) {
  try {
    const profile = await getUserProfile(uid);
    if (!profile) return;

    window.appState.user.streak = profile.streak ?? 0;
    // ยังไม่มีระบบคำนวณ rank จริงในหน้านี้ (ต้องใช้ getUserRank แบบหน้า leaderboard ถ้าต้องการ)
    renderUpdatedProfileData();
  } catch (err) {
    console.error("โหลดสถิติ (streak/rank) จาก Firestore ไม่สำเร็จ:", err);
  }
}

function renderUpdatedProfileData() {
  const userData = window.appState.user;
  if (!userData) return;

  const imgView = document.getElementById("prof-avatar-view");
  const nameView = document.getElementById("prof-name-view");
  const emailView = document.getElementById("prof-email-view");
  const streakVal = document.getElementById("prof-streak-val");
  const rankVal = document.getElementById("prof-rank-val");

  if (imgView) imgView.src = userData.avatar;
  if (nameView) nameView.innerText = userData.name;
  if (emailView) emailView.innerText = userData.email;
  if (streakVal) streakVal.innerText = userData.streak;
  if (rankVal) rankVal.innerText = userData.rank;

  const imgEdit = document.getElementById("prof-avatar-edit");
  const inputName = document.getElementById("prof-input-name");
  const inputEmail = document.getElementById("prof-input-email");

  if (imgEdit) imgEdit.src = userData.avatar;
  if (inputName) inputName.value = userData.name;
  if (inputEmail) inputEmail.value = userData.email;
}

function toggleProfileMode(targetMode) {
  const mainViewBlock = document.getElementById("profile-main-view");
  const editViewBlock = document.getElementById("profile-edit-view");

  if (targetMode === "edit") {
    mainViewBlock?.classList.add("hidden");
    editViewBlock?.classList.remove("hidden");
  } else {
    editViewBlock?.classList.add("hidden");
    mainViewBlock?.classList.remove("hidden");
  }
}

function saveProfileChangesData() {
  const inputNameVal = document.getElementById("prof-input-name")?.value;
  const inputEmailVal = document.getElementById("prof-input-email")?.value;

  if (!inputNameVal || inputNameVal.trim() === "") {
    alert("กรุณากรอกชื่อผู้ใช้งาน");
    return;
  }

  window.appState.user.name = inputNameVal.trim();
  window.appState.user.email = inputEmailVal.trim();

  renderUpdatedProfileData();
  toggleProfileMode("view");
  console.log("💾 บันทึกการเปลี่ยนแปลงโปรไฟล์เรียบร้อยแล้ว! (ยังไม่เขียนกลับ Firestore/Auth)");
}

function handleLogoutAction() {
  const conf = confirm("คุณต้องการออกจากระบบใช่หรือไม่?");
  if (conf) {
    alert("ออกจากระบบเสร็จสิ้น");
    navigateTo("home");
  }
}

window.initProfileScreen = initProfileScreen;
window.toggleProfileMode = toggleProfileMode;
window.saveProfileChangesData = saveProfileChangesData;
window.handleLogoutAction = handleLogoutAction;

document.addEventListener("DOMContentLoaded", initProfileScreen);