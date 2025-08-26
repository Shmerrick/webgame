document.addEventListener('DOMContentLoaded', async () => {
  const placeholder = document.getElementById('nav-container');
  if (!placeholder) return;
  try {
    const res = await fetch('nav.html');
    const html = await res.text();
    placeholder.innerHTML = html;
    const nav = placeholder.querySelector('nav');
    if (placeholder.dataset.sticky === 'true' && nav) {
      nav.classList.add('sticky', 'top-0', 'z-50');
    }
    const current = window.location.pathname.split('/').pop();
    placeholder.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (href === current) {
        a.classList.remove('text-slate-300', 'hover:text-emerald-400');
        a.classList.add('bg-emerald-600', 'text-white', 'rounded');
      }
    });
  } catch (err) {
    console.error('Failed to load navigation', err);
  }
});
