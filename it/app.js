'use strict';

const {languageKey, readLanguage, readStored:saved, writeStored} = HanyuCourse;
const prefix = 'hanyuwed:it:';
const keys = {units: prefix + 'units:v1', deck: prefix + 'deck:v1', session: prefix + 'session:v1', word: id => prefix + 'progress:v1:' + id};
const $ = id => document.getElementById(id);
const content = $('content');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[c]));

function write(key, value) {
  if (!writeStored(key,value)) storageWarning();
}

function storageWarning() {
  $('storage-message').hidden = false;
  $('storage-message').textContent = t('Браузер не сохранил прогресс. Можно продолжать в этой вкладке.',
    'Brauzer natijani saqlamadi. Shu oynada davom etish mumkin.');
}

let lang = readLanguage();
const t = (ru,uz) => lang === 'uz' ? uz : ru;
const wordById = new Map(IT_WORDS.map(word => [word.id,word]));
const progress = new Map(IT_WORDS.map(word => [word.id,saved(keys.word(word.id),null)]));
const units = saved(keys.units,[0]);
const chosen = new Set(Array.isArray(units) ? units.filter(n => Number.isInteger(n) && IT_UNITS[n]) : [0]);
const views = {
  topics: ['Юниты','Bo‘limlar'],
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
let audio = null;
const courseBase = new URL('./', location.href);

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
  if (location.hash === '#' + destination) {
    route();
    $('heading').focus();
  }
  else location.hash = destination;
}

function selectedWords() {
  return IT_WORDS.filter(word => word.sources.some(source => chosen.has(source.unit)));
}

function hardWords() {
  return selectedWords().filter(word => progress.get(word.id) === 'hard');
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

function it(text, classes = 'it-text') {
  return '<span lang="it" class="' + classes + '">' + esc(text) + '</span>';
}

function player(text, slow = false, hideText = false) {
  const label = hideText ? t('Прослушать задание','Topshiriqni tinglash') : t('Слушать · ','Tinglash · ') + text;
  return btn('▶ Слушать','▶ Tinglash','audio',text,'btn', 'aria-label="' + esc(label) + '"') +
    (slow ? btn('Медленнее','Sekinroq','audio-slow',text) : '');
}

function stopAudio() {
  if (!audio) return;
  audio.pause();
  audio = null;
}

function speak(text, slow) {
  stopAudio();
  const status = $('audio-status');
  status.textContent = '';
  if (!Object.hasOwn(IT_AUDIO,text)) {
    status.textContent = t('Запись недоступна.','Audio mavjud emas.');
    return;
  }
  const clip = new Audio(new URL('audio/' + IT_AUDIO[text] + '.mp3', courseBase).href);
  audio = clip;
  status.textContent = t('Загружается запись…','Audio yuklanmoqda…');
  clip.preservesPitch = true;
  clip.playbackRate = slow ? 0.78 : 1;
  function failed() {
    if (audio === clip) status.textContent = t('Запись не загрузилась. Нажми «Слушать» ещё раз.','Audio yuklanmadi. «Tinglash»ni qayta bosing.');
  }
  clip.addEventListener('playing',() => {
    if (audio === clip) status.textContent = t('Воспроизведение…','Ijro etilmoqda…');
  });
  clip.addEventListener('ended',() => {
    if (audio === clip) status.textContent = '';
  });
  clip.addEventListener('error',failed,{once:true});
  clip.play().catch(failed);
}

function render() {
  document.documentElement.lang = lang;
  document.title = 'HanyuWed · ' + t('Итальянский','Italyan tili');
  $('locale').setAttribute('aria-label',t('Язык интерфейса','Interfeys tili'));
  $('navigation').setAttribute('aria-label',t('Разделы','Bo‘limlar'));
  $('home').textContent = t('Выбрать язык','Tilni tanlash');
  for (const element of $('locale').querySelectorAll('button')) {
    element.setAttribute('aria-pressed',String(element.dataset.language === lang));
  }
  $('heading').textContent = t(...views[view]);
  $('navigation').innerHTML = Object.entries(views).map(([id,names]) =>
    button(t(...(HanyuCourse.labels[id === 'topics' ? 'units' : id] || names)),
      'route',id,'',id === view ? 'aria-current="page"' : '')).join('');
  $('audio-status').textContent = '';
  content.innerHTML = ({topics:renderTopics,cards:renderCards,practice:renderPractice,dictionary:renderDictionary})[view]();
}

function unitOptions(current, all = false) {
  const first = all ? '<option value="all">' + t('Все юниты','Barcha bo‘limlar') + '</option>' : '';
  const list = all ? IT_UNITS : IT_UNITS.filter(u => chosen.has(u.id));
  return first + list.map(u => '<option value="' + u.id + '"' + (String(u.id) === String(current) ? ' selected' : '') +
    '>' + esc((u.id || '0') + ' · ' + u.title) + '</option>').join('');
}

function cardCount(count) {
  if (lang === 'uz') return count + ' ta kartochka';
  const lastTwo = count % 100;
  const last = count % 10;
  const noun = lastTwo >= 11 && lastTwo <= 14 ? 'карточек' :
    last === 1 ? 'карточка' : last >= 2 && last <= 4 ? 'карточки' : 'карточек';
  return count + ' ' + noun;
}

function renderTopics() {
  const list = IT_UNITS.map(unit => {
    const words = IT_WORDS.filter(word => word.sources.some(source => source.unit === unit.id));
    const count = words.filter(word => progress.get(word.id) === 'hard').length;
    const label = '<span class="tile-symbol" aria-hidden="true">' + unit.id + '</span><span><span class="tile-title it-text" lang="it">' +
      esc(unit.title) + '</span><span class="meta">' + esc(unit[lang]) + '</span><span class="meta">' +
      cardCount(words.length) + (count ? ' · '+count+t(' трудных',' ta qiyin') : '') +
      '</span></span><span class="tick" aria-hidden="true">' + (chosen.has(unit.id) ? '✓' : '') + '</span>';
    return '<button type="button" class="tile" data-action="unit" data-value="' + unit.id +
      '" aria-pressed="' + chosen.has(unit.id) + '">' + label + '</button>';
  }).join('');
  const disabled = !chosen.size ? 'disabled' : '';
  return '<section><div class="tile-grid">' + list + '</div><div class="selection actions">' +
    btn('Карточки','Kartochkalar','begin','all','primary',disabled) +
    btn('Практика','Mashqlar','open-practice','','btn',disabled) + '</div></section>';
}

function beginDeck(hard, direction = deck?.direction || 'from-it') {
  deck = {hard,direction,entries:hard ? hardWords() : selectedWords(),index:0,opened:new Set()};
  saveDeck();
}

function restoreDeck() {
  const value = saved(keys.deck,null);
  if (!value || !Array.isArray(value.ids) || !Array.isArray(value.opened) || !Number.isInteger(value.index) ||
      !Array.isArray(value.units) || value.units.join() !== [...chosen].join()) return null;
  const entries = value.ids.map(id => wordById.get(id)).filter(Boolean);
  return {hard:value.hard === true,direction:value.direction === 'to-it' ? 'to-it' : 'from-it', entries,
    index:Math.max(0,Math.min(value.index,entries.length)),opened:new Set(value.opened)};
}

function saveDeck() {
  write(keys.deck, deck ? {units:[...chosen],hard:deck.hard,direction:deck.direction,index:deck.index,
    ids:deck.entries.map(word => word.id),opened:[...deck.opened]} : null);
}

function nounForms(word) {
  if (!word.forms) return '';
  const gender = word.forms.gender === 'f' ? t('ж. р.','muannas') : t('м. р.','muzakkar');
  return '<p class="forms">' + it(word.forms.singular) + ' (' + gender + ') → ' + it(word.forms.plural) +
    (word.forms.pluralGender ? ' (' + t('ж. р.','muannas') + ')' : '') + '</p>';
}

function renderCards() {
  if (!deck) beginDeck(false);
  const word = deck.entries[deck.index];
  const controls = '<div class="bar choices">' +
    button('IT → ' + lang.toUpperCase(),'direction','from-it','', 'aria-pressed="' + (deck.direction === 'from-it') + '"') +
    button(lang.toUpperCase() + ' → IT','direction','to-it','', 'aria-pressed="' + (deck.direction === 'to-it') + '"') +
    button(t('Трудные','Qiyinlar') + ' · ' + hardWords().length,'begin',deck.hard ? 'all' : 'hard','', 'aria-pressed="' + deck.hard + '"') + '</div>';
  if (!word) {
    const message = deck.hard && !hardWords().length ?
      t('Нет трудных слов в выбранных юнитах. Пометь нужные слова кнопкой «Ещё учу».','Tanlangan bo‘limlarda qiyin so‘zlar yo‘q. Keraklilarini «Hali o‘rganyapman» bilan belgilang.') :
      deck.entries.length ? t('Карточки пройдены.','Kartochkalar tugadi.') : t('Выбери хотя бы один юнит.','Kamida bitta bo‘limni tanlang.');
    return '<section>' + controls + '<div class="surface empty"><p>' + message + '</p><div class="actions">' +
      (deck.index > 0 ? btn('Назад','Oldingi','card-move','-1') : '') +
      btn('Выбрать юниты','Bo‘lim tanlash','route','topics') +
      btn('Повторить трудные','Qiyinlarini takrorlash','begin','hard','btn',hardWords().length ? '' : 'disabled') + '</div></div></section>';
  }
  const revealed = deck.opened.has(word.id);
  const fromItalian = deck.direction === 'from-it';
  const main = fromItalian ? it(word.it) : '<span class="meaning">' + esc(word[lang]) + '</span>';
  const back = fromItalian ? '<span class="meaning">' + esc(word[lang]) + '</span>' : it(word.it);
  const state = progress.get(word.id);
  return '<section>' + controls + '<p class="meta">' + (deck.index+1) + '/' + deck.entries.length +
    (state === 'hard' ? ' · ' + t('Ещё учу','Hali o‘rganyapman') : state === 'known' ? ' · ' + t('Знаю','Bilaman') : '') +
    '</p><button type="button" class="surface flash" data-action="flip" aria-expanded="' + revealed + '">' + main +
    (revealed ? back : '<small>' + t('Показать перевод','Tarjimani ko‘rsatish') + '</small>') + '</button>' +
    (revealed ? nounForms(word) : '') +
    (fromItalian || revealed ? '<div class="listen-controls">' + player(word.it,true) +
      (revealed && word.forms ? btn('Артикль + слово','Artikl + so‘z','audio',word.forms.singular) : '') + '</div>' : '') +
    '<div class="actions">' +
    btn('Ещё учу','Hali o‘rganyapman','grade','hard','btn',revealed ? '' : 'disabled') +
    btn('Знаю','Bilaman','grade','known','primary',revealed ? '' : 'disabled') +
    btn('Назад','Oldingi','card-move','-1','btn',deck.index ? '' : 'disabled') +
    btn('Вперёд','Keyingi','card-move','1') + '</div></section>';
}

function selectPracticeUnit() {
  if (!chosen.has(practiceUnit)) practiceUnit = [...chosen][0] ?? 0;
}

function renderLesson(lesson) {
  const rules = lesson.rules.map(([ru,uz,bodyRu,bodyUz,phrases]) =>
    '<details class="surface lesson"><summary>' + esc(t(ru,uz)) + '</summary><p>' + esc(t(bodyRu,bodyUz)) +
    '</p><div class="listen-controls">' + phrases.map(phrase => button(phrase,'audio',phrase,'btn','lang="it"')).join('') + '</div></details>').join('');
  const scene = lesson.scene.map(([phrase,ru,uz]) => '<li>' + it(phrase) + ' <p class="meta">' + esc(t(ru,uz)) + '</p>' + player(phrase) + '</li>').join('');
  return rules + '<details class="surface lesson"><summary>' + t('Диалог и самостоятельная реплика','Dialog va mustaqil javob') +
    '</summary><ol>' + scene + '</ol><h2>' + t('Теперь твоя реплика','Endi sizning navbatingiz') + '</h2><p>' +
    esc(t(...lesson.task)) + '</p><details><summary>' + t('Образец','Namuna') + '</summary><p>' +
    it(lesson.model[0]) + '</p><p class="meta">' + esc(t(lesson.model[1],lesson.model[2])) +
    '</p>' + player(lesson.model[0],true) + '</details></details>';
}

function renderPractice() {
  if (session) return session.done ? renderResults() : renderQuestion();
  if (!chosen.size) return '<section>' + btn('Выбрать юнит','Bo‘lim tanlash','route','topics') + '</section>';
  selectPracticeUnit();
  const options = [
    ['grammar','Грамматика','Grammatika'],['to-it',lang.toUpperCase()+' → IT',lang.toUpperCase()+' → IT'],
    ['from-it','IT → '+lang.toUpperCase(),'IT → '+lang.toUpperCase()],['dictation','Диктант','Diktant']
  ];
  const modes = options.map(([id,ru,uz]) => '<option value="' + id + '"' + (mode===id ? ' selected' : '') + '>' + t(ru,uz) + '</option>').join('');
  return '<section><div class="surface lesson"><div class="bar controls"><label>' + t('Юнит','Bo‘lim') +
    '<select id="practice-unit">' + unitOptions(practiceUnit) + '</select></label><label>' + t('Режим','Rejim') +
    '<select id="mode">' + modes + '</select></label>' +
    (mode === 'grammar' ? '' : '<label>' + t('Сколько слов','So‘zlar soni') + '<select id="amount">' +
      [6,10,20].map(n => '<option'+(n===amount?' selected':'')+'>'+n+'</option>').join('') + '</select></label>') +
    '</div>' + btn('Начать','Boshlash','start','','primary') +
    btn('Изменить выбранные юниты','Tanlangan bo‘limlarni o‘zgartirish','route','topics') +
    '</div>' + renderLesson(IT_LESSONS[practiceUnit]) + '</section>';
}

function drillQuestions(unit) {
  return IT_LESSONS[unit].drills.map(([ru,uz,frame,list,sound]) => ({
    prompts:{ru,uz}, prompt:ru, frame, accepted:list.split('|'), language:'it', sound:Boolean(sound)
  }));
}

function wordQuestions(unit, type) {
  const lesson = IT_LESSONS[unit];
  const pool = IT_WORDS.filter(word => word.sources.some(source => source.unit === unit));
  if (type === 'dictation') {
    const practiceSounds = lesson.sounds || [];
    const phrases = [...new Set([...practiceSounds,...shuffled(pool).map(word => word.it)])].slice(0,amount);
    return phrases.map(text => ({prompt:'dictation',audio:text,sound:true,accepted:[text],language:'it'}));
  }
  return shuffled(pool).slice(0,amount).map(word =>
    ({prompt:type,wordId:word.id,language:type === 'to-it'?'it':lang,accepted:[word.it]}));
}

function questionForLocale(question) {
  const word = wordById.get(question.wordId);
  if (!word) return question;
  if (question.prompt === 'from-it') {
    const target = word[lang];
    const meanings = target.split(/\s+\/\s+|\s+ yoki\s+/);
    return {...question,language:lang,accepted:[target,...meanings]};
  }
  const equivalents = IT_WORDS.filter(candidate => candidate[lang] === word[lang]);
  const accepted = equivalents.flatMap(candidate => [candidate.it, ...(candidate.forms ? [candidate.forms.singular] : [])]);
  return {...question,accepted:[...new Set(accepted)]};
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
  if (q.prompt === 'dictation') return t('Прослушай запись и набери услышанное.','Audioni tinglang va eshitganingizni yozing.');
  return q.prompt === 'to-it' ? t('Напиши по-итальянски.','Italyancha yozing.') : t('Переведи на русский.','O‘zbekchaga tarjima qiling.');
}

function reply() {
  const slot = session.replies[session.index] ||= {};
  const q = session.questions[session.index];
  const key = q.prompt === 'from-it' ? lang : 'it';
  return slot[key] ||= {text:'',attempts:0,result:'',assisted:false,solved:false};
}

const feedbacks = {
  correct:['Верно.','To‘g‘ri.'], empty:['Введи ответ.','Javobni yozing.'],
  accent:['Проверь ударение и знак над буквой.','Urg‘u va harf ustidagi belgini tekshiring.'],
  article:['Проверь артикль и его форму.','Artikl va uning shaklini tekshiring.'],
  apostrophe:['Проверь апостроф и пробел рядом с ним.','Tutuq belgisi va uning yonidagi bo‘shliqni tekshiring.'],
  double:['Проверь, одна согласная или две.','Bitta yoki ikkita undoshni tekshiring.'],
  agreement:['Согласуй окончание с родом и числом.','Qo‘shimchani jins va songa moslang.'],
  auxiliary:['Проверь вспомогательный глагол.','Yordamchi fe’lni tekshiring.'],
  placement:['Проверь положение местоимения.','Olmoshning o‘rnini tekshiring.'],
  wrong:['Ответ пока не совпал. Проверь форму и попробуй ещё раз.','Javob hali mos kelmadi. Shaklni tekshirib, yana urinib ko‘ring.'],
  shown:['Образец ответа','Javob namunasi']
};

function renderQuestion() {
  const q = questionForLocale(session.questions[session.index]);
  const a = reply();
  const word = wordById.get(q.wordId);
  const last = session.index === session.questions.length-1;
  const clue = q.frame ? it(q.frame) : word ? q.prompt === 'from-it' ? it(word.it) : esc(word[lang]) : '';
  const keys = q.language === 'it' ? '<div class="accents">' + Array.from('àèéìòù’').map(s => button(s,'insert',s)).join('') + '</div>' : '';
  const feedback = a.result ? t(...(feedbacks[a.result] || feedbacks.wrong)) : '';
  const tone = a.result === 'correct' ? 'good' : a.result === 'shown' ? 'shown' : 'bad';
  return '<section class="surface practice"><p class="meta">' + (session.index+1) + ' / ' + session.questions.length +
    '</p><progress class="progress" value="' +(session.index+1)+ '" max="' + session.questions.length +
    '" aria-label="' + t('Ход практики','Mashq jarayoni') + '"></progress>' +
    '<label for="answer">' + esc(questionLabel(q)) + '</label>' +
    (clue ? '<div class="prompt">' + clue + '</div>' : '') +
    (q.audio ? '<div class="listen-controls">' + player(q.audio,true,true) + '</div>' : '') +
    '<input id="answer" lang="' + q.language + '" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" value="' +
    esc(a.text) + '">' + keys + '<p id="feedback" role="status" data-tone="' + tone + '">' + esc(feedback) + '</p>' +
    (a.assisted ? '<p>' + q.accepted.map(s=>q.language === 'it' ? it(s) : esc(s)).join(' · ') + '</p>' : '') +
    ((a.solved || a.assisted) && q.language === 'it' && Object.hasOwn(IT_AUDIO,q.accepted[0]) ?
      '<div class="audio-answer">' + player(q.accepted[0],true) + '</div>' : '') +
    '<div class="actions">' + btn('Проверить','Tekshirish','check','','primary') +
    btn('Показать образец','Namunani ko‘rsatish','answer') +
    btn('Назад','Oldingi','question-move','-1','btn',session.index ? '' : 'disabled') +
    button(last ? t('Результат','Natija') : t('Вперёд','Keyingi'),'question-move','1') + '</div>' +
    btn('Закрыть практику','Mashqni yopish','practice-clear','','quiet') + '</section>';
}

function resultAt(index) {
  const q = session.questions[index];
  const a = session.replies[index]?.[q.prompt === 'from-it' ? lang : 'it'];
  if (a?.assisted) return 'assisted';
  if (a?.solved) return a.attempts === 1 ? 'first' : 'fixed';
  return a?.attempts ? 'wrong' : 'skipped';
}

function renderResults() {
  const stats = session.questions.map((_,i) => resultAt(i));
  const labels = {first:['С первого раза','Birinchi urinishda'],fixed:['После исправления','Tuzatishdan so‘ng'],
    assisted:['С образцом','Namuna bilan'],wrong:['Пока с ошибкой','Xato bilan'],skipped:['Пропущено','O‘tkazildi']};
  const totals = Object.entries(labels).map(([key,label]) => '<dt>'+t(...label)+'</dt><dd>' +
    stats.filter(s=>s===key).length+'</dd>').join('');
  const review = session.questions.map((question, index) => {
    const item = questionForLocale(question);
    const word = wordById.get(item.wordId);
    const userReply = session.replies[index]?.[item.prompt === 'from-it' ? lang : 'it'];
    const prompt = item.frame || (word ? (item.prompt === 'from-it' ? word.it : word[lang]) : questionLabel(item));
    return '<li><strong>' + esc(prompt) + '</strong> · ' + esc(t(...labels[stats[index]])) +
      '<p>' + t('Твой ответ','Javobingiz') + ': ' + esc(userReply?.text || '—') + '</p>' +
      '<p>' + t('Возможный ответ','Mumkin bo‘lgan javob') + ': ' + esc(item.accepted.join(' · ')) + '</p></li>';
  }).join('');
  return '<section class="surface practice"><h2>' + t('Результат','Natija') + '</h2><dl class="summary">' + totals +
    '</dl><details><summary>' + t('Посмотреть ответы','Javoblarni ko‘rish') + '</summary><ol>' + review +
    '</ol></details><div class="actions">' + btn('Повторить ошибки','Xatolarni takrorlash','retry','','primary',
      stats.every(s=>s==='first')?'disabled':'') +
    btn('Повторить трудные','Qiyinlarini takrorlash','begin','hard','btn',hardWords().length?'':'disabled') +
    btn('К последнему вопросу','Oxirgi savolga','question-move','-1') +
    btn('К настройкам','Sozlamalarga','practice-clear') + '</div></section>';
}

function verify() {
  const a = reply();
  const q = questionForLocale(session.questions[session.index]);
  const value = $('answer').value;
  const result = checkItalian(value,q);
  if (result !== 'empty' && a.last !== italianSpelling(value,q.language)) {
    a.attempts++;
    a.last = italianSpelling(value,q.language);
  }
  a.text = value;
  a.result = result;
  a.solved = result === 'correct';
  saveSession();
  render();
  if (a.solved) content.querySelector('[data-action="question-move"][data-value="1"]').focus();
  else $('answer').focus();
}

function renderDictionary() {
  return '<section><label for="word-search">' + t('Поиск на IT, RU или UZ','IT, RU yoki UZ bo‘yicha qidiruv') +
    '</label><input id="word-search" type="search" value="' + esc(query) + '" autocomplete="off">' +
    '<div class="bar controls"><label>' + t('Юнит','Bo‘lim') + '<select id="dict-unit">' + unitOptions(dictUnit,true) +
    '</select></label>' + btn('Трудные','Qiyinlar','dict-hard','','btn','aria-pressed="' + dictHard + '"') +
    '</div><div id="word-list">' + dictionaryRows() + '</div></section>';
}

function dictionaryRows() {
  const scope = IT_WORDS.filter(word => {
    if ((dictHard && progress.get(word.id) !== 'hard') ||
        (dictUnit !== 'all' && !word.sources.some(source => source.unit === Number(dictUnit)))) return false;
    return true;
  });
  const rows = HanyuCourse.rankedDictionary(scope, query,
    word => [word.it,word.ru,word.uz,word.forms?.singular,word.forms?.plural,...(word.aliases || [])],
    text => HanyuCourse.normalizeSearch(italianSearch(text)));
  if (!rows.length) return '<p>' + t('Слова не найдены.','So‘z topilmadi.') + '</p>';
  return '<p class="meta">' + t('Найдено · ','Topildi · ') + rows.length + '</p>' +
    rows.slice(0,dictLimit).map(word => {
      const sources = word.sources.map(s => 'Nuovo Progetto Italiano 1 · ' +
        (s.unit ? t('юнит ','bo‘lim ') + s.unit : t('вводный юнит','kirish bo‘limi')) +
        ' · ' + t('стр. ','sahifa ') + s.page).join(' / ');
      const hard = progress.get(word.id) === 'hard';
      return '<article class="word"><div><strong>' + it(word.it) + '</strong><p>' + esc(word[lang]) + '</p>' +
        nounForms(word) + '<p class="meta">' + esc(sources) + '</p></div><div class="actions">' +
        btn('▶ Слушать','▶ Tinglash','audio',word.it) +
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
  if (action === 'route') { go(value); return; }
  if (action === 'open-practice') { go('practice'); return; }
  if (action === 'unit') {
    const unit = Number(value);
    if (chosen.has(unit)) chosen.delete(unit);
    else chosen.add(unit);
    deck = null;
    write(keys.units,[...chosen]);
    saveDeck();
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
    if (a.last !== italianSpelling(a.text, questionForLocale(session.questions[session.index]).language)) {
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

window.addEventListener('hashchange',() => {
  route();
  $('heading').focus();
});
window.addEventListener('pageshow',() => {
  const current = readLanguage();
  if (lang !== current) { lang = current; render(); }
});
window.addEventListener('storage',event => {
  if (event.key === languageKey) { lang = readLanguage(); render(); }
  if (event.key?.startsWith(prefix + 'progress:v1:')) {
    const id = event.key.slice((prefix+'progress:v1:').length);
    if (wordById.has(id)) progress.set(id,saved(keys.word(id),null));
    if (view !== 'practice') render();
  }
});
window.addEventListener('pagehide',stopAudio);
route();
if (document.documentElement.dataset.standalone === undefined && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('../sw.js').catch(() => {});
}
