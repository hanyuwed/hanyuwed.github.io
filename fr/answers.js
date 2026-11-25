function normalizeSpelling(value) {
  return value.normalize('NFC')
    .toLowerCase()
    .replace(/[’‘ʻʼ`´]/g, "'")
    .replace(/[\u2010\u2011]/g, '-')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s+([!?.])/g, '$1');
}

function searchSpelling(value) {
  return normalizeSpelling(value).normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replaceAll('œ','oe')
    .replaceAll('æ','ae');
}

function answerSpelling(value, item) {
  const normalized = normalizeSpelling(value);
  return item.fr ? normalized.replace(/[.!]$/, '') : normalized.replace(/[.!?]$/, '').replaceAll('ё','е');
}

function evaluateAnswer(value, item) {
  const answer = answerSpelling(value, item);
  const accepted = item.accepted.map(option => answerSpelling(option, item));
  if (!answer) return 'empty';
  if (accepted.includes(answer)) return 'correct';
  if (item.question && !answer.endsWith('?') && accepted.includes(answer + '?')) {
    return 'question-mark';
  }
  if (item.fr && accepted.some(option => searchSpelling(option) === searchSpelling(answer))) {
    return 'accent';
  }
  if (item.fr && item.article && accepted.some(option => option.replace(/^(?:le |la |les |l'|un |une |des )/, '') === answer.replace(/^(?:le |la |les |l'|un |une |des )/, ''))) {
    return 'article';
  }
  if (item.fr && item.elision) {
    const expanded = option => option.replace(/\b(j|n|qu|m|t|s|d)'/g,'$1e ');
    if (accepted.some(option=>expanded(option)===answer || option.replace(/'/g,' ')===answer ||
      option.replace(/'/g,'')===answer)) return 'elision';
  }
  if (item.grammarMode==='full' && !item.negative) {
    if (answer.startsWith(item.aux + ' ')) return 'participle';
    if (answer.endsWith(' ' + item.participle)) return 'auxiliary';
  }
  if (item.negative && !/(^|\s)(ne |n')/.test(answer)) return 'negation';
  return 'incorrect';
}
