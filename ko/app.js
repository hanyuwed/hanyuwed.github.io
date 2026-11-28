import {entries, units} from './data.js';
import {contextTasks, evaluate, forSearch, numberTasks, spellingTask} from './answers.js?v=2';
import {KO_AUDIO} from './audio-index.js';

const $ = id => document.getElementById(id);
const allUnitIds = units.map((_, index) => index + 1);
const standalone = document.documentElement.hasAttribute('data-standalone');
const prefix = standalone ? 'hanyuwed:ko:preview:' : 'hanyuwed:ko:snu1a:';
const settingsKey = prefix + 'settings:v1';
const cardsKey = prefix + 'cards:v1';
const practiceKey = prefix + 'practice:v1';
const languageKey = standalone ? prefix + 'language' : HanyuCourse.languageKey;
const markKey = id => prefix + 'marks:v1:' + id;
const legacyKey = 'hanyuwed-ko-snu1a-v1';

function load(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function json(key) {
  try { return JSON.parse(load(key)); } catch { return null; }
}
function save(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}
function migrate() {
  if (load(prefix + 'migration:v1')) return;
  const legacy = json(legacyKey);
  if (!legacy || typeof legacy !== 'object') return;
  let ok = true;
  entries.forEach(({id}, index) => {
    const mark = legacy.marks?.[index];
    if (!load(markKey(id)) && ['known','hard'].includes(mark)) {
      ok = save(markKey(id), mark) && ok;
    }
  });
  if (!load(settingsKey) && Array.isArray(legacy.selected)) {
    ok = save(settingsKey, JSON.stringify(allUnitIds.filter(id => legacy.selected.includes(id)))) && ok;
  }
  if (!load(languageKey) && ['ru','uz'].includes(legacy.language)) {
    ok = save(languageKey, legacy.language) && ok;
  }
  if (ok) save(prefix + 'migration:v1', 'done');
}
migrate();
const saved = json(settingsKey);
let language = load(languageKey) === 'uz' ? 'uz' : 'ru';
let selected = new Set(Array.isArray(saved) ? allUnitIds.filter(id => saved.includes(id)) : allUnitIds);
const marks = new Map(entries.map(word => [word.id, load(markKey(word.id))])
  .filter(([, mark]) => ['known','hard'].includes(mark)));
let view = 'units';
let cardMode = 'all';
let cardReverse = false;
let showReading = false;
let cards = null;
let practiceDirection = 'hangul';
let practice = null;
const practiceControls = ['practice-mode', 'practice-limit', 'number-kind'];

const t = (ru, uz) => language === 'uz' ? uz : ru;
const nameFor = id => t(units[id - 1][1], units[id - 1][2]);
const chosen = () => entries.filter(word => selected.has(word.unit));
const text = (id, value) => { $(id).textContent = value; };
const show = (id, yes) => { $(id).hidden = !yes; };
const pressed = (element, yes) => element.setAttribute('aria-pressed', String(yes));
const labelFor = id => id <= 8 ? t(`Урок ${id}`, `${id}-dars`) : '';
const countFor = count => t(`Карточек: ${count}`, `Kartochkalar: ${count} ta`);
const positionFor = (index, length) => `${index + 1} / ${length}`;
const displayWord = word => word.forms.join(' · ');

function node(tag, className, value) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = value;
  return element;
}
function randomOrder(list) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function setProgress(id, value, total) {
  $(id).max = total;
  $(id).value = value;
}
let statusTimer;
let activeRecording;
function status(message) {
  clearTimeout(statusTimer);
  text('status', message);
  show('status', Boolean(message));
  if (message) statusTimer = setTimeout(() => status(''), 5000);
}
function stopAudio() {
  activeRecording?.pause();
  activeRecording = null;
  window.speechSynthesis?.cancel();
  status('');
}
function koreanVoice() {
  return window.speechSynthesis?.getVoices().find(item => /^ko(?:[-_]|$)/i.test(item.lang));
}
function speakWithVoice(ko) {
  const voice = koreanVoice();
  if (!voice || !window.SpeechSynthesisUtterance) {
    status(t('Для озвучки добавь корейский голос в настройках устройства.', 'Tinglash uchun qurilma sozlamalarida koreyscha ovozni qo‘sh.'));
    return;
  }
  const utterance = new SpeechSynthesisUtterance(ko);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = .86;
  utterance.onerror = event => {
    if (event.error !== 'interrupted' && event.error !== 'canceled') {
      status(t('Голос не запустился. Попробуй ещё раз.', 'Ovoz boshlanmadi. Yana urinib ko‘r.'));
    }
  };
  window.speechSynthesis.speak(utterance);
}
function speak(ko) {
  stopAudio();
  const path = KO_AUDIO[ko.trim()];
  if (!path) {
    speakWithVoice(ko);
    return;
  }
  const recording = new Audio(new URL(path, import.meta.url).href);
  activeRecording = recording;
  status(t('Загружается запись…','Audio yuklanmoqda…'));
  recording.onended = () => {
    if (activeRecording !== recording) return;
    activeRecording = null;
    status('');
  };
  recording.play().then(() => {
    if (activeRecording === recording) status(t('Воспроизведение…','Ijro etilmoqda…'));
  }).catch(() => {
    if (activeRecording !== recording) return;
    activeRecording = null;
    if (koreanVoice() && window.SpeechSynthesisUtterance) {
      speakWithVoice(ko);
      return;
    }
    status(t('Запись не загрузилась. Проверь подключение к интернету и попробуй снова.',
      'Audio yuklanmadi. Internetga ulanishni tekshir va qayta urinib ko‘r.'));
  });
}
window.speechSynthesis?.addEventListener('voiceschanged', () => {
  if (view === 'practice' && $('practice-mode').value === 'dictation') renderPractice();
});

const localized = [...document.querySelectorAll('[data-uz]')].map(element => [element, element.textContent]);
const attributes = ['aria-label', 'placeholder', 'title'].flatMap(attribute =>
  [...document.querySelectorAll(`[data-uz-${attribute}]`)].map(element => [element, attribute, element.getAttribute(attribute)])
);
function localize() {
  document.documentElement.lang = language;
  document.title = t('HanyuWed · Корейский', 'HanyuWed · Koreys tili');
  for (const [element, ru] of localized) element.textContent = t(ru, element.dataset.uz);
  for (const [element, attribute, ru] of attributes) element.setAttribute(attribute, t(ru, element.getAttribute(`data-uz-${attribute}`)));
  for (const button of $('languages').querySelectorAll('button')) pressed(button, language === button.dataset.language);
  updatePracticeAvailability();
}
function updatePracticeAvailability() {
  const numbers = numberTasks(chosen(), language, 'all', entries);
  const sizes = {numbers:numbers.length, context:contextTasks(selected).length};
  for (const [id,count] of Object.entries(sizes)) {
    const option = $('practice-mode').querySelector(`option[value="${id}"]`);
    option.disabled = count === 0;
    option.textContent += ` · ${count}`;
  }
  for (const option of $('number-kind').options) {
    option.disabled = !numbers.some(task => option.value === 'all' || task.type === option.value);
  }
  if ($('number-kind').selectedOptions[0]?.disabled) $('number-kind').value = 'all';
}
function updateSelection(ids, focusId) {
  selected = new Set(ids);
  localize();
  cards = practice = null;
  cardMode = 'all';
  save(settingsKey, JSON.stringify([...selected]));
  persistCards();
  loadPracticeSetup();
  navigate('units', false);
  if (focusId) $(`unit-${focusId}`).focus({preventScroll:true});
}
function renderUnits() {
  $('unit-grid').replaceChildren();
  $('extra-grid').replaceChildren();
  units.forEach(([symbol], index) => {
    const id = index + 1;
    const checked = selected.has(id);
    const list = entries.filter(word => word.unit === id);
    const known = list.filter(word => marks.get(word.id) === 'known').length;
    const button = node('button', 'tile', '');
    button.type = 'button';
    button.id = `unit-${id}`;
    pressed(button, checked);
    const mark = node('span', 'tick', checked ? '✓' : '');
    mark.setAttribute('aria-hidden', 'true');
    const emblem = node('span', 'tile-symbol', symbol);
    emblem.setAttribute('aria-hidden', 'true');
    const details = node('span', '', '');
    if (labelFor(id)) details.append(node('span', 'meta', labelFor(id)));
    details.append(node('span', 'tile-title', nameFor(id)),
      node('span', 'meta', `${countFor(list.length)} · ${t('Помню', 'Esimda')} ${known}`));
    button.append(emblem, details, mark);
    button.onclick = () => updateSelection(checked ? [...selected].filter(item => item !== id) : [...selected, id], id);
    $(id <= 8 ? 'unit-grid' : 'extra-grid').append(button);
  });
  text('selection-count', selected.size
    ? t(`Выбрано ${selected.size} из ${units.length} · ${countFor(chosen().length)}`, `${units.length} tadan ${selected.size} ta tanlandi · ${countFor(chosen().length)}`)
    : t('Выбери хотя бы один раздел', 'Kamida bitta bo‘limni tanla'));
  $('select-all').disabled = selected.size === units.length;
  $('clear-units').disabled = $('start').disabled = !selected.size;
  text('start', cards?.queue[cards.index] && cardMode === 'all'
    ? t('Продолжить карточки', 'Kartochkalarni davom ettirish')
    : t('Начать карточки', 'Kartochkalarni boshlash'));
}

function selectedSignature() {
  return allUnitIds.filter(id => selected.has(id)).join(',');
}
function clearSession(key) {
  try { localStorage.removeItem(key); } catch {}
}
function persistCards() {
  if (!cards) return clearSession(cardsKey);
  save(cardsKey, JSON.stringify({
    selection:selectedSignature(),
    mode:cardMode,
    reverse:cardReverse,
    reading:showReading,
    revealed:cards.revealed,
    queue:cards.queue.map(word => word.id),
    index:cards.index
  }));
}
function restoreCards() {
  const session = json(cardsKey);
  if (session?.selection !== selectedSignature() || !Array.isArray(session.queue) ||
      !['all','hard'].includes(session.mode) || !validPosition(session.index, session.queue.length)) return;
  const words = new Map(chosen().map(word => [word.id, word]));
  const queue = session.queue.map(id => words.get(id));
  if (queue.some(word => !word)) return;
  cardMode = session.mode;
  cardReverse = session.reverse === true;
  showReading = session.reading === true;
  cards = {queue,index:session.index,revealed:session.revealed === true};
}
function validPosition(index, length) {
  return Number.isInteger(index) && index >= 0 && index <= length;
}
function newCards() {
  const list = chosen().filter(word => cardMode === 'all' || marks.get(word.id) === 'hard');
  cards = {queue:randomOrder(list), index:0, revealed:false};
  persistCards();
}
function renderCards() {
  if (!cards) newCards();
  const hard = chosen().filter(word => marks.get(word.id) === 'hard').length;
  const known = chosen().filter(word => marks.get(word.id) === 'known').length;
  const word = cards.queue[cards.index];
  text('card-direction', cardReverse ? t('На карточке · перевод', 'Kartochkada · tarjima') : t('На карточке · хангыль', 'Kartochkada · hangul'));
  pressed($('card-direction'), cardReverse);
  text('hard-mode', `${t('Трудные', 'Qiyinlar')} ${hard}`);
  for (const button of $('card-modes').querySelectorAll('button')) pressed(button, button.dataset.mode === cardMode);
  text('card-summary', t(`Помню ${known} из ${chosen().length} · Ещё учу ${hard}`, `${chosen().length} tadan ${known} ta esimda · ${hard} tasini hali o‘rganyapman`));
  show('deck', Boolean(word));
  show('card-end', !word);
  $('shuffle').disabled = cards.queue.length < 2;
  if (!word) {
    text('card-end-title', cards.queue.length ? t('Круг завершён', 'Kartochkalar tugadi') : t('Трудных слов пока нет', 'Hozircha qiyin so‘zlar yo‘q'));
    text('card-end-summary', cards.queue.length ? '' : t('Отметь слово кнопкой «Ещё учу», чтобы повторить его здесь.', 'So‘zni bu yerda takrorlash uchun «Hali o‘rganyapman»ni bos.'));
    show('repeat-hard', hard > 0);
    return;
  }
  text('card-unit', nameFor(word.unit));
  text('card-position', positionFor(cards.index, cards.queue.length));
  setProgress('card-progress', cards.index + 1, cards.queue.length);
  const koreanVisible = !cardReverse || cards.revealed;
  show('card-word', koreanVisible);
  show('card-reading', koreanVisible && (cards.revealed || showReading));
  show('card-translation', cardReverse || cards.revealed);
  text('card-word', displayWord(word));
  $('card-word').lang = 'ko';
  text('card-reading', word.reading);
  text('card-translation', word[language]);
  $('flash').setAttribute('aria-expanded', String(cards.revealed));
  text('flip-hint', cards.revealed ? t('Скрыть ответ', 'Javobni yashirish') : t('Открыть ответ', 'Javobni ochish'));
  show('grades', cards.revealed);
  show('card-audio', koreanVisible);
  show('other-audio', koreanVisible && word.forms[0] === '영');
  show('toggle-reading', !cardReverse);
  text('toggle-reading', showReading ? t('Скрыть чтение', 'O‘qilishini yashirish') : t('Показать чтение', 'O‘qilishini ko‘rsatish'));
  $('previous-card').disabled = cards.index === 0;
}
function moveCard(offset, grade) {
  const word = cards.queue[cards.index];
  if (grade) {
    marks.set(word.id, grade);
    save(markKey(word.id), grade);
  }
  stopAudio();
  cards.index += offset;
  cards.revealed = false;
  persistCards();
  renderCards();
  (cards.queue[cards.index] ? $('flash') : $('repeat-all')).focus({preventScroll:true});
}
function changeCardMode(mode) {
  cardMode = mode;
  stopAudio();
  newCards();
  renderCards();
}

const feedbackMessages = {
  correct: ['Верно!', 'To‘g‘ri!'],
  empty: ['Введи ответ.', 'Javob yoz.'],
  wrong: ['Попробуй ещё раз.', 'Yana urinib ko‘r.'],
  'meaning-spacing': ['Выражение верное. Посмотри, где нужен пробел.', 'Ibora to‘g‘ri. Bo‘sh joy qayerda kerakligini ko‘r.'],
  spacing: ['Проверь границы слов.', 'So‘zlar orasidagi bo‘sh joyni tekshir.'],
  format: ['Значение верное. Используй формат из задания.', 'Ma’nosi to‘g‘ri. Topshiriqdagi shakldan foydalan.'],
  system: ['Это число относится к другой системе счёта.', 'Bu son boshqa sanoq tizimiga tegishli.'],
  month: ['У этого месяца особое название на хангыле.', 'Bu oyning hangulda maxsus nomi bor.'],
  sound: ['Ты записал звучание. Проверь написание слова.', 'Talaffuzni yozding. So‘zning imlosini tekshir.'],
  'dictionary-form': ['Смысл верный. Нужна словарная форма на -다.', 'Ma’nosi to‘g‘ri. Lug‘atdagi -다 shaklini yoz.'],
  'translation-orthography': ['Проверь апострофы и пробелы в переводе.', 'Tarjimadagi tutuq belgisi va bo‘sh joylarni tekshir.'],
  keyboard: ['Введи ответ корейской раскладкой.', 'Javobni koreys klaviaturasida yoz.'],
  unfinished: ['Собери буквы в слоговые блоки.', 'Harflarni bo‘g‘in bloklariga yig‘.'],
  shown: ['Ответ', 'Javob']
};
const instructions = {
  meaning:['Напиши слово или выражение хангылем.', 'So‘z yoki iborani hangulda yoz.'],
  spelling:['Напиши хангылем и проверь пробелы.', 'Hangulda yoz va bo‘sh joylarni tekshir.'],
  dictation:['Прослушай и напиши хангылем.', 'Tingla va hangulda yoz.'],
  native:['Напиши исконно корейским числительным.', 'Sof koreyscha sonni yoz.'],
  sino:['Напиши китайско-корейским числительным.', 'Xitoycha asosli sonni yoz.'],
  money:['Запиши цену хангылем с 원.', 'Narxni 원 bilan hangulda yoz.'],
  letters:['Запиши полностью хангылем.', 'To‘liq hangulda yoz.'],
  digits:['Запиши цифрами с 년, 월 или 일.', 'Raqamlar bilan yoz va 년, 월 yoki 일 qo‘sh.'],
  particle:['Впиши только частицу.', 'Faqat yuklamani yoz.'],
  verb:['Впиши глагол в словарной форме на -다.', 'Fe’lni lug‘atdagi -다 shaklida yoz.'],
  form:['Заполни пропуск.', 'Bo‘sh joyni to‘ldir.']
};
let composing = false;
let compositionJustEnded = false;

function currentTask() {
  return practice?.queue[practice.index];
}
function practiceTasks() {
  const mode = $('practice-mode').value;
  const words = chosen();
  if (mode === 'context') return contextTasks(selected);
  if (mode === 'numbers') return numberTasks(words, language, $('number-kind').value, entries);
  const type = mode === 'meaning' ? practiceDirection === 'translation' ? 'translation' :
    $('practice-strict').checked ? 'spelling' : 'meaning' : mode;
  return words.map(word => spellingTask(word, language, type));
}
function taskKey(task) {
  return task.contextual ? task.prompt : `${task.word.id}:${task.type}`;
}
function setupKey() {
  const mode = $('practice-mode').value;
  const option = mode === 'numbers' ? $('number-kind').value :
    mode === 'meaning' ? practiceDirection + ($('practice-strict').checked && practiceDirection === 'hangul' ? ':strict' : '') : '';
  return [practiceKey,selectedSignature(),mode,$('practice-limit').value,option].join(':');
}
function persistPractice() {
  if (!practice) return clearSession(practiceKey);
  const record = JSON.stringify({
    selection:selectedSignature(),
    controls:practiceControls.map(id => $(id).value),
    direction:practiceDirection,
    strict:$('practice-strict').checked,
    locale:language,
    queue:practice.queue.map(taskKey),
    index:practice.index,
    outcomes:practice.report.map(item => item.outcome),
    answers:practice.report.map(item => item.answer),
    result:practice.result,
    hadMistake:practice.hadMistake,
    completed:practice.completed,
    draft:$('answer').value
  });
  save(practiceKey,record);
  save(setupKey(),record);
}
function restorePractice(session = json(practiceKey)) {
  if (session?.selection !== selectedSignature() || !Array.isArray(session.queue) ||
      !validPosition(session.index, session.queue.length) || !Array.isArray(session.outcomes) ||
      !Array.isArray(session.controls) || session.controls.length !== practiceControls.length) return;
  practiceControls.forEach((id, index) => {
    if ([...$(id).options].some(option => option.value === session.controls[index])) $(id).value = session.controls[index];
  });
  const legacyStrict = session.controls[0] === 'spelling';
  if (legacyStrict) $('practice-mode').value = 'meaning';
  $('practice-strict').checked = legacyStrict || session.strict === true;
  practiceDirection = !legacyStrict && session.direction === 'translation' ? 'translation' : 'hangul';
  const tasks = new Map(practiceTasks().map(task => [taskKey(task), task]));
  const queue = session.queue.map(key => tasks.get(key));
  const completed = session.completed === true && session.index < queue.length;
  if (queue.some(task => !task) || session.outcomes.length !== session.index + Number(completed) ||
      session.outcomes.some(outcome => !['first','fixed','shown'].includes(outcome))) return;
  const staleTranslation = session.locale !== language && queue[session.index]?.reverse && !completed;
  practice = {
    queue,index:session.index,completed,
    report:session.outcomes.map((outcome,index) => ({task:queue[index],outcome,answer:session.answers?.[index] || ''})),
    result:!staleTranslation && (session.result === 'context' || Object.hasOwn(feedbackMessages,session.result)) ? session.result : '',
    hadMistake:!staleTranslation && session.hadMistake === true
  };
  $('answer').value = !staleTranslation && typeof session.draft === 'string' ? session.draft : '';
  persistPractice();
}
function loadPracticeSetup() {
  stopAudio();
  practice = null;
  $('answer').value = '';
  restorePractice(json(setupKey()));
  if (!practice) persistPractice();
}
function newPractice(queue) {
  if (!queue) {
    queue = randomOrder(practiceTasks());
    if ($('practice-limit').value !== 'all') queue = queue.slice(0, Number($('practice-limit').value));
  }
  practice = {queue, index:0, report:[], result:'', hadMistake:false, completed:false};
  $('answer').value = '';
  persistPractice();
}

function renderPractice() {
  const mode = $('practice-mode').value;
  const task = currentTask();
  const available = practiceTasks().length;
  const count = $('practice-limit').value === 'all' ? available : Math.min(Number($('practice-limit').value),available);
  text('practice-scope',selected.size ? [...selected].map(nameFor).join(' · ') : t('Уроки не выбраны','Darslar tanlanmagan'));
  text('practice-count',t('Заданий: ','Mashqlar: ')+count+' / '+available);
  show('start-practice',!practice && count>0);
  const voiceAvailable = mode !== 'dictation' || !task || Object.hasOwn(KO_AUDIO,task.audio.trim()) || Boolean(koreanVoice());
  text('to-hangul', t('Вводить хангыль', 'Hangul yozish'));
  text('to-translation', t('Вводить перевод', 'Tarjimani yozish'));
  pressed($('to-hangul'), practiceDirection === 'hangul');
  pressed($('to-translation'), practiceDirection === 'translation');
  show('practice-directions', mode === 'meaning');
  show('practice-strict-option', mode === 'meaning' && practiceDirection === 'hangul');
  show('number-options', mode === 'numbers' && !$('number-kind').options[0].disabled);
  show('question', Boolean(task) && voiceAvailable);
  show('practice-end', !task && (practice?.queue.length ?? 0) > 0 && voiceAvailable);
  const notice = !voiceAvailable
    ? t('Для диктанта нужен корейский голос устройства. Выбери письменное упражнение или включи корейский голос.',
      'Diktant uchun qurilmada koreyscha ovoz kerak. Yozma mashqni tanla yoki koreyscha ovozni yoq.')
    : !available
      ? t('В выбранных уроках нет заданий этого типа. Выбери другие уроки или вид задания.', 'Tanlangan darslarda bu turdagi mashqlar yo‘q. Boshqa dars yoki mashq turini tanla.')
      : '';
  show('practice-notice', Boolean(notice));
  text('practice-notice', notice);
  if (!practice) return;
  if (!task || !voiceAvailable) {
    const n = outcome => practice.report.filter(item => item.outcome === outcome).length;
    text('practice-score', t(
      `С первой попытки ${n('first')} · Исправлено ${n('fixed')} · Ответ показан ${n('shown')}`,
      `Birinchi urinishda ${n('first')} · Tuzatildi ${n('fixed')} · Javob ko‘rsatildi ${n('shown')}`));
    $('retry-practice').disabled = practice.report.every(item => item.outcome === 'first');
    const review = practice.report.filter(item=>item.outcome!=='first').map(({task,answer}) => {
      const line = node('li','','');
      line.append(node('strong','',task.prompt||t('Диктант','Diktant')),
        node('p','meta',t('Твой ответ','Javobing')+' · '+(answer||'—')),
        node('p','',t('Образец','Namuna')+' · '+task.accepted.join(' · ')));
      if (task.hint) line.append(node('p','meta',task.hint[language]));
      return line;
    });
    $('practice-review-list').replaceChildren(...review);
    show('practice-review',Boolean(review.length));
    return;
  }
  const [ru,uz] = task.reverse
    ? ['Напиши перевод по-русски.', 'Tarjimani o‘zbekcha yoz.']
    : instructions[task.type];
  text('question-unit', nameFor(task.word.unit));
  text('question-count', positionFor(practice.index, practice.queue.length));
  setProgress('question-progress', practice.index + 1, practice.queue.length);
  text('prompt', task.prompt);
  $('prompt').lang = task.reverse || task.contextual ? 'ko' : language;
  show('prompt', Boolean(task.prompt));
  show('listen-question', Boolean(task.audio));
  $('answer').lang = task.reverse ? language : 'ko';
  show('practice-keyboard',!task.reverse);
  text('answer-label', task.instruction?.[language] ?? t(ru,uz));
  $('answer').readOnly = practice.completed;
  const result = practice.result;
  const translated = feedbackMessages[result];
  const message = translated ? t(...translated) : '';
  const explanation = task.contextual && (result === 'context' || practice.completed) ? task.hint[language] : '';
  text('feedback', [message,explanation].filter(Boolean).join(' '));
  $('feedback').dataset.tone = result === 'shown' ? 'shown' : practice.completed ? 'good' : result ? 'bad' : '';
  const showSolution = ['shown','meaning-spacing'].includes(result);
  text('solution', showSolution ? task.accepted.slice(0, 4).join(' · ') : '');
  $('solution').lang = task.reverse ? language : 'ko';
  show('solution', showSolution);
  show('check', !practice.completed);
  show('show', !practice.completed);
  show('next-question', practice.completed);
}

function finishAnswer(outcome) {
  practice.completed = true;
  practice.report.push({task:currentTask(),outcome,answer:$('answer').value});
  persistPractice();
  renderPractice();
  $('next-question').focus();
}

function checkAnswer() {
  const task = currentTask();
  if (!task || practice.completed || composing || compositionJustEnded) return;
  const result = evaluate(task, $('answer').value);
  practice.result = result;
  if (result === 'correct') {
    finishAnswer(practice.hadMistake ? 'fixed' : 'first');
    return;
  }
  if (result !== 'empty') practice.hadMistake = true;
  persistPractice();
  renderPractice();
  $('answer').focus();
}

function restartPractice() {
  stopAudio();
  newPractice();
  renderPractice();
}

function renderDictionary() {
  const list = HanyuCourse.rankedDictionary(chosen(), $('search').value,
    word => [word.hangul,word.reading,word.ru,word.uz,...word.forms], forSearch);
  text('search-count', t(`Найдено ${list.length} из ${chosen().length}`, `${chosen().length} tadan ${list.length} ta topildi`));
  const fragment = document.createDocumentFragment();
  for (const word of list) {
    const row = node('div', 'word', '');
    const hangul = node('div', 'hangul', displayWord(word));
    hangul.lang = 'ko';
    const parts = node('div', 'word-parts', '');
    const mark = marks.get(word.id);
    parts.append(node('div', 'reading meta', word.reading), node('div', '', word[language]));
    if (mark) parts.append(node('div', 'meta', mark === 'known' ? t('Помню', 'Esimda') : t('Ещё учу', 'Hali o‘rganyapman')));
    const audio = node('button', 'btn', '♪');
    audio.type = 'button';
    audio.setAttribute('aria-label', t(`Прослушать ${word.hangul}`, `${word.hangul} talaffuzini tinglash`));
    audio.onclick = () => speak(word.spoken);
    const soundGroup = node('div', '', '');
    soundGroup.append(audio);
    if (word.forms[0] === '영') {
      audio.textContent = '♪ 영';
      const other = node('button', 'btn', '♪ 공');
      other.type = 'button';
      other.lang = 'ko';
      other.onclick = () => speak('공');
      soundGroup.append(other);
    }
    row.append(hangul, parts, soundGroup);
    fragment.append(row);
  }
  $('word-list').replaceChildren(fragment);
}
const navigation = [...document.querySelectorAll('[data-view]')];
function navigate(nextView, scroll = true, writeHistory = true) {
  view = nextView;
  if (writeHistory && location.hash !== `#${view}`) history.pushState(null, '', `#${view}`);
  stopAudio();
  for (const button of navigation) {
    const isCurrent = button.dataset.view === view;
    show(button.dataset.view, isCurrent);
    button.disabled = button.dataset.view !== 'units' && !selected.size;
    if (isCurrent) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
  const headings = {
    units:t(...HanyuCourse.labels.units),
    cards:t('Карточки', 'Kartochkalar'),
    practice:t(...HanyuCourse.labels.practice),
    dictionary:t('Словарь', 'Lug‘at')
  };
  text('heading', headings[view]);
  text('intro', view === 'units' ? t('8 уроков SNU Korean 1A и дополнительные слова', 'SNU Korean 1A darsligidan 8 ta dars va qo‘shimcha so‘zlar')
    : t(`В выбранных разделах ${chosen().length} карточек`, `Tanlangan bo‘limlarda ${chosen().length} ta kartochka`));
  ({units:renderUnits, cards:renderCards, practice:renderPractice, dictionary:renderDictionary})[view]();
  if (scroll) window.scrollTo(0, 0);
}

for (const button of navigation) button.onclick = () => {
  navigate(button.dataset.view);
  $('heading').focus({preventScroll:true});
};
function changeLanguage(next) {
  if (next === language) return;
  language = next;
  if (practice) {
    const mode = $('practice-mode').value;
    const localizeTask = task => {
      if (mode === 'numbers') return numberTasks([task.word], language, task.type, entries)[0];
      return mode === 'context' ? task : spellingTask(task.word, language, task.type);
    };
    practice.queue = practice.queue.map(localizeTask);
    practice.report = practice.report.map(item => ({...item, task:localizeTask(item.task)}));
    if (!practice.completed && currentTask()?.reverse) {
      $('answer').value = '';
      practice.result = '';
      practice.hadMistake = false;
    }
    persistPractice();
  }
  localize();
  navigate(view, false);
}
for (const button of $('languages').querySelectorAll('button')) {
  button.onclick = () => {
    const next = button.dataset.language;
    save(languageKey, next);
    changeLanguage(next);
  };
}
window.addEventListener('pageshow', () => {
  const preference = load(languageKey);
  if (preference) changeLanguage(preference);
});
window.addEventListener('storage', event => {
  if (event.key === languageKey && event.newValue) changeLanguage(event.newValue);
  if (!event.key?.startsWith(prefix + 'marks:v1:')) return;
  const id = event.key.slice((prefix + 'marks:v1:').length);
  if (['known','hard'].includes(event.newValue)) marks.set(id, event.newValue);
  else marks.delete(id);
  if (view === 'units') renderUnits();
  if (view === 'cards') renderCards();
  if (view === 'dictionary') renderDictionary();
});

$('select-all').onclick = () => updateSelection(allUnitIds);
$('clear-units').onclick = () => updateSelection([]);
$('start').onclick = () => {
  if (cardMode !== 'all' || !cards?.queue[cards.index]) {
    cardMode = 'all';
    newCards();
  }
  navigate('cards');
  $('heading').focus({preventScroll:true});
};
$('card-direction').onclick = () => {
  cardReverse = !cardReverse;
  cards.revealed = false;
  stopAudio();
  persistCards();
  renderCards();
};
$('toggle-reading').onclick = () => {
  showReading = !showReading;
  persistCards();
  renderCards();
};
$('shuffle').onclick = () => changeCardMode(cardMode);
for (const button of $('card-modes').querySelectorAll('button')) button.onclick = () => changeCardMode(button.dataset.mode);
$('flash').onclick = () => {
  cards.revealed = !cards.revealed;
  persistCards();
  renderCards();
};
$('card-audio').onclick = () => speak(cards.queue[cards.index].spoken);
$('other-audio').onclick = () => speak('공');
$('previous-card').onclick = () => moveCard(-1);
$('next-card').onclick = () => moveCard(1);
$('again').onclick = () => moveCard(1, 'hard');
$('remember').onclick = () => moveCard(1, 'known');
$('repeat-all').onclick = () => changeCardMode('all');
$('repeat-hard').onclick = () => changeCardMode('hard');
for (const button of $('practice-directions').querySelectorAll('button')) {
  button.onclick = () => {
    if (button.dataset.direction === practiceDirection) return;
    practiceDirection = button.dataset.direction;
    loadPracticeSetup();
    renderPractice();
  };
}
for (const id of [...practiceControls,'practice-strict']) $(id).onchange = () => {
  loadPracticeSetup();
  renderPractice();
};
$('start-practice').onclick = () => {
  restartPractice();
  $('answer').focus();
};
$('answer-form').onsubmit = event => {
  event.preventDefault();
  checkAnswer();
};
$('answer').addEventListener('compositionstart', () => { composing = true; });
$('answer').addEventListener('compositionend', () => {
  composing = false;
  compositionJustEnded = true;
  setTimeout(() => { compositionJustEnded = false; }, 0);
});
$('answer').addEventListener('keydown', event => {
  if (event.key === 'Enter' && (composing || compositionJustEnded || event.isComposing || event.keyCode === 229)) {
    event.preventDefault();
  }
});
$('answer').addEventListener('input', () => {
  if (composing || !practice || practice.completed) return;
  practice.result = '';
  persistPractice();
  renderPractice();
});
$('listen-question').onclick = () => speak(currentTask().audio);
$('show').onclick = () => {
  if (practice.completed) return;
  practice.result = 'shown';
  finishAnswer('shown');
};
$('next-question').onclick = () => {
  if (!practice.completed) return;
  stopAudio();
  practice.index++;
  practice.result = '';
  practice.hadMistake = practice.completed = false;
  $('answer').value = '';
  persistPractice();
  renderPractice();
  (currentTask() ? $('answer') : $('restart-practice')).focus();
};
$('restart-practice').onclick = restartPractice;
$('retry-practice').onclick = () => {
  const queue = practice.report.filter(item => item.outcome !== 'first').map(item => item.task);
  newPractice(queue);
  renderPractice();
  $('answer').focus();
};
$('search').oninput = renderDictionary;
let letters = '';
for (const button of $('letter-choices').querySelectorAll('button')) {
  button.onclick = () => {
    if (letters.length === 2) letters = '';
    letters += button.textContent;
    text('letter-status', letters === 'ㄱㅏ' ? '가 ✓' : letters.length === 1
      ? letters : t('Сначала ㄱ, затем ㅏ.', 'Avval ㄱ, keyin ㅏ.'));
  };
}
let syllables = '';
for (const button of $('syllable-choices').querySelectorAll('.choices button')) {
  button.onclick = () => {
    if (syllables.length === 2) syllables = '';
    syllables += button.textContent;
    text('syllable-result', syllables);
    text('syllable-status', syllables.length < 2 ? '' : syllables === '가방'
      ? t('Верно. Сумка.', 'To‘g‘ri. Sumka.')
      : t('Собери слово 가방.', '가방 so‘zini yig‘.'));
  };
}
$('clear-syllable').onclick = () => {
  syllables = '';
  text('syllable-result', '');
  text('syllable-status', '');
};
for (const button of document.querySelectorAll('[data-read]')) button.onclick = () => speak(button.dataset.read);
localize();
restoreCards();
restorePractice();
function routeFromHash() {
  const destination = location.hash.slice(1);
  navigate(['units','cards','practice','dictionary'].includes(destination) ? destination : 'units', false, false);
  $('heading').focus({preventScroll:true});
}
window.addEventListener('hashchange', routeFromHash);
const initialView = ['units','cards','practice','dictionary'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'units';
if (!location.hash) history.replaceState(null, '', `#${initialView}`);
HanyuCourse.keepHeaderOnEntry();
navigate(initialView, false, false);
if (!standalone && 'serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js').catch(() => {});
if (!standalone) HanyuCourse.initOfflineAudio($('offline-audio'),Object.values(KO_AUDIO),new URL('../',location.href));
