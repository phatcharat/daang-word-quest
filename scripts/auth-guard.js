import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {

    if(!user){

        window.location.href =
            "../login/login.html";
        return;

    }

    // ดึงสถานะ emailVerified ล่าสุด กันค่าเก่าค้างจาก session ก่อนหน้า
    await user.reload();

    if (!user.emailVerified) {

        window.location.href =
            "../verify-email/verify-email.html";

    }

});