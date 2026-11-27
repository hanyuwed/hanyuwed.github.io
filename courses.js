const languageKey = 'hanyu-language-v1';
const buttons = Array.from(document.querySelectorAll('[data-language]'));
const translations = Array.from(document.querySelectorAll('[data-uz]'), node => ({
  node,
  ru: node.textContent,
  uz: node.dataset.uz
}));

function renderLanguage(language) {
  document.documentElement.lang = language;
  document.title = language === 'uz' ? 'hanyuwed — Tilni tanla' : 'hanyuwed — Выбери язык';
  document.getElementById('interface-language').setAttribute(
    'aria-label', language === 'uz' ? 'Interfeys tili' : 'Язык интерфейса'
  );
  for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.language === language));
  for (const {node, ru, uz} of translations) node.textContent = language === 'uz' ? uz : ru;
}

function savedLanguage() {
  try { return localStorage.getItem(languageKey) === 'uz' ? 'uz' : 'ru'; }
  catch { return 'ru'; }
}

for (const button of buttons) {
  button.addEventListener('click', () => {
    const language = button.dataset.language;
    try { localStorage.setItem(languageKey, language); } catch {}
    renderLanguage(language);
  });
}
window.addEventListener('pageshow', () => renderLanguage(savedLanguage()));
window.addEventListener('storage', event => {
  if (event.key === languageKey || event.key === null) renderLanguage(savedLanguage());
});
renderLanguage(savedLanguage());
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
