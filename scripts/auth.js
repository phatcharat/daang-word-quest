import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

/* LOGIN */

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

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

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

        try{

            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user =
                userCredential.user;

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

            alert("สมัครสมาชิกสำเร็จ");

            window.location.href =
                "login.html";

        }catch(error){

            alert(error.message);

        }

    });

}