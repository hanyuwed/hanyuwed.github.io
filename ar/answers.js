const studyMarks = /[\u064B-\u0652]/gu;
const displayControls = /[\u061C\u200C-\u200F\u202A-\u202E\u2066-\u2069]/gu;
const endPunctuation = /[.!?؟،؛]+$/u;

export function cleanArabic(text) {
  return text.normalize('NFC').replace(displayControls, '').replaceAll('ـ', '')
    .trim().replace(/\s+/gu, ' ').replace(endPunctuation, '').trim();
}

export function bareArabic(text) {
  return cleanArabic(text).replace(studyMarks, '');
}

export function cleanTranslation(text) {
  return text.normalize('NFC').toLowerCase().trim().replace(/[’‘ʻʼ`]/gu, "'")
    .replaceAll('ё','е').replace(/\s+/gu, ' ').replace(endPunctuation, '').trim();
}

export function searchArabic(text) {
  return bareArabic(text).replace(/[أإآٱ]/gu, 'ا').replace(/ى/gu, 'ي');
}

export function graphemes(text) {
  return cleanArabic(text).match(/[^\p{M}]\p{M}*|\p{M}+/gu) ?? [];
}

export function compareArabic(answer, candidate, checkMarks = true) {
  const typed = cleanArabic(answer);
  const expected = cleanArabic(candidate);
  const plainTyped = bareArabic(typed);
  const plainExpected = bareArabic(expected);
  if (plainTyped !== plainExpected) {
    if (plainTyped.endsWith('ه') && plainExpected.endsWith('ة') &&
        plainTyped.slice(0, -1) === plainExpected.slice(0, -1)) return 'ta';
    return 'letters';
  }
  if (!checkMarks) return 'correct';
  const target = graphemes(expected);
  for (const [index, grapheme] of graphemes(typed).entries()) {
    const marks = grapheme.match(studyMarks) ?? [];
    const model = target[index] ?? '';
    for (const mark of marks) {
      const isEnding = index === target.length - 1 && /^[\u064B-\u0650]$/u.test(mark);
      const modelHasVowel = /[\u064B-\u0650]/u.test(model);
      if (!model.includes(mark) && !(isEnding && !modelHasVowel)) return 'marks';
    }
  }
  return 'correct';
}

export function approvedAnswer(answer, candidates, arabic, checkMarks = true) {
  const results = candidates.map(candidate => arabic ? compareArabic(answer, candidate, checkMarks) :
    cleanTranslation(answer) === cleanTranslation(candidate) ? 'correct' : 'letters');
  return ['correct', 'ta', 'marks', 'letters'].find(result => results.includes(result)) ?? 'letters';
}
