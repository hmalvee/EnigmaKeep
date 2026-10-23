// Apply the saved theme before first paint. External file so a strict CSP
// (script-src 'self') allows it.
(function () {
  try {
    var t = localStorage.getItem('theme') || 'dark';
    var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {}
})();
