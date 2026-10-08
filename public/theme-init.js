// Apply the appearance before the first paint. Never read training data here.
(function () {
  var theme = 'system';
  try { theme = localStorage.getItem('home-rower-theme') || 'system'; }
  catch (error) { window.rowerThemeStorageUnavailable = true; }
  var dark = theme === 'dark' || (theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]').content = dark ? '#000000' : '#F2F2F7';
})();
