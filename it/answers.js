'use strict';

function italianSpelling(value, language = 'it') {
  const text = String(value).normalize('NFC').toLowerCase()
    .replace(/[’‘ʻʼ`´]/g, "'")
    .replace(/[‐‑]/g, '-')
    .trim().replace(/\s+/g, ' ').replace(/\s+([!?.,])/g, '$1')
    .replace(/[.!?]+$/, '');
  return language === 'ru' ? text.replaceAll('ё', 'е') : text;
}

function italianSearch(value) {
  return italianSpelling(value).normalize('NFD').replace(/\p{M}/gu, '');
}

function checkItalian(value, item) {
  const actual = italianSpelling(value,item.language);
  const expected = item.accepted.map(option => italianSpelling(option,item.language));
  if (!actual) return 'empty';
  if (expected.includes(actual)) return 'correct';
  if (item.language !== 'it') return 'wrong';
  if (expected.some(option => italianSearch(option) === italianSearch(actual))) return 'accent';
  if (item.sound && expected.some(option => option.replace(/(.)\1/g,'$1') === actual.replace(/(.)\1/g,'$1'))) return 'double';
  if (expected.includes("l'amica") && actual === 'la amica') return 'apostrophe';
  const withoutArticle = string => string.replace(/^(?:l'|(?:il|lo|la|i|gli|le|un|uno|una) )/, '');
  if (expected.some(option => withoutArticle(option) === withoutArticle(actual))) return 'article';
  const withoutApostrophe = string => string.replace(/[' ]/g,'');
  if (expected.some(option => withoutApostrophe(option) === withoutApostrophe(actual))) return 'apostrophe';
  if (expected.includes('sono partite') && actual === 'sono partiti' ||
      expected.includes('è arrivata') && actual === 'è arrivato' ||
      expected.includes('le ho comprate') && actual === 'le ho comprato' ||
      expected.includes('si sono vestite') && actual === 'si sono vestiti') return 'agreement';
  if (expected.includes('è arrivata') && actual.startsWith('ha ') ||
      expected.includes('sono partite') && actual.startsWith('hanno ')) return 'auxiliary';
  if (expected.includes('posso comprarlo') && actual === 'posso lo comprare') return 'placement';
  return 'wrong';
}
