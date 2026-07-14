// ===== components/profile/profile.js =====

import { auth } from "../../scripts/firebase.js";
import {
  onAuthStateChanged,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { db } from "../../scripts/firebase.js";
import { getUserProfile } from "../../scripts/services/user-service.js";
import { getUserRank } from "../../scripts/services/leaderboard-service.js";
import { computeDisplayStreak } from "../../scripts/services/streak-service.js";
import {
  AVATAR_LIST,
  DEFAULT_AVATAR_ID,
  getAvatarById,
  saveAvatarSelection,
} from "../../scripts/services/avatar-service.js";

window.appState = window.appState || {};

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

  window.appState.user = window.appState.user || {
    name: "กำลังโหลด...",
    email: "...",
    avatarId: DEFAULT_AVATAR_ID,
    streak: 0,
    rank: 0,
  };

  toggleProfileMode("view");
  renderUpdatedProfileData();

  const user = await waitForAuthUser();
  if (!user) return; // auth-guard จะจัดการ redirect ไป login เอง

  window.appState.user.name = user.displayName || user.email || "ผู้ใช้";
  window.appState.user.email = user.email || "";
  renderUpdatedProfileData();

  loadFirestoreStats(user.uid);
}

async function loadFirestoreStats(uid) {
  try {
    const profile = await getUserProfile(uid);
    if (!profile) return;

    window.appState.user.avatarId = profile.avatarId || DEFAULT_AVATAR_ID;

    window.appState.user.streak = computeDisplayStreak(
      profile.streak ?? 0,
      profile.lastPlayedDate ?? null,
    );

    window.appState.user.rank = await getUserRank(profile.xp || 0, profile.createdAt || null);

    renderUpdatedProfileData();
  } catch (err) {
    console.error("โหลดสถิติ (avatar/streak/rank) จาก Firestore ไม่สำเร็จ:", err);
  }
}

function renderAvatarCircle(containerEl, avatarId) {
  if (!containerEl) return;
  const avatarData = getAvatarById(avatarId);
  containerEl.innerHTML = `
    <div class="avatar-emoji-circle" style="background:${avatarData.color};">
      ${avatarData.emoji}
    </div>
  `;
}

function renderAvatarPicker(selectedId) {
  const grid = document.getElementById("avatar-picker-grid");
  if (!grid) return;

  grid.innerHTML = AVATAR_LIST.map(
    (a) => `
      <button
        type="button"
        class="avatar-picker-item${a.id === selectedId ? " selected" : ""}"
        style="background:${a.color};"
        data-avatar-id="${a.id}"
      >${a.emoji}</button>
    `,
  ).join("");

  grid.querySelectorAll(".avatar-picker-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectAvatar(btn.dataset.avatarId);
    });
  });
}

function selectAvatar(avatarId) {
  window.appState.user.avatarId = avatarId;
  renderUpdatedProfileData();
}

function renderUpdatedProfileData() {
  const userData = window.appState.user;
  if (!userData) return;

  const nameView = document.getElementById("prof-name-view");
  const emailView = document.getElementById("prof-email-view");
  const streakVal = document.getElementById("prof-streak-val");
  const rankVal = document.getElementById("prof-rank-val");

  renderAvatarCircle(document.getElementById("prof-avatar-view"), userData.avatarId);
  renderAvatarCircle(document.getElementById("prof-avatar-edit"), userData.avatarId);
  renderAvatarPicker(userData.avatarId);

  if (nameView) nameView.innerText = userData.name;
  if (emailView) emailView.innerText = userData.email;
  if (streakVal) streakVal.innerText = userData.streak;
  if (rankVal) rankVal.innerText = userData.rank;

  const inputName = document.getElementById("prof-input-name");
  if (inputName) inputName.value = userData.name;
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

async function saveProfileChangesData() {
  const inputNameVal = document.getElementById("prof-input-name")?.value;

  if (!inputNameVal || inputNameVal.trim() === "") {
    alert("กรุณากรอกชื่อผู้ใช้งาน");
    return;
  }

  const newName = inputNameVal.trim();
  const uid = auth.currentUser?.uid;

  try {
    // 1. อัปเดต Firebase Auth profile ให้ displayName เปลี่ยนจริง
    await updateProfile(auth.currentUser, { displayName: newName });

    // 2. Sync ชื่อไป Firestore ด้วย เพื่อให้ Leaderboard แสดงชื่อใหม่ถูกต้อง
    await setDoc(doc(db, "users", uid), { displayName: newName }, { merge: true });

    // 3. Sync avatar ที่เลือกไว้ (ถ้ามีการเปลี่ยน)
    await saveAvatarSelection(uid, window.appState.user.avatarId);
  } catch (err) {
    console.error("บันทึกโปรไฟล์ไม่สำเร็จ:", err);
    alert("บันทึกโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    return;
  }

  window.appState.user.name = newName;
  renderUpdatedProfileData();
  toggleProfileMode("view");
  console.log("💾 บันทึกชื่อ + Avatar ลง Firebase Auth และ Firestore เรียบร้อยแล้ว!");
}

async function handleLogoutAction() {
  const conf = confirm("คุณต้องการออกจากระบบใช่หรือไม่?");
  if (!conf) return;

  try {
    await signOut(auth);
    window.location.href = "../login/login.html";
  } catch (err) {
    console.error("ออกจากระบบไม่สำเร็จ:", err);
    alert("เกิดข้อผิดพลาด ไม่สามารถออกจากระบบได้ กรุณาลองใหม่อีกครั้ง");
  }
}

window.initProfileScreen = initProfileScreen;
window.toggleProfileMode = toggleProfileMode;
window.saveProfileChangesData = saveProfileChangesData;
window.handleLogoutAction = handleLogoutAction;

document.addEventListener("DOMContentLoaded", initProfileScreen);