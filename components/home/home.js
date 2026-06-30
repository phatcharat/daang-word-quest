function navigateTo(page) {

    switch (page) {

        case "home":
            window.location.href = "home.html";
            break;

        case "game":
            window.location.href =
                "../game/game.html";
            break;

        case "spelling":
            window.location.href =
                "../spelling/spelling.html";
            break;

        case "leaderboard":
            window.location.href =
                "../leaderboard/leaderboard.html";
            break;

        case "profile":
            alert("Coming Soon");
            break;
    }
}

window.navigateTo = navigateTo;

function initHomeScreen() {

    // ไฮไลต์ปุ่ม Home
    document.querySelectorAll(".nav-item")
        .forEach(btn => btn.classList.remove("active"));

    document
        .querySelector("[onclick=\"navigateTo('home')\"]")
        ?.classList.add("active");

    const quizBtn = document.getElementById("quiz-btn");
    const spellBtn = document.getElementById("spell-btn");

    quizBtn?.addEventListener("click", () => {
        navigateTo("game");
    });

    spellBtn?.addEventListener("click", () => {
        navigateTo("spelling");
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initHomeScreen();
});