import {shuffled} from './data.js';

const toneMarks = ['', '\u0304', '\u0301', '\u030c', '\u0300', ''];

function spellPinyin(value) {
  return value.normalize('NFKC').toLowerCase().replace(/u:|v/g, 'ü');
}

function withoutSeparators(value) {
  return value.replace(/[\s'‘’ʼ`·.…-]+/gu, '').normalize('NFC');
}

function applyNumberedTone(match, syllable, digit) {
  const vowel = /[aeê]/u.exec(syllable) ?? /ou/u.exec(syllable) ?? /[iouü](?!.*[iouü])/u.exec(syllable);
  if (!vowel) return match;

  const markPosition = vowel.index + 1;
  return syllable.slice(0, markPosition) + toneMarks[Number(digit)] + syllable.slice(markPosition);
}

export function matchesPinyin(answer, expected) {
  const normalized = withoutSeparators(
    spellPinyin(answer).replace(/([a-züê]+)([0-5])/gu, applyNumberedTone)
  );
  const options = expected === 'yígòng' ? [expected, 'yīgòng'] : expected.split('/');
  return normalized !== '' && options.some(option => (
    normalized === withoutSeparators(spellPinyin(option))
  ));
}

export function createPinyinPractice(root, t) {
  const storageKey = 'hanyu-pinyin-v1';
  const input = root.querySelector('#pinyinAnswer');
  const check = root.querySelector('#pinyinCheck');
  const show = root.querySelector('#pinyinShow');
  const next = root.querySelector('#pinyinNext');
  const restart = root.querySelector('#pinyinRestart');
  const feedback = root.querySelector('#pinyinFeedback');
  const unit = root.querySelector('#pinyinUnitLabel');
  const position = root.querySelector('#pinyinPosition');
  const prompt = root.querySelector('#pinyinPrompt');
  const activity = root.querySelector('#pinyinActivity');
  const empty = root.querySelector('#pinyinEmpty');
  const complete = root.querySelector('#pinyinComplete');
  const filters = [...root.querySelectorAll('[data-pinyin-kind]')];

  let kind = 'all';
  let selection;
  let source = [];
  let queue = [];
  let index = 0;
  let result = '';

  function save() {
    HanyuCourse.writeStored(storageKey, {selection, kind, ids:queue.map(word => word.id), index, result, draft:input.value});
  }

  function restore() {
    const stored = HanyuCourse.readStored(storageKey);
    if (!stored || stored.selection !== selection || !Array.isArray(stored.ids) ||
        !['all','characters','words'].includes(stored.kind) || !Number.isInteger(stored.index) ||
        stored.index < 0 || stored.index > stored.ids.length) return false;
    const wordsById = new Map(source.map(word => [word.id, word]));
    if (!stored.ids.every(id => wordsById.has(id))) return false;
    kind = stored.kind;
    queue = stored.ids.map(id => wordsById.get(id));
    index = stored.index;
    result = ['empty','correct','incorrect','revealed'].includes(stored.result) ? stored.result : '';
    input.value = typeof stored.draft === 'string' ? stored.draft : '';
    for (const filter of filters) filter.setAttribute('aria-pressed', String(filter.dataset.pinyinKind === kind));
    renderQuestion();
    return true;
  }

  function renderQuestion() {
    const word = queue[index];
    const answered = result === 'correct' || result === 'revealed';
    activity.hidden = !word;
    empty.hidden = queue.length > 0;
    complete.hidden = queue.length === 0 || Boolean(word);
    if (!word) return;

    position.textContent = `${index + 1} / ${queue.length}`;
    prompt.textContent = word.hanzi;
    input.readOnly = answered;
    input.setAttribute('aria-invalid', String(result === 'incorrect'));
    check.hidden = answered;
    show.hidden = answered;
    next.hidden = !answered;
    feedback.dataset.result = result;
    const messages = {
      empty: t('Сначала введи пиньинь.', 'Avval pinyinni yoz.'),
      correct: t(`Верно! ${word.pinyin}`, `To‘g‘ri! ${word.pinyin}`),
      incorrect: t('Попробуй ещё раз. Проверь написание и тоны.', 'Qayta urinib ko‘r. Yozilishi va ohanglarini tekshir.'),
      revealed: t(`Ответ — ${word.pinyin}`, `Javob — ${word.pinyin}`),
    };
    feedback.textContent = messages[result] ?? '';
  }

  function resetAnswer() {
    result = '';
    input.value = '';
    renderQuestion();
    save();
  }

  function start() {
    const filtered = source.filter(word => {
      if (kind === 'all') return true;
      const hanziCount = word.hanzi.match(/\p{Script=Han}/gu)?.length ?? 0;
      return kind === 'characters' ? hanziCount === 1 : hanziCount > 1;
    });
    const unique = new Map(filtered.map(word => [`${word.hanzi}\0${word.pinyin}`, word]));
    queue = shuffled([...unique.values()]);
    index = 0;
    resetAnswer();
  }

  for (const button of filters) {
    button.addEventListener('click', () => {
      if (kind === button.dataset.pinyinKind) return;
      kind = button.dataset.pinyinKind;
      for (const filter of filters) filter.setAttribute('aria-pressed', String(filter === button));
      start();
    });
  }

  input.addEventListener('input', () => {
    result = '';
    renderQuestion();
    save();
  });
  function checkAnswer() {
    const word = queue[index];
    if (check.hidden || !word) return;

    const answer = input.value.trim();
    if (!answer) result = 'empty';
    else result = matchesPinyin(answer, word.pinyin) ? 'correct' : 'incorrect';

    renderQuestion();
    save();
    if (result === 'correct') next.focus();
    else input.focus();
  }
  check.addEventListener('click', checkAnswer);
  input.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.isComposing) return;
    event.preventDefault();
    checkAnswer();
  });
  show.addEventListener('click', () => {
    result = 'revealed';
    renderQuestion();
    save();
    next.focus();
  });
  next.addEventListener('click', () => {
    index += 1;
    resetAnswer();
    if (queue[index]) input.focus();
    else restart.focus();
  });
  restart.addEventListener('click', () => {
    start();
    input.focus();
  });

  return function render(words, unitTitle) {
    unit.textContent = unitTitle;
    const newSelection = words.map(word => word.id).join(',');
    if (selection !== newSelection) {
      selection = newSelection;
      source = words.filter(word => word.pinyin.trim());
      if (!restore()) start();
    } else {
      renderQuestion();
    }
  };
}
