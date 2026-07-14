import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    sendEmailVerification,
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
    PASSWORD_RULES,
    getFailedRules,
    isPasswordValid,
} from "./utils/password-validator.js";

const loginForm =
    document.getElementById("loginForm");

if(loginForm){

    loginForm.addEventListener(
        "submit",
        async(event)=>{

        event.preventDefault();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        try{

            const cred = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            await cred.user.reload();

            if (!cred.user.emailVerified) {
                window.location.href = "../verify-email/verify-email.html";
                return;
            }

            window.location.href =
                "../home/home.html";

        }catch(error){

            alert(error.message);

        }

    });

}

/* SIGNUP */

const signupForm =
    document.getElementById("signupForm");

if(signupForm){

    const passwordInput = document.getElementById("password");
    const rulesListEl = document.getElementById("password-rules");

    // แสดงรายการเกณฑ์ทั้งหมดตอนโหลดหน้า (ยังไม่ติ๊กผ่านอันไหนเลย)
    if (rulesListEl) {
        rulesListEl.innerHTML = PASSWORD_RULES
            .map((rule) => `<li data-rule-id="${rule.id}">${rule.label}</li>`)
            .join("");
    }

    // อัปเดตสถานะ ✓/○ แบบเรียลไทม์ทุกครั้งที่พิมพ์
    if (passwordInput && rulesListEl) {
        passwordInput.addEventListener("input", () => {
            const failedIds = getFailedRules(passwordInput.value).map((r) => r.id);
            rulesListEl.querySelectorAll("li").forEach((li) => {
                const ruleId = li.dataset.ruleId;
                li.classList.toggle("valid", !failedIds.includes(ruleId));
            });
        });
    }

    signupForm.addEventListener(
        "submit",
        async(event)=>{

        event.preventDefault();

        const displayName =
            document.getElementById("displayName").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if(password !== confirmPassword){

            alert("รหัสผ่านไม่ตรงกัน");
            return;

        }

        // เช็คเกณฑ์รหัสผ่านก่อนยิงไป Firebase
        if (!isPasswordValid(password)) {
            alert(
                "รหัสผ่านไม่ตรงตามเกณฑ์ที่กำหนด:\n" +
                getFailedRules(password).map((r) => "• " + r.label).join("\n")
            );
            return;
        }

        try{

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user =
                userCredential.user;

            await updateProfile(user, {
                displayName: displayName
            });

            await setDoc(
                doc(db,"users",user.uid),
                {
                    displayName,
                    email,

                    xp:0,
                    streak:0,
                    badge:[],

                    createdAt:
                        serverTimestamp()
                }
            );

            await sendEmailVerification(user);

            alert("สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันตัวตนก่อนเข้าใช้งาน");

            window.location.href =
                "../verify-email/verify-email.html";

        }catch(error){

            alert(error.message);

        }

    });

}