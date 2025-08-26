window.addEventListener('load', async () => {
  try {
    const script = document.querySelector('script[src$="version.js"]');
    const url = script ? new URL('version.json', script.src) : new URL('version.json', window.location.href);
    const res = await fetch(url, { cache: 'no-cache' });
    const pkg = await res.json();
    const el = document.getElementById('version-display');
    if (el) {
      el.textContent = `Version: ${pkg.version}`;
    }
  } catch (err) {
    console.error('Failed to load version', err);
  }
});
