// No-flash theme script: reads localStorage and applies .dark before React
// hydration. Exported as a raw string so callers can inject it via
// dangerouslySetInnerHTML — the DOM needs this to run before paint.
//
// Why not next/script beforeInteractive? In Next 16.2.4 + React 19 it only
// emits `<link rel="preload">` without the actual `<script>` tag, so the FOUC
// guard never runs. Inline <script> in <head> is the working SSR path; React
// 19 dev-mode logs a noisy warning about scripts in components, but the HTML
// executes correctly and production consoles stay clean.
export const themeScript = `(() => {
  try {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = stored ? stored === 'dark' : prefersDark;
    if (dark) document.documentElement.classList.add('dark');
  } catch {}
})();`;
