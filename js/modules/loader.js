// ================================================
// PAGE LOADER CONTROLLER — The Veg Studio
// Buttery-Smooth Dissolve & Guaranteed Dismissal
// ================================================
(function () {
  var loader = document.getElementById("page-loader");
  var dismissed = false;

  function exitLoader() {
    if (dismissed) return;
    dismissed = true;
    if (!loader) return;

    // Trigger buttery-smooth CSS transition
    loader.classList.add("fade-out");

    // Remove from layout after smooth 800ms transition completes
    setTimeout(function () {
      loader.classList.add("gone");
    }, 850);
  }

  // Smooth auto-exit right as logo reveal and progress bar complete (~1.9s)
  setTimeout(exitLoader, 1900);

  // Early dismiss on tap / click
  ["touchstart", "pointerdown", "click"].forEach(function (evt) {
    window.addEventListener(evt, function () {
      setTimeout(exitLoader, 60);
    }, { passive: true, once: true });
  });
})();
