function initSpellingScreen() {

    document
        .querySelectorAll(".category-card")
        .forEach(card => {

            card.addEventListener("click", () => {

                const category = card.dataset.category;

                resetSession();

                window.appState.session.category = category;
                window.appState.session.lessonId = 1;

                navigateTo("game");
            });

        });

}

window.initSpellingScreen = initSpellingScreen;