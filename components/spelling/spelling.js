function initSpellingScreen() {
  document.querySelectorAll(".category-card").forEach(card => {
    card.addEventListener("click", () => {
      const category = card.dataset.category;
      sessionStorage.setItem("daang_category", category);
      window.location.href = "../lesson/lesson.html";
    });
  });
}

window.initSpellingScreen = initSpellingScreen;
document.addEventListener("DOMContentLoaded", initSpellingScreen);