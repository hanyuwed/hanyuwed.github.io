const digitWords = {
  ru: ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять'],
  uz: ['nol', 'bir', 'ikki', 'uch', 'to‘rt', 'besh', 'olti', 'yetti', 'sakkiz', 'to‘qqiz', 'o‘n']
};
const sounds = {학교:'학꾜', 읽다:'익따', 읽어:'일거', '책을 읽다':'채글 익따'};
const polite = {공부하다:'공부해요', '밥을 먹다':'밥을 먹어요', 춥다:'추워요', 덥다:'더워요'};
const placeMeanings = {
  극장: {ru:'театр, кинотеатр', uz:'teatr, kinoteatr'},
  영화관: {ru:'кинотеатр', uz:'kinoteatr'}
};

export const pairs = {
  native: 'sof koreyscha',
  sino: 'xitoycha kelib chiqishli'
};

function spelling(value) {
  return value.normalize('NFC').trim().replace(/\s+/gu, ' ');
}
function looseSpacing(value) {
  return spelling(value).replaceAll(' ', '');
}
function translation(value) {
  return spelling(value).toLowerCase()
    .replace(/[‘’ʻʼ‛`´]/gu, "'").replace(/ё/gu, 'е').replace(/[.!?]+$/u, '')
    .replace(/\s*[-‐‑]\s*/gu, '-').trim();
}
export function forSearch(value) {
  return translation(value).replace(/[\s'(),.·–—\-]/gu, '');
}
function bareMeaning(value) {
  return value.replace(/\s*\([^)]*\)/gu, '').trim();
}
function translationOptions(word, lang) {
  const full = word[lang];
  const bare = bareMeaning(full);
  const options = [full, bare, ...bare.split(/[,;/]+/u)];
  const system = numberSystem(word);
  if (system) {
    const digits = digitWords[lang];
    const index = digits.indexOf(bare);
    if (index >= 0) options.push(String(index));
    if (bare === '0') options.push(digits[0]);
  }
  if (/^\d[\d ]* (вон|von)$/u.test(bare)) {
    options.push(bare.replace(/ (вон|von)$/u, '').replaceAll(' ', ''));
  }
  return options;
}
function normalizedTranslation(value) {
  return translation(value).replace(/(?<=\d) (?=\d)/gu, '');
}

export function numberSystem(word) {
  return Object.keys(pairs).find(system => word.uz.endsWith(` (${pairs[system]})`));
}
function compareLoose(value, options) {
  return options.some(option => looseSpacing(option) === looseSpacing(value));
}
function lexicalForms(word, lang) {
  if (!Object.hasOwn(placeMeanings, word.hangul)) return word.forms;
  const prompt = word[lang];
  // The specific “cinema” prompt admits either studied word.
  return Object.entries(placeMeanings)
    .filter(([, values]) => values[lang].split(', ').includes(prompt))
    .map(([form]) => form).concat(word.forms);
}

export function spellingTask(word, lang, type) {
  const reverse = type === 'translation';
  const meaning = type === 'meaning';
  const dictated = type === 'dictation';
  let prompt = word[lang];
  let accepted = lexicalForms(word, lang);
  if (reverse) {
    prompt = word.forms.join(' · ');
    accepted = translationOptions(word, lang);
  }
  if (dictated) {
    prompt = '';
    accepted = [word.spoken];
  }
  if (!reverse && !dictated && word.hangul === '극장') {
    prompt = lang === 'ru' ? 'театр' : 'teatr';
  }
  return {
    type, word, prompt, accepted, meaning, reverse,
    audio: dictated ? word.spoken : ''
  };
}

export function numberTasks(words, lang, choice, corpus = words) {
  const tasks = [];
  for (const word of words) {
    const system = numberSystem(word);
    if (system && (choice === 'all' || choice === system)) {
      tasks.push({
        word, type:system, prompt:bareMeaning(word[lang]), accepted:word.forms,
        otherSystem:corpus.filter(other => numberSystem(other) && numberSystem(other) !== system &&
          bareMeaning(other.uz) === bareMeaning(word.uz)).flatMap(other => other.forms)
      });
    }
    if (word.unit === 6 && / 원$/u.test(word.hangul) && ['all','money'].includes(choice)) {
      tasks.push({word, type:'money', prompt:word[lang], accepted:word.forms});
    }
    if (word.unit === 11) {
      for (const [index, type] of ['digits','letters'].entries()) {
        if (choice === 'all' || choice === type) {
          tasks.push({word, type, prompt:word[lang], accepted:[word.forms[index]], otherFormat:[word.forms[1 - index]]});
        }
      }
    }
  }
  return tasks;
}

const contexts = [
  [3, 'particle', '책□ 읽다', '을', '를', '책 оканчивается на согласную.', '책 undosh bilan tugaydi.'],
  [3, 'particle', '커피□ 마시다', '를', '을', '커피 оканчивается на гласную.', '커피 unli bilan tugaydi.'],
  [3, 'particle', '학교□ 가요', '에', '에서', 'Здесь школа — пункт назначения.', 'Bu gapda 학교 boradigan joy.'],
  [3, 'particle', '학교□ 공부해요', '에서', '에', 'Здесь действие происходит в школе.', 'Bu gapda ish-harakat maktabda sodir bo‘ladi.'],
  [4, 'particle', '책이 책상 위□ 있어요', '에', '에서', 'Здесь речь о положении предмета.', 'Bu gap narsa qayerdaligini bildiradi.'],
  [8, 'verb', '피아노를 □', '치다', '하다', 'Для игры на пианино здесь подходит 치다.', 'Pianino chalish uchun 치다 ishlatiladi.'],
  [8, 'verb', '스키를 □', '타다', '하다', 'Кататься на лыжах — 스키를 타다.', 'Chang‘i uchish — 스키를 타다.'],
  [8, 'verb', '축구를 □', '하다', '치다', 'Играть в футбол — 축구를 하다.', 'Futbol o‘ynash — 축구를 하다.']
];
export function contextTasks(selected) {
  return contexts.filter(([unit]) => selected.has(unit)).map(([unit,type,prompt,form,wrong,ru,uz]) => ({
    word:{unit}, type, prompt, accepted:[form], contextual:true, hint:{ru,uz}, wrong
  }));
}

export function evaluate(task, value) {
  const answer = spelling(value);
  if (!answer) return 'empty';
  if (task.reverse) {
    const key = normalizedTranslation(answer);
    if (task.accepted.some(form => normalizedTranslation(form) === key)) return 'correct';
    if (task.accepted.some(form => forSearch(form) === forSearch(answer))) return 'translation-orthography';
    return 'wrong';
  }
  if (task.accepted.some(form => spelling(form) === answer)) return 'correct';
  if (compareLoose(answer, task.accepted)) return task.meaning ? 'meaning-spacing' : 'spacing';
  if (task.otherFormat && compareLoose(answer, task.otherFormat)) return 'format';
  if (task.otherSystem && compareLoose(answer, task.otherSystem)) return 'system';
  if (task.type === 'letters' && ['육월','십월'].includes(answer) &&
      ((answer === '육월' && task.accepted[0] === '유월') || (answer === '십월' && task.accepted[0] === '시월'))) return 'month';
  if (answer === sounds[task.word.hangul]) return 'sound';
  if (answer === polite[task.word.hangul]) return 'dictionary-form';
  if (task.wrong === answer) return 'context';
  if (/^[a-z\s-]+$/iu.test(answer)) return 'keyboard';
  if (/^[\u1100-\u11ff\u3131-\u318e\s]+$/u.test(answer)) return 'unfinished';
  return 'wrong';
}
