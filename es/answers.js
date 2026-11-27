'use strict';

function spanishSpelling(value, language = 'es', punctuation = false) {
  let text = String(value).normalize('NFC').toLowerCase().trim()
    .replace(/\s+/g, ' ').replace(/\s+([,.!?])/g, '$1');
  if (!punctuation) text = text.replace(/^[¿¡]+\s*/, '').replace(/[.!?]+$/, '');
  if (language === 'ru') text = text.replaceAll('ё', 'е');
  if (language === 'uz') text = text.replace(/[’‘ʻʼ`´]/g, "'");
  return text;
}

const withoutAcute = text => text.normalize('NFD').replace(/\u0301/g, '').normalize('NFC');
const spanishSearch = text => withoutAcute(spanishSpelling(text, 'uz')).replaceAll('ё', 'е');
const withoutArticle = text => text.replace(/^(?:el|la|los|las|un|una|unos|unas) /, '');

function checkSpanish(value, item) {
  const actual = spanishSpelling(value, item.language, item.punctuation);
  const expected = item.accepted.map(option => spanishSpelling(option, item.language, item.punctuation));
  if (!actual) return 'empty';
  if (expected.includes(actual)) return 'correct';
  if (item.language !== 'es') return 'wrong';
  if (expected.some(option => withoutAcute(option) === withoutAcute(actual))) return 'accent';
  if (expected.some(option => option.includes('ñ') && option.replaceAll('ñ','n') === actual)) return 'enye';
  if (item.article && expected.some(option => withoutArticle(option) === withoutArticle(actual))) return 'article';
  if (item.punctuation && item.accepted.some(option => spanishSpelling(option) === spanishSpelling(value))) return 'punctuation';
  return 'wrong';
}
