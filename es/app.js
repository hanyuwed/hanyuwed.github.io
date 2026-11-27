'use strict';

const languageKey = 'hanyu-language-v1';
const prefix = 'hanyuwed:es:';
const keys = {deck: prefix + 'deck:v1', units: prefix + 'units:v1', session: prefix + 'session:v1', word: id => prefix + 'progress:v1:' + id};
const $ = id => document.getElementById(id);
const content = $('content');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[c]));

function saved(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { storageWarning(); }
}

function readLanguage() {
  try { return localStorage.getItem(languageKey) === 'uz' ? 'uz' : 'ru'; }
  catch { return 'ru'; }
}

function storageWarning() {
  $('storage-message').hidden = false;
  $('storage-message').textContent = t('Браузер не сохранил прогресс. Можно продолжать в этой вкладке.',
    'Brauzer natijani saqlamadi. Shu oynada davom etish mumkin.');
}

let lang = readLanguage();
const t = (ru,uz) => lang === 'uz' ? uz : ru;
const wordById = new Map(ES_WORDS.map(word => [word.id,word]));
const progress = new Map(ES_WORDS.map(word => [word.id,saved(keys.word(word.id),null)]));
const units = saved(keys.units,[0]);
const chosen = new Set(Array.isArray(units) ? units.filter(n => Number.isInteger(n) && ES_UNITS[n]) : [0]);
const views = {
  topics: ['Темы','Bo‘limlar'],
  cards: ['Карточки','Kartochkalar'],
  practice: ['Практика','Mashqlar'],
  dictionary: ['Словарь','Lug‘at']
};
let view = 'topics';
let deck = restoreDeck();
let practiceUnit = [...chosen][0] ?? 0;
let mode = 'grammar';
let amount = 10;
let session = restoreSession(saved(keys.session,null));
let query = '';
let dictUnit = 'all';
let dictHard = false;
let dictLimit = 35;
const audio = new Audio();
audio.preload = 'none';
let audioRequest = 0;
let activeAudio = false;
const courseBase = new URL('./', location.href);
const audioCache = 'hanyuwed-es-audio:' + new URL('../', courseBase).pathname;
const downloaded = new Set();
const downloading = new Map();
const downloadErrors = new Set();

function restoreSession(value) {
  if (!value || !Array.isArray(value.questions) || !value.questions.length ||
      !value.questions.every(q => Array.isArray(q.accepted) && typeof q.prompt === 'string') ||
      !Array.isArray(value.replies) || !Number.isInteger(value.index)) return null;
  value.index = Math.max(0,Math.min(value.index,value.questions.length-1));
  return value;
}

function route() {
  stopAudio();
  const requested = location.hash.slice(1);
  view = Object.hasOwn(views,requested) ? requested : 'topics';
  render();
}

function go(destination) {
  if (location.hash === '#' + destination) route();
  else location.hash = destination;
}

function selectedWords() {
  return ES_WORDS.filter(word => word.sources.some(source => chosen.has(source.unit)));
}

function hardWords() {
  return ES_WORDS.filter(word => progress.get(word.id) === 'hard');
}

function shuffled(items) {
  const result = [...items];
  for (let i=result.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [result[i],result[j]] = [result[j],result[i]];
  }
  return result;
}

function button(name, action, value = '', className = 'btn', attributes = '') {
  return '<button type="button" class="' + className + '" data-action="' + action + '" data-value="' +
    esc(value) + '" ' + attributes + '>' + esc(name) + '</button>';
}

function btn(ru,uz,action,value,className,attributes) {
  return button(t(ru,uz),action,value,className,attributes);
}

function es(text, classes = 'es-text') {
  return '<span lang="es" class="' + classes + '">' + esc(text) + '</span>';
}

function player(text, slow = false, hidden = false) {
  const label = hidden ? t('Прослушать задание','Topshiriqni tinglash') : t('Слушать','Tinglash');
  return button(label,'audio',text) + (slow ? btn('Медленнее','Sekinroq','audio-slow',text) : '');
}

function stopAudio() {
  audioRequest++;
  activeAudio = false;
  audio.pause();
  $('audio-status').textContent = '';
}

function audioUrl(text) {
  return new URL('audio/' + ES_AUDIO[text] + '.mp3', courseBase).href;
}

function speak(text, slow) {
  stopAudio();
  const request = audioRequest;
  const status = $('audio-status');
  if (!Object.hasOwn(ES_AUDIO,text)) {
    status.textContent = t('Запись недоступна.','Audio mavjud emas.');
    return;
  }
  activeAudio = true;
  status.textContent = t('Загружается запись…','Audio yuklanmoqda…');
  const src = typeof ES_EMBEDDED_AUDIO === 'undefined' ? audioUrl(text) :
    'data:audio/mpeg;base64,' + ES_EMBEDDED_AUDIO[ES_AUDIO[text]];
  if (audio.src !== src) audio.src = src;
  else if (audio.error) audio.load();
  audio.currentTime = 0;
  audio.preservesPitch = true;
  audio.playbackRate = slow ? 0.8 : 1;
  audio.play().catch(error => {
    if (request !== audioRequest || error.name === 'AbortError') return;
    status.textContent = t('Запись не загрузилась. Нажми «Слушать» ещё раз или перейди дальше.',
      'Audio yuklanmadi. «Tinglash»ni qayta bosing yoki keyingi savolga o‘ting.');
  });
}

audio.addEventListener('playing', () => {
  if (activeAudio) $('audio-status').textContent = t('Воспроизведение · испанский (Испания)','Ijro etilmoqda · ispan tili (Ispaniya)');
});
audio.addEventListener('ended', () => {
  if (activeAudio) $('audio-status').textContent = t('Нажми «Слушать», чтобы повторить.','Takrorlash uchun «Tinglash»ni bosing.');
});
audio.addEventListener('error', () => {
  if (activeAudio) $('audio-status').textContent = t('Запись недоступна. Можно повторить загрузку.','Audio mavjud emas. Yana yuklab ko‘ring.');
});

function lessonAudio(unit) {
  const {rules,scene,model,drills} = ES_LESSONS[unit];
  const words = ES_WORDS.filter(word => word.sources.some(source => source.unit === unit));
  return [...new Set([
    ...words.flatMap(word => [word.es,...(word.aliases || [])]),
    ...rules.flatMap(rule => rule[4]), ...scene.map(line => line[0]), model[0],
    ...drills.map(drill => drill[4])
  ].map(audioUrl))];
}

function downloadControls(unit) {
  if (!('caches' in window) || document.documentElement.dataset.standalone !== undefined) return '';
  const label = downloaded.has(unit) ? t('Аудио скачано','Audio yuklab olindi') :
    downloading.has(unit) ? t('Загружается…','Yuklanmoqda…') :
    downloadErrors.has(unit) ? t('Продолжить загрузку аудио','Audioni yuklashni davom ettirish') :
    t('Скачать звук урока','Dars audiosini yuklash');
  const total = lessonAudio(unit).length;
  const count = downloading.get(unit);
  const megabytes = lessonAudio(unit).reduce((total,url) => total + ES_AUDIO_BYTES[url.split('/').pop().slice(0,-4)],0) / 1e6;
  const detail = count === undefined ? '' : count + ' / ' + total;
  return button(label,'download',unit,'btn',downloaded.has(unit) || downloading.has(unit) ? 'disabled' : '') +
    '<p class="meta" role="status">' + (detail || megabytes.toFixed(2) + ' MB') + '</p>';
}

function refreshDownload(unit) {
  const element = $('download-audio');
  if (element && Number(element.dataset.unit) === unit) element.innerHTML = downloadControls(unit);
}

async function downloadAudio(unit) {
  if (downloading.has(unit)) return;
  downloading.set(unit,0);
  downloadErrors.delete(unit);
  refreshDownload(unit);
  try {
    const cache = await caches.open(audioCache);
    const files = lessonAudio(unit);
    for (let i=0;i<files.length;i+=4) {
      const results = await Promise.allSettled(files.slice(i,i+4).map(async url => {
        if (await cache.match(url)) return;
        const response = await fetch(url);
        if (response.status !== 200 || !response.headers.get('Content-Type')?.startsWith('audio/')) {
          throw new Error('Invalid MP3 response');
        }
        await cache.put(url,response);
      }));
      downloading.set(unit,downloading.get(unit) + results.filter(result => result.status === 'fulfilled').length);
      refreshDownload(unit);
      if (results.some(result => result.status === 'rejected')) throw new Error('Audio download interrupted');
    }
    downloaded.add(unit);
  } catch {
    downloadErrors.add(unit);
  } finally {
    downloading.delete(unit);
    refreshDownload(unit);
  }
}

async function restoreDownloads() {
  if (!window.caches || document.documentElement.dataset.standalone !== undefined) return;
  try {
    const cache = await caches.open(audioCache);
    const paths = new Set((await cache.keys()).map(request => request.url));
    for (const {id} of ES_UNITS) {
      if (lessonAudio(id).every(url => paths.has(url))) downloaded.add(id);
    }
    refreshDownload(practiceUnit);
  } catch {}
}

function render() {
  document.documentElement.lang = lang;
  document.title = 'HanyuWed · ' + t('Испанский','Ispan tili');
  $('locale').setAttribute('aria-label',t('Язык интерфейса','Interfeys tili'));
  $('navigation').setAttribute('aria-label',t('Разделы','Bo‘limlar'));
  $('home').textContent = t('Выбрать язык','Tilni tanlash');
  for (const element of $('locale').querySelectorAll('button')) {
    element.setAttribute('aria-pressed',String(element.dataset.language === lang));
  }
  $('heading').textContent = t(...views[view]);
  $('navigation').innerHTML = Object.entries(views).map(([id,names]) =>
    button(t(...names),'route',id,'',id === view ? 'aria-current="page"' : '')).join('');
  $('audio-status').textContent = '';
  content.innerHTML = ({topics:renderTopics,cards:renderCards,practice:renderPractice,dictionary:renderDictionary})[view]();
}

function unitOptions(current, all = false) {
  const first = all ? '<option value="all">' + t('Все темы','Barcha bo‘limlar') + '</option>' : '';
  const list = all ? ES_UNITS : ES_UNITS.filter(u => chosen.has(u.id));
  return first + list.map(u => '<option value="' + u.id + '"' + (String(u.id) === String(current) ? ' selected' : '') +
    '>' + esc((u.id + 1) + ' · ' + u.title) + '</option>').join('');
}

function renderTopics() {
  const list = ES_UNITS.map(unit => {
    const words = ES_WORDS.filter(word => word.sources.some(source => source.unit === unit.id));
    const known = words.filter(word => progress.get(word.id) === 'known').length;
    const count = words.filter(word => progress.get(word.id) === 'hard').length;
    const label = '<span class="tile-symbol" aria-hidden="true">' + (unit.id + 1) + '</span><span><span class="tile-title es-text" lang="es">' +
      esc(unit.title) + '</span><span class="meta">' + esc(unit[lang]) + '</span><span class="meta">' +
      known + '/' + words.length + t(' освоено',' ta o‘rganildi') + (count ? ' · '+count+t(' трудных',' ta qiyin') : '') +
      '</span></span><span class="tick" aria-hidden="true">' + (chosen.has(unit.id) ? '✓' : '') + '</span>';
    return '<button type="button" class="tile" data-action="unit" data-value="' + unit.id +
      '" aria-pressed="' + chosen.has(unit.id) + '">' + label + '</button>';
  }).join('');
  const disabled = !chosen.size ? 'disabled' : '';
  return '<section><div class="tile-grid">' + list + '</div><div class="selection actions">' +
    btn('Карточки','Kartochkalar','begin','all','primary',disabled) +
    btn('Практика','Mashqlar','open-practice','','btn',disabled) + '</div></section>';
}

function restoreDeck() {
  const value = saved(keys.deck,null);
  if (!value || !Array.isArray(value.ids) || !Array.isArray(value.opened) || !Number.isInteger(value.index)) return null;
  const entries = value.ids.map(id => wordById.get(id)).filter(Boolean);
  return {hard:value.hard === true,direction:value.direction === 'to-es' ? 'to-es' : 'from-es',
    entries,index:Math.max(0,Math.min(value.index,entries.length)),opened:new Set(value.opened)};
}

function saveDeck() {
  write(keys.deck,deck ? {hard:deck.hard,direction:deck.direction,index:deck.index,
    ids:deck.entries.map(word => word.id),opened:[...deck.opened]} : null);
}

function beginDeck(hard, direction = deck?.direction || 'from-es') {
  deck = {hard,direction,entries:hard ? hardWords() : selectedWords(),index:0,opened:new Set()};
  saveDeck();
}

function wordForms(word) {
  const gender = word.gender ? '<p class="forms">' + t(
    word.gender === 'f' ? 'Женский род' : 'Мужской род',
    word.gender === 'f' ? 'Muannas jins' : 'Muzakkar jins') + '</p>' : '';
  const forms = word.aliases?.length ? '<p class="forms">' +
    t('Формы и варианты · нажми, чтобы послушать','Shakllar va variantlar · tinglash uchun bosing') +
    '</p><div class="listen-controls">' +
    word.aliases.map(form => button(form,'audio',form,'btn','lang="es"')).join('') + '</div>' : '';
  return gender + forms;
}

function wordExample(word) {
  const terms = [word.es,word.bare,...(word.aliases || [])].filter(Boolean)
    .map(term => term.toLowerCase());
  const contexts = ES_LESSONS[word.sources[0].unit].scene;
  const example = contexts.find(([text]) => {
    const words = ' ' + text.toLowerCase().replace(/[^\p{L}\s]/gu,' ') + ' ';
    return terms.some(term => term.length >= 4 && words.includes(' ' + term + ' '));
  });
  if (!example) return '';
  const [text,ru,uz] = example;
  return '<div class="word-example"><p>' + es(text) + '</p><p class="meta">' + esc(t(ru,uz)) +
    '</p><div class="listen-controls">' +
    btn('Слушать пример','Misolni tinglash','audio',text) + '</div></div>';
}

function renderCards() {
  if (!deck) beginDeck(false);
  const word = deck.entries[deck.index];
  const controls = '<div class="bar choices">' +
    button('ES → ' + lang.toUpperCase(),'direction','from-es','', 'aria-pressed="' + (deck.direction === 'from-es') + '"') +
    button(lang.toUpperCase() + ' → ES','direction','to-es','', 'aria-pressed="' + (deck.direction === 'to-es') + '"') +
    button(t('Трудные','Qiyinlar') + ' · ' + hardWords().length,'begin',deck.hard ? 'all' : 'hard','', 'aria-pressed="' + deck.hard + '"') + '</div>';
  if (!word) {
    const message = deck.hard && !hardWords().length ?
      t('Нет трудных слов. Пометь нужные слова кнопкой «Ещё учу».','Tanlangan bo‘limlarda qiyin so‘zlar yo‘q. Keraklilarini «Hali o‘rganyapman» bilan belgilang.') :
      deck.entries.length ? t('Карточки пройдены.','Kartochkalar tugadi.') : t('Выбери хотя бы одну тему.','Kamida bitta bo‘limni tanlang.');
    return '<section>' + controls + '<div class="surface empty"><p>' + message + '</p><div class="actions">' +
      (deck.index > 0 ? btn('Назад','Oldingi','card-move','-1') : '') +
      btn('Выбрать темы','Bo‘lim tanlash','route','topics') +
      btn('Повторить трудные','Qiyinlarini takrorlash','begin','hard','btn',hardWords().length ? '' : 'disabled') + '</div></div></section>';
  }
  const revealed = deck.opened.has(word.id);
  const fromSpanish = deck.direction === 'from-es';
  const main = fromSpanish ? es(word.es) : '<span class="meaning">' + esc(word[lang]) + '</span>';
  const back = fromSpanish ? '<span class="meaning">' + esc(word[lang]) + '</span>' : es(word.es);
  const state = progress.get(word.id);
  return '<section>' + controls + '<p class="meta">' + (deck.index+1) + '/' + deck.entries.length +
    (state === 'hard' ? ' · ' + t('Ещё учу','Hali o‘rganyapman') : state === 'known' ? ' · ' + t('Помню','Bilaman') : '') +
    '</p><button type="button" class="surface flash" data-action="flip" aria-expanded="' + revealed + '">' + main +
    (revealed ? back : '<small>' + t('Показать перевод','Tarjimani ko‘rsatish') + '</small>') + '</button>' +
    (fromSpanish || revealed ? '<div class="listen-controls">' +
      btn('Слушать слово','So‘zni tinglash','audio',word.es) +
      btn('Слово медленно','So‘zni sekin tinglash','audio-slow',word.es) + '</div>' : '') +
    (revealed ? wordForms(word) + wordExample(word) : '') +
    '<div class="actions">' +
    btn('Ещё учу','Hali o‘rganyapman','grade','hard','btn',revealed ? '' : 'disabled') +
    btn('Помню','Bilaman','grade','known','primary',revealed ? '' : 'disabled') +
    btn('Назад','Oldingi','card-move','-1','btn',deck.index ? '' : 'disabled') +
    btn('Вперёд','Keyingi','card-move','1') + '</div></section>';
}

function selectPracticeUnit() {
  if (!chosen.has(practiceUnit)) practiceUnit = [...chosen][0] ?? 0;
}

function renderLesson(lesson) {
  const rules = lesson.rules.map(([ru,uz,bodyRu,bodyUz,phrases]) =>
    '<details class="surface lesson"><summary>' + esc(t(ru,uz)) + '</summary><p>' + esc(t(bodyRu,bodyUz)) +
    '</p><div class="listen-controls">' + phrases.map(phrase => button(phrase,'audio',phrase,'btn','lang="es"')).join('') + '</div></details>').join('');
  const scene = lesson.scene.map(([phrase,ru,uz]) => '<li>' + es(phrase) + ' <p class="meta">' + esc(t(ru,uz)) + '</p>' + player(phrase) + '</li>').join('');
  return rules + '<details class="surface lesson"><summary>' + t('Диалог и самостоятельная реплика','Dialog va mustaqil javob') +
    '</summary><ol>' + scene + '</ol><h2>' + t('Теперь твоя реплика','Endi sizning navbatingiz') + '</h2><p>' +
    esc(t(...lesson.task)) + '</p><details><summary>' + t('Образец','Namuna') + '</summary><p>' +
    es(lesson.model[0]) + '</p><p class="meta">' + esc(t(lesson.model[1],lesson.model[2])) +
    '</p>' + player(lesson.model[0],true) + '</details></details>';
}

function renderPractice() {
  if (session) return session.done ? renderResults() : renderQuestion();
  if (!chosen.size) return '<section>' + btn('Выбрать тему','Bo‘lim tanlash','route','topics') + '</section>';
  selectPracticeUnit();
  const options = [
    ['grammar','Грамматика','Grammatika'],['to-es',lang.toUpperCase()+' → ES',lang.toUpperCase()+' → ES'],
    ['from-es','ES → '+lang.toUpperCase(),'ES → '+lang.toUpperCase()],['dictation','Диктант','Diktant'],
    ['listen','Слушай и выбери','Tinglang va tanlang']
  ];
  const modes = options.map(([id,ru,uz]) => '<option value="' + id + '"' + (mode===id ? ' selected' : '') + '>' + t(ru,uz) + '</option>').join('');
  return '<section><div class="surface lesson"><div class="bar controls"><label>' + t('Тема','Bo‘lim') +
    '<select id="practice-unit">' + unitOptions(practiceUnit) + '</select></label><label>' + t('Режим','Rejim') +
    '<select id="mode">' + modes + '</select></label>' +
    (mode === 'grammar' ? '' : '<label>' + t('Сколько слов','So‘zlar soni') + '<select id="amount">' +
      [6,10,20].map(n => '<option'+(n===amount?' selected':'')+'>'+n+'</option>').join('') + '</select></label>') +
    '</div>' + btn('Начать','Boshlash','start','','primary') + '<div id="download-audio" data-unit="' + practiceUnit + '">' + downloadControls(practiceUnit) + '</div></div>' + renderLesson(ES_LESSONS[practiceUnit]) + '</section>';
}

function drillQuestions(unit) {
  return ES_LESSONS[unit].drills.map(([ru,uz,frame,list,model,hintRu,hintUz,hintType,choices,tokens,punctuation]) => ({
    prompts:{ru,uz}, prompt:'grammar', frame, accepted:list.split('|'), language:'es', model,
    hint:{ru:hintRu,uz:hintUz}, hintType, choices:choices ? choices.split('|') : undefined,
    tokens:tokens ? tokens.split('|') : undefined, punctuation
  }));
}

function wordQuestions(unit, type) {
  const lesson = ES_LESSONS[unit];
  const pool = ES_WORDS.filter(word => word.sources.some(source => source.unit === unit));
  if (type === 'dictation') {
    const phrases = [...new Set([...lesson.scene.map(line => line[0]),...lesson.rules.flatMap(rule => rule[4]),...shuffled(pool.flatMap(word => [word.es,...(word.aliases||[])]))])];
    return phrases.slice(0,amount).map(text => ({prompt:'dictation',audio:text,model:text,accepted:[text],language:'es'}));
  }
  if (type === 'listen') {
    return shuffled(pool).slice(0,amount).map(word => {
      const alternatives = shuffled([...new Set(pool.filter(other =>
        spanishSearch(other.es) !== spanishSearch(word.es) && other.ru !== word.ru && other.uz !== word.uz
      ).map(other => other.es))]).slice(0,2);
      return {prompt:'listen',audio:word.es,choices:shuffled([word.es,...alternatives]),accepted:[word.es],language:'es'};
    });
  }
  return shuffled(pool).slice(0,amount).map(word =>
    ({prompt:type,wordId:word.id,language:type === 'to-es'?'es':lang,accepted:[word.es]}));
}

function questionForLocale(question) {
  const word = wordById.get(question.wordId);
  if (!word) return question;
  if (question.prompt === 'from-es') {
    const translations = ES_WORDS.filter(other => other.es === word.es).map(other => other[lang]);
    return {...question,language:lang,accepted:[...new Set(translations.flatMap(text => text.split(' / ')))],model:word.es};
  }
  const firstMeaning = word[lang].split(' / ')[0];
  const equivalent = ES_WORDS.filter(other => other[lang].split(' / ').includes(firstMeaning) &&
    (Boolean(other.bare) === Boolean(word.bare)));
  return {...question,article:Boolean(word.bare),accepted:[...new Set(equivalent.flatMap(other => [other.es,...(other.bare ? [other.bare] : [])]))],model:word.es};
}

function start(questions) {
  if (!questions.length) return;
  session = {index:0,done:false,questions,replies:[]};
  saveSession();
  render();
  $('answer')?.focus();
}

function saveSession() { write(keys.session,session); }

function questionLabel(q) {
  if (q.prompts) return q.prompts[lang];
  if (q.prompt === 'listen') return t('Прослушай и выбери услышанное.','Tinglang va eshitganingizni tanlang.');
  if (q.prompt === 'dictation') return t('Прослушай запись и набери услышанное.','Audioni tinglang va eshitganingizni yozing.');
  return q.prompt === 'to-es' ? t('Напиши по-испански.','Ispancha yozing.') : t('Переведи на русский.','O‘zbekchaga tarjima qiling.');
}

function reply() {
  const slot = session.replies[session.index] ||= {};
  const q = session.questions[session.index];
  const key = q.prompt === 'from-es' ? lang : 'es';
  return slot[key] ||= {text:'',attempts:0,result:'',assisted:false,solved:false};
}

const feedbacks = {
  correct:['Верно.','To‘g‘ri.'], empty:['Введи ответ.','Javobni yozing.'],
  accent:['Проверь ударение и знак над буквой.','Urg‘u va harf ustidagi belgini tekshiring.'],
  article:['Проверь артикль и его форму.','Artikl va uning shaklini tekshiring.'],
  enye:['Нужна буква ñ.','Ñ harfi kerak.'],
  punctuation:['Проверь знаки в начале и конце вопроса.','Savol boshi va oxiridagi belgilarni tekshiring.'],

  agreement:['Согласуй окончание с родом и числом.','Qo‘shimchani jins va songa moslang.'],
  wrong:['Ответ пока не совпал. Проверь форму и попробуй ещё раз.','Javob hali mos kelmadi. Shaklni tekshirib, yana urinib ko‘ring.'],
  shown:['Образец ответа','Javob namunasi']
};

function feedbackText(q,a) {
  const base = a.result ? t(...(feedbacks[a.result] || feedbacks.wrong)) : '';
  if (a.result === 'accent') {
    const expected = q.accepted.find(option => withoutAcute(spanishSpelling(option)) === withoutAcute(spanishSpelling(a.text)));
    const accents = expected?.match(/[áéíóú]/gi);
    if (accents?.length) return base + ' (' + [...new Set(accents)].join(', ') + ')';
  }
  if (a.result && !['correct','empty','shown','accent','enye','punctuation'].includes(a.result) && q.hint?.[lang]) return base + ' ' + q.hint[lang];
  return base;
}

function renderQuestion() {
  const q = questionForLocale(session.questions[session.index]);
  const a = reply();
  const word = wordById.get(q.wordId);
  const last = session.index === session.questions.length-1;
  const clue = q.frame ? es(q.frame) : word ? q.prompt === 'from-es' ? es(word.es) : esc(word[lang].split(' / ')[0]) : '';
  const keys = q.language === 'es' && !q.choices ? '<div class="accents">' + Array.from('áéíóúüñ¿¡').map(s => button(s,'insert',s)).join('') + '</div>' : '';
  const feedback = feedbackText(q,a);
  const choices = q.choices?.map(choice => button(choice,'choose',choice,'btn','lang="es" aria-pressed="' + (choice === a.text) + '"')).join('') || '';
  const tokens = q.tokens?.map((token,index) => button(token,'token',index,'btn','lang="es" ' + ((a.tokens || []).includes(index) ? 'disabled' : ''))).join('') || '';
  const tone = a.result === 'correct' ? 'good' : a.result === 'shown' ? 'shown' : 'bad';
  return '<section class="surface practice"><p class="meta">' + (session.index+1) + ' / ' + session.questions.length +
    '</p><progress class="progress" value="' +(session.index+1)+ '" max="' + session.questions.length+'"></progress>' +
    '<label for="answer">' + esc(questionLabel(q)) + '</label>' +
    (clue ? '<div class="prompt">' + clue + '</div>' : '') +
    (q.audio ? '<div class="listen-controls">' + player(q.audio,true,true) + '</div>' : '') +
    (choices ? '<div class="listen-controls">' + choices + '</div>' : '') +
    (tokens ? '<div class="listen-controls">' + tokens + btn('Очистить','Tozalash','clear-tokens') + '</div>' : '') +
    '<input id="answer" lang="' + q.language + '" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" ' + (choices ? 'readonly' : '') + ' value="' +
    esc(a.text) + '">' + keys + '<p id="feedback" role="status" data-tone="' + tone + '">' + esc(feedback) + '</p>' +
    (a.assisted ? '<p>' + q.accepted.map(s=>q.language === 'es' ? es(s) : esc(s)).join(' · ') + '</p>' : '') +
    ((a.solved || a.assisted) && q.model && Object.hasOwn(ES_AUDIO,q.model) ?
      '<div class="audio-answer">' + es(q.model) + ' ' + player(q.model,true) + '</div>' : '') +
    '<div class="actions">' + btn('Проверить','Tekshirish','check','','primary') +
    btn('Показать образец','Namunani ko‘rsatish','answer') +
    btn('Назад','Oldingi','question-move','-1','btn',session.index ? '' : 'disabled') +
    button(last ? t('Результат','Natija') : t('Вперёд','Keyingi'),'question-move','1') + '</div>' +
    btn('Закрыть практику','Mashqni yopish','practice-clear','','quiet') + '</section>';
}

function resultAt(index) {
  const q = session.questions[index];
  const a = session.replies[index]?.[q.prompt === 'from-es' ? lang : 'es'];
  if (a?.assisted) return 'assisted';
  if (a?.solved) return a.firstAttempt === 'correct' ? 'first' : 'fixed';
  return a?.attempts ? 'wrong' : 'skipped';
}

function renderResults() {
  const stats = session.questions.map((_,i) => resultAt(i));
  const labels = {first:['С первого раза','Birinchi urinishda'],fixed:['После исправления','Tuzatishdan so‘ng'],
    assisted:['С образцом','Namuna bilan'],wrong:['Пока с ошибкой','Xato bilan'],skipped:['Пропущено','O‘tkazildi']};
  const review = session.questions.map((entry,index) => {
    if (stats[index] === 'first') return '';
    const q = questionForLocale(entry);
    const response = session.replies[index]?.[entry.prompt === 'from-es' ? lang : 'es'];
    return '<li><p>' + esc(questionLabel(q)) + '</p><p class="meta">' + esc(response?.text || t('Пропущено','O‘tkazildi')) +
      '</p><p>' + esc(q.accepted[0]) + '</p>' + (q.hint?.[lang] ? '<p>' + esc(q.hint[lang]) + '</p>' : '') + '</li>';
  }).join('');
  const totals = Object.entries(labels).map(([key,label]) => '<dt>'+t(...label)+'</dt><dd>' +
    stats.filter(s=>s===key).length+'</dd>').join('');
  return '<section class="surface practice"><h2>' + t('Результат','Natija') + '</h2><dl class="summary">' + totals +
    '</dl>' + (review ? '<details><summary>' + t('Посмотреть ответы','Javoblarni ko‘rish') + '</summary><ul>' + review + '</ul></details>' : '') + '<div class="actions">' + btn('Повторить ошибки','Xatolarni takrorlash','retry','','primary',
      stats.every(s=>s==='first')?'disabled':'') +
    btn('Повторить трудные','Qiyinlarini takrorlash','begin','hard','btn',hardWords().length?'':'disabled') +
    btn('К последнему вопросу','Oxirgi savolga','question-move','-1') +
    btn('К настройкам','Sozlamalarga','practice-clear') + '</div></section>';
}

function verify() {
  const a = reply();
  const q = questionForLocale(session.questions[session.index]);
  const value = $('answer').value;
  const result = checkSpanish(value,q);
  if (result !== 'empty' && a.last !== spanishSpelling(value,q.language,q.punctuation)) {
    a.attempts++;
    a.last = spanishSpelling(value,q.language,q.punctuation);
  }
  a.text = value;
  if (result !== 'empty' && a.firstAttempt === undefined) a.firstAttempt = result;
  if (q.wordId && !['correct','empty'].includes(result)) setProgress(q.wordId,'hard');
  a.result = result;
  a.solved = result === 'correct';
  saveSession();
  render();
  if (a.solved) content.querySelector('[data-action="question-move"][data-value="1"]').focus();
  else $('answer').focus();
}

function renderDictionary() {
  return '<section><label for="word-search">' + t('Поиск на ES, RU или UZ','ES, RU yoki UZ bo‘yicha qidiruv') +
    '</label><input id="word-search" type="search" value="' + esc(query) + '" autocomplete="off">' +
    '<div class="bar controls"><label>' + t('Тема','Bo‘lim') + '<select id="dict-unit">' + unitOptions(dictUnit,true) +
    '</select></label>' + btn('Трудные','Qiyinlar','dict-hard','','btn','aria-pressed="' + dictHard + '"') +
    '</div><div id="word-list">' + dictionaryRows() + '</div></section>';
}

function dictionaryRows() {
  const find = spanishSearch(query).replaceAll('ё','е');
  const rows = ES_WORDS.filter(word => {
    if ((dictHard && progress.get(word.id) !== 'hard') ||
        (dictUnit !== 'all' && !word.sources.some(source => source.unit === Number(dictUnit)))) return false;
    return [word.es,word.ru,word.uz,word.bare,...(word.aliases || [])].some(
      text => text && spanishSearch(text).replaceAll('ё','е').includes(find));
  });
  if (!rows.length) return '<p>' + t('Слова не найдены.','So‘z topilmadi.') + '</p>' + btn('Сбросить фильтры','Filtrlarni tozalash','dict-reset');
  const exact = spanishSpelling(query);
  const matchScore = word => [word.es,word.bare,...(word.aliases || [])].some(text => text && spanishSpelling(text) === exact);
  if (find) rows.sort((a,b) => Number(matchScore(b)) - Number(matchScore(a)));
  return '<p class="meta">' + t('Найдено · ','Topildi · ') + rows.length + '</p>' +
    rows.slice(0,dictLimit).map(word => {
      const sources = word.sources.map(s => (s.unit + 1) + ' · ' + (s.page === 'PDF' ? 'PDF' : t('Фото ','Rasm ') + s.page)).join(' / ');
      const hard = progress.get(word.id) === 'hard';
      return '<article class="word"><div><strong>' + es(word.es) + '</strong><p>' + esc(word[lang]) + '</p>' +
        wordForms(word) + wordExample(word) + '<p class="meta">' + esc(sources) + '</p></div><div class="actions">' +
        btn('▶ Слушать','▶ Tinglash','audio',word.es) +
        button(hard ? t('Ещё учу ✓','Hali o‘rganyapman ✓') : t('В трудные','Qiyinlarga'),
          'word-hard',word.id,'btn','aria-pressed="' + hard + '"') + '</div></article>';
    }).join('') + (rows.length>dictLimit ? btn('Показать ещё','Yana ko‘rsatish','dict-more') : '');
}

function updateDictionary() { $('word-list').innerHTML = dictionaryRows(); }

function setProgress(id,status) {
  progress.set(id,status);
  write(keys.word(id),status);
}

document.addEventListener('click',event => {
  const toggle = event.target.closest('button[data-language]');
  if (toggle) {
    stopAudio();
    lang = toggle.dataset.language;
    try { localStorage.setItem(languageKey,lang); }
    catch { storageWarning(); }
    render();
    return;
  }
  const target = event.target.closest('button[data-action]');
  if (!target) return;
  const {action,value} = target.dataset;
  if (action === 'audio' || action === 'audio-slow') { speak(value,action === 'audio-slow'); return; }
  if (action === 'download') { void downloadAudio(Number(value)); return; }
  if (action === 'dict-reset') { query = ''; dictUnit = 'all'; dictHard = false; dictLimit = 35; }
  if (action === 'choose' || action === 'token' || action === 'clear-tokens') {
    const a = reply();
    if (action === 'choose') {
      a.text = value;
    } else {
      const q = session.questions[session.index];
      a.tokens = action === 'clear-tokens' ? [] : [...(a.tokens || []),Number(value)];
      a.text = a.tokens.map(index => q.tokens[index]).join(' ');
    }
    a.result = '';
    a.solved = false;
    saveSession();
    render();
    return;
  }
  if (action === 'route') { go(value); return; }
  if (action === 'open-practice') { go('practice'); return; }
  if (action === 'unit') {
    const unit = Number(value);
    if (chosen.has(unit)) chosen.delete(unit);
    else chosen.add(unit);
    deck = null;
    saveDeck();
    write(keys.units,[...chosen]);
    render();
    content.querySelector('[data-action="unit"][data-value="' + unit + '"]')?.focus();
    return;
  }
  if (action === 'begin' || action === 'direction') {
    beginDeck(action === 'begin' ? value === 'hard' : deck.hard,action === 'direction' ? value : undefined);
    go('cards');
    return;
  }
  if (action === 'flip') {
    const word = deck.entries[deck.index];
    if (deck.opened.has(word.id)) deck.opened.delete(word.id);
    else deck.opened.add(word.id);
  }
  if (action === 'card-move') {
    stopAudio();
    deck.index = Math.max(0,Math.min(deck.entries.length,deck.index + Number(value)));
  }
  if (action === 'grade') {
    const word = deck.entries[deck.index];
    setProgress(word.id,value);
    stopAudio();
    if (deck.hard && value === 'known') deck.entries.splice(deck.index,1);
    else deck.index++;
  }
  if (action === 'start') {
    start(mode === 'grammar' ? drillQuestions(practiceUnit) : wordQuestions(practiceUnit,mode));
    return;
  }
  if (action === 'check') { verify(); return; }
  if (action === 'insert') {
    const input = $('answer');
    input.setRangeText(value,input.selectionStart,input.selectionEnd,'end');
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.focus();
    return;
  }
  if (action === 'answer') {
    const a = reply();
    if (!a.solved) {
      a.assisted = true;
      a.result = 'shown';
      saveSession();
    }
  }
  if (action === 'question-move') {
    stopAudio();
    if (session.done) session.done = false;
    else if (session.index + Number(value) === session.questions.length) session.done = true;
    else session.index = Math.max(0,session.index + Number(value));
    saveSession();
    render();
    $('answer')?.focus();
    return;
  }
  if (action === 'retry') { start(session.questions.filter((_,i) => resultAt(i)!=='first')); return; }
  if (action === 'practice-clear') {
    session = null;
    saveSession();
    stopAudio();
  }
  if (action === 'dict-hard') { dictHard = !dictHard; dictLimit = 35; }
  if (action === 'dict-more') { dictLimit += 35; updateDictionary(); return; }
  if (action === 'word-hard') {
    setProgress(value,progress.get(value) === 'hard' ? null : 'hard');
    deck = null;
    saveDeck();
    updateDictionary();
    return;
  }
  if (['flip','card-move','grade'].includes(action)) saveDeck();
  render();
  if (action === 'flip') content.querySelector('[data-action="flip"]')?.focus();
});

content.addEventListener('input',event => {
  if (event.target.id === 'word-search') {
    query = event.target.value;
    dictLimit = 35;
    updateDictionary();
  }
  if (event.target.id === 'answer') {
    const a = reply();
    a.text = event.target.value;
    a.tokens = [];
    if (a.last !== spanishSpelling(a.text, questionForLocale(session.questions[session.index]).language,session.questions[session.index].punctuation)) {
      a.solved = false;
      a.result = '';
      $('feedback').textContent = '';
    }
    saveSession();
  }
});

content.addEventListener('change',event => {
  const {id,value} = event.target;
  if (id === 'dict-unit') { dictUnit = value; dictLimit = 35; updateDictionary(); }
  if (id === 'practice-unit') { practiceUnit = Number(value); render(); }
  if (id === 'mode') { mode = value; render(); }
  if (id === 'amount') amount = Number(value);
});

content.addEventListener('keydown',event => {
  if (event.target.id === 'answer' && event.key === 'Enter' && !event.isComposing) {
    event.preventDefault();
    verify();
  }
});

window.addEventListener('hashchange',route);
window.addEventListener('pageshow',() => {
  const current = readLanguage();
  if (lang !== current) { lang = current; render(); }
});
window.addEventListener('storage',event => {
  if (event.key === languageKey) { stopAudio(); lang = readLanguage(); render(); }
  if (event.key?.startsWith(prefix + 'progress:v1:')) {
    const id = event.key.slice((prefix+'progress:v1:').length);
    if (wordById.has(id)) progress.set(id,saved(keys.word(id),null));
    if (view !== 'practice') render();
  }
});
window.addEventListener('pagehide',stopAudio);
route();
void restoreDownloads();
if (document.documentElement.dataset.standalone === undefined && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('../sw.js').catch(() => {});
}
