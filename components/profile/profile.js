// ===== components/profile/profile.js =====

function initProfileScreen() {
    console.log("👤 ระบบหน้า Profile สไตล์แอปเกมแนวโมเดิร์น พร้อมทำงานแล้ว!");
    
    // 1. ตรวจเช็กคลังข้อมูลสำรองเพื่อป้องกันแอปขัดข้องระหว่างประมวลผล
    if (!window.appState.user) {
        window.appState.user = {
            name: "Pennapa Bunkaew",
            email: "pboonkaew959@gmail.com",
            streak: 10,
            xp: 9000,
            rank: 1,
            avatar: "https://i.imgur.com/vR9Vv91.png" // บังคับตั้งค่าดีฟอลต์เป็นลิ้งก์จำลองตัวละครหลักตามสเปก
        };
    }

    // 2. เคลียร์ระดับหน้าจอให้เปิดโหมดพรีวิวหลักเป็นค่าเริ่มต้นเสมอ
    toggleProfileMode('view');

    // 3. จัดการดึงประวัติข้อมูลล่าสุดไปถมลงในกล่อง HTML แต่ละจุด
    renderUpdatedProfileData();
}

// ฟังก์ชันดึงประวัติล่าสุดจากตัวแปรสากลมาแสดงผลบนหน้าจอ
function renderUpdatedProfileData() {
    const userData = window.appState.user;
    if (!userData) return;

    // --- ส่วนแสดงผลโหมดหน้าหลัก (View Mode DOM) ---
    const imgView = document.getElementById("prof-avatar-view");
    const nameView = document.getElementById("prof-name-view");
    const emailView = document.getElementById("prof-email-view");
    const streakVal = document.getElementById("prof-streak-val");
    const rankVal = document.getElementById("prof-rank-val");
    const xpVal = document.getElementById("prof-xp-val");
    const xpFill = document.getElementById("prof-xp-progress-fill");

    if (imgView) imgView.src = userData.avatar;
    if (nameView) nameView.innerText = userData.name;
    if (emailView) emailView.innerText = userData.email;
    if (streakVal) streakVal.innerText = userData.streak;
    if (rankVal) rankVal.innerText = userData.rank;
    if (xpVal) xpVal.innerText = userData.xp.toLocaleString();

    // คำนวณหลอดความคืบหน้าของ XP (เทียบมาตรฐานฐาน 10000 XP ตามต้นฉบับรูปถ่าย)
    if (xpFill) {
        const percent = Math.min((userData.xp / 10000) * 100, 100);
        xpFill.style.width = `${percent}%`;
    }

    // --- ส่วนเตรียมข้อมูลสำหรับโหมดหน้าแก้ไข (Edit Mode DOM Input) ---
    const imgEdit = document.getElementById("prof-avatar-edit");
    const inputName = document.getElementById("prof-input-name");
    const inputEmail = document.getElementById("prof-input-email");

    if (imgEdit) imgEdit.src = userData.avatar;
    if (inputName) inputName.value = userData.name;
    if (inputEmail) inputEmail.value = userData.email;
}

// ฟังก์ชันสลับการมองเห็นระหว่างหน้าหลักและหน้าแก้ไขข้อมูลส่วนตัว
function toggleProfileMode(targetMode) {
    const mainViewBlock = document.getElementById("profile-main-view");
    const editViewBlock = document.getElementById("profile-edit-view");

    if (targetMode === 'edit') {
        if (mainViewBlock) mainViewBlock.classList.add("hidden");
        if (editViewBlock) editViewBlock.classList.remove("hidden");
    } else {
        if (editViewBlock) editViewBlock.classList.add("hidden");
        if (mainViewBlock) mainViewBlock.classList.remove("hidden");
    }
}

// ฟังก์ชันดึงค่าจากช่องฟอร์มเพื่อบันทึกข้อมูลกลับลงสู่ระบบฐานข้อมูลกลาง
function saveProfileChangesData() {
    const inputNameVal = document.getElementById("prof-input-name")?.value;
    const inputEmailVal = document.getElementById("prof-input-email")?.value;

    if (!inputNameVal || inputNameVal.trim() === "") {
        alert("กรุณากรอกชื่อผู้ใช้งานด้วยครับ");
        return;
    }

    // เซ็ตข้อมูลชุดใหม่บันทึกทับลงในหน่วยความจำแอพสเตต
    window.appState.user.name = inputNameVal.trim();
    window.appState.user.email = inputEmailVal.trim();

    // อัปเดตการแสดงผลหน้า UI และสั่งเด้งสลับหน้าจอกลับสู่สเตจหลัก
    renderUpdatedProfileData();
    toggleProfileMode('view');
    console.log("💾 บันทึกการเปลี่ยนแปลงโปรไฟล์เรียบร้อยแล้ว!");
}

// ระบบจัดการควบคุมการออกจากระบบคลังข้อมูลเกม
function handleLogoutAction() {
    const conf = confirm("คุณต้องการออกจากระบบใช่หรือไม่?");
    if (conf) {
        alert("ออกจากระบบเสร็จสิ้น");
        navigateTo('home');
    }
}

// ผูกฟังก์ชันเข้าข่ายระบบ Routing ส่วนกลางของหน้าต่างแอปพลิเคชัน
window.initProfileScreen = initProfileScreen;
window.toggleProfileMode = toggleProfileMode;
window.saveProfileChangesData = saveProfileChangesData;
window.handleLogoutAction = handleLogoutAction;