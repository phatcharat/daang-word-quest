import { auth } from "../../scripts/firebase.js";
import {
    onAuthStateChanged,
    sendEmailVerification,
    signOut,
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

function waitForAuthUser() {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

async function init() {
    const user = await waitForAuthUser();

    if (!user) {
        // ไม่ได้ล็อกอินอยู่เลย ย้อนกลับไปหน้า login
        window.location.href = "../login/login.html";
        return;
    }

    // ถ้ายืนยันไปแล้วจริงๆ (เช่นกดลิงก์แล้วย้อนกลับมาเปิดหน้านี้ทีหลัง) ให้เข้า home ได้เลย
    await user.reload();
    if (user.emailVerified) {
        window.location.href = "../home/home.html";
        return;
    }

    document.getElementById("ve-email").textContent = user.email;

    document.getElementById("ve-check-btn").onclick = async () => {
        await user.reload();
        if (user.emailVerified) {
            window.location.href = "../home/home.html";
        } else {
            alert("ยังไม่พบการยืนยัน กรุณาตรวจสอบอีเมล (รวมถึง Junk/Spam) แล้วลองใหม่อีกครั้ง");
        }
    };

    document.getElementById("ve-resend-btn").onclick = async () => {
        try {
            await sendEmailVerification(user);
            alert("ส่งอีเมลยืนยันอีกครั้งแล้ว กรุณาตรวจสอบกล่องจดหมาย");
        } catch (err) {
            alert("ส่งอีเมลไม่สำเร็จ: " + err.message);
        }
    };

    document.getElementById("ve-logout-btn").onclick = async () => {
        await signOut(auth);
        window.location.href = "../login/login.html";
    };
}

document.addEventListener("DOMContentLoaded", init);