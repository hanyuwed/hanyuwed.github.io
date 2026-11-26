import { entries, units } from './data.js';
import { approvedAnswer, bareArabic, cleanTranslation, graphemes, searchArabic } from './answers.js';

const $ = id => document.getElementById(id);
const byId = new Map(entries.map(entry => [entry.id, entry]));
const solo = document.documentElement.hasAttribute('data-standalone');
const prefix = solo ? 'hanyuwed:ar:preview:' : 'hanyuwed:ar:manhaj-a1:';
const languageKey = solo ? prefix + 'language' : 'hanyu-language-v1';
const settingsKey = prefix + 'settings:v1';
const markKey = id => prefix + 'marks:v1:' + id;
const unitIds = units.map((_, index) => index + 1);
let memoryOnly = false;

function read(key) {
  try { return localStorage.getItem(key); }
  catch { memoryOnly = true; return null; }
}
function save(key, value) {
  try { localStorage.setItem(key, value); }
  catch { memoryOnly = true; }
}
function readSettings() {
  try { return JSON.parse(read(settingsKey)) ?? {}; }
  catch { return {}; }
}

let lang = read(languageKey) === 'uz' ? 'uz' : 'ru';
const t = (ru, uz) => lang === 'uz' ? uz : ru;
const tabs = {
  units: ['Уроки','Darslar'], alphabet: ['Чтение','O‘qish'], cards: ['Карточки','Kartochkalar'],
  practice: ['Практика','Mashqlar'], dictionary: ['Словарь','Lug‘at']
};
const modes = {
  choice: ['Выбрать перевод','Tarjimani tanlash'], meaning: ['Написать перевод','Tarjima yozish'],
  writing: ['Написать по-арабски','Arabcha yozish'], tokens: ['Собрать выражение','Iborani tuzish'],
  marks: ['Поставить огласовку','Harakat qo‘yish'], letters: ['Собрать слово из букв','So‘zni harflardan tuzish'],
  dictation: ['Диктант','Diktant']
};
const types = { all:['Все','Hammasi'], word:['Слова','So‘zlar'], phrase:['Выражения','Iboralar'] };
const saved = readSettings();
const selected = new Set((Array.isArray(saved.units) ? saved.units : [1]).filter(id => unitIds.includes(id)));
let kind = Object.hasOwn(types, saved.kind) ? saved.kind : 'all';
let decorated = saved.decorated !== false;
let reverse = saved.reverse === true;
let mode = Object.hasOwn(modes, saved.mode) ? saved.mode : 'choice';
let size = [10, 20, 0].includes(saved.size) ? saved.size : 10;
const marks = new Map();
for (const entry of entries) {
  const state = read(markKey(entry.id));
  if (state === 'known' || state === 'hard') marks.set(entry.id, state);
}
let view = 'units';
let deck = null;
const practices = new Map();
let filterUnit = 0;
let filterKind = 'all';
let filterHard = false;
let search = '';
let voices = [];
let alphabet = { answer:'', index:0, feedback:'', played:false };
let audioNote = '';

const markNames = {
  'َ':['фатха','fatha'], 'ِ':['касра','kasra'], 'ُ':['дамма','damma'],
  'ْ':['сукун','sukun'], 'ّ':['шадда','shadda'], 'ً':['фатхатан','fathatan'],
  'ٍ':['касратан','kasratan'], 'ٌ':['дамматан','dammatan']
};
const alphabetQuestions = [
  { text:['Найди букву «та», две точки сверху.','«Ta» harfini top. Tepasida ikkita nuqta bor.'], options:['ب','ت','ث'], answer:'ت' },
  { text:['Найди букву «ха» без точки.','Nuqtasiz «ha» harfini top.'], options:['ج','ح','خ'], answer:'ح' },
  { text:['Какая буква прерывает соединение в слове بَاب?','بَاب so‘zida qaysi harf ulanishni to‘xtatadi?'], options:['ب','ا'], answer:'ا' },
  { text:['Выбери долгий слог «баа».','Cho‘ziq «baa» bo‘g‘inini tanla.'], options:['بَ','بَا','بُ'], answer:'بَا' },
  { text:['Послушай и выбери услышанную букву.','Tinglab, eshitgan harfingni tanla.'], audio:'صَاد', options:['س','ص'], answer:'ص' },
  { text:['Какое слово означает «город»?','Qaysi so‘z «shahar» degani?'], options:['مَدْرَسَة','مَدِينَة','جَامِعَة'], answer:'مَدِينَة' }
];

function storeSettings() {
  save(settingsKey, JSON.stringify({ units:[...selected], kind, decorated, reverse, mode, size }));
}
function setMark(id, state) {
  marks.set(id, state);
  save(markKey(id), state);
}

function escape(text) {
  return String(text).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
}
function arabic(text, classes = 'small') {
  return '<bdi class="ar ' + classes + '" lang="ar" dir="rtl">' + escape(text) + '</bdi>';
}
const translation = entry => entry[lang][0];
const shown = entry => decorated ? entry.ar : entry.ar.replace(/[\u064B-\u0652]/gu, '');
const count = (index, total) => t(index + ' из ' + total, index + ' / ' + total);
const activePool = () => entries.filter(entry => entry.units.some(id => selected.has(id)) &&
  (kind === 'all' || entry.kind === kind));
const hardPool = () => activePool().filter(entry => marks.get(entry.id) === 'hard');
const practice = () => practices.get(lang);

function shuffle(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const other = Math.floor(Math.random() * (i + 1));
    [result[i], result[other]] = [result[other], result[i]];
  }
  return result;
}
function button(label, action, options = {}) {
  const { value = '', primary = false, disabled = false, pressed, raw = false } = options;
  return '<button type="button" class="' + (primary ? 'primary' : 'btn') + '" data-action="' + action +
    '" data-value="' + escape(value) + '"' + (disabled ? ' disabled' : '') +
    (pressed === undefined ? '' : ' aria-pressed="' + pressed + '"') + '>' + (raw ? label : escape(label)) + '</button>';
}
function select(id, label, options, current) {
  return '<label>' + escape(label) + '<select id="' + id + '">' + options.map(([key, text]) =>
    '<option value="' + escape(key) + '"' + (String(key) === String(current) ? ' selected' : '') +
    '>' + escape(text) + '</option>').join('') + '</select></label>';
}
const controlOptions = values => Object.entries(values).map(([id, pair]) => [id, t(...pair)]);
const poolTypes = () => select('kind', t('Материал','Material'), controlOptions(types), kind);
const progress = (index, total) => '<div class="meta">' + count(index, total) +
  '</div><progress class="progress" value="' + index + '" max="' + total + '" aria-label="' + t('Прогресс','Jarayon') + '"></progress>';
function empty(note, action, label) {
  return '<div class="surface empty"><p>' + escape(note) + '</p>' + button(label, action, {primary:true}) + '</div>';
}

function renderUnits() {
  const tiles = units.map(([ar, ru, uz], index) => {
    const id = index + 1;
    const chosen = selected.has(id);
    const cards = entries.filter(entry => entry.units.includes(id)).length;
    return '<button type="button" class="tile" data-action="unit" data-value="' + id + '" aria-pressed="' +
      chosen + '"><span class="tile-symbol">' + id + '</span><span><span class="tile-title">' + escape(t(ru, uz)) +
      '</span>' + arabic(ar) + '<small class="meta">' + t('Карточек: ', 'Kartochkalar: ') + cards +
      '</small></span><span class="tick" aria-hidden="true">' + (chosen ? '✓' : '') + '</span></button>';
  }).join('');
  return '<p class="section-note">' + t('Если арабское письмо пока незнакомо, начни с букв. Уроки можно выбрать в любом порядке.',
    'Arab yozuvi bilan hali tanish bo‘lmasang, harflardan boshla. Darslarni istalgan tartibda tanlash mumkin.') +
    '</p><div class="wrap below">' + button(t('Начать с букв','Harflardan boshlash'), 'open-alphabet') +
    button(t('Перейти к урокам','Darslarga o‘tish'), 'focus-units') + '</div><div class="bar">' +
    button(t('Выбрать все','Hammasini tanlash'),'all-units') +
    button(t('Снять выбор','Tanlovni bekor qilish'),'clear-units') + '</div><div class="controls">' + poolTypes() +
    '</div><div class="tile-grid">' + tiles + '</div><div class="selection"><p class="meta" role="status">' +
    t('Карточек выбрано: ','Tanlangan kartochkalar: ') + activePool().length + '</p>' +
    button(t('Начать карточки','Kartochkalarni boshlash'),'start-cards',{primary:true,disabled:!activePool().length}) + '</div>';
}

function renderAlphabet() {
  const question = alphabetQuestions[alphabet.index];
  const lines = [
    [t('Буквы и точки','Harflar va nuqtalar'),t('В арабском 28 основных букв. Читай справа налево. Сравни число и положение точек в группах.','Arab alifbosida 28 ta asosiy harf bor. O‘ngdan chapga o‘qi. Nuqtalar soni va joyini solishtir.'),'ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي'],
    [t('Как соединяются буквы','Harflar qanday ulanadi'),t('Буквы ا د ذ ر ز و не соединяются со следующей буквой слева. В слове «дверь» вторая ب стоит отдельно.','ا د ذ ر ز و harflari keyingi chapdagi harfga ulanmaydi. «Eshik» so‘zida ikkinchi ب alohida yoziladi.'),'بَاب · بَ / ـبَـ / ـبَ'],
    [t('Краткие и долгие гласные','Qisqa va cho‘ziq unlilar'),t('Фатха, касра и дамма дают короткие звуки а, и, у. Сукун обозначает отсутствие гласного, шадда удваивает согласную, танвин добавляет звук н.','Fatha, kasra va damma qisqa a, i, u tovushlarini bildiradi. Sukun unli yo‘qligini, shadda undosh ikkilanishini, tanvin esa n tovushini bildiradi.'),'بَ بِ بُ · بَا بِي بُو · بْ بّ بً بٍ بٌ'],
    [t('Звуки и особые написания','Tovushlar va maxsus yozuvlar'),t('Сравни звучание похожих букв. В артикле ال буква ل остаётся на письме, даже когда сливается со следующим звуком.','O‘xshash harflarning talaffuzini solishtir. ال artiklidagi ل harfi keyingi tovushga qo‘shilsa ham yozuvda qoladi.'),'س ص · ت ط · ح ه · ع ء · ك ق · ة ه · ى ي · الشَّمْس وَالْقَمَر']
  ];
  const notes = lines.map(([title,note,samples]) => '<div class="surface lesson-box"><h2>' + escape(title) +
    '</h2><p>' + escape(note) + '</p><div dir="rtl">' + arabic(samples) + '</div></div>').join('');
  const choices = question.options.map(option => button(arabic(option),'letter-option',{
    raw:true,value:option,pressed:alphabet.answer === option,disabled:!!question.audio && !alphabet.played
  })).join('');
  const sound = question.audio ? (voices.length ? button(t('Прослушать','Tinglash'),'letter-audio') :
    '<p class="meta">' + t('Арабский голос недоступен. Перейди к следующему заданию.','Arabcha ovoz mavjud emas. Keyingi mashqqa o‘t.') + '</p>') : '';
  const prompt = question.text[lang === 'ru' ? 0 : 1];
  return '<div id="study-alphabet">' + notes + '</div><div class="surface practice"><h2>' +
    t('Проверь себя','O‘zingni tekshir') + '</h2>' + progress(alphabet.index + 1, alphabetQuestions.length) +
    '<p>' + escape(prompt) + '</p>' + sound + '<div class="wrap letters" dir="rtl">' + choices +
    '</div><p id="feedback" role="status">' + escape(alphabet.feedback) + '</p><div class="actions">' +
    button(t('Назад','Orqaga'),'alphabet-prev',{disabled:alphabet.index===0}) +
    button(alphabet.index === alphabetQuestions.length - 1 ? t('К урокам','Darslarga') : t('Вперёд','Oldinga'),'alphabet-next') + '</div></div>';
}

function startDeck(hard = false) {
  const pool = hard ? hardPool() : activePool();
  deck = { queue:shuffle(pool.map(entry => entry.id)), index:0, revealed:new Set(), hard };
}
function renderCards() {
  if (!deck) startDeck();
  const controls = '<div class="wrap below">' +
    button(t('С арабского','Arabchadan'),'card-to-translation',{pressed:!reverse}) +
    button(t('На арабский','Arabchaga'),'card-to-arabic',{pressed:reverse}) +
    button(t('Огласовки','Harakatlar'),'toggle-marks',{pressed:decorated}) + '</div>' +
    '<div class="wrap below">' +
    button(t('Все карточки','Barcha kartochkalar'),'all-cards',{pressed:!deck.hard}) +
    button(t('Трудные','Qiyinlar') + ' · ' + hardPool().length,'hard-cards',{pressed:deck.hard}) + '</div>';
  const entry = byId.get(deck.queue[deck.index]);
  if (!entry) {
    const note = !deck.queue.length ? (deck.hard ? t('В выбранных уроках пока нет трудных карточек.',
      'Tanlangan darslarda hozircha qiyin kartochkalar yo‘q.') : t('Выбери уроки, чтобы начать.','Boshlash uchun darslarni tanla.')) :
      t('Карточки закончились.','Kartochkalar yakunlandi.');
    return controls + '<div class="surface empty"><p>' + escape(note) + '</p><div class="wrap">' +
      button(t('Повторить трудные','Qiyinlarini takrorlash'),'hard-cards',{primary:hardPool().length > 0,disabled:!hardPool().length}) +
      button(t('Повторить все','Hammasini takrorlash'),'all-cards',{disabled:!activePool().length}) +
      button(t('Назад','Orqaga'),'prev-card',{disabled:deck.index===0}) + '</div></div>';
  }
  const revealed = deck.revealed.has(deck.index);
  const ar = arabic(shown(entry), 'main-text');
  const gloss = '<span class="meaning">' + escape(translation(entry)) + '</span>';
  return controls + progress(deck.index + 1, deck.queue.length) + '<div class="surface">' +
    '<button type="button" class="flash btn" data-action="flip" aria-expanded="' + revealed + '" aria-controls="card-detail">' +
    (reverse ? gloss : ar) + '<small class="meta">' + (revealed ? t('Скрыть ответ','Javobni yashirish') :
      t('Открыть ответ','Javobni ochish')) + '</small></button><div id="card-detail" class="card-detail"' +
    (revealed ? '' : ' hidden') + '>' + (reverse ? ar : gloss) + '<div class="wrap below">' +
    soundButton(entry) + '</div></div></div><div class="actions">' +
    button(t('Ещё учу','Hali o‘rganyapman'),'grade-hard',{pressed:marks.get(entry.id)==='hard'}) +
    button(t('Помню','Esimda'),'grade-known',{primary:true,pressed:marks.get(entry.id)==='known'}) +
    '</div><div class="actions card-nav">' +
    button(t('Назад','Orqaga'),'prev-card',{disabled:deck.index===0}) +
    button(t('Вперёд','Oldinga'),'next-card') + '</div>';
}

function selectMark(entry) {
  const letters = graphemes(entry.ar).filter(part => /\p{Script=Arabic}/u.test(part[0]));
  const pos = letters.findIndex(part => Object.keys(markNames).some(mark => part.includes(mark)));
  if (pos < 0) return null;
  const sign = Object.keys(markNames).find(mark => letters[pos].includes(mark));
  return { pos, sign, letter:letters[pos][0] };
}
function chipSet(words) {
  return shuffle(words.map((text, id) => ({text,id})));
}
function makeQuestion(entry, pool) {
  let options = [];
  if (mode === 'choice') {
    const accepted = new Set(entry[lang].map(cleanTranslation));
    const distractors = [];
    for (const alternative of shuffle(pool)) {
      const label = cleanTranslation(translation(alternative));
      if (accepted.has(label) || alternative[lang].some(x => accepted.has(cleanTranslation(x)))) continue;
      accepted.add(label);
      distractors.push(translation(alternative));
      if (distractors.length === 3) break;
    }
    options = shuffle([translation(entry), ...distractors]);
  }
  const parts = mode === 'tokens' ? chipSet(entry.ar.split(' ')) :
    mode === 'letters' ? chipSet([...bareArabic(entry.ar)]) : [];
  return { entry, options, parts, target: mode === 'marks' ? selectMark(entry) : null, chips:[],
    draft:'', result:null, heard:false };
}
function eligible(entry) {
  if (mode === 'tokens') return entry.ar.split(' ').length > 1 && entry.kind === 'phrase';
  if (mode === 'letters') return !bareArabic(entry.ar).includes(' ');
  if (mode === 'marks') return Boolean(selectMark(entry));
  return true;
}
function startPractice(repeat = false) {
  const prior = practice();
  const pool = repeat ? prior.queue.filter(q => q.result !== 'correct').map(q => q.entry) : activePool().filter(eligible);
  if (!pool.length || (mode === 'dictation' && !voices.length)) return false;
  const list = shuffle(pool).slice(0, size || pool.length);
  const choicePool = [...pool, ...entries.filter(entry => !pool.includes(entry))];
  practices.set(lang, { mode, index:0, queue:list.map(entry => makeQuestion(entry, choicePool)) });
  return true;
}

function renderPractice() {
  const options = '<div class="controls">' + select('mode',t('Упражнение','Mashq'),controlOptions(modes),mode) +
    select('size',t('Вопросов','Savollar'),[[10,'10'],[20,'20'],[0,t('Все','Hammasi')]],size) + '</div>';
  const session = practice();
  if (!session || session.mode !== mode) {
    const total = activePool().filter(eligible).length;
    const canStart = total > 0 && (mode !== 'dictation' || voices.length);
    const note = mode === 'dictation' && !voices.length ?
      t('На устройстве нет арабского голоса. Можно продолжить с чтением.','Qurilmada arabcha ovoz yo‘q. O‘qish mashqlarini davom ettirish mumkin.') :
      total ? t('Подходящих карточек: ','Mos kartochkalar: ') + total :
        t('Выбери уроки с подходящим материалом.','Mos materialli darslarni tanla.');
    return options + '<div class="surface empty"><p>' + escape(note) + '</p>' +
      button(t('Начать','Boshlash'),'start-practice',{primary:true,disabled:!canStart}) +
      (!total ? button(t('К урокам','Darslarga'),'open-units') : '') +
      (mode === 'dictation' && !voices.length ? button(t('К чтению','O‘qishga'),'open-alphabet') : '') + '</div>';
  }
  const current = session.queue[session.index];
  if (!current) {
    const results = session.queue.map(q => q.result);
    const correct = results.filter(result => result === 'correct').length;
    const skipped = results.filter(result => result === 'skip' || result === null).length;
    const tipped = results.filter(result => result === 'hint').length;
    const errors = results.length - correct - skipped - tipped;
    return options + '<div class="surface empty"><h2>' + t('Результат','Natija') + '</h2><p>' +
      t('Верно: ','To‘g‘ri: ') + count(correct, results.length) + ' · ' + t('Ошибки: ','Xato: ') + errors +
      ' · ' + t('С подсказкой: ','Yordam bilan: ') + tipped + ' · ' + t('Пропущено: ','O‘tkazilgan: ') + skipped +
      '</p><div class="wrap">' + button(t('Повторить ошибки и пропуски','Xato va o‘tkazilganlarni takrorlash'),'retry-practice',
        {primary:true,disabled:correct===results.length}) + button(t('Новая практика','Yangi mashq'),'start-practice') +
      button(t('Назад','Orqaga'),'prev-question') + '</div></div>';
  }
  const isArabic = !['meaning','choice'].includes(mode);
  const entry = current.entry;
  let prompt = isArabic ? escape(translation(entry)) : arabic(shown(entry),'main-text');
  if (mode === 'marks') {
    const plain = arabic(bareArabic(entry.ar), 'main-text');
    prompt = plain + '<div class="meta">' +
      t('Выбери знак для буквы №','Belgi qo‘yiladigan harf №') + (current.target.pos + 1) + ' · ' +
      arabic(current.target.letter) + ' · ' + t(...markNames[current.target.sign]) + '</div>';
  }
  if (['choice','meaning'].includes(mode) && !decorated &&
      entries.some(other => other.id !== entry.id && bareArabic(other.ar) === bareArabic(entry.ar) && other.ar !== entry.ar)) {
    prompt = arabic(entry.ar,'main-text');
  }
  if (mode === 'dictation') {
    prompt = t('Прослушай и запиши по-арабски','Tingla va arabcha yoz');
  }
  const correct = current.result === 'correct';
  const revealed = current.result !== null;
  const checked = current.result;
  const explanations = {
    correct:t('Верно.','To‘g‘ri.'),
    ta:t('В конце нужна ة. У тебя ه.','Oxirida ة kerak. Javobingda ه bor.'),
    marks:t('Проверь огласовку. Сравни её с образцом.','Harakatni tekshir. Namuna bilan solishtir.'),
    letters:t('Сравни свой ответ с образцом.','Javobingni namuna bilan solishtir.'),
    hint:t('Ответ показан.','Javob ko‘rsatildi.'),
    skip:t('Вопрос пропущен.','Savol o‘tkazildi.')
  };
  let input;
  if (mode === 'choice' || mode === 'marks') {
    const choices = mode === 'choice' ? current.options : Object.keys(markNames);
    input = '<div class="options">' + choices.map(value => button(mode === 'marks' ? arabic('ـ' + value) : value,
      'pick-option',{value,raw:mode === 'marks',disabled:revealed,pressed:current.draft===value})).join('') + '</div>';
  } else if (mode === 'tokens' || mode === 'letters') {
    function partButtons(parts, action) {
      return parts.map(part => button(arabic(part.text),'chip-' + action,{raw:true,value:part.id,disabled:revealed})).join('');
    }
    const ordered = current.chips.map(id => current.parts.find(part => part.id === id));
    const rest = current.parts.filter(part => !current.chips.includes(part.id));
    input = '<div class="meta">' + t('Твой ответ','Javobing') + '</div><div class="tokens token-answer" dir="rtl">' +
      partButtons(ordered,'remove') + '</div><div class="tokens" dir="rtl">' + partButtons(rest,'add') + '</div>';
  } else {
    input = '<label for="typed-answer">' + t('Твой ответ','Javobing') + '</label><input spellcheck="false" autocomplete="off" autocapitalize="off" id="typed-answer" class="answer ' +
      (isArabic ? 'ar" lang="ar" dir="rtl"' : '"') + ' value="' + escape(current.draft) + '"' + (revealed ? ' readonly' : '') + '>';
    if (isArabic && !revealed) input += '<div class="wrap letters below" dir="rtl" aria-label="' + t('Огласовки','Harakatlar') +
      '">' + Object.keys(markNames).map(value => button(arabic('ـ' + value),'insert',{raw:true,value})).join('') + '</div>';
  }
  const solution = isArabic ? arabic(entry.ar) : escape(translation(entry));
  return options + progress(session.index+1,session.queue.length) +
    '<div class="surface practice"><div class="prompt" id="question-prompt">' + prompt + '</div>' +
    (mode === 'dictation' ? soundButton(entry, true) : '') + input +
    '<p id="feedback" role="status" data-tone="' + (correct ? 'good' : 'bad') + '">' +
    (revealed ? explanations[checked] + ' ' + solution : '') + '</p><div class="wrap option-gap">' +
    (revealed ? '' : button(t('Проверить','Tekshirish'),'check',{primary:true,disabled:mode === 'dictation' && !current.heard}) +
      button(t('Показать ответ','Javobni ko‘rsatish'),'hint') + button(t('Пропустить','O‘tkazish'),'skip')) +
    button(t('Ещё учу','Hali o‘rganyapman'),'practice-hard',{pressed:marks.get(entry.id)==='hard'}) +
    '</div><div class="actions card-nav">' +
    button(t('Назад','Orqaga'),'prev-question',{disabled:session.index===0}) +
    button(t('Вперёд','Oldinga'),'next-question',{primary:revealed}) + '</div></div>';
}

function answerQuestion(question, result) {
  if (question.result !== null) return false;
  if (result !== 'check') {
    question.result = result;
    return true;
  }
  let answer = question.draft;
  if (mode === 'tokens' || mode === 'letters') {
    answer = question.chips.map(id => question.parts.find(part => part.id === id).text)
      .join(mode === 'tokens' ? ' ' : '');
  }
  if (!answer.trim() || (mode === 'dictation' && !question.heard)) return false;
  if (mode === 'marks') {
    question.result = answer === question.target.sign ? 'correct' : 'marks';
    return true;
  }
  const entry = question.entry;
  const arabicAnswer = ['writing','dictation','tokens','letters'].includes(mode);
  let candidates = arabicAnswer ? [entry.ar] : entry[lang];
  if (mode === 'writing') {
    const label = cleanTranslation(translation(entry));
    candidates = entries.filter(other => other[lang].some(gloss => cleanTranslation(gloss) === label))
      .map(other => other.ar);
  }
  question.result = approvedAnswer(answer, candidates, arabicAnswer, mode !== 'letters');
  return true;
}

function dictionaryResults() {
  const raw = cleanTranslation(search);
  const ar = searchArabic(search);
  return entries.filter(entry => {
    if (filterUnit && !entry.units.includes(filterUnit)) return false;
    if (filterKind !== 'all' && entry.kind !== filterKind) return false;
    if (filterHard && marks.get(entry.id) !== 'hard') return false;
    return !raw || (ar && searchArabic(entry.ar).includes(ar)) ||
      ['ru','uz'].some(language => entry[language].some(text => cleanTranslation(text).includes(raw)));
  });
}
function updateDictionary() {
  const results = dictionaryResults();
  $('result-count').textContent = t('Найдено: ','Topildi: ') + results.length;
  $('word-list').innerHTML = results.length ? results.map(entry => {
    const hard = marks.get(entry.id) === 'hard';
    const lesson = entry.units.map(id => countUnit(id)).join(' · ');
    return '<details class="dictionary-item" data-id="' + entry.id + '"><summary>' +
      arabic(entry.ar) + '<span>' + escape(translation(entry)) + '</span></summary><p class="meta">' +
      escape(lesson) + '</p><p>' + escape(entry[lang].join(' · ')) + '</p><div class="wrap below">' +
      button(hard ? t('Убрать из трудных','Qiyinlardan olib tashlash') : t('Ещё учу','Hali o‘rganyapman'),'dictionary-mark',
        {value:entry.id,pressed:hard}) + soundButton(entry) + '</div></details>';
  }).join('') : '<p>' + t('По этому запросу карточек нет.','Bu so‘rovga mos kartochka topilmadi.') + '</p>';
}
function countUnit(id) {
  return t('Урок ','Dars ') + id + ' · ' + t(units[id-1][1],units[id-1][2]);
}
function renderDictionary() {
  return '<label for="search">' + t('Поиск по арабскому, русскому и узбекскому','Arabcha, ruscha va o‘zbekcha qidiruv') +
    '</label><input id="search" type="search" dir="auto" autocomplete="off" value="' + escape(search) + '"><div class="controls below">' +
    select('filter-unit',t('Урок','Dars'),[[0,t('Все уроки','Barcha darslar')],...unitIds.map(id=>[id,countUnit(id)])],filterUnit) +
    select('filter-kind',t('Материал','Material'),controlOptions(types),filterKind) + '</div><div class="wrap">' +
    button(t('Только трудные','Faqat qiyinlar'),'filter-hard',{pressed:filterHard}) +
    '<span id="result-count" class="meta" role="status"></span></div><div id="word-list"></div>';
}

function refreshVoices() {
  voices = (window.speechSynthesis?.getVoices() ?? []).filter(voice => /^ar([-_]|$)/i.test(voice.lang));
}
function soundButton(entry, dictation = false) {
  if (!voices.length) return dictation ?
    '<p class="meta">' + t('Арабский голос сейчас недоступен.','Arabcha ovoz hozir mavjud emas.') + '</p>' : '';
  return button(t('Прослушать','Tinglash'),dictation ? 'play-question' : 'play',{value:entry.id});
}
function speak(text) {
  if (!voices.length) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voices[0];
  utterance.lang = voices[0].lang;
  utterance.rate = 0.84;
  utterance.onerror = event => {
    if (['canceled','interrupted'].includes(event.error)) return;
    audioNote = t('Не удалось воспроизвести арабский звук.','Arabcha ovozni ijro etib bo‘lmadi.');
    const q = practice()?.queue[practice()?.index];
    if (view === 'practice' && mode === 'dictation' && q?.entry.ar === text) {
      q.heard = false;
      render();
    } else showStatus();
  };
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

const views = {units:renderUnits,alphabet:renderAlphabet,cards:renderCards,practice:renderPractice,dictionary:renderDictionary};
function showStatus() {
  const status = $('storage-message');
  status.textContent = audioNote || (memoryOnly ? t('Отметки сохранятся только в этой вкладке.',
    'Belgilar faqat shu varaqda saqlanadi.') : '');
  status.hidden = !status.textContent;
}
function restoreFocus(previous) {
  if (!previous || previous === document.body) return;
  if (previous.id && $(previous.id)) return $(previous.id).focus({preventScroll:true});
  const { action, value } = previous.dataset ?? {};
  if (!action) return;
  const target = [...$('content').querySelectorAll('[data-action]')].find(node =>
    node.dataset.action === action && node.dataset.value === value && !node.disabled);
  target?.focus({preventScroll:true});
}
function render({ focus = false } = {}) {
  const previous = document.activeElement;
  document.documentElement.lang = lang;
  document.title = 'HanyuWed · ' + t('Арабский', 'Arab tili');
  $('subtitle').textContent = t('Арабский · Manhaj A1','Arab tili · Manhaj A1');
  $('home').textContent = t('Выбрать курс','Kurs tanlash');
  $('locale').setAttribute('aria-label',t('Язык интерфейса','Interfeys tili'));
  for (const item of $('locale').querySelectorAll('button')) item.setAttribute('aria-pressed',item.dataset.language===lang);
  $('navigation').setAttribute('aria-label',t('Разделы','Bo‘limlar'));
  for (const item of $('navigation').querySelectorAll('button')) {
    item.textContent = t(...tabs[item.dataset.value]);
    if (item.dataset.value === view) item.setAttribute('aria-current','page');
    else item.removeAttribute('aria-current');
  }
  $('heading').textContent = view === 'units' ? t('Выбери уроки','Darslarni tanla') : t(...tabs[view]);
  $('content').innerHTML = views[view]();
  if (view === 'dictionary') updateDictionary();
  showStatus();
  if (focus) $('heading').focus();
  else restoreFocus(previous);
}
function changeView(next) {
  window.speechSynthesis?.cancel();
  audioNote = '';
  view = next;
  if (location.hash !== '#' + next) history.pushState(null,'','#' + next);
  render({focus:true});
}
function applyLocation() {
  const key = location.hash.slice(1);
  const next = Object.hasOwn(tabs,key) ? key : 'units';
  if (next === view) return;
  window.speechSynthesis?.cancel();
  view = next;
  render({focus:true});
}
function changeLang(next) {
  if (!['ru','uz'].includes(next) || lang === next) return;
  lang = next;
  alphabet.feedback = '';
  audioNote = '';
  render();
}
function resetPools() {
  deck = null;
  practices.clear();
  storeSettings();
}

$('navigation').innerHTML = Object.keys(tabs).map(key => button('', 'view', {value:key})).join('');
if (solo) $('home').href = $('brand').href = 'https://hanyuwed.github.io/';
document.addEventListener('click', event => {
  const locale = event.target.closest('button[data-language]');
  if (locale) {
    save(languageKey,locale.dataset.language);
    return changeLang(locale.dataset.language);
  }
  const selectedButton = event.target.closest('button[data-action]');
  if (!selectedButton) return;
  const {action,value} = selectedButton.dataset;
  const session = practice();
  const question = session?.queue[session.index];
  const actionCard = deck && byId.get(deck.queue[deck.index]);
  if (action === 'view') return changeView(value);
  if (action === 'open-alphabet') return changeView('alphabet');
  if (action === 'open-units') return changeView('units');
  if (action === 'focus-units') return $('content').querySelector('[data-action=unit]').focus();
  if (action === 'play') return speak(byId.get(value).ar);
  if (action === 'play-question' && question) {
    question.heard = speak(question.entry.ar);
    const check = $('content').querySelector('[data-action=check]');
    if (check && question.heard) check.disabled = false;
    return;
  }
  if (action === 'letter-audio') {
    alphabet.played = speak(alphabetQuestions[alphabet.index].audio);
  } else if (action === 'letter-option') {
    alphabet.answer = value;
    alphabet.feedback = value === alphabetQuestions[alphabet.index].answer ?
      t('Верно.','To‘g‘ri.') : t('Попробуй ещё.','Yana urinib ko‘r.');
  } else if (action === 'alphabet-prev' || action === 'alphabet-next') {
    const next = alphabet.index + (action === 'alphabet-prev' ? -1 : 1);
    if (next === alphabetQuestions.length) return changeView('units');
    alphabet = {index:next,answer:'',feedback:'',played:false};
  } else if (action === 'unit' || action === 'all-units' || action === 'clear-units') {
    if (action === 'unit') {
      const id = Number(value);
      if (selected.has(id)) selected.delete(id);
      else selected.add(id);
    } else {
      selected.clear();
      if (action === 'all-units') unitIds.forEach(id => selected.add(id));
    }
    resetPools();
  } else if (action === 'start-cards' || action === 'hard-cards' || action === 'all-cards') {
    startDeck(action === 'hard-cards');
    return changeView('cards');
  } else if (['card-to-translation','card-to-arabic','toggle-marks'].includes(action)) {
    if (action === 'toggle-marks') decorated = !decorated;
    else {
      const next = action === 'card-to-arabic';
      if (reverse !== next) deck.revealed.clear();
      reverse = next;
    }
    storeSettings();
  } else if (action === 'flip') {
    if (deck.revealed.has(deck.index)) deck.revealed.delete(deck.index);
    else deck.revealed.add(deck.index);
  } else if (['next-card','prev-card','grade-hard','grade-known'].includes(action)) {
    window.speechSynthesis?.cancel();
    if (action.startsWith('grade-') && actionCard) setMark(actionCard.id,action.slice(6));
    deck.index = Math.max(0,Math.min(deck.queue.length,deck.index+(action==='prev-card'?-1:1)));
  } else if (action === 'start-practice' || action === 'retry-practice') {
    startPractice(action === 'retry-practice');
  } else if (action === 'prev-question' || action === 'next-question') {
    window.speechSynthesis?.cancel();
    session.index = Math.max(0,Math.min(session.queue.length,session.index+(action==='prev-question'?-1:1)));
  } else if (question && ['pick-option','chip-add','chip-remove','insert','check','skip','hint','practice-hard'].includes(action)) {
    if (action === 'practice-hard') setMark(question.entry.id,'hard');
    else if (question.result !== null) return;
    else if (action === 'pick-option') question.draft = value;
    else if (action === 'chip-add') question.chips.push(Number(value));
    else if (action === 'chip-remove') question.chips = question.chips.filter(id=>id!==Number(value));
    else if (action === 'insert') {
      const field = $('typed-answer');
      if (field.selectionStart === 0) return field.focus();
      field.setRangeText(value,field.selectionStart,field.selectionStart,'end');
      question.draft = field.value;
      return field.focus();
    } else if (!answerQuestion(question,action)) {
      const feedback = $('feedback');
      feedback.textContent = t('Сначала введи или выбери ответ.','Avval javob yoz yoki tanla.');
      return;
    }
  } else if (action === 'filter-hard') {
    filterHard = !filterHard;
  } else if (action === 'dictionary-mark') {
    setMark(value,marks.get(value)==='hard'?'known':'hard');
    updateDictionary();
    const item = [...$('word-list').querySelectorAll('details')].find(details => details.dataset.id === value);
    if (item) {
      item.open = true;
      item.querySelector('[data-action=dictionary-mark]').focus();
    } else $('search').focus();
    return;
  }
  render();
  if (['check','hint','skip'].includes(action)) $('content').querySelector('[data-action=next-question]')?.focus();
  if (['prev-question','next-question','start-practice','retry-practice'].includes(action))
    $('typed-answer')?.focus({preventScroll:true});
  if (['prev-card','next-card','grade-hard','grade-known'].includes(action))
    $('content').querySelector('.flash')?.focus({preventScroll:true});
});
document.addEventListener('change', event => {
  const {id,value} = event.target;
  if (id === 'kind') {
    kind = value;
    resetPools();
  } else if (id === 'mode') {
    mode = value;
    practices.clear();
    storeSettings();
  } else if (id === 'size') {
    size = Number(value);
    practices.clear();
    storeSettings();
  } else if (id === 'filter-unit') filterUnit = Number(value);
  else if (id === 'filter-kind') filterKind = value;
  else return;
  render();
});
document.addEventListener('input', event => {
  if (event.target.id === 'search') {
    search = event.target.value;
    updateDictionary();
  }
  if (event.target.id === 'typed-answer') {
    const q = practice()?.queue[practice()?.index];
    if (q && q.result === null) {
      q.draft = event.target.value;
      $('feedback').textContent = '';
    }
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.isComposing && event.target.id === 'typed-answer') {
    event.preventDefault();
    $('content').querySelector(event.target.readOnly ? '[data-action=next-question]' : '[data-action=check]')?.click();
  }
});
window.addEventListener('storage', event => {
  if (event.key === languageKey) changeLang(event.newValue);
  const markPrefix = markKey('');
  if (!event.key?.startsWith(markPrefix)) return;
  const id = event.key.slice(markPrefix.length);
  if (!byId.has(id)) return;
  if (['hard','known'].includes(event.newValue)) marks.set(id,event.newValue);
  else marks.delete(id);
  if (document.activeElement?.tagName !== 'INPUT') render();
});
window.addEventListener('pageshow', () => {
  const storedLanguage = read(languageKey);
  if (storedLanguage) changeLang(storedLanguage);
});
window.addEventListener('popstate',applyLocation);
window.addEventListener('hashchange',applyLocation);
refreshVoices();
window.speechSynthesis?.addEventListener('voiceschanged',() => {
  const available = voices.length > 0;
  refreshVoices();
  if (available !== (voices.length > 0) && document.activeElement?.tagName !== 'INPUT') render();
});
applyLocation();
render();
if (!solo && 'serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js').catch(() => {});
