'use strict';

const TOPICS = {
  dialogue:['Rencontres et voyages','Знакомство и поездки','Tanishuv va sayohat'],
  family:['Ma famille','Семья','Oila'],
  jobs:['Les métiers','Профессии','Kasblar'],
  places:['Les lieux','Места и расположение','Joylar va joylashuv'],
  home:['Le logement','Жильё','Turar joy'],
  meetings:['Les rencontres','Встречи и занятия','Uchrashuvlar va darslar'],
  verbs:['Les verbes','Французские глаголы','Fransuzcha fe’llar'],
  present:['Le présent','Настоящее время','Hozirgi zamon'],
  past:['Le passé composé','Прошедшее время','O‘tgan zamon']
};
const SECTIONS = {
  present:['26 глаголов на -er','-er bilan tugaydigan 26 ta fe’l'],
  'family-members':['Члены семьи','Oila a’zolari'],
  'family-status':['Семейное положение','Oilaviy holat'],
  'family-actions':['Семейные занятия','Oilaviy mashg‘ulotlar'],
  jobs:['Профессии','Kasblar'], time:['Выражения времени','Vaqt iboralari'],
  'past-etre':['Глаголы с être','Être bilan keladigan fe’llar'],
  'past-avoir':['Глаголы с avoir','Avoir bilan keladigan fe’llar'],
  places:['Un endroit / un lieu','Un endroit / un lieu'], location:['Местоположение','Joylashuv'],
  meetings:['Встречи и занятия','Uchrashuvlar va darslar'], verbs:['Список из 58 глаголов','58 ta fe’l ro‘yxati'],
  dialogue:['Словарь Sylvie – Roger','Sylvie – Roger lug‘ati'],
  'home-housing':['Жильё','Turar joy'], 'home-location':['Расположение','Joylashuv'],
  'home-rooms':['Комнаты','Xonalar'], 'home-equipment':['Оборудование','Jihozlar'],
  'home-adjectives':['Прилагательные','Sifatlar'], 'home-rental':['Аренда и проживание','Ijara va yashash'],
  'home-reviews':['Отзывы','Sharhlar'], 'home-verbs':['Глаголы','Fe’llar'],
  'home-expressions':['Выражения','Iboralar'], 'home-instructions':['Инструкции','Ko‘rsatmalar']
};
const VIEWS = {
  topics:['Темы','Mavzular'], cards:['Карточки','Kartochkalar'],
  practice:['Практика','Mashqlar'], dictionary:['Словарь','Lug‘at']
};
const MODES = {
  writing:['Написание','Yozish'],
  present:['Présent','Présent'], past:['Passé composé','Passé composé'],
  article:['Артикли','Artikllar'], agreement:['Согласование','Moslashuv'], location:['Предлоги','Predloglar'],
  dictation:['Диктант','Diktant']
};
const PREFIX = typeof COURSE_STORAGE_PREFIX === 'string' ? COURSE_STORAGE_PREFIX : 'hanyuwed:fr:';
const languageKey = PREFIX === 'hanyuwed:fr:' ? HanyuCourse.languageKey : PREFIX + 'language';
const storage = {
  available:true,
  read(key, fallback) {
    return HanyuCourse.readStored(key,fallback);
  },
  write(key,value) {
    const saved = HanyuCourse.writeStored(key,value);
    if (!saved) this.available = false;
    return saved;
  }
};
function readLanguage() {
  return HanyuCourse.readLanguage(languageKey);
}
let lang = readLanguage();
const t = (ru, uz) => lang === 'uz' ? uz : ru;
const tr = pair => t(...pair);
const $ = id => document.getElementById(id);
const main = $('main');
const courseSections = COURSE.sections.map(s => s.id);
const savedSelection = storage.read(PREFIX + 'topics:v1', ['family-members','family-status','family-actions']);
let selected = new Set(Array.isArray(savedSelection) ? savedSelection.filter(s => courseSections.includes(s)) : []);
const progress = Object.create(null);
const entries = COURSE.entries;
const keyFor = id => PREFIX + 'progress:v1:' + id;
for (const entry of entries) {
  const stored = storage.read(keyFor(entry.id), null);
  if (['known','hard'].includes(stored)) progress[entry.id] = stored;
}
let view = 'topics';
let cardDirection = 'from-fr';
let hardOnly = false;
let cardState = null;
let mode = 'writing';
let practice = null;
let wordQuery = '';
let dictFilter = 'all';
const defaultSettings = {direction:'to-fr', amount:'10', verb:'all', person:'all', form:'verb', pastAux:'all', pastForm:'full'};
const cardsKey = PREFIX + 'cards:v1';
const practiceKey = forMode => PREFIX + 'practice:v1:' + forMode;
let settings = {...defaultSettings};
let voices = [];
let spoken = null;
let recordedAudio = null;
let soundStatus = '';
let topicFocus = null;

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => (
  {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]
));

function shuffle(list) {
  const array = [...list];
  for (let index = array.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [array[index], array[other]] = [array[other], array[index]];
  }
  return array;
}

function translation(entry, language = lang) {
  return [...new Set(entry.meanings.map(item => item[language]))].join(' · ');
}

function choices(value) {
  return value.split(/\s*[,/]\s*/).filter(Boolean).flatMap(part => {
    if (/\((?:o‘g‘il|qiz|erkak|ayol)\)$/.test(part)) return [part];
    const plain = part.replace(/\s+\([^)]*\)(?=\s*[.!?]?$)/, '');
    return plain === part ? [part] : [part,plain];
  });
}

function variants(fr) {
  const result = fr.split(' / ').flatMap(form => {
    if (form.includes('(e)')) return [form.replace('(e)',''),form.replace('(e)','e')];
    if (form.includes('(s)')) return [form.replace('(s)',''),form.replace('(s)','s')];
    return [form];
  });
  return result;
}

function selectedEntries() {
  return entries.filter(entry => entry.sources.some(source => selected.has(source.section)));
}

function topicEntries(id) {
  return entries.filter(entry => entry.sources.some(source => source.topic === id));
}

function tagFor(entry) {
  const source = entry.sources.find(s => selected.has(s.section)) || entry.sources[0];
  return tr(TOPICS[source.topic].slice(1));
}

function lexicalExample(entry) {
  return entry.example || EXAMPLES[entry.fr.toLowerCase()] || '';
}

const EXAMPLES = {
  'la mère':'Ma mère travaille en ville.', 'le père':'Mon père est chauffeur.',
  'le frère aîné':'Mon frère aîné habite à Québec.', 'le frère':'J’ai un frère.',
  'la sœur':'Ma sœur est étudiante.', 'une personne':'Je rencontre une personne.',
  'la femme':'Sa femme est médecin.', 'un logement':'Nous cherchons un logement.',
  'une annonce':'Elle a écrit une annonce.', 'le centre-ville':'Nous habitons dans le centre-ville.',
  'près de':'La maison est près du marché.', 'à côté de':'Le café est à côté de l’entrée.',
  'avoir lieu':'La rencontre a lieu à midi.', 'participer à':'Je participe à une rencontre.',
  'depuis':'Elle habite ici depuis deux ans.', 'le vol':'À quelle heure est le vol ?',
  's’asseoir':'Elle s’assoit sur la chaise.', 'un endroit / un lieu':'C’est un bel endroit.'
};
const ORIGINAL_EXAMPLES = [
  ['Ma famille','Ma sœur est étudiante. Nous passons du temps ensemble.','Моя сестра — студентка. Мы проводим время вместе.','Opam talaba. Biz birga vaqt o‘tkazamiz.'],
  ['Rencontre','Enchanté ! D’où venez-vous ? — Je viens de Québec.','Очень приятно! Откуда вы? — Я из Квебека.','Tanishganimdan xursandman! Qayerdansiz? — Men Kvebekdanman.'],
  ['Logement','C’est un bel appartement à côté du marché. La cuisine est équipée.','Это красивая квартира рядом с рынком. Кухня оборудована.','Bu bozor yonidagi chiroyli xonadon. Oshxona jihozlangan.']
];

function stopSpeech() {
  if (recordedAudio) {
    recordedAudio.pause();
    recordedAudio = null;
  }
  if (spoken && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  spoken = null;
}

function updateVoices() {
  if (!('speechSynthesis' in window)) return;
  voices = window.speechSynthesis.getVoices().filter(voice => /^fr(?:[-_]|$)/i.test(voice.lang));
}
if ('speechSynthesis' in window) {
  updateVoices();
  window.speechSynthesis.addEventListener('voiceschanged',() => {
    const hadVoice = voices.length > 0;
    updateVoices();
    if (hadVoice !== (voices.length>0) && view==='practice' && mode==='dictation' && !practice) render();
  });
}
const speechText = text => variants(text)[0].replaceAll('…','').trim();
const recordingFor = text => typeof FR_AUDIO === 'object' ? FR_AUDIO[speechText(text)] : undefined;
const hasFrenchVoice = () => voices.length && 'SpeechSynthesisUtterance' in window;

function say(text, target = $('sound-status')) {
  updateVoices();
  stopSpeech();
  const setStatus = message => {
    soundStatus = message;
    if (target?.isConnected) target.textContent = message;
  };
  const source = recordingFor(text);
  const speakWithBrowser = () => {
    if (!hasFrenchVoice()) {
      setStatus(source ? t('Запись не загрузилась. Проверь подключение.', 'Audio yuklanmadi. Internet aloqasini tekshir.') :
        t('Для этого текста нет записи или доступного голоса.', 'Bu matn uchun audio yoki ovoz mavjud emas.'));
      return;
    }
    const voice = voices.find(voice => voice.lang === 'fr-FR') || voices[0];
    const utterance = new SpeechSynthesisUtterance(speechText(text));
    utterance.lang = voice.lang;
    utterance.voice = voice;
    utterance.rate = .89;
    utterance.onend = () => { if (spoken === utterance) { spoken = null; setStatus(''); } };
    utterance.onerror = () => {
      if (spoken !== utterance) return;
      spoken = null;
      setStatus(t('Не удалось воспроизвести звук.', 'Ovozni ijro etib bo‘lmadi.'));
    };
    spoken = utterance;
    setStatus(t('Воспроизведение…','Ijro etilmoqda…'));
    window.speechSynthesis.speak(utterance);
  };
  if (!source) {
    speakWithBrowser();
    return;
  }
  const audio = new Audio(source);
  recordedAudio = audio;
  audio.onended = () => {
    if (recordedAudio !== audio) return;
    recordedAudio = null;
    setStatus('');
  };
  const failed = () => {
    if (recordedAudio !== audio) return;
    recordedAudio = null;
    speakWithBrowser();
  };
  audio.onerror = failed;
  setStatus(t('Загружается запись…','Audio yuklanmoqda…'));
  audio.play().then(() => {
    if (recordedAudio === audio) setStatus(t('Воспроизведение…','Ijro etilmoqda…'));
  }).catch(failed);
}

function anchor(view, name, selection) {
  return '<a href="#' + view + '"' + (selection ? ' aria-current="page"' : '') + '>' + esc(name) + '</a>';
}

function actionButton(name, action, style = 'secondary', extra = '') {
  return '<button type="button" class="' + style + '" data-action="' + action + '" ' + extra + '>' + esc(name) + '</button>';
}

function sound(text, compact = false) {
  const label = t('Прослушать','Tinglash');
  return actionButton(compact ? '♪' : '♪ ' + label, 'sound', 'secondary' + (compact ? ' icon-btn' : ''),
    'aria-label="' + esc(label) + '" data-text="' + esc(text) + '"');
}

const soundRegion = () => '<p id="sound-status" role="status" class="detail">' + esc(soundStatus) + '</p>';
function selectionSummary() {
  const set = selectedEntries();
  return t('Выбрано · ' + set.length, 'Tanlangan · ' + set.length);
}

const selectionId = () => [...selected].sort().join(',');

function updateSelection() {
  storage.write(PREFIX + 'topics:v1', [...selected]);
  cardState = null;
  storage.write(cardsKey,null);
  if (mode === 'writing') {
    practice = null;
    savePractice();
  }
}

function topicsPage() {
  const cards = selectedEntries();
  const keywords = {
    dialogue:'Salut', family:'Mère', jobs:'Métier', places:'Où', home:'Chez',
    meetings:'Avec', verbs:'Faire', present:'Je', past:'Hier'
  };
  const tiles = Object.entries(TOPICS).map(([id,[fr,ru,uz]]) => {
    const all = COURSE.sections.filter(section => section.topic === id).every(section => selected.has(section.id));
    const group = topicEntries(id);
    const known = group.filter(entry => progress[entry.id] === 'known').length;
    const hard = group.filter(entry => progress[entry.id] === 'hard').length;
    return '<button type="button" class="unit-tile" data-action="topic" data-id="' + id + '" aria-pressed="' + all + '">' +
      '<span class="unit-symbol" lang="fr" aria-hidden="true">' + esc(keywords[id]) + '</span>' +
      '<span class="unit-body"><span class="unit-number" lang="fr">' + esc(fr) + '</span>' +
      '<span class="unit-title">' + esc(t(ru,uz)) + '</span><span class="unit-count">' +
      t('Карточек: ','Kartochkalar: ') + group.length + '</span>' +
      '<progress class="unit-track" aria-hidden="true" max="' + group.length + '" value="' + known + '"></progress>' +
      '<span class="unit-stats">' + t('Помню: ', 'Esimda: ') + known + ' · ' + t('Ещё учу: ', 'Hali o‘rganyapman: ') +
      hard + '</span></span><span class="unit-check" aria-hidden="true">' + (all ? '✓' : '') + '</span></button>';
  }).join('');
  const subgroups = Object.entries(TOPICS).filter(([id]) => COURSE.sections.filter(s => s.topic === id).length > 1)
    .map(([id,[title]]) => '<details class="subgroups" data-topic="' + id + '"' + (topicFocus === id ? ' open' : '') + '><summary lang="fr">' +
      esc(title) + '</summary><div class="subgroup-list">' +
      COURSE.sections.filter(s => s.topic === id).map(section => '<label><input type="checkbox" data-section="' +
        section.id + '"' + (selected.has(section.id) ? ' checked' : '') + '>' + esc(tr(SECTIONS[section.id])) + '</label>').join('') +
      '</div></details>').join('');
  return '<section><p class="unit-intro">' +
    t('Карточки выбранных тем перемешаются в одном круге.', 'Tanlangan mavzulardagi kartochkalar bir davrada aralashtiriladi.') +
    '</p><div class="selection-tools">' + actionButton(t('Выбрать все','Barchasini tanlash'),'select-all','text-button') +
    actionButton(t('Снять выбор','Tanlovni bekor qilish'),'select-none','text-button') +
    '</div><div class="unit-grid">' + tiles + '</div>' +
    '<details class="box subgroups"' + (topicFocus ? ' open' : '') + '><summary>' + t('Выбрать подразделы','Bo‘limlarni tanlash') +
    '</summary>' + subgroups + '</details><div class="selection-action"><p role="status">' + esc(selectionSummary()) + '</p>' +
    '<div class="panel-actions">' +
    actionButton(t('Перемешать и повторять','Aralashtirib takrorlash'),'begin-cards','primary',cards.length ? '' : 'disabled') +
    actionButton(t('Письменная практика','Yozma mashq'),'begin-writing','secondary',cards.length ? '' : 'disabled') +
    '</div></div></section>';
}

function hardEntries() {
  return selectedEntries().filter(entry => progress[entry.id] === 'hard');
}

function cardsStart() {
  const queue = hardOnly ? hardEntries() : selectedEntries();
  cardState = {queue:shuffle(queue), index:0, back:false};
  saveCards();
}

function saveCards() {
  if (!cardState) return;
  const {queue,index,back} = cardState;
  storage.write(cardsKey,{selection:selectionId(),ids:queue.map(entry => entry.id),index,back,cardDirection,hardOnly});
}

function restoreCards() {
  const saved = storage.read(cardsKey,null);
  if (!saved || saved.selection!==selectionId() || !Array.isArray(saved.ids)) return;
  const queue = itemsFromIds(selectedEntries(),saved.ids,item => item.id);
  if (!queue || !Number.isInteger(saved.index) || saved.index<0 || saved.index>queue.length) return;
  cardState = {queue,index:saved.index,back:saved.back===true};
  cardDirection = saved.cardDirection==='to-fr' ? 'to-fr' : 'from-fr';
  hardOnly = saved.hardOnly===true;
}

function cardsPage() {
  if (!cardState) cardsStart();
  const {queue,index,back} = cardState;
  const entry = queue[index];
  const hardCount = hardEntries().length;
  const toFrench = cardDirection === 'to-fr';
  const controls = '<div class="toolbar">' +
    actionButton(hardOnly ? t('Все карточки','Barcha kartochkalar') : t('Трудные','Qiyinlar') + ' · ' + hardCount,
      'hard','secondary','aria-pressed="' + hardOnly + '"') +
    actionButton((toFrench ? lang.toUpperCase() + ' → FR' : 'FR → ' + lang.toUpperCase()),'card-direction','secondary',
      'aria-label="' + esc(t('Сменить направление','Yo‘nalishni almashtirish')) + '"') +
    actionButton(t('Перемешать','Aralashtirish'),'shuffle','text-button') + '</div>';
  const backButton = actionButton(t('Назад','Oldingi'),'previous-card','secondary',index===0 ? 'disabled' : '');
  if (!entry) return '<section class="study stack">' + controls +
    '<div class="box stack"><p>' + (queue.length ? t('Повторение завершено.','Takrorlash tugadi.') :
      hardOnly ? t('В выбранных темах пока нет трудных карточек. Отмечай их кнопкой «Ещё учу».',
        'Tanlangan mavzularda qiyin kartochkalar yo‘q. Ularni «Hali o‘rganyapman» tugmasi bilan belgila.') :
      t('Выбери хотя бы одну тему.','Kamida bitta mavzuni tanlang.')) + '</p>' +
    '<div class="row">' +
    (queue.length ? backButton + actionButton(t('Начать заново','Qayta boshlash'),'shuffle') : '') +
    (hardCount ? actionButton(t('Повторить трудные','Qiyinlarini takrorlash') + ' · ' + hardCount,
      'repeat-hard','primary') : '') +
    '<a href="#topics">' + t('Выбрать темы','Mavzularni tanlash') + '</a></div></div></section>';
  const example = lexicalExample(entry);
  const text = back ? (toFrench ? entry.fr : translation(entry)) : (toFrench ? translation(entry) : entry.fr);
  const displayFrench = back === toFrench;
  return '<section class="study stack">' + controls +
    '<p class="card-top"><span>' + esc(tagFor(entry)) + '</span><span>' + (index + 1) + ' / ' + queue.length + '</span></p>' +
    '<progress class="progress" aria-label="' + t('Ход повторения','Takrorlash jarayoni') + '" max="' + queue.length + '" value="' + index + '"></progress>' +
    '<button type="button" class="flashcard" data-action="flip" aria-pressed="' + back + '">' +
    '<span class="prompt"' + (displayFrench ? ' lang="fr"' : '') + '>' + esc(text) + '</span>' +
    (back && example ? '<span class="translation muted" lang="fr">' + esc(example) + '</span>' : '') +
    '<span class="flip-hint">' + (back ? t('Вернуться к вопросу','Savolga qaytish') : t('Показать ответ','Javobni ko‘rish')) + '</span></button>' +
    '<div class="study-nav">' + (back || !toFrench ? sound(entry.fr) : '<span></span>') +
    '<div class="row">' + actionButton(t('Ещё учу','Hali o‘rganyapman'),'grade-hard','secondary',back ? '' : 'disabled') +
    actionButton(t('Помню','Esimda'),'grade-known','primary',back ? '' : 'disabled') + '</div></div>' +
    '<div class="row">' + backButton +
    actionButton(t('Вперёд','Keyingi'),'next-card') + '</div>' + soundRegion() + '</section>';
}

const FORMS = {
  verb:['Только глагол','Faqat fe’l'], affirmative:['Утверждение','Tasdiq'],
  negative:['Отрицание','Inkor'], question:['Вопрос с est-ce que','Est-ce que bilan savol'],
  inversion:['Вопрос с инверсией','Inversiya bilan savol'], open:['Вопрос любым способом','Istalgan usulda savol'],
  mixed:['Разные формы','Aralash shakllar']
};
const PAST_FORMS = {
  full:['Вся форма','To‘liq shakl'], participle:['Базовая форма причастия','Sifatdoshning asosiy shakli'],
  aux:['Вспомогательный глагол','Yordamchi fe’l'], agreement:['Согласование с être','Être bilan moslashuv'],
  negative:['Отрицание','Inkor'], mixed:['Разные формы','Aralash shakllar']
};

function presentQuestion(entry, person, form) {
  const forms = presentForms(entry, person);
  const variants = {
    verb:[forms.verb], affirmative:[forms.affirmative], negative:[forms.negative], question:[forms.question],
    inversion:[forms.inversion], open:[forms.question,forms.intonation,forms.inversion].filter(Boolean)
  };
  const rule = form === 'verb' ? {
    manger:['В nous mangeons сохраняется e перед -ons.','Nous mangeons shaklida -ons oldidan e qoladi.'],
    voyager:['В nous voyageons сохраняется e перед -ons.','Nous voyageons shaklida -ons oldidan e qoladi.'],
    commencer:['В nous commençons пишется ç перед -ons.','Nous commençons shaklida -ons oldidan ç yoziladi.'],
    conjuguer:['В nous conjuguons основа сохраняет u.','Nous conjuguons shaklida asosdagi u qoladi.'],
    répéter:['Повтори чередование è и é в таблице.','Jadvaldagi è va é almashishini takrorlang.']
  }[entry.verb] : null;
  const instruction = {
    verb:['Впиши только форму глагола.','Faqat fe’l shaklini yozing.'],
    affirmative:['Напиши утвердительное предложение.','Tasdiq gapni yozing.'],
    negative:['Переделай предложение в письменное отрицание.','Gapni yozma inkor shakliga o‘tkazing.'],
    question:['Переделай предложение в вопрос с est-ce que.','Gapni est-ce que yordamida savolga aylantiring.'],
    inversion:['Переделай предложение в вопрос с инверсией.','Gapni inversiya yordamida savolga aylantiring.'],
    open:['Задай вопрос любым из трёх изученных способов.','O‘rganilgan uch usuldan biri bilan savol tuzing.']
  }[form];
  const subject = person === 'je' && requiresElision(forms.verb) ? 'j’___' : person + ' ___';
  const title = form === 'verb' ? subject + ' ' + OBJECTS[entry.verb] + '.' :
    form === 'affirmative' ? person + ' + ' + entry.verb + ' + ' + OBJECTS[entry.verb] : forms.affirmative;
  return {
    id:['present',entry.verb,person,form].join('-'), title, fr:true, promptFr:true,
    label:instruction, note:entry.verb + ' · ' + person, accepted:variants[form],
    elision:true, negative:form==='negative', question:['question','open','inversion'].includes(form),
    rule:rule || (form==='negative' ?
      ['В письменном отрицании нужны ne или n’ и pas.','Yozma inkor shaklida ne yoki n’ va pas kerak.'] : undefined),
    solution:form==='verb' ? forms.affirmative : variants[form][0]
  };
}

function reversePrompt(entry) {
  const tag = tagFor(entry);
  const plain = translation(entry);
  return {plain, tag};
}

function lexExercise(entry, toFrench) {
  const {plain,tag} = reversePrompt(entry);
  const direct = variants(entry.fr);
  const article = direct.every(text => /^(?:le |la |les |l[’']|un |une |des )/i.test(text));
  const answers = toFrench ? [...direct] : entry.meanings.flatMap(meaning => choices(meaning[lang]));
  if (!toFrench) answers.push(...entry.meanings.map(item => item[lang]));
  if (toFrench) {
    const labels = new Set(entry.meanings.flatMap(meaning => choices(meaning[lang])).map(normalizeSpelling));
    // Only accept dictionary synonyms when the prompt supplies no distinction.
    for (const candidate of entries) {
      if (candidate === entry || !candidate.meanings.some(meaning => normalizeSpelling(meaning[lang]) === normalizeSpelling(plain))) continue;
      const candidateForms = variants(candidate.fr);
      const expectedArticle = article && direct.every(value => /^(?:le |la |les |l[’'])/i.test(value)) ? 'def' : article ? 'indef' : null;
      const wordForms = candidateForms.filter(value =>
        expectedArticle === 'def' ? /^(?:le |la |les |l[’'])/i.test(value) :
        expectedArticle === 'indef' ? /^(?:un |une |des )/i.test(value) : true);
      if (labels.has(normalizeSpelling(candidate.meanings[0][lang])) || plain === candidate.meanings[0][lang]) answers.push(...wordForms);
    }
  }
  const definite = article && direct.every(value => /^(?:le |la |les |l[’'])/i.test(value));
  const indefinite = article && direct.every(value => /^(?:un |une |des )/i.test(value));
  if (toFrench) {
    const synonyms = {
      'pas loin de':['près de'], 'près de':['pas loin de'],
      'un endroit touristique':['un lieu touristique'],
      'un lieu touristique':['un endroit touristique']
    };
    answers.push(...(synonyms[entry.fr.toLowerCase()] || []));
  }
  const label = !toFrench ?
    ['Напиши перевод на русский.','O‘zbekcha tarjimasini yozing.'] :
    definite ? ['Напиши по-французски с определённым артиклем.','Fransuzcha aniq artikl bilan yozing.'] :
    indefinite ? ['Напиши по-французски с неопределённым артиклем.','Fransuzcha noaniq artikl bilan yozing.'] :
    ['Напиши по-французски.','Fransuzcha yozing.'];
  return {id:entry.id + '-' + (toFrench?'fr':lang), entry, title:toFrench?plain:entry.fr,
    note:tag, fr:toFrench,promptFr:!toFrench, label, article, elision:true,
    accepted:[...new Set(answers)], solution:toFrench?entry.fr:plain};
}

const DICTATION = [
  ['one','J’habite dans le centre-ville.','Я живу в центре города.','Men shahar markazida yashayman.'],
  ['two','Nous commençons le cours.','Мы начинаем урок.','Biz darsni boshlaymiz.'],
  ['three','Je n’écoute pas la radio.','Я не слушаю радио.','Men radio tinglamayman.'],
  ['four','La cuisine est équipée.','Кухня оборудована.','Oshxona jihozlangan.'],
  ['five','Elle est allée au marché.','Она сходила на рынок.','U bozorga bordi.'],
  ['six','Les enfants jouent aux échecs.','Дети играют в шахматы.','Bolalar shaxmat o‘ynayapti.'],
  ['seven','Nous voyageons souvent.','Мы часто путешествуем.','Biz tez-tez sayohat qilamiz.'],
  ['eight','Il a écrit une annonce.','Он написал объявление.','U e’lon yozdi.'],
  ['nine','Elles sont parties hier.','Они уехали вчера (о двух женщинах).','Ular kecha ketishdi (ayollar haqida).'],
  ['ten','C’est une belle maison.','Это красивый дом.','Bu chiroyli uy.']
];

function exercisePool() {
  if (mode==='writing') return selectedEntries().map(e => lexExercise(e,settings.direction==='to-fr'));
  if (mode==='present') {
    const matching = COURSE.present.filter(e => settings.verb==='all' || settings.verb===e.verb);
    const people = settings.person==='all' ? PERSONS : [settings.person];
    const forms = settings.form==='mixed' ? ['affirmative','negative','question'] : [settings.form];
    return matching.flatMap(entry=>people.flatMap(person=>forms.filter(form=>form!=='inversion'||person!=='je')
      .map(form=>presentQuestion(entry, person, form))));
  }
  if (mode==='past') {
    const list = COURSE.past.filter(e => (settings.verb==='all'||e.verb===settings.verb) && (settings.pastAux==='all'||e.aux===settings.pastAux));
    const form = settings.pastForm;
    const subjects = PAST_SUBJECTS.filter(subject => settings.person==='all' || subject.person===settings.person);
    const forms = form==='mixed' ? ['full','negative'] : [form];
    const questions = list.flatMap(entry => {
      if (form==='participle') return [pastExercise(entry,PAST_SUBJECTS[0],form)];
      if (form==='agreement' && entry.aux!=='être') return [];
      return subjects.flatMap(subject => forms.map(type => pastExercise(entry,subject,type)));
    });
    return [...new Map(questions.map(question => [question.id,question])).values()];
  }
  if (mode==='dictation') return DICTATION.map(([id,fr,ru,uz]) => ({
    id:'dictation-'+id,fr:true, clip:fr, title:'', note:'', accepted:[fr],
    label:['Прослушай и запиши предложение.','Gapni tinglab, yozing.'], transcripts:[ru,uz], elision:true
  }));
  return CONTEXT_EXERCISES.filter(item=>item.group===mode);
}

function itemsFromIds(pool, ids, idFor) {
  if (!Array.isArray(ids) || ids.length>pool.length || new Set(ids).size!==ids.length) return null;
  const index = new Map(pool.map(item => [idFor(item),item]));
  const items = ids.map(id => index.get(id));
  return items.every(Boolean) ? items : null;
}

const questionId = item => item.entry?.id || item.id;

function savePractice() {
  let run = null;
  if (practice) {
    const position = {index:practice.index,replies:practice.replies};
    run = {ids:practice.queue.map(questionId),position};
    if (mode==='writing') {
      practice.languageSessions.set(lang,position);
      run.languageSessions = Object.fromEntries(practice.languageSessions);
    }
  }
  storage.write(practiceKey(mode),{settings,run,selection:mode==='writing' ? selectionId() : null});
}

function restorePosition(saved, length, fallbackIndex = 0) {
  const index = Number.isInteger(saved?.index) && saved.index>=0 && saved.index<=length ? saved.index : fallbackIndex;
  const replies = Array.isArray(saved?.replies) ? saved.replies.slice(0,length).map(reply => {
    if (!reply || typeof reply!=='object') return null;
    return {
      draft:typeof reply.draft==='string' ? reply.draft : '',
      feedback:Object.hasOwn(MESSAGES,reply.feedback) ? reply.feedback : null,
      attempts:Number.isSafeInteger(reply.attempts) && reply.attempts>0 ? reply.attempts : 0,
      firstCorrect:reply.firstCorrect===true,correct:reply.correct===true,shown:reply.shown===true
    };
  }) : [];
  return {index,replies};
}

function restorePractice() {
  const saved = storage.read(practiceKey(mode),null);
  const options = {
    direction:['to-fr','from-fr'], amount:['10','20','all'],
    verb:['all',...(mode==='past'?COURSE.past:COURSE.present).map(entry => entry.verb)],
    person:['all',...PERSONS], form:Object.keys(FORMS), pastAux:['all','être','avoir'], pastForm:Object.keys(PAST_FORMS)
  };
  settings = {...defaultSettings};
  for (const [key,values] of Object.entries(options)) {
    if (values.includes(saved?.settings?.[key])) settings[key] = saved.settings[key];
  }
  practice = null;
  const run = saved?.run;
  if (!Array.isArray(run?.ids) || !run.ids.length || (mode==='writing' && saved.selection!==selectionId())) return;
  const queue = itemsFromIds(exercisePool(),run.ids,questionId);
  if (!queue) return;
  const position = restorePosition(run.position,queue.length);
  const languageSessions = new Map();
  if (mode==='writing') {
    for (const language of ['ru','uz']) {
      if (run.languageSessions?.[language]) languageSessions.set(language,restorePosition(run.languageSessions[language],queue.length));
    }
  }
  const current = mode==='writing' ? languageSessions.get(lang) || {index:Math.min(position.index,queue.length-1),replies:[]} : position;
  practice = {queue,...current,languageSessions};
}

function practiceStart(items) {
  updateVoices();
  let queue = items || shuffle(exercisePool());
  if (mode==='dictation' && !hasFrenchVoice()) queue = queue.filter(item => recordingFor(item.clip));
  if (!items && settings.amount!=='all') queue = queue.slice(0,Number(settings.amount));
  if (!queue.length) {
    if (mode==='dictation') soundStatus = t('Записи для диктанта недоступны. Попробуй письменное упражнение.','Diktant audiolari mavjud emas. Yozma mashqni sinab ko‘r.');
    return false;
  }
  practice = {queue,index:0,replies:[],languageSessions:new Map()};
  savePractice();
  return true;
}

function selectField(name,title,options) {
  return '<label class="field"><span>' + esc(title) + '</span><select name="' + name + '" data-setting="' + name + '">' +
    options.map(([value,label])=>'<option value="' + esc(value) + '"' + (settings[name]===value?' selected':'') + '>' +
      esc(label) + '</option>').join('') + '</select></label>';
}

function presentReference() {
  const entry = COURSE.present.find(e=>e.verb===settings.verb) || COURSE.present.find(e=>e.verb==='habiter');
  const rows = ['je','tu','elle','nous','vous','ils'].map((person,index) => {
    const forms = presentForms(entry,person);
    return '<tr><th scope="row">'+['je','tu','il / elle / on','nous','vous','ils / elles'][index]+'</th>'+
      ['affirmative','negative','question'].map(key=>'<td>'+esc(forms[key])+'</td>').join('')+'</tr>';
  }).join('');
  return '<details class="box"><summary>' + t('Спряжение и способы задать вопрос','Tuslanish va so‘roq shakllari') +
    '</summary><h3 lang="fr">' + esc(entry.verb) + '</h3><div class="table-wrap" tabindex="0"><table lang="fr"><thead><tr><th>' +
    t('Лицо','Shaxs') + '</th><th>Affirmation</th><th>Négation</th><th>Question</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<p class="detail" lang="fr">Vous parlez français ? · Est-ce que vous parlez français ? · Parlez-vous français ?</p>' +
    '<p class="detail">' + t('Особые формы nous: mangeons, voyageons, commençons, conjuguons. У répéter: je répète, nous répétons.',
    'Nous shakllariga e’tibor bering: mangeons, voyageons, commençons, conjuguons. Répéter: je répète, nous répétons.') + '</p></details>';
}

function pastReference() {
  const subjects = ['je','tu','il / elle / on','nous','vous','ils / elles'];
  const aux = subjects.map((p,i)=>'<tr><th scope="row">'+p+'</th><td>'+esc(subjectPhrase(p,AUXILIARIES.avoir[i]))+
    '</td><td>'+esc(subjectPhrase(p,AUXILIARIES.être[i]))+'</td></tr>').join('');
  return '<details class="box"><summary>' + t('Вспомогательные глаголы, причастия и согласование','Yordamchi fe’llar, participe passé va moslashuv') +
    '</summary><div class="table-wrap" tabindex="0"><table lang="fr"><thead><tr><th>Personne</th><th>Avoir</th><th>Être</th></tr></thead><tbody>'+aux+
    '</tbody></table></div><p class="detail" lang="fr">Elle est sortie de la maison. · Elle a sorti la chaise.</p><p class="detail">' +
    t('Выбор зависит от конструкции. С être согласуем с подлежащим: arrivée, arrivés, arrivées. В базовых примерах с avoir прямое дополнение стоит после причастия.',
      'Tanlov gap tuzilishiga bog‘liq. Être bilan ega bo‘yicha moslashtiramiz: arrivée, arrivés, arrivées. Oddiy avoir misollarida to‘ldiruvchi participe passé dan keyin keladi.') +
    '</p><p class="detail">' + t('При прямом дополнении перед avoir возможна форма les annonces qu’elle a écrites.',
      'Vositasiz to‘ldiruvchi oldin kelsa: les annonces qu’elle a écrites.') + '</p><div class="table-wrap" tabindex="0">' +
    '<table><thead><tr><th>Infinitif</th><th>Auxiliaire</th><th>Participe passé</th><th>' + t('Перевод','Tarjima') +
    '</th></tr></thead><tbody>' + COURSE.past.map(row=>'<tr><th scope="row" lang="fr">'+esc(row.verb)+'</th><td lang="fr">'+
      row.aux+'</td><td lang="fr">'+esc(row.participle)+'</td><td>'+esc(row[lang])+'</td></tr>').join('') + '</tbody></table></div></details>';
}

function practiceOptions() {
  const all = t('Все','Hammasi');
  const fields = [];
  if (mode==='writing') fields.push(selectField('direction',t('Направление','Yo‘nalish'),[
    ['to-fr',lang.toUpperCase()+' → FR'],['from-fr','FR → '+lang.toUpperCase()]
  ]));
  if (mode==='present'||mode==='past') {
    const list = mode==='present'?COURSE.present:COURSE.past.filter(e=>settings.pastAux==='all'||e.aux===settings.pastAux);
    if (mode==='past') fields.push(selectField('pastAux',t('Вспомогательный','Yordamchi fe’l'),[['all',all],['être','être'],['avoir','avoir']]));
    fields.push(selectField('verb',t('Глагол','Fe’l'),[['all',all],...list.map(e=>[e.verb,e.verb])]));
    const options = mode==='present' ? FORMS : PAST_FORMS;
    fields.push(selectField(mode==='present'?'form':'pastForm',t('Что написать','Nimani yozish'),Object.entries(options).map(([k,v])=>[k,tr(v)])));
    if (mode==='present'||settings.pastForm!=='participle') {
      fields.push(selectField('person',t('Лицо','Shaxs'),[['all',all],...PERSONS.map(p=>[p,p])]));
    }
  }
  fields.push(selectField('amount',t('Заданий','Mashqlar soni'),[['10','10'],['20','20'],['all',t('Весь урок','Butun dars')]]));
  const empty = mode==='writing' && !selected.size;
  const inversionJe = mode==='present' && settings.form==='inversion' && settings.person==='je';
  const agreementAvoir = mode==='past' && settings.pastForm==='agreement' && (
    settings.pastAux==='avoir' || COURSE.past.some(e=>e.verb===settings.verb&&e.aux==='avoir'));
  const missingDictation = mode==='dictation' && !hasFrenchVoice() && !DICTATION.some(([,text]) => recordingFor(text));
  const notice = empty ? t('Сначала выбери темы.','Avval mavzularni tanlang.') : inversionJe ?
    t('Для je выбери вопрос с est-ce que.','Je bilan est-ce que shaklini tanlang.') : agreementAvoir ?
    t('Для этого упражнения выбери être.','Bu mashqda être ni tanlang.') : missingDictation ?
    t('Записи для диктанта недоступны.','Diktant audiolari mavjud emas.') : '';
  const reference = mode==='present' ? presentReference() : mode==='past' ? pastReference() : '';
  return '<section class="box stack">' + (mode==='writing'?'<p class="detail">'+esc(selectionSummary())+' · <a href="#topics">'+
    t('Изменить темы','Mavzularni o‘zgartirish')+'</a></p>':'') + '<div class="form-grid">'+fields.join('')+'</div>'+
    (notice?'<p class="detail">'+esc(notice)+'</p>':'')+
    (missingDictation?'<a href="#practice">'+t('Открыть письменное упражнение','Yozma mashqni ochish')+'</a>':'')+'<div>'+
    actionButton(t('Начать','Boshlash'),'start-practice','primary',notice?'disabled':'')+'</div>'+soundRegion()+'</section>'+reference;
}

function resultPage() {
  const wrong = practice.queue.filter((_,index)=>!practice.replies[index]?.firstCorrect);
  const corrected = practice.replies.filter(reply=>reply?.correct&&!reply.firstCorrect).length;
  const skipped = practice.queue.filter((_,index)=>!practice.replies[index]?.attempts && !practice.replies[index]?.shown).length;
  return '<section class="box stack"><h2>'+t('Результат','Natija')+'</h2><p>'+
    t('Верно с первой попытки: ','Birinchi urinishda to‘g‘ri: ')+(practice.queue.length-wrong.length)+' / '+practice.queue.length+
    ' · '+t('Исправлено: ','Tuzatildi: ')+corrected+' · '+t('Пропущено: ','O‘tkazib yuborildi: ')+skipped+'</p><div class="row">'+
    actionButton(t('Назад','Oldingi'),'previous-question','secondary')+
    (wrong.length?actionButton(t('Повторить ошибки','Xatolarni takrorlash'),'retry','primary'):'')+
    actionButton(t('Настроить практику','Mashqni sozlash'),'practice-settings')+'<a href="#topics">'+t('Выбрать темы','Mavzularni tanlash')+'</a></div></section>';
}

function questionPage() {
  const item = practice.queue[practice.index];
  const reply = practice.replies[practice.index];
  const last = practice.index === practice.queue.length - 1;
  const accents = item.fr ? '<div class="accent-bar" aria-label="'+t('Французские знаки','Fransuzcha belgilar')+'">'+
    [...'éèêëàâîïôùûüçœ’'].map(letter=>actionButton(letter,'accent','accent-key','data-letter="'+letter+'"')).join('')+'</div>' : '';
  const detail = item.transcripts ? '<details><summary>'+t('Контекст по смыслу','Ma’no bo‘yicha yordam')+'</summary><p>'+
    esc(tr(item.transcripts))+'</p></details>' : '';
  return '<section class="box stack"><div class="row"><p class="detail">'+(practice.index+1)+' / '+practice.queue.length+
    (item.note?' · '+esc(item.note):'')+'</p>'+actionButton(t('Настройки','Sozlamalar'),'practice-settings','text-button')+'</div>'+
    '<progress class="progress" max="'+practice.queue.length+'" value="'+practice.index+'" aria-label="'+t('Ход практики','Mashq jarayoni')+'"></progress>'+
    '<p id="instruction">'+esc(tr(item.label))+'</p>'+(item.title?'<p class="prompt"'+(item.promptFr||!item.entry?' lang="fr"':'')+'>'+
      esc(item.title)+'</p>':'')+
    (item.hint?'<p class="detail" id="question-context">'+esc(tr(item.hint))+'</p>':'')+
    (item.clip?'<div>'+sound(item.clip)+'</div>'+detail:'')+
    '<form id="answer-form" class="answer-form" novalidate><label class="field"><span>'+t('Твой ответ','Javobingiz')+
    '</span><input id="answer" type="text" lang="'+(item.fr?'fr':lang)+'" value="'+esc(reply?.draft || '')+
    '" aria-describedby="instruction '+(item.hint?'question-context ':'')+'feedback" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off"></label>'+accents+
    '<div id="feedback" class="feedback" role="status" aria-live="polite"></div><div class="row answer-actions"><button class="primary" id="check" type="submit">'+
    t('Проверить','Tekshirish')+'</button>'+actionButton(t('Показать ответ','Javobni ko‘rish'),'reveal','text-button','id="reveal"')+
    '</div></form><div class="row">'+
    actionButton(t('Назад','Oldingi'),'previous-question','secondary',practice.index===0 ? 'disabled' : '')+
    actionButton(last ? t('Результат','Natija') : t('Вперёд','Keyingi'),'next-question','secondary','id="next"')+
    '</div>'+soundRegion()+'</section>';
}

function practicePage() {
  const tabs = Object.entries(MODES).map(([id,label])=>anchor(id==='writing'?'practice':'practice/'+id,tr(label),mode===id)).join('');
  const body = practice ? (practice.index===practice.queue.length ? resultPage() : questionPage()) : practiceOptions();
  return '<section class="practice stack"><nav class="tabs mode-nav" aria-label="'+
    t('Тип практики','Mashq turi')+'">'+tabs+'</nav>'+body+'</section>';
}

function dictionaryResults() {
  const scope = dictFilter==='selected' ? selectedEntries() : dictFilter==='all' ? entries : topicEntries(dictFilter);
  const words = HanyuCourse.rankedDictionary(scope, wordQuery,
    entry => [entry.fr,...entry.meanings.flatMap(row=>[row.ru,row.uz])], searchSpelling);
  const count = $('word-results');
  if (count) count.textContent = t('Найдено: ','Topildi: ') + words.length;
  const empty = '<li class="box">'+t('Слова не найдены. Измени запрос или фильтр.','So‘zlar topilmadi. So‘rov yoki filtrni o‘zgartiring.')+'</li>';
  return words.length ? words.map(entry=>{
    const example = lexicalExample(entry);
    const verb = entry.fr.toLowerCase();
    const grammar = [COURSE.present.some(e=>e.verb===verb)?'present':'', COURSE.past.some(e=>e.verb===verb)?'past':'']
      .filter(Boolean).map(where=>'<a href="#practice/'+where+'/'+encodeURIComponent(verb)+'" lang="fr">'+tr(MODES[where])+'</a>').join(' · ');
    return '<li class="word box"><div><strong lang="fr">'+esc(entry.fr)+'</strong>' +
      (grammar?'<p>'+grammar+'</p>':'')+'</div><div><p>'+esc(translation(entry))+'</p>'+
      (example?'<p lang="fr" class="detail">'+esc(example)+'</p>':'')+
      (entry.translationNote?'<p class="detail">'+t('Узбекский перевод дополнен для курса.','O‘zbekcha tarjima kurs uchun to‘ldirilgan.')+'</p>':'')+
      '</div>'+sound(entry.fr,true)+'</li>';
  }).join('') : empty;
}

function dictionaryPage() {
  const filters = [['all',t('Все темы','Barcha mavzular')],['selected',t('Выбранные темы','Tanlangan mavzular')],
    ...Object.entries(TOPICS).map(([id,[fr,ru,uz]])=>[id,t(ru,uz)])];
  return '<section class="dictionary"><div class="form-grid"><label class="field"><span>'+t('Поиск','Qidiruv')+
    '</span><input type="search" id="word-query" value="'+esc(wordQuery)+'" placeholder="'+
    t('Слово или выражение на FR, RU, UZ','FR, RU, UZ tilidagi so‘z yoki ibora')+'"></label><label class="field"><span>'+
    t('Тема','Mavzu')+'</span><select id="word-filter">'+filters.map(([id,label])=>'<option value="'+id+'"'+
    (dictFilter===id?' selected':'')+'>'+esc(label)+'</option>').join('')+'</select></label></div><p class="detail" id="word-results" role="status"></p>'+
    soundRegion()+'<ul class="word-list" id="word-list"></ul></section>';
}

function renderHints() {
  const examples = ORIGINAL_EXAMPLES.map(([title,fr,ru,uz])=>'<div><h3 lang="fr">'+esc(title)+'</h3><p lang="fr">'+esc(fr)+'</p><p class="detail">'+
    esc(t(ru,uz))+'</p>'+sound(fr)+'</div>').join('');
  const notes = [
    ['В vous сочетание ou даёт звук [u], а в beau eau звучит как [o]. В voir буквы oi передают [wa].',
     'Vous so‘zida ou [u], beau so‘zida eau [o], voir so‘zida esa oi [wa] kabi aytiladi.'],
    ['В enfant есть носовой гласный. В les enfants слышится связка [z]. Окончание -ent у ils parlent обычно не произносится.',
     'Enfant so‘zida burun unlisi bor. Les enfants birikmasida [z] bog‘lanishi eshitiladi. Ils parlent shaklidagi -ent odatda talaffuz qilinmaydi.'],
    ['У le père и la mère артикль показывает род. В l’entrée артикль сокращён, поэтому род полезно учить отдельно. Tu обычно обращено к одному знакомому, vous — к нескольким людям или вежливо к одному.',
     'Le père va la mère birikmalarida artikl rodni ko‘rsatadi. L’entrée da artikl qisqargan, rodni alohida yodlang. Tu odatda bir tanish kishiga, vous esa bir necha kishiga yoki bir kishiga hurmat bilan aytiladi.'],
    ['J’habite, je n’habite pas и est-ce qu’elle habite используют апостроф. После être профессия в простом представлении обычно идёт без артикля: elle est médecin.',
     'J’habite, je n’habite pas va est-ce qu’elle habite apostrof bilan yoziladi. Oddiy tanishtirishda être dan keyin kasb odatda artiklsiz keladi: elle est médecin.']
  ].map(pair=>'<p>'+esc(tr(pair))+'</p>').join('');
  return '<details class="box hint-list"><summary>'+t('Памятка по чтению и грамматике','Talaffuz va grammatika bo‘yicha eslatma')+
    '</summary>'+notes+'</details><details class="box stack"><summary>'+t('Дополнительные учебные примеры','Qo‘shimcha mashq misollari')+
    '</summary><div class="stack">'+examples+'</div>'+'</details>';
}

function render() {
  document.documentElement.lang = lang;
  document.title = t('hanyuwed — Карточки французского', 'hanyuwed — Fransuz tili kartochkalari');
  for (const button of document.querySelectorAll('[data-lang]')) button.setAttribute('aria-pressed',button.dataset.lang===lang);
  const headings = {
    topics:[HanyuCourse.labels.units,['Можно повторять одну тему или смешать несколько.','Bir yoki bir nechta mavzuni takrorlash mumkin.']],
    cards:[VIEWS.cards,[selectionSummary(),selectionSummary()]],
    practice:[VIEWS.practice,['Введи ответ и проверь себя.','Javobni yozib, tekshir.']],
    dictionary:[VIEWS.dictionary,['Французский, русский и узбекский.','Fransuz, rus va o‘zbek tillarida.']]
  };
  $('page-title').textContent = tr(headings[view][0]);
  $('page-subtitle').textContent = tr(headings[view][1]);
  $('course-picker').textContent = t('Выбрать язык','Tilni tanlash');
  $('brand-course').textContent = t('Французский по карточкам', 'Fransuz tili kartochkalarda');
  $('language-switch').setAttribute('aria-label',t('Язык обучения','O‘rganish tili'));
  $('help').setAttribute('aria-label',t('Как пользоваться','Qanday foydalaniladi?'));
  $('nav').innerHTML = Object.entries(VIEWS).map(([id,label]) =>
    anchor(id,tr(HanyuCourse.labels[id === 'topics' ? 'units' : id] || label),view===id)).join('');
  $('nav').ariaLabel = t('Разделы','Bo‘limlar');
  $('footer-detail').textContent = storage.available ?
    t('Прогресс хранится в этом браузере','Natijalar shu brauzerda saqlanadi') :
    t('Браузер не сохранил прогресс','Brauzer natijalarni saqlamadi');
  main.innerHTML = ({
    topics:topicsPage,
    cards:cardsPage,
    practice:practicePage,
    dictionary:dictionaryPage
  })[view]();
  if (view==='dictionary') $('word-list').innerHTML = dictionaryResults();
  if (view==='practice' && practice && practice.index<practice.queue.length) updateFeedback();
}

const MESSAGES = {
  empty:['Сначала впиши ответ.','Avval javob yozing.'],
  correct:['Верно.','To‘g‘ri.'],
  shown:['Образец ответа','Javob namunasi'],
  accent:['Почти. Проверь французские знаки и буквы.','Deyarli to‘g‘ri. Fransuzcha belgilar va harflarni tekshiring.'],
  article:['Проверь артикль.','Artiklni tekshiring.'],
  elision:['Проверь апостроф в сокращённой форме.','Qisqargan shakldagi apostrofni tekshiring.'],
  negation:['Добавь ne или n’ и поставь pas после глагола.','Ne yoki n’ ni qo‘shing va pas ni fe’ldan keyin yozing.'],
  'question-mark':['Поставь вопросительный знак.','So‘roq belgisini qo‘ying.'],
  participle:['Вспомогательный глагол выбран верно. Проверь причастие.','Yordamchi fe’l to‘g‘ri. Participe passé shaklini tekshiring.'],
  auxiliary:['Причастие верное. Проверь вспомогательный глагол.','Participe passé to‘g‘ri. Yordamchi fe’lni tekshiring.'],
  incorrect:['Попробуй ещё раз.','Yana urinib ko‘ring.']
};

function updateFeedback() {
  const reply = practice.replies[practice.index];
  const item = practice.queue[practice.index];
  const box = $('feedback');
  const status = reply?.feedback;
  const locked = reply?.correct || reply?.shown;
  $('answer').readOnly = Boolean(locked);
  $('check').hidden = Boolean(locked);
  $('reveal').hidden = Boolean(locked);
  for (const button of document.querySelectorAll('[data-action=accent]')) button.disabled = Boolean(locked);
  box.replaceChildren();
  delete box.dataset.state;
  if (!status) return;
  box.dataset.state = ({correct:'ok',shown:'ok',accent:'near',empty:'near'})[status] || 'error';
  const explain = !['correct','shown','empty','negation','question-mark','accent','article','elision'].includes(status) && item.rule;
  box.textContent = tr(MESSAGES[status]) + (explain ? ' ' + tr(item.rule) : '');
  if (status==='accent') {
    const match = item.accepted.find(variant=>searchSpelling(answerSpelling(variant,item))===searchSpelling(answerSpelling(reply.draft,item)));
    box.append(' '+ (match || item.accepted[0]));
  }
  if (locked) {
    const example = document.createElement('strong');
    example.lang = item.fr?'fr':lang;
    example.textContent = item.solution || item.accepted[0];
    box.append(example);
    if (item.rule) box.append(tr(item.rule));
  }
}

function replyRecord() {
  return practice.replies[practice.index] ||= {draft:'',feedback:null,attempts:0,firstCorrect:false,correct:false,shown:false};
}

function saveReply(item, reply) {
  const old = storage.read(keyFor(item.id), {});
  storage.write(keyFor(item.id),{
    bestFirst:Boolean(old?.bestFirst || reply.firstCorrect), lastCorrect:reply.correct,
    attempts:(Number(old?.attempts)||0)+1, time:Date.now()
  });
  if (!storage.available) $('footer-detail').textContent = t('Браузер не сохранил прогресс','Brauzer natijalarni saqlamadi');
}

function check() {
  const current = practice?.queue[practice.index];
  if (!current) return;
  const reply = replyRecord();
  if (reply.correct || reply.shown) return;
  reply.draft = $('answer').value;
  const result = evaluateAnswer(reply.draft,current);
  reply.feedback = result;
  if (result!=='empty') {
    const prior = reply.attempts;
    reply.attempts += 1;
    if (result==='correct') {
      reply.firstCorrect = prior===0;
      reply.correct = true;
      saveReply(current,reply);
    }
  }
  updateFeedback();
  savePractice();
  if (result==='correct') $('next').focus();
}

function displayAnswer() {
  const item = practice.queue[practice.index];
  const reply = replyRecord();
  if (reply.correct || reply.shown) return;
  reply.shown = true;
  reply.feedback = 'shown';
  saveReply(item,reply);
  updateFeedback();
  savePractice();
  $('next').focus();
}

function moveQuestion(offset) {
  const index = practice.index + offset;
  if (index < 0 || index > practice.queue.length) return;
  clearSound();
  practice.index = index;
  savePractice();
  render();
  $('answer')?.focus();
  if (!$('answer')) main.querySelector('[data-action="previous-question"]')?.focus();
}

function clearSound() {
  stopSpeech();
  soundStatus = '';
}

function updateRoute() {
  const [target,targetMode,rawVerb] = location.hash.slice(1).split('/');
  const requested = Object.hasOwn(VIEWS,target) ? target : 'topics';
  const requestedMode = Object.hasOwn(MODES,targetMode) ? targetMode : 'writing';
  if (requested==='practice' && requestedMode!==mode) {
    mode = requestedMode;
    restorePractice();
  }
  if (requested==='practice' && rawVerb) {
    try {
      const verb = decodeURIComponent(rawVerb);
      const list = mode==='present'?COURSE.present:mode==='past'?COURSE.past:[];
      if (list.some(e => e.verb===verb) && settings.verb!==verb) {
        settings.verb = verb;
        settings.pastAux = 'all';
        practice = null;
        savePractice();
      }
    } catch { /* Malformed hash: keep the current selection. */ }
  }
  view = requested;
  clearSound();
  render();
}
function go(route) {
  if (location.hash==='#'+route) updateRoute();
  else location.hash = route;
}
window.addEventListener('hashchange', updateRoute);
window.addEventListener('storage',event=>{
  if (event.key === languageKey) {
    setLanguage(readLanguage());
    return;
  }
  if (!event.key?.startsWith(PREFIX+'progress:v1:')) return;
  const id = event.key.split(':').at(-1);
  if (entries.some(e=>e.id===id)) progress[id] = storage.read(keyFor(id),null);
});
window.addEventListener('pageshow', () => setLanguage(readLanguage()));

function setLanguage(language) {
  if (language===lang) return;
  const previous = lang;
  lang = language;
  try { localStorage.setItem(languageKey,lang); } catch { storage.available = false; }
  if (practice && mode==='writing') {
    const previousIndex = practice.index;
    practice.languageSessions.set(previous,{index:previousIndex,replies:practice.replies});
    practice.queue = practice.queue.map(item=>lexExercise(item.entry,settings.direction==='to-fr'));
    const session = practice.languageSessions.get(lang);
    practice.index = session?.index ?? Math.min(previousIndex,practice.queue.length-1);
    practice.replies = session?.replies ?? [];
    savePractice();
  }
  clearSound();
  render();
}

document.addEventListener('click',event=>{
  const language = event.target.closest('[data-lang]');
  if (language) { setLanguage(language.dataset.lang); return; }
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const {action,id,text,letter} = button.dataset;
  if (action==='sound') {
    say(text,button.closest('dialog')?.querySelector('[role=status]') || undefined);
    return;
  }
  if (action==='help') {
    const dialog = $('help-dialog');
    dialog.innerHTML = '<button type="button" class="close" data-action="close-help" aria-label="' +
      t('Закрыть','Yopish') + '">×</button><h2 id="help-title">' + t('Как пользоваться','Qanday foydalaniladi?') +
      '</h2><p>' + t('Выбери темы для карточек или открой «Практику» для письменных заданий.',
      'Kartochkalar uchun mavzularni tanla yoki yozma topshiriqlar uchun «Mashqlar»ni och.') +
      '</p><div class="help-content stack">' + renderHints() + '</div><p class="detail" role="status"></p>';
    dialog.showModal();
    return;
  }
  if (action==='close-help') { clearSound(); $('help-dialog').close(); return; }
  if (action==='topic') {
    const ids = COURSE.sections.filter(s=>s.topic===id).map(s=>s.id);
    const remove = ids.every(key=>selected.has(key));
    for (const key of ids) remove ? selected.delete(key) : selected.add(key);
    updateSelection();
    render();
    main.querySelector('[data-id="'+id+'"]').focus();
    return;
  }
  if (action==='select-all'||action==='select-none') {
    selected = new Set(action==='select-all'?courseSections:[]);
    updateSelection();
  }
  if (action==='begin-cards') { hardOnly=false; cardsStart(); go('cards'); return; }
  if (action==='begin-writing') { go('practice'); return; }
  if (action==='flip') { cardState.back = !cardState.back; }
  if (action==='shuffle') cardsStart();
  if (action==='card-direction') { cardDirection = cardDirection==='to-fr'?'from-fr':'to-fr'; if (cardState) cardState.back=false; }
  if (action==='hard'||action==='repeat-hard') {
    hardOnly = action==='repeat-hard' || !hardOnly;
    cardsStart();
  }
  if (action==='previous-card'||action==='next-card') {
    const offset = action==='previous-card' ? -1 : 1;
    const index = cardState.index + offset;
    if (index < 0 || index > cardState.queue.length) return;
    cardState.index = index;
    cardState.back = false;
  }
  if (action==='grade-hard'||action==='grade-known') {
    if (!cardState?.back) return;
    const entry = cardState.queue[cardState.index];
    if (!entry) return;
    const value = action==='grade-hard'?'hard':'known';
    progress[entry.id] = value;
    storage.write(keyFor(entry.id),value);
    cardState.index++;
    cardState.back = false;
  }
  if (action==='practice-settings') {
    practice = null;
    savePractice();
  }
  if (action==='start-practice') {
    if (!practiceStart()) {
      const status = $('sound-status');
      if (status) status.textContent = soundStatus || t('Выбери параметры с доступными заданиями.','Mashq mavjud parametrlarni tanlang.');
      return;
    }
  }
  if (action==='retry') {
    const wrong = practice.queue.filter((_,index)=>!practice.replies[index]?.firstCorrect);
    if (wrong.length) practiceStart(wrong);
  }
  if (action==='reveal') { displayAnswer(); return; }
  if (action==='previous-question'||action==='next-question') {
    moveQuestion(action==='previous-question' ? -1 : 1);
    return;
  }
  if (action==='accent') {
    const input = $('answer');
    input.setRangeText(letter,input.selectionStart,input.selectionEnd,'end');
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.focus();
    return;
  }
  if (action==='flip'||action==='card-direction'||action.endsWith('-card')||action.startsWith('grade-')) saveCards();
  clearSound();
  render();
  if (action==='flip'||action.startsWith('grade-')||action.endsWith('-card')) {
    main.querySelector('.flashcard')?.focus();
  }
  if (action==='start-practice'||action==='retry') $('answer')?.focus();
});

main.addEventListener('submit',event=>{
  if (event.target.id!=='answer-form') return;
  event.preventDefault();
  check();
});
main.addEventListener('input',event=>{
  if (event.target.id==='answer' && practice && !event.target.readOnly) {
    const reply = replyRecord();
    reply.draft = event.target.value;
    reply.feedback = null;
    updateFeedback();
    savePractice();
  }
  if (event.target.id==='word-query') {
    wordQuery = event.target.value;
    $('word-list').innerHTML = dictionaryResults();
  }
});
main.addEventListener('change',event=>{
  const {target} = event;
  if (target.dataset.section) {
    const id = target.dataset.section;
    topicFocus = target.closest('[data-topic]').dataset.topic;
    target.checked ? selected.add(id) : selected.delete(id);
    updateSelection();
    render();
    main.querySelector('[data-section="'+id+'"]').focus();
  }
  if (target.id==='word-filter') {
    dictFilter = target.value;
    $('word-list').innerHTML = dictionaryResults();
  }
  if (target.dataset.setting) {
    const key = target.dataset.setting;
    settings[key] = target.value;
    if (key==='pastAux') settings.verb='all';
    if (['verb','pastAux'].includes(key) && location.hash.split('/').length>2) {
      const suffix = settings.verb==='all' ? '' : '/' + encodeURIComponent(settings.verb);
      history.replaceState(null,'','#practice/' + mode + suffix);
    }
    savePractice();
    render();
    main.querySelector('[data-setting="'+key+'"]')?.focus();
  }
});
restoreCards();
restorePractice();
updateRoute();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js').catch(() => {});
if (typeof FR_AUDIO === 'object') HanyuCourse.initOfflineAudio($('offline-audio'),Object.values(FR_AUDIO),new URL('../',location.href));
