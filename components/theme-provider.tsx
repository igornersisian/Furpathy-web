// No-flash theme script: reads localStorage and applies .dark before React hydration.
// Rendered as a raw string inside <head> to avoid React 19 warning about <script>
// elements appearing inside component trees.
export const themeScript = `(() => {
  try {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = stored ? stored === 'dark' : prefersDark;
    if (dark) document.documentElement.classList.add('dark');
  } catch (_) {}
})();`;
