function navigateTo(page) {
    switch (page) {
        case "home":
            window.location.href = "../home/home.html";
            break;
        case "game":
            window.location.href = "../game/game.html";
            break;
        case "spelling":
            window.location.href = "../spelling/spelling.html";
            break;
        case "leaderboard":
            window.location.href = "../leaderboard/leaderboard.html";
            break;
        case "profile":
            window.location.href = "../profile/profile.html";
            break;
        case "quizLesson":
            window.location.href = "../quiz-lesson/quiz-lesson.html";
            break;
    }
}
window.navigateTo = navigateTo;