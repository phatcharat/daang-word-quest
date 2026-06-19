function initHomeScreen() {
    
    // ไฮไลต์ปุ่ม Home
    document.querySelectorAll(".nav-item")
        .forEach(btn => btn.classList.remove("active"));

    document
        .querySelector("[onclick=\"navigateTo('home')\"]")
        ?.classList.add("active");

    const quizBtn = document.getElementById("quiz-btn");
    const spellBtn = document.getElementById("spell-btn");
    const listenBtn = document.getElementById("listen-btn");

    quizBtn?.addEventListener("click", () => {
        navigateTo("game");
    });

    spellBtn?.addEventListener("click", () => {
        navigateTo("spelling");
    });

}

window.initHomeScreen = initHomeScreen;