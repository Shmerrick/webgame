window.addEventListener('load', async () => {
  try {
    const res = await fetch('version.json', { cache: 'no-cache' });
    const pkg = await res.json();
    const el = document.getElementById('version-display');
    if (el) {
      el.textContent = `Version: ${pkg.version}`;
    }
  } catch (err) {
    console.error('Failed to load version', err);
  }
});
