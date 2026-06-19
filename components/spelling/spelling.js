function initSpellingScreen() {

    document
        .querySelectorAll(".category-card")
        .forEach(card => {

            card.addEventListener("click", () => {

                const category = card.dataset.category;

                window.appState.category = category;
                window.appState.gameMode = "spelling";

                navigateTo("game");
            });

        });

}

window.initSpellingScreen = initSpellingScreen;