// ==========================================
// THE VEG STUDIO - APPLICATION INITIALIZER
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
  // Render home categories and featured content
  renderHome();

  // Close customization modal on overlay click
  const itemModal = document.getElementById("itemModal");
  if (itemModal) {
    itemModal.addEventListener("click", function (e) {
      if (e.target === this) closeModal();
    });
  }
});
