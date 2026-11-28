import { entries, units } from './data.js';
import { approvedAnswer, bareArabic, cleanTranslation, graphemes, searchArabic } from './answers.js?v=2';
import { recordings } from './speech-data.js';

const $ = id => document.getElementById(id);
const situationalPhrases = [
  ['اِسْمِي مَرْيَمُ وَأَنَا طَالِبَةٌ.','Меня зовут Марьям, и я студентка.','Ismim Maryam, men talabaman.'],
  ['عِنْدِي أَخٌ كَبِيرٌ وَأُخْتٌ صَغِيرَةٌ.','У меня есть старший брат и младшая сестра.','Mening akam va singlim bor.'],
  ['أَدْرُسُ اللُّغَةَ الْعَرَبِيَّةَ فِي الْجَامِعَةِ.','Я изучаю арабский язык в университете.','Universitetda arab tilini o‘rganaman.'],
  ['أَبِي طَبِيبٌ وَأُمِّي مُعَلِّمَةٌ.','Мой отец врач, а мама учительница.','Otam shifokor, onam esa o‘qituvchi.'],
  ['أَسْكُنُ فِي شَقَّةٍ قَرِيبَةٍ مِنَ الْمَدْرَسَةِ.','Я живу в квартире рядом со школой.','Maktab yaqinidagi kvartirada yashayman.'],
  ['الْجَوُّ بَارِدٌ فِي الْمَدِينَةِ الْيَوْمَ.','Сегодня в городе холодно.','Bugun shaharda havo sovuq.'],
  ['أَيْنَ مَحَطَّةُ الْحَافِلَاتِ مِنْ فَضْلِكَ؟','Скажите, пожалуйста, где автобусная станция?','Ayting-chi, avtobus bekati qayerda?'],
  ['أُرِيدُ كُوبًا مِنَ الشَّايِ مِنْ فَضْلِكَ.','Я хотел бы чашку чая, пожалуйста.','Iltimos, bir piyola choy bering.'],
  ['كَمْ سِعْرُ هَذَا الْقَمِيصِ؟','Сколько стоит эта рубашка?','Bu ko‘ylak qancha turadi?'],
  ['أَشْعُرُ بِأَلَمٍ فِي رَأْسِي.','У меня болит голова.','Boshim og‘riyapti.'],
  ['أَلْعَبُ كُرَةَ الْقَدَمِ مَعَ أَصْدِقَائِي.','Я играю в футбол с друзьями.','Do‘stlarim bilan futbol o‘ynayman.'],
  ['أَسْتَيْقِظُ فِي السَّاعَةِ السَّابِعَةِ صَبَاحًا.','Я просыпаюсь в семь часов утра.','Ertalab soat yettida uyg‘onaman.']
].map(([ar,ru,uz],index)=>({id:'situation-'+(index+1),ar,ru:[ru],uz:[uz],kind:'phrase',units:[index+1]}));
const byId = new Map([...entries,...situationalPhrases].map(entry => [entry.id, entry]));
const solo = document.documentElement.hasAttribute('data-standalone');
const prefix = solo ? 'hanyuwed:ar:preview:' : 'hanyuwed:ar:manhaj-a1:';
const languageKey = solo ? prefix + 'language' : HanyuCourse.languageKey;
const settingsKey = prefix + 'settings:v1';
const studyKey = prefix + 'study:v1';
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
  units: HanyuCourse.labels.units, alphabet: ['Чтение','O‘qish'], cards: HanyuCourse.labels.cards,
  practice: HanyuCourse.labels.practice, dictionary: HanyuCourse.labels.dictionary
};
const modes = {
  choice: ['Выбрать перевод','Tarjimani tanlash'], meaning: ['Написать перевод','Tarjima yozish'],
  writing: ['Написать по-арабски','Arabcha yozish'], tokens: ['Собрать выражение','Iborani tuzish'],
  marks: ['Краткие гласные на слух','Qisqa unlilarni eshitish'], letters: ['Собрать слово из букв','So‘zni harflardan tuzish'],
  dictation: ['Диктант','Diktant']
};
const practiceGroups = {
  translation:[['Перевод','Tarjima'],['choice','meaning']],
  writing:[modes.writing,['writing']],
  assemble:[['Собрать','Yig‘ish'],['tokens','letters']],
  marks:[modes.marks,['marks']],
  dictation:[modes.dictation,['dictation']]
};
const translationVariants = {
  'مَرِح':{ru:['жизнерадостный']},
  'مَرْحَبًا':{ru:['приветствую']},
  'كَيْفَ حَالُكَ؟':{ru:['как поживаешь','как ты себя чувствуешь'],uz:['Qalaysan','Qalaysiz']}
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
let activeAudio = null;
let alphabet = { answer:'', index:0, feedback:'', played:false };
let audioNote = '';
const audioUrls = Object.values(recordings).map(path => new URL(path, import.meta.url).href);
const audioCache = 'hanyuwed-media:' + new URL('../', import.meta.url).pathname;
const audioDownload = { count:0, running:false, error:false, checked:false };

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
  { text:['Послушай и выбери услышанную букву.','Tinglab, eshitgan harfingni tanla.'], audio:'alphabet-sad', options:['س','ص'], answer:'ص' },
  { text:['Какое слово означает «город»?','Qaysi so‘z «shahar» degani?'], options:['مَدْرَسَة','مَدِينَة','جَامِعَة'], answer:'مَدِينَة' }
];

function storeSettings() {
  save(settingsKey, JSON.stringify({ units:[...selected], kind, decorated, reverse, mode, size }));
}
function setMark(id, state) {
  if (state === null) {
    marks.delete(id);
    try { localStorage.removeItem(markKey(id)); }
    catch { memoryOnly = true; }
  } else {
    marks.set(id, state);
    save(markKey(id), state);
  }
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
const practiceKey = (language = lang, type = mode) => [language,[...selected].sort((a,b)=>a-b).join(','),kind,type,size].join(':');
const practice = () => practices.get(practiceKey());
const translationAnswers = entry => [...entry[lang],...(translationVariants[entry.ar]?.[lang] || [])];

function shuffle(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const other = Math.floor(Math.random() * (i + 1));
    [result[i], result[other]] = [result[other], result[i]];
  }
  return result;
}
function button(label, action, options = {}) {
  const { value = '', primary = false, disabled = false, pressed, raw = false, ariaLabel } = options;
  return '<button type="button" class="' + (primary ? 'primary' : 'btn') + '" data-action="' + action +
    '" data-value="' + escape(value) + '"' + (disabled ? ' disabled' : '') +
    (ariaLabel ? ' aria-label="' + escape(ariaLabel) + '"' : '') +
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

function downloadControls() {
  if (solo || !('caches' in window) || !('serviceWorker' in navigator)) return '';
  const complete = audioDownload.count === audioUrls.length;
  const label = audioDownload.running ? t('Загружается…','Yuklanmoqda…') :
    complete ? t('Аудио загружено','Audio yuklab olindi') :
    audioDownload.error ? t('Продолжить загрузку аудио','Audioni yuklashni davom ettirish') :
    t('Скачать аудио для работы без сети','Oflayn foydalanish uchun audioni yuklash');
  const detail = !audioDownload.checked ? t('Проверяем записи…','Audiolar tekshirilmoqda…') :
    t('Загружено записей: ','Yuklangan audiolar: ') + audioDownload.count + ' / ' + audioUrls.length;
  const error = audioDownload.error ? t(' Загрузка прервалась. Нажми кнопку, чтобы продолжить.',
    ' Yuklash to‘xtadi. Davom etish uchun tugmani bosing.') : '';
  return button(label,'download-audio',{disabled:audioDownload.running || complete || !audioDownload.checked}) +
    '<p class="meta" role="status">' + detail + error + '</p>';
}

function refreshAudioDownload() {
  const panel = $('audio-download');
  if (panel) panel.innerHTML = downloadControls();
}

async function checkAudioDownload() {
  if (solo || !('caches' in window) || !('serviceWorker' in navigator)) return;
  try {
    const cache = await caches.open(audioCache);
    const cached = new Set((await cache.keys()).map(request => request.url));
    audioDownload.count = audioUrls.filter(url => cached.has(url)).length;
  } catch {
    audioDownload.error = true;
  } finally {
    audioDownload.checked = true;
    refreshAudioDownload();
  }
}

async function downloadAudio() {
  if (audioDownload.running) return;
  audioDownload.running = true;
  audioDownload.error = false;
  refreshAudioDownload();
  try {
    await navigator.serviceWorker.register('../sw.js');
    await new Promise((resolve,reject) => {
      const timer = setTimeout(() => reject(new Error('Offline support unavailable')),45000);
      navigator.serviceWorker.ready.then(registration => {
        clearTimeout(timer);
        resolve(registration);
      },error => {
        clearTimeout(timer);
        reject(error);
      });
    });
    const cache = await caches.open(audioCache);
    for (let index = 0; index < audioUrls.length; index += 4) {
      const results = await Promise.allSettled(audioUrls.slice(index,index + 4).map(async url => {
        if (await cache.match(url)) return;
        const response = await fetch(url);
        if (!response.ok || !response.headers.get('Content-Type')?.startsWith('audio/')) throw new Error('Audio unavailable');
        await cache.put(url,response);
      }));
      const cached = new Set((await cache.keys()).map(request => request.url));
      audioDownload.count = audioUrls.filter(url => cached.has(url)).length;
      refreshAudioDownload();
      if (results.some(result => result.status === 'rejected')) throw new Error('Audio download interrupted');
    }
  } catch {
    audioDownload.error = true;
  } finally {
    audioDownload.running = false;
    refreshAudioDownload();
  }
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
    button(t('Перейти к урокам','Darslarga o‘tish'), 'focus-units') + '</div>' +
    '<div id="audio-download" class="surface lesson-box">' + downloadControls() + '</div><div class="bar">' +
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
  const examples = [
    ['reading-letters','ب ت ث'], ['reading-door','بَاب'],
    ['reading-vowels','بَ بِ بُ · بَا بِي بُو'], ['reading-sun-moon','الشَّمْس وَالْقَمَر']
  ];
  const letterForms = [
    [t('Отдельно','Alohida'),'ب'], [t('В начале','Boshida'),'بـ'],
    [t('В середине','O‘rtasida'),'ـبـ'], [t('В конце','Oxirida'),'ـب']
  ].map(([label,form]) => '<span>' + escape(label) + ' ' + arabic(form) + '</span>').join(' · ');
  const notes = lines.map(([title,note,samples],index) => '<div class="surface lesson-box"><h2>' + escape(title) +
    '</h2><p>' + escape(note) + '</p><div dir="rtl">' + arabic(samples) + '</div>' +
    (index === 1 ? '<p>' + letterForms + '</p>' : '') +
    button(t('Прослушать','Tinglash') + ' · ' + arabic(examples[index][1]),'play',
      {value:examples[index][0],raw:true}) + '</div>').join('');
  const choices = question.options.map(option => button(arabic(option),'letter-option',{
    raw:true,value:option,pressed:alphabet.answer === option,disabled:!!question.audio && !alphabet.played
  })).join('');
  const sound = question.audio ? button(t('Прослушать','Tinglash'),'letter-audio') : '';
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
      t('Открыть ответ','Javobni ochish')) + '</small></button><div class="card-detail">' +
    '<div id="card-detail"' + (revealed ? '' : ' hidden') + '>' + (reverse ? ar : gloss) + '</div>' +
    (!reverse || revealed ? '<div class="wrap below">' + soundButton(entry) + '</div>' : '') +
    '</div></div><div class="actions">' +
    button(t('Ещё учу','Hali o‘rganyapman'),'grade-hard',{pressed:marks.get(entry.id)==='hard'}) +
    button(t('Помню','Esimda'),'grade-known',{primary:true,pressed:marks.get(entry.id)==='known'}) +
    '</div><div class="actions card-nav">' +
    button(t('Назад','Orqaga'),'prev-card',{disabled:deck.index===0}) +
    button(t('Вперёд','Oldinga'),'next-card') + '</div>';
}

function selectMark(entry, preview = false) {
  const parts = graphemes(entry.ar);
  let position = 0;
  const candidates = [];
  parts.forEach((part, index) => {
    if (!/\p{Script=Arabic}/u.test(part[0])) return;
    position++;
    if (!parts[index + 1] || !/\p{Script=Arabic}/u.test(parts[index + 1][0])) return;
    for (const sign of ['َ', 'ِ', 'ُ']) {
      if (part.includes(sign)) candidates.push({ index, pos:position, sign, letter:part[0] });
    }
  });
  if (!candidates.length) return null;
  const selected = candidates[preview ? 0 : Math.floor(Math.random() * candidates.length)];
  parts[selected.index] = parts[selected.index].replace(selected.sign, '');
  return { ...selected, prompt:parts.join('') };
}
function chipSet(words) {
  return shuffle(words.map((text, id) => ({text,id})));
}
function makeQuestion(entry, pool) {
  let options = [];
  if (mode === 'choice') {
    const accepted = new Set(translationAnswers(entry).map(cleanTranslation));
    const distractors = [];
    const form = item => item.kind === 'phrase' || /^(я|ты|он|она|мы|вы|они|men|sen|u|biz|siz|ular)\s/iu.test(translation(item));
    const related = item => item.units.some(id=>entry.units.includes(id));
    const sameForm = item => form(item) === form(entry);
    const candidates = shuffle(pool).sort((left,right)=>
      (Number(related(right))*2+Number(sameForm(right))) - (Number(related(left))*2+Number(sameForm(left))));
    for (const alternative of candidates) {
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
  if (mode === 'tokens') return entry.ar.split(' ').length > 1;
  if (mode === 'letters') return !bareArabic(entry.ar).includes(' ');
  if (mode === 'marks') return Boolean(recordings[entry.id]) && Boolean(selectMark(entry,true));
  if (mode === 'dictation') return Object.hasOwn(recordings,entry.id);
  return true;
}
function practicePool() {
  const contextual = ['tokens','meaning','choice'].includes(mode) && kind !== 'word' ?
    situationalPhrases.filter(entry=>selected.has(entry.units[0])) : [];
  return [...activePool(),...contextual].filter(eligible);
}
function startPractice(repeat = false) {
  const prior = practice();
  const available = practicePool();
  const pool = repeat ? prior.queue.filter(q => q.result !== 'correct').map(q => q.entry) : available;
  if (!pool.length) return false;
  const list = shuffle(pool).slice(0, size || pool.length);
  const choicePool = [...new Set([...pool,...available,...entries])];
  practices.set(practiceKey(), { mode, index:0, queue:list.map(entry => makeQuestion(entry, choicePool)) });
  return true;
}

function questionAnswer(question) {
  return ['tokens','letters'].includes(mode) ?
    question.chips.map(id=>question.parts.find(part=>part.id===id).text).join(mode==='tokens'?' ':'') : question.draft;
}

function renderPractice() {
  const group = Object.keys(practiceGroups).find(id=>practiceGroups[id][1].includes(mode));
  const typesInGroup = practiceGroups[group][1];
  const total = practicePool().length;
  const questionCount = Math.min(total,size||total);
  const scope = [...selected].map(id=>countUnit(id)).join(' · ') || t('Уроки не выбраны','Darslar tanlanmagan');
  const options = '<div class="controls">' + select('practice-group',t('Упражнение','Mashq'),
    Object.entries(practiceGroups).map(([id,[label]])=>[id,t(...label)]),group) +
    (typesInGroup.length>1?select('mode',t('Вариант','Variant'),typesInGroup.map(id=>[id,t(...modes[id])]),mode):'') +
    select('size',t('Вопросов','Savollar'),[[10,'10'],[20,'20'],[0,t('Все','Hammasi')]],size) + '</div>' +
    '<div class="wrap"><span class="meta">'+escape(scope)+'</span>'+button(t('Выбрать уроки','Darslarni tanlash'),'open-units')+'</div>'+
    '<p class="meta" role="status">'+t('Заданий: ','Mashqlar: ')+questionCount+' / '+total+'</p>';
  const session = practice();
  if (!session || session.mode !== mode) {
    return options + '<div class="surface empty">' + (!total?
      '<p>'+t('Выбери уроки с подходящим материалом.','Mos materialli darslarni tanla.')+'</p>':'')+
      button(t('Начать','Boshlash'),'start-practice',{primary:true,disabled:!total}) + '</div>';
  }
  const current = session.queue[session.index];
  if (!current) {
    const results = session.queue.map(q => q.result);
    const correct = results.filter(result => result === 'correct').length;
    const skipped = results.filter(result => result === 'skip' || result === null).length;
    const tipped = results.filter(result => result === 'hint').length;
    const errors = results.length - correct - skipped - tipped;
    const review = session.queue.filter(q=>q.result!=='correct').map(q=>{
      const answer = questionAnswer(q);
      const model = mode==='marks'?arabic('ـ'+q.target.sign):['choice','meaning'].includes(mode)?
        escape(translation(q.entry)):arabic(q.entry.ar);
      return '<li>'+arabic(q.entry.ar)+' · '+escape(translation(q.entry))+
        '<p>'+t('Твой ответ','Javobing')+' · '+escape(answer||'—')+'</p>'+
        '<p>'+t('Образец','Namuna')+' · '+model+'</p></li>';
    }).join('');
    return options + '<div class="surface empty"><h2>' + t('Результат','Natija') + '</h2><p>' +
      t('Верно: ','To‘g‘ri: ') + count(correct, results.length) + ' · ' + t('Ошибки: ','Xato: ') + errors +
      ' · ' + t('С подсказкой: ','Yordam bilan: ') + tipped + ' · ' + t('Пропущено: ','O‘tkazilgan: ') + skipped +
      '</p>'+(review?'<details><summary>'+t('Разбор заданий','Mashqlar tahlili')+'</summary><ol>'+review+'</ol></details>':'')+
      '<div class="wrap">' + button(t('Повторить задания','Mashqlarni takrorlash'),'retry-practice',
        {primary:true,disabled:correct===results.length}) + button(t('Новая практика','Yangi mashq'),'start-practice') +
      button(t('Назад','Orqaga'),'prev-question') + '</div></div>';
  }
  const isArabic = !['meaning','choice'].includes(mode);
  const entry = current.entry;
  let prompt = isArabic ? escape(translation(entry)) : arabic(shown(entry),'main-text');
  if (mode === 'marks') {
    const parts = graphemes(current.target.prompt).map((part,index)=>
      index===current.target.index?'<mark class="mark-target">'+escape(part)+'</mark>':escape(part));
    prompt = '<bdi class="ar main-text" lang="ar" dir="rtl">'+parts.join('')+'</bdi><div class="meta">' +
      t('Прослушай и выбери краткую гласную для выделенной буквы №', 'Tingla va belgilangan harf uchun qisqa unlini tanla №') +
      current.target.pos + ' · ' + arabic(current.target.letter) + ' · ' + escape(translation(entry)) + '</div>';
  }
  if (['choice','meaning'].includes(mode) && !decorated &&
      entries.some(other => other.id !== entry.id && bareArabic(other.ar) === bareArabic(entry.ar) && other.ar !== entry.ar)) {
    prompt = arabic(entry.ar,'main-text');
  }
  if (mode === 'dictation') {
    prompt = t('Прослушай и запиши по-арабски. Огласовки можно не вводить.', 'Tingla va arabcha yoz. Harakatlarni yozish shart emas.');
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
    const choices = mode === 'choice' ? current.options : ['َ', 'ِ', 'ُ'];
    input = '<div class="options">' + choices.map(value => button(mode === 'marks' ? arabic('ـ' + value) + ' ' + escape(t(...markNames[value])) : value,
      'pick-option',{value,raw:mode === 'marks',disabled:revealed,pressed:current.draft===value})).join('') + '</div>';
  } else if (mode === 'tokens' || mode === 'letters') {
    function partButtons(parts, action) {
      return parts.map(part => button(arabic(part.text),'chip-' + action,{raw:true,value:part.id,disabled:revealed})).join('');
    }
    const ordered = current.chips.map(id => current.parts.find(part => part.id === id));
    const rest = current.parts.filter(part => !current.chips.includes(part.id));
    input = '<div class="meta">' + t('Твой ответ','Javobing') + '</div><div class="tokens token-answer" dir="rtl">' +
      partButtons(ordered,'remove') + '</div><div class="tokens" dir="rtl">' + partButtons(rest,'add') + '</div>';
    if (mode==='letters' && ordered.length) input += '<p>'+arabic(questionAnswer(current))+'</p>';
  } else {
    input = '<label for="typed-answer">' + t('Твой ответ','Javobing') + '</label><input spellcheck="false" autocomplete="off" autocapitalize="off" id="typed-answer" class="answer ' +
      (isArabic ? 'ar" lang="ar" dir="rtl"' : '"') + ' value="' + escape(current.draft) + '"' + (revealed ? ' readonly' : '') + '>';
    if (isArabic && !revealed) input += '<p class="meta">' + t('Для ввода букв включи арабскую раскладку на устройстве.', 'Harflarni yozish uchun qurilmada arabcha klaviaturani yoqing.') + '</p>';
    if (isArabic && !revealed) input += '<div class="wrap letters below" dir="rtl" aria-label="' + t('Огласовки','Harakatlar') +
      '">' + Object.keys(markNames).map(value => button(arabic('ـ' + value),'insert',{raw:true,value})).join('') + '</div>';
  }
  const alternate = mode==='writing' && correct && bareArabic(current.draft)!==bareArabic(entry.ar);
  const solution = alternate ? arabic(current.draft)+' · '+t('В учебнике','Darslikda')+' '+arabic(entry.ar) :
    isArabic ? arabic(entry.ar) : escape(translation(entry));
  return options + progress(session.index+1,session.queue.length) +
    '<div class="surface practice"><div class="prompt" id="question-prompt">' + prompt + '</div>' +
    (recordings[entry.id] && (mode === 'dictation' || revealed || ['choice','meaning','marks'].includes(mode)) ?
      '<div class="wrap below">' + soundButton(entry, mode === 'dictation' || mode === 'marks') + '</div>' : '') + input +
    '<p id="feedback" role="status" data-tone="' + (correct ? 'good' : 'bad') + '">' +
    (revealed ? explanations[checked] + ' ' + solution : '') + '</p><div class="wrap option-gap">' +
    (revealed ? '' : button(t('Проверить','Tekshirish'),'check',{primary:true,disabled:['dictation','marks'].includes(mode) && !current.heard}) +
      button(t('Показать ответ','Javobni ko‘rsatish'),'hint') + button(t('Пропустить','O‘tkazish'),'skip')) +
    (recordings[entry.id]?button(t('Ещё учу','Hali o‘rganyapman'),'practice-hard',{pressed:marks.get(entry.id)==='hard'}):'') +
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
  const answer = questionAnswer(question);
  if (!answer.trim() || (['dictation','marks'].includes(mode) && !question.heard)) return false;
  if (mode === 'marks') {
    question.result = answer === question.target.sign ? 'correct' : 'marks';
    return true;
  }
  const entry = question.entry;
  const arabicAnswer = ['writing','dictation','tokens','letters'].includes(mode);
  let candidates = arabicAnswer ? [entry.ar] : translationAnswers(entry);
  if (mode === 'writing') {
    const label = cleanTranslation(translation(entry));
    candidates = entries.filter(other => other[lang].some(gloss => cleanTranslation(gloss) === label))
      .map(other => other.ar);
  }
  question.result = approvedAnswer(answer, candidates, arabicAnswer, mode !== 'letters');
  return true;
}

function dictionaryResults() {
  const scope = entries.filter(entry => {
    if (filterUnit && !entry.units.includes(filterUnit)) return false;
    if (filterKind !== 'all' && entry.kind !== filterKind) return false;
    if (filterHard && marks.get(entry.id) !== 'hard') return false;
    return true;
  });
  const normalize = /\p{Script=Arabic}/u.test(search) ? searchArabic : HanyuCourse.normalizeSearch;
  return HanyuCourse.rankedDictionary(scope, search, entry => [entry.ar,...entry.ru,...entry.uz], normalize);
}
function updateDictionary() {
  const results = dictionaryResults();
  $('result-count').textContent = t('Найдено: ','Topildi: ') + results.length;
  $('word-list').innerHTML = results.length ? results.map(entry => {
    const hard = marks.get(entry.id) === 'hard';
    const lesson = entry.units.map(id => countUnit(id)).join(' · ');
    const sound = button('♪','play',{
      value:entry.id, ariaLabel:t(`Прослушать ${entry.ar}`,`${entry.ar} talaffuzini tinglash`)
    });
    return '<div class="dictionary-item"><details data-id="' + escape(entry.id) + '"><summary>' +
      arabic(entry.ar) + '<span>' + escape(translation(entry)) + '</span></summary><p class="meta">' +
      escape(lesson) + '</p><p>' + escape(entry[lang].join(' · ')) + '</p><div class="wrap below">' +
      button(hard ? t('Убрать из трудных','Qiyinlardan olib tashlash') : t('Ещё учу','Hali o‘rganyapman'),'dictionary-mark',
        {value:entry.id,pressed:hard}) + '</div></details>' + sound + '</div>';
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

function soundButton(entry, dictation = false) {
  return button(t('Прослушать','Tinglash'),dictation ? 'play-question' : 'play',{value:entry.id});
}
function stopAudio() {
  activeAudio?.pause();
  activeAudio = null;
}
function playAudio(id, onStart) {
  stopAudio();
  audioNote = '';
  showStatus();
  const clip = recordings[id];
  if (!clip) {
    audioNote = t('Для этого слова запись недоступна. Можно пропустить задание.', 'Bu so‘z uchun audio yo‘q. Topshiriqni o‘tkazib yuborish mumkin.');
    showStatus();
    return;
  }
  const audio = new Audio(new URL(clip, import.meta.url));
  activeAudio = audio;
  audio.play().then(() => {
    if (activeAudio === audio) onStart?.();
  }).catch(() => {
    if (activeAudio !== audio) return;
    activeAudio = null;
    audioNote = t('Не удалось воспроизвести звук. Попробуй ещё раз.','Ovozni ijro etib bo‘lmadi. Yana urinib ko‘r.');
    showStatus();
  });
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
  $('home').textContent = t('Выбрать язык','Tilni tanlash');
  $('locale').setAttribute('aria-label',t('Язык интерфейса','Interfeys tili'));
  for (const item of $('locale').querySelectorAll('button')) item.setAttribute('aria-pressed',item.dataset.language===lang);
  $('navigation').setAttribute('aria-label',t('Разделы','Bo‘limlar'));
  for (const item of $('navigation').querySelectorAll('button')) {
    item.textContent = t(...tabs[item.dataset.value]);
    if (item.dataset.value === view) item.setAttribute('aria-current','page');
    else item.removeAttribute('aria-current');
  }
  $('heading').textContent = t(...tabs[view]);
  $('content').innerHTML = views[view]();
  if (view === 'dictionary') updateDictionary();
  showStatus();
  if (focus) $('heading').focus();
  else restoreFocus(previous);
}
function changeView(next) {
  stopAudio();
  audioNote = '';
  view = next;
  if (location.hash !== '#' + next) history.pushState(null,'','#' + next);
  render({focus:true});
}
function applyLocation() {
  const key = location.hash.slice(1);
  const next = Object.hasOwn(tabs,key) ? key : 'units';
  if (next === view) return;
  stopAudio();
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
  storeSettings();
  saveStudy();
}

function saveStudy() {
  const cards = deck ? {...deck, revealed:[...deck.revealed]} : null;
  const sessions = Object.fromEntries([...practices].map(([language, session]) => [language, {
    ...session, queue:session.queue.map(question => ({...question, entry:question.entry.id}))
  }]));
  if (!HanyuCourse.writeStored(studyKey, {units:[...selected], kind, cards, sessions})) memoryOnly = true;
}

function restoreStudy() {
  const stored = HanyuCourse.readStored(studyKey);
  if (!stored || !Array.isArray(stored.units)) return;
  const {cards, sessions} = stored;
  const sameSelection = stored.units.join() === [...selected].join() && stored.kind === kind;
  if (sameSelection && Array.isArray(cards?.queue) && cards.queue.every(id => byId.has(id)) && Array.isArray(cards.revealed) &&
      Number.isInteger(cards.index) && cards.index >= 0 && cards.index <= cards.queue.length) {
    deck = {...cards, revealed:new Set(cards.revealed)};
  }
  for (const [key,session] of Object.entries(sessions || {})) {
    if (!session || !Object.hasOwn(modes,session.mode) || !Array.isArray(session.queue) ||
        !Number.isInteger(session.index) || session.index < 0 || session.index > session.queue.length ||
        !session.queue.every(question => byId.has(question?.entry) && Array.isArray(question.chips) &&
          Array.isArray(question.parts) && Array.isArray(question.options) && typeof question.draft === 'string')) continue;
    if (['ru','uz'].includes(key) && !sameSelection) continue;
    const id = ['ru','uz'].includes(key) ? practiceKey(key,session.mode) : key;
    practices.set(id, {...session,queue:session.queue.map(question => ({...question,entry:byId.get(question.entry)}))});
  }
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
  if (action === 'download-audio') { void downloadAudio(); return; }
  if (action === 'play') return playAudio(value);
  if (action === 'play-question' && question) {
    return playAudio(question.entry.id,() => {
      question.heard = true;
      saveStudy();
      const check = $('content').querySelector('[data-action=check]');
      if (check) check.disabled = false;
    });
  }
  if (action === 'letter-audio') {
    return playAudio(alphabetQuestions[alphabet.index].audio,() => {
      alphabet.played = true;
      render();
    });
  } else if (action === 'letter-option') {
    alphabet.answer = value;
    alphabet.feedback = value === alphabetQuestions[alphabet.index].answer ?
      t('Верно.','To‘g‘ri.') : t('Попробуй ещё.','Yana urinib ko‘r.');
  } else if (action === 'alphabet-prev' || action === 'alphabet-next') {
    stopAudio();
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
    saveStudy();
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
    stopAudio();
    if (action.startsWith('grade-') && actionCard) setMark(actionCard.id,action.slice(6));
    deck.index = Math.max(0,Math.min(deck.queue.length,deck.index+(action==='prev-card'?-1:1)));
  } else if (action === 'start-practice' || action === 'retry-practice') {
    stopAudio();
    startPractice(action === 'retry-practice');
  } else if (action === 'prev-question' || action === 'next-question') {
    stopAudio();
    session.index = Math.max(0,Math.min(session.queue.length,session.index+(action==='prev-question'?-1:1)));
  } else if (question && ['pick-option','chip-add','chip-remove','insert','check','skip','hint','practice-hard'].includes(action)) {
    if (action === 'practice-hard') setMark(question.entry.id,marks.get(question.entry.id)==='hard'?null:'hard');
    else if (question.result !== null) return;
    else if (action === 'pick-option') question.draft = value;
    else if (action === 'chip-add') question.chips.push(Number(value));
    else if (action === 'chip-remove') question.chips = question.chips.filter(id=>id!==Number(value));
    else if (action === 'insert') {
      const field = $('typed-answer');
      if (field.selectionStart === 0) return field.focus();
      field.setRangeText(value,field.selectionStart,field.selectionStart,'end');
      question.draft = field.value;
      saveStudy();
      return field.focus();
    } else if (!answerQuestion(question,action)) {
      const feedback = $('feedback');
      feedback.textContent = t('Сначала введи или выбери ответ.','Avval javob yoz yoki tanla.');
      return;
    }
  } else if (action === 'filter-hard') {
    filterHard = !filterHard;
  } else if (action === 'dictionary-mark') {
    setMark(value,marks.get(value)==='hard'?null:'hard');
    updateDictionary();
    const item = [...$('word-list').querySelectorAll('details')].find(details => details.dataset.id === value);
    if (item) {
      item.open = true;
      item.querySelector('[data-action=dictionary-mark]').focus();
    } else $('search').focus();
    return;
  }
  if (view === 'cards' || view === 'practice') saveStudy();
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
  } else if (id === 'mode' || id === 'practice-group') {
    stopAudio();
    mode = id === 'mode' ? value : practiceGroups[value][1][0];
    storeSettings();
    saveStudy();
  } else if (id === 'size') {
    stopAudio();
    size = Number(value);
    storeSettings();
    saveStudy();
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
      saveStudy();
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
window.addEventListener('pagehide',stopAudio);
restoreStudy();
applyLocation();
render();
if (!solo && 'serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js').catch(() => {});
void checkAudioDownload();
