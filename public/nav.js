// Mobile navigation toggle
window.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('menu-toggle');
  const links = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('hidden');
    });
  }
});
