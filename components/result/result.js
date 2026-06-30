function initResultScreen(){

    const session =
        window.appState.session;

    document.getElementById(
        "correctCount"
    ).textContent =
        session.correct;

    document.getElementById(
        "wrongCount"
    ).textContent =
        session.wrong;

    document.getElementById(
        "xpEarned"
    ).textContent =
        session.xpEarned;

}

window.initResultScreen =
    initResultScreen;