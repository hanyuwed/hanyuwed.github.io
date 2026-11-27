import {words,selectWords,shuffled,restoreUnits} from './data.js';
import {createPronunciationPlayer} from './audio-player.js';
import {createPinyinPractice} from './pinyin-practice.js';
const $=id=>document.getElementById(id), key='hanyu-progress-v1';
const {languageKey, readLanguage, readStored, writeStored, rankedDictionary, normalizeSearch} = HanyuCourse;
const deckKey = 'hanyu-deck-v1';
const markPrefix = 'hanyu-progress-v2:';
const wordById = new Map(words.map(word => [word.id, word]));
let language = readLanguage();

const t = (ru, uz) => language === 'uz' ? uz : ru;
const staticTranslations = [...document.querySelectorAll('[data-uz]')].map(node => ({
  node, ru: [...node.childNodes], uz: node.dataset.uz,
}));
const translatedAttributes = ['aria-label', 'placeholder', 'title'].flatMap(name =>
  [...document.querySelectorAll(`[data-uz-${name}]`)].map(node => ({
    node, name, ru: node.getAttribute(name), uz: node.getAttribute(`data-uz-${name}`),
  }))
);
function renderLanguage() {
  document.documentElement.lang = language;
  document.title = t('hanyuwed — Карточки китайского', 'hanyuwed — Xitoy tili kartochkalari');
  $('languageRu').setAttribute('aria-pressed', String(language === 'ru'));
  $('languageUz').setAttribute('aria-pressed', String(language === 'uz'));
  for (const {node, ru, uz} of staticTranslations) {
    if (language === 'uz') node.textContent = uz;
    else node.replaceChildren(...ru);
  }
  for (const {node, name, ru, uz} of translatedAttributes) node.setAttribute(name, t(ru, uz));
}
function changeLanguage(next) {
  if (next === language) return;
  language = next;
  try { localStorage.setItem(languageKey, next); } catch {}
  renderLanguage();
  navigate(view);
}
$('languageRu').onclick = () => changeLanguage('ru');
$('languageUz').onclick = () => changeLanguage('uz');

function loadProgress() {
  const previous = readStored(key, {});
  const marks = {};
  for (const {id} of words) {
    const value = readStored(markPrefix + id, previous[id]);
    if (value === 'known' || value === 'hard') marks[id] = value;
  }
  return marks;
}
let progress = loadProgress();
const unitInfo = [
  {id: 1, title: 'Знакомство', uz: 'Tanishuv', symbol: '你'},
  {id: 2, title: 'Вещи', uz: 'Buyumlar', symbol: '书'},
  {id: 3, title: 'Семья', uz: 'Oila', symbol: '家'},
  {id: 4, title: 'Класс и учёба', uz: 'Sinf va o‘qish', symbol: '学'},
  {id: 5, title: 'Даты и день рождения', uz: 'Sana va tug‘ilgan kun', symbol: '月'},
  {id: 6, title: 'Время и распорядок дня', uz: 'Vaqt va kun tartibi', symbol: '点'},
  {id: 7, title: 'Места и направления', uz: 'Joylar va yo‘nalishlar', symbol: '在'},
  {id: 8, title: 'Комната и расположение предметов', uz: 'Xona va buyumlarning joylashuvi', symbol: '房'},
  {id: 9, title: 'Еда и напитки', uz: 'Yegulik va ichimliklar', symbol: '茶'},
  {id: 10, title: 'Покупки и цены', uz: 'Xaridlar va narxlar', symbol: '钱'},
  {id: 11, title: 'Встречи, дела и обмен валюты', uz: 'Uchrashuvlar, ishlar va valyuta ayirboshlash', symbol: '来'},
  {id: 12, title: 'Транспорт и поездки', uz: 'Transport va safarlar', symbol: '车'},
];
const selectedUnitsKey='hanyu-selected-units-v1';
let units=unitInfo.map(u=>u.id),restoredUnit=false;
try{const saved=localStorage.getItem(selectedUnitsKey);const legacy=localStorage.getItem('hanyu-selected-unit-v1');const parsed=restoreUnits(saved,legacy);if(parsed){units=parsed;restoredUnit=true;}}catch{}
let draftUnits=[...units];
let mode='all',reverse=false,showPy=false,revealed=false,queue=[],index=0,done=false,view='units',graded=new Set();
let unitDestination = 'study';
const renderPinyin = createPinyinPractice($('pinyinPractice'), t);
const topicTitle = unit => t(unit.title, unit.uz);
const wordTranslation = word => t(word.ru, word.uz);
const wordNote = word => t(word.note, word.noteUz);
const cardCount = count => t(`Карточек: ${count}`, `Kartochkalar: ${count}`);
const studyStats = (known, hard) => t(`Помню: ${known} · Ещё учу: ${hard}`, `Esimda: ${known} · Hali o‘rganyapman: ${hard}`);
const unitNumber = id => t(`Юнит ${id}`, `${id}-dars`);
function unitTitle(id) {
  return `${unitNumber(id)} · ${topicTitle(unitInfo.find(u => u.id === id))}`;
}
function unitWords(id){return words.filter(w=>!id||w.unit===id);}
function selectionTitle() {
  if (units.length === unitInfo.length) return t('Все юниты', 'Barcha darslar');
  if (units.length === 1) return unitNumber(units[0]);
  return t(`Юниты ${units.join(', ')}`, `Darslar: ${units.join(', ')}`);
}
function selectedWords(){return selectWords(units,'all',progress);}
function renderUnits(){const root=$('unitGrid');root.replaceChildren();for(const u of unitInfo){const group=unitWords(u.id),known=group.filter(w=>progress[w.id]==='known').length,hard=group.filter(w=>progress[w.id]==='hard').length;const b=document.createElement('button');const checked=draftUnits.includes(u.id);b.className='unit-tile'+(checked?' is-current':'');b.setAttribute('aria-pressed',String(checked));b.setAttribute('aria-label',`${unitNumber(u.id)}. ${topicTitle(u)}. ${cardCount(group.length)}. ${studyStats(known, hard)}.`);const symbol=document.createElement('span');symbol.className='unit-symbol';symbol.textContent=u.symbol;const body=document.createElement('span');body.className='unit-body';const label=document.createElement('span');label.className='unit-number';label.textContent=unitNumber(u.id).toUpperCase();const title=document.createElement('span');title.className='unit-title';title.textContent=topicTitle(u);const count=document.createElement('span');count.className='unit-count';count.textContent=cardCount(group.length);const stats=document.createElement('span');stats.className='unit-stats';stats.textContent=studyStats(known, hard);const track=document.createElement('span');track.className='unit-track';const bar=document.createElement('span');bar.style.width=`${known/group.length*100}%`;track.append(bar);body.append(label,title,count,track,stats);const check=document.createElement('span');check.className='unit-check';check.setAttribute('aria-hidden','true');check.textContent=checked?'✓':'';b.append(symbol,body,check);b.onclick=()=>{draftUnits=checked?draftUnits.filter(id=>id!==u.id):[...draftUnits,u.id].sort((a,b)=>a-b);renderUnits();root.children[u.id-1].focus({preventScroll:true});};root.append(b);}
const n=selectWords(draftUnits,'all',progress).length;$('selectionSummary').textContent=draftUnits.length
  ? t(`Выбрано юнитов: ${draftUnits.length}`, `Tanlangan darslar: ${draftUnits.length}`) + ' · ' + cardCount(n)
  : t('Выбери хотя бы один юнит', 'Kamida bitta darsni tanla');$('startSelected').disabled=!draftUnits.length;$('selectAllUnits').disabled=draftUnits.length===unitInfo.length;$('clearUnits').disabled=!draftUnits.length;}
$('selectAllUnits').onclick=()=>{draftUnits=unitInfo.map(u=>u.id);renderUnits();};
$('clearUnits').onclick=()=>{draftUnits=[];renderUnits();};
$('startSelected').onclick=()=>{if(!draftUnits.length)return;units=[...draftUnits];mode='all';$('search').value='';try{localStorage.setItem(selectedUnitsKey,JSON.stringify(units));}catch{}start(true);navigate(unitDestination);window.scrollTo({top:0,behavior:'smooth'});};
function navigate(nextView,writeHistory=true){pronunciation.stop();if(nextView==='units'&&view!=='units'){draftUnits=[...units];unitDestination=view==='pinyin'?'pinyin':'study';}view=nextView;if(writeHistory&&location.hash!==`#${view}`)history.pushState(null,'',`#${view}`);$('unitPicker').hidden=view!=='units';$('study').hidden=view!=='study';$('pinyinPractice').hidden=view!=='pinyin';$('dictionary').hidden=view!=='dictionary';for(const [id,target]of [['unitsTab','units'],['studyTab','study'],['pinyinTab','pinyin'],['dictTab','dictionary']]){$(id).classList.toggle('active',view===target);$(id).setAttribute('aria-current',view===target?'page':'false');}$('wordCount').textContent=view==='units'?words.length:selectedWords().length;$('pageEyebrow').textContent=view==='units'?t('ТВОИ ПЕРВЫЕ СЛОВА', 'BIRINCHI SO‘ZLARING'):selectionTitle().toUpperCase();$('pageTitle').textContent=view === 'units' ? t('Выбери юниты.', 'Darslarni tanla.')
  : view === 'pinyin' ? t('Тренировка пиньиня.', 'Pinyin mashqi.')
  : units.length === 1 ? topicTitle(unitInfo.find(u => u.id === units[0]))
  : units.length === unitInfo.length ? t('Повторим всё.', 'Hammasini takrorlaymiz.')
  : t('Повторяем вместе.', 'Birgalikda takrorlaymiz.');$('pageSubtitle').textContent=view === 'units' ? t('Одна тема или несколько — решаешь ты.', 'Bitta mavzuni yoki bir nechtasini tanla.')
  : `${cardCount(selectedWords().length)} · ${view === 'dictionary'
      ? t('слова выбранных юнитов', 'tanlangan darslardagi so‘zlar')
      : t('учись в своём темпе', 'o‘zingga qulay tezlikda o‘rgan')}`;$('selectedUnit').textContent=selectionTitle();$('dictionaryUnit').textContent=selectionTitle() + t(' · Сменить', ' · O‘zgartirish');if(view==='units')renderUnits();else if(view==='dictionary')renderDict();else if(view==='pinyin')renderPinyin(selectedWords(), selectionTitle());else render();}

let toastTimer;function toast(msg){$('toast').textContent=msg;$('toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.display='none',3300);}
function save(id, value) {
  if (!writeStored(markPrefix + id, value)) {
    toast(t('Браузер не разрешает сохранить прогресс.', 'Natijalarni brauzerda saqlab bo‘lmadi.'));
  }
}
function saveDeck() {
  writeStored(deckKey, {units, mode, ids:queue.map(word => word.id), index, reverse, showPy, revealed, done, graded:[...graded]});
}

function restoreDeck() {
  const state = readStored(deckKey);
  if (!state || !Array.isArray(state.units) || state.units.join() !== units.join() ||
      !Array.isArray(state.ids) || !state.ids.length || !Number.isInteger(state.index) ||
      !state.ids.every(id => wordById.has(id) && units.includes(wordById.get(id).unit))) return false;
  queue = state.ids.map(id => wordById.get(id));
  mode = state.mode === 'hard' ? 'hard' : 'all';
  index = Math.max(0, Math.min(state.index, queue.length - 1));
  reverse = state.reverse === true;
  showPy = state.showPy === true;
  revealed = state.revealed === true;
  done = state.done === true;
  graded = new Set(Array.isArray(state.graded) ? state.graded.filter(id => wordById.has(id)) : []);
  return true;
}
function start(random=false){pronunciation.stop();queue=selectWords(units,mode,progress);if(random)queue=shuffled(queue);index=0;done=false;revealed=false;graded=new Set();render();}
function counts(){const group=selectedWords(),known=group.filter(w=>progress[w.id]==='known').length,hard=group.filter(w=>progress[w.id]==='hard').length;$('hardCount').textContent=hard;$('summaryText').textContent=t(`Отмечено «Помню»: ${known} из ${group.length} · Ещё учу: ${hard}`,
    `Esimda: ${group.length} tadan ${known} ta · Hali o‘rganyapman: ${hard}`);return {known,hard};}
function render(){
  saveDeck();
  const target = t('РУ', 'UZ');
  $('directionLabel').textContent = reverse ? `${target} → 汉` : `汉 → ${target}`;
  const {hard}=counts();$('allMode').classList.toggle('selected',mode==='all');$('hardMode').classList.toggle('selected',mode==='hard');$('deck').hidden=done||!queue.length;$('empty').hidden=done||!!queue.length;$('complete').hidden=!done;if(done){$('completeText').textContent=t(`В этом круге оценено ${graded.size} из ${queue.length} карточек. Трудных слов в выбранных юнитах: ${hard}.`,
    `Bu safar ${queue.length} ta kartochkadan ${graded.size} tasini belgilading. Tanlangan darslarda ${hard} ta qiyin so‘z bor.`);$('repeatHard').hidden=!hard;return;}if(!queue.length)return;
const w=queue[index];$('unitLabel').textContent=unitTitle(w.unit);$('position').textContent=`${index+1} / ${queue.length}`;$('progressBar').style.width=`${(index+1)/queue.length*100}%`;
const content=$('cardContent');content.replaceChildren();function line(text,cls){const s=document.createElement('span');s.className=cls;s.textContent=text;content.append(s);}
if(reverse&&!revealed){line(wordTranslation(w),'front-ru');}else{line(w.hanzi,'hanzi');content.lastChild.lang='zh-Hans';if(revealed||showPy)line(w.pinyin,'pinyin');if(revealed){line(wordTranslation(w),'translation');if(wordNote(w))line(wordNote(w),'note');}}
const visibleText = [...content.children].map(part => part.textContent).join(' · ');
$('flashcard').classList.toggle('revealed',revealed);$('flashcard').setAttribute('aria-label',`${visibleText}. ${revealed?t('Скрыть ответ','Javobni yashirish'):t('Показать ответ','Javobni ko‘rsatish')}`);$('flipHint').textContent=revealed?t('Нажми, чтобы скрыть ответ','Javobni yashirish uchun bos'):t('Нажми, чтобы проверить себя ↗','Javobni ko‘rish uchun bos ↗');$('assess').hidden=!revealed;$('beforeAnswer').hidden=revealed;$('previous').disabled=index===0;$('pinyinToggle').hidden=reverse;$('pinyinToggle').textContent=showPy?t('Пиньинь: виден','Pinyin: ko‘rsatilgan'):t('Пиньинь: скрыт','Pinyin: yashirilgan');}
function advance(){pronunciation.stop();revealed=false;if(index<queue.length-1)index++;else done=true;render();}
function grade(value){if(!revealed||done||!queue[index])return;const id=queue[index].id;progress[id]=value;graded.add(id);save(id,value);advance();}
$('flashcard').onclick=()=>{revealed=!revealed;render();};$('again').onclick=()=>grade('hard');$('remember').onclick=()=>grade('known');$('next').onclick=advance;$('previous').onclick=()=>{if(index>0){pronunciation.stop();index--;revealed=false;render();}};
$('changeUnit').onclick=$('dictionaryUnit').onclick=()=>navigate('units');$('direction').onclick=()=>{pronunciation.stop();reverse=!reverse;revealed=false;render();};$('pinyinToggle').onclick=()=>{showPy=!showPy;render();};$('shuffle').onclick=()=>{start(true);toast(t('Карточки перемешаны', 'Kartochkalar aralashtirildi'));};$('allMode').onclick=$('backAll').onclick=()=>{mode='all';start();};$('hardMode').onclick=$('repeatHard').onclick=()=>{mode='hard';start(true);};$('restart').onclick=()=>start(true);
$('unitsTab').onclick=()=>navigate('units');$('studyTab').onclick=()=>navigate('study');$('dictTab').onclick=()=>navigate('dictionary');
$('pinyinTab').onclick=()=>navigate('pinyin');
$('pinyinUnit').onclick=()=>navigate('units');
function normalizeDictionary(value) {
  const normalized = normalizeSearch(value);
  if (/\p{Script=Cyrillic}/u.test(normalized)) return normalized;
  const text = normalized.normalize('NFD').replace(/\p{M}/gu, '').replace(/\s/gu, '');
  return /^(?:[a-z:]+[0-5])+[a-z:]*$/u.test(text) ? text.replace(/[0-5]/gu, '') : text;
}

function renderDict() {
  const list = rankedDictionary(selectedWords(), $('search').value,
    word => [word.hanzi, word.pinyin, word.ru, word.uz], normalizeDictionary);
  $('results').textContent = t(`Найдено: ${list.length}`, `Topildi: ${list.length}`);
  const root = $('wordList');
  root.replaceChildren();
  for (const word of list) {
    const row = document.createElement('div');
    row.className = 'word';
    const hanzi = document.createElement('div');
    hanzi.className = 'word-hanzi';
    hanzi.lang = 'zh-Hans';
    hanzi.textContent = word.hanzi;
    const info = document.createElement('div');
    const pinyin = document.createElement('div');
    pinyin.className = 'word-py';
    pinyin.textContent = word.pinyin;
    const translation = document.createElement('div');
    translation.className = 'word-ru';
    translation.textContent = wordTranslation(word);
    info.append(pinyin, translation);
    if (progress[word.id]) {
      const mark = document.createElement('div');
      mark.className = 'word-mark';
      mark.textContent = progress[word.id] === 'hard' ? t('↺ Ещё учу', '↺ Hali o‘rganyapman') : t('✓ Помню', '✓ Esimda');
      info.append(mark);
    }
    const sound = document.createElement('button');
    sound.textContent = '♪';
    sound.setAttribute('aria-label', t(`Прослушать ${word.hanzi}`, `${word.hanzi} talaffuzini tinglash`));
    sound.onclick = () => pronunciation.play(word);
    row.append(hanzi, info, sound);
    root.append(row);
  }
}
$('search').oninput=renderDict;
window.addEventListener('storage', event => {
  if (event.key === key || event.key === null || event.key?.startsWith(markPrefix)) {
    progress = loadProgress();
    if (view === 'units') renderUnits();
    else if (view === 'dictionary') renderDict();
    else if (view === 'study') counts();
  }
  if (event.key === languageKey && ['ru','uz'].includes(event.newValue)) changeLanguage(event.newValue);
});
const pronunciation=createPronunciationPlayer({audio:$('wordAudio'),panel:$('audioPlayer'),wordLabel:$('audioWord'),status:$('audioStatus'),close:$('closeAudio'), translate:t});
$('speak').onclick=()=>{if(reverse&&!revealed){toast(t('Сначала открой ответ, чтобы услышать слово.', 'So‘zni tinglash uchun avval javobni och.'));return;}if(queue[index])pronunciation.play(queue[index]);};
$('help').onclick=()=>$('helpDialog').showModal();$('closeHelp').onclick=()=>$('helpDialog').close();$('helpDialog').onclick=e=>{if(e.target===$('helpDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}};
document.addEventListener('keydown',e=>{if($('helpDialog').open||$('study').hidden||/INPUT|SELECT|BUTTON/.test(document.activeElement.tagName))return;if(e.code==='Space'&&!done&&queue.length){e.preventDefault();revealed=!revealed;render();}if(e.key==='ArrowRight'&&!done&&queue.length)advance();if(e.key==='ArrowLeft'&&index>0){pronunciation.stop();index--;revealed=false;render();}});
function routeFromHash() {
  const destination = location.hash.slice(1);
  navigate(['units','study','pinyin','dictionary'].includes(destination) ? destination : (restoredUnit ? 'study' : 'units'), false);
}
window.addEventListener('hashchange', routeFromHash);
window.addEventListener('pageshow', () => {
  changeLanguage(readLanguage());
});
const initialView = ['units','study','pinyin','dictionary'].includes(location.hash.slice(1)) ? location.hash.slice(1) : (restoredUnit ? 'study' : 'units');
if (!location.hash) history.replaceState(null, '', `#${initialView}`);
renderLanguage();if(!restoreDeck())start(true);navigate(initialView,false);if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
