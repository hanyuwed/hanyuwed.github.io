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
const translationVariants = {
  미국:{ru:['Соединённые Штаты Америки','Соединённые Штаты'],uz:['Amerika Qo‘shma Shtatlari']},
  책상:{ru:['письменный стол','рабочий стол'],uz:['yozuv stoli']}
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
  const options = [full, bare, ...bare.split(/[,;/]+/u), ...(translationVariants[word.hangul]?.[lang] || [])];
  if (lang === 'uz' && word.hangul.startsWith('날씨가 ')) options.push(full + ' bo‘lmoq');
  if (lang === 'uz' && word.hangul === '시원하다') options.push('salqin');
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
  [1, 'form', '저는 학생□.', '이에요', '예요', 'После согласной в конце 학생 нужна форма 이에요.', '학생 undosh bilan tugaydi, shuning uchun 이에요 yoziladi.', 'Допиши вежливую форму «быть». Я студент.', '«Bo‘lmoq» fe’lining xushmuomala shaklini yoz. Men talabaman.'],
  [1, 'form', '저는 의사□.', '예요', '이에요', 'После гласной в конце 의사 нужна форма 예요.', '의사 unli bilan tugaydi, shuning uchun 예요 yoziladi.', 'Допиши вежливую форму «быть». Я врач.', '«Bo‘lmoq» fe’lining xushmuomala shaklini yoz. Men shifokorman.'],
  [1, 'particle', '저□ 한국 사람이에요.', '는', '은', 'Тематическая частица после гласной 저 — 는.', '저 unli bilan tugaydi, mavzu yuklamasi 는 bo‘ladi.', 'Обозначь тему высказывания. Я кореец или кореянка.', 'Gapning mavzusini bildiruvchi yuklamani yoz. Men koreysman.'],
  [2, 'particle', '책□ 있어요.', '이', '가', 'У 책 есть конечная согласная, поэтому частица подлежащего — 이.', '책 undosh bilan tugaydi, shuning uchun ega yuklamasi 이 bo‘ladi.', 'Впиши частицу подлежащего. Есть книга.', 'Ega yuklamasini yoz. Kitob bor.'],
  [2, 'particle', '의자□ 없어요.', '가', '이', 'После гласной в конце 의자 частица подлежащего — 가.', '의자 unli bilan tugaydi, shuning uchun ega yuklamasi 가 bo‘ladi.', 'Впиши частицу подлежащего. Стула нет.', 'Ega yuklamasini yoz. Stul yo‘q.'],
  [2, 'form', '이건 지우개□.', '예요', '이에요', 'В конце 지우개 стоит гласная, поэтому нужна форма 예요.', '지우개 unli bilan tugaydi, shuning uchun 예요 yoziladi.', 'Допиши вежливую форму «быть». Это ластик.', '«Bo‘lmoq» fe’lining xushmuomala shaklini yoz. Bu o‘chirg‘ich.'],
  [3, 'particle', '책□ 읽다', '을', '를', '책 оканчивается на согласную, поэтому нужна форма 을.', '책 undosh bilan tugaydi, shuning uchun 을 yoziladi.', 'Впиши частицу дополнения. Читать книгу.', 'To‘ldiruvchi yuklamasini yoz. Kitob o‘qimoq.'],
  [3, 'particle', '커피□ 마시다', '를', '을', '커피 оканчивается на гласную, поэтому нужна форма 를.', '커피 unli bilan tugaydi, shuning uchun 를 yoziladi.', 'Впиши частицу дополнения. Пить кофе.', 'To‘ldiruvchi yuklamasini yoz. Qahva ichmoq.'],
  [3, 'particle', '학교□ 가요', '에', '에서', 'Здесь школа — пункт назначения, который обозначает 에.', 'Bu gapda 학교 boradigan joy, uni 에 yuklamasi bildiradi.', 'Иду в школу. Впиши частицу места назначения.', 'Maktabga ketyapman. Boradigan joyni bildiruvchi yuklamani yoz.'],
  [3, 'particle', '학교□ 공부해요', '에서', '에', 'Действие происходит в школе, поэтому нужна частица 에서.', 'Ish-harakat maktabda sodir bo‘lyapti, shuning uchun 에서 yoziladi.', 'Учусь в школе. Впиши частицу места действия.', 'Maktabda o‘qiyman. Ish-harakat joyini bildiruvchi yuklamani yoz.'],
  [4, 'particle', '책이 책상 위□ 있어요', '에', '에서', 'Положение предмета обозначает 에.', 'Narsaning turgan joyini 에 yuklamasi bildiradi.', 'Книга лежит на столе. Впиши частицу места.', 'Kitob yozuv stoli ustida. Joy yuklamasini yoz.'],
  [4, 'particle', '약국이 병원 옆□ 있어요.', '에', '에서', 'Место, где находится аптека, обозначаем частицей 에.', 'Dorixona joylashgan o‘rinni 에 yuklamasi bildiradi.', 'Аптека рядом с больницей.', 'Dorixona shifoxonaning yonida.'],
  [5, 'particle', '월요일□ 만나요.', '에', '에서', '에 указывает, когда происходит действие.', '에 ish-harakat qachon bo‘lishini bildiradi.', 'Встретимся в понедельник.', 'Dushanba kuni uchrashamiz.'],
  [5, 'particle', '토요일□ 일요일까지 쉬어요.', '부터', '까지', 'Начало периода обозначает 부터, конец — 까지.', 'Davrning boshlanishini 부터, oxirini 까지 bildiradi.', 'Отдыхаю с субботы до воскресенья.', 'Shanbadan yakshanbagacha dam olaman.'],
  [5, 'particle', '월요일부터 금요일□ 일해요.', '까지', '부터', 'До пятницы — 금요일까지.', 'Jumagacha — 금요일까지.', 'Работаю с понедельника до пятницы.', 'Dushanbadan jumagacha ishlayman.'],
  [6, 'form', '사과 □ 개 주세요.', '두', '둘', 'Перед счётным словом 개 форма 둘 меняется на 두.', '개 sanoq so‘zidan oldin 둘 shakli 두 ga o‘zgaradi.', 'Впиши числительное. Дайте два яблока, пожалуйста.', 'Sonni yoz. Iltimos, ikkita olma bering.'],
  [6, 'form', '김밥 □ 줄 주세요.', '한', '하나', 'Перед счётным словом 줄 форма 하나 меняется на 한.', '줄 sanoq so‘zidan oldin 하나 shakli 한 ga o‘zgaradi.', 'Впиши числительное. Дайте один ролл кимпапа, пожалуйста.', 'Sonni yoz. Iltimos, bitta kimbap bering.'],
  [6, 'particle', '비빔밥□ 주세요.', '을', '를', 'У 비빔밥 есть конечная согласная, поэтому нужна частица 을.', '비빔밥 undosh bilan tugaydi, shuning uchun 을 yoziladi.', 'Впиши частицу дополнения. Дайте пибимпап, пожалуйста.', 'To‘ldiruvchi yuklamasini yoz. Iltimos, bibimbap bering.'],
  [7, 'form', '오늘은 □. (춥다)', '추워요', '춥어요', 'В вежливой форме 춥다 превращается в 추워요.', '춥다 fe’lining xushmuomala shakli — 추워요.', 'Впиши вежливую форму на -요. Сегодня холодно.', '-요 bilan tugaydigan xushmuomala shaklni yoz. Bugun havo sovuq.'],
  [7, 'form', '여름에는 □. (덥다)', '더워요', '덥어요', 'В вежливой форме 덥다 превращается в 더워요.', '덥다 fe’lining xushmuomala shakli — 더워요.', 'Впиши вежливую форму на -요. Летом жарко.', '-요 bilan tugaydigan xushmuomala shaklni yoz. Yozda havo issiq.'],
  [7, 'particle', '비□ 와요.', '가', '이', 'После гласной в конце 비 нужна частица подлежащего 가.', '비 unli bilan tugaydi, shuning uchun ega yuklamasi 가 bo‘ladi.', 'Впиши частицу подлежащего. Идёт дождь.', 'Ega yuklamasini yoz. Yomg‘ir yog‘yapti.'],
  [8, 'verb', '피아노를 □', '치다', '하다', 'Для игры на пианино можно использовать 치다 или 연주하다.', 'Pianino chalish uchun 치다 yoki 연주하다 ishlatiladi.', 'Играть на пианино. Впиши глагол в словарной форме.', 'Pianino chalmoq. Fe’lni lug‘at shaklida yoz.'],
  [8, 'verb', '스키를 □', '타다', '하다', 'Кататься на лыжах — 스키를 타다.', 'Chang‘ida uchmoq — 스키를 타다.', 'Кататься на лыжах. Впиши глагол в словарной форме.', 'Chang‘ida uchmoq. Fe’lni lug‘at shaklida yoz.'],
  [8, 'verb', '축구를 □', '하다', '치다', 'Играть в футбол — 축구를 하다.', 'Futbol o‘ynamoq — 축구를 하다.', 'Играть в футбол. Впиши глагол в словарной форме.', 'Futbol o‘ynamoq. Fe’lni lug‘at shaklida yoz.'],
  [9, 'form', '길이 □. (좁다)', '좁아요', '좁어요', 'У 좁다 гласная ㅗ, поэтому в вежливой форме получается 좁아요.', '좁다 negizida ㅗ bor, xushmuomala shakli 좁아요 bo‘ladi.', 'Впиши вежливую форму на -요. Дорога узкая.', '-요 bilan tugaydigan xushmuomala shaklni yoz. Yo‘l tor.'],
  [9, 'particle', '날씨□ 좋아요.', '가', '이', 'После гласной в конце 날씨 нужна частица подлежащего 가.', '날씨 unli bilan tugaydi, shuning uchun ega yuklamasi 가 bo‘ladi.', 'Впиши частицу подлежащего. Погода хорошая.', 'Ega yuklamasini yoz. Ob-havo yaxshi.'],
  [10, 'form', '사람이 □ 명 있어요.', '세', '셋', 'Перед счётным словом 명 форма 셋 меняется на 세.', '명 sanoq so‘zidan oldin 셋 shakli 세 ga o‘zgaradi.', 'Впиши числительное хангылем. Здесь три человека.', 'Sonni hangulda yoz. Bu yerda uch kishi bor.'],
  [10, 'form', '책이 □ 권 있어요.', '네', '넷', 'Перед счётным словом 권 форма 넷 меняется на 네.', '권 sanoq so‘zidan oldin 넷 shakli 네 ga o‘zgaradi.', 'Впиши числительное хангылем. Здесь четыре книги.', 'Sonni hangulda yoz. Bu yerda to‘rtta kitob bor.'],
  [11, 'form', '□월에 만나요.', '유', '육', 'В слове 유월 для июня используется 유, а не 육.', 'Iyun oyi 유월 deb yoziladi, bunda 육 emas, 유 ishlatiladi.', 'Заполни пропуск хангылем. Встретимся в июне.', 'Bo‘sh joyni hangulda to‘ldir. Iyun oyida uchrashamiz.'],
  [11, 'form', '□월에 한국에 가요.', '시', '십', 'В слове 시월 для октября используется 시, а не 십.', 'Oktabr oyi 시월 deb yoziladi, bunda 십 emas, 시 ishlatiladi.', 'Заполни пропуск хангылем. В октябре еду в Корею.', 'Bo‘sh joyni hangulda to‘ldir. Oktabr oyida Koreyaga boraman.'],
  [1, 'form', '안녕하세요. 저는 민수□.', '예요', '이에요', 'Имя 민수 заканчивается на гласную. После него используется 예요.', '민수 ismi unli bilan tugaydi. Undan keyin 예요 ishlatiladi.', 'Представься вежливо. Здравствуйте, я Минсу.', 'Xushmuomala tanishing. Salom, men Minsuman.'],
  [2, 'particle', '가방 안에 공책□ 있어요.', '이', '가', 'У 공책 есть конечный согласный, поэтому нужна частица 이.', '공책 undosh bilan tugaydi, shuning uchun 이 yuklamasi kerak.', 'В сумке есть тетрадь. Впиши частицу подлежащего.', 'Sumkada daftar bor. Ega yuklamasini yoz.'],
  [3, 'particle', '친구□ 도서관에 가요.', '와', '과', 'После гласной частица совместности имеет форму 와.', 'Unlidan keyin birgalik yuklamasi 와 shaklida yoziladi.', 'Иду в библиотеку с другом. Используй 와 или 과.', 'Do‘stim bilan kutubxonaga ketyapman. 와 yoki 과 ni qo‘llang.'],
  [4, 'form', '은행은 우체국 □에 있어요.', '옆', '앞', 'Рядом с почтой — 우체국 옆에.', 'Pochta yonida — 우체국 옆에.', 'Банк рядом с почтой. Впиши «рядом».', 'Bank pochta yonida. «Yonida» ma’nosini to‘ldir.'],
  [5, 'particle', '아홉 시□ 수업이 시작돼요.', '에', '에서', 'Перед точным временем частица 에 ставится после обозначения времени.', 'Aniq vaqtni bildirgan iboradan keyin 에 qo‘yiladi.', 'Урок начинается в девять. Впиши частицу времени.', 'Dars soat to‘qqizda boshlanadi. Vaqt yuklamasini yoz.'],
  [6, 'form', '물 □ 병 주세요.', '두', '둘', '병 — счётное слово для бутылок. Перед ним пишем 두.', '병 shishalar uchun sanoq so‘zi. Undan oldin 두 yoziladi.', 'Дайте две бутылки воды, пожалуйста. Впиши числительное.', 'Iltimos, ikki shisha suv bering. Sonni yoz.'],
  [7, 'form', '봄에는 날씨가 □. (따뜻하다)', '따뜻해요', '따뜻하요', 'В вежливой форме 하다 переходит в 해요.', 'Xushmuomala shaklda 하다 fe’li 해요 bo‘ladi.', 'Весной погода тёплая. Допиши форму на -요.', 'Bahorda havo iliq. -요 bilan tugaydigan shaklni yoz.'],
  [8, 'particle', '주말에 친구와 테니스□ 쳐요.', '를', '을', 'После гласной в 테니스 используется частица дополнения 를.', '테니스 unli bilan tugaydi, shuning uchun 를 yoziladi.', 'В выходные играю с другом в теннис. Впиши частицу дополнения.', 'Dam olish kunlari do‘stim bilan tennis o‘ynayman. To‘ldiruvchi yuklamasini yoz.'],
  [9, 'form', '이 길은 □. (넓다)', '넓어요', '넓아요', 'Последняя гласная основы 넓- — ㅓ, поэтому пишем 넓어요.', '넓- negizining oxirgi unlisi ㅓ, shuning uchun 넓어요 yoziladi.', 'Эта дорога широкая. Допиши форму на -요.', 'Bu yo‘l keng. -요 bilan tugaydigan shaklni yoz.'],
  [10, 'form', '고양이가 □ 마리 있어요.', '한', '하나', 'Перед счётным словом для животных 마리 нужна форма 한.', 'Hayvonlar uchun 마리 sanoq so‘zidan oldin 한 yoziladi.', 'Здесь одна кошка. Впиши числительное.', 'Bu yerda bitta mushuk bor. Sonni yoz.'],
  [11, 'particle', '5월 3일□ 생일 파티를 해요.', '에', '에서', 'Дата указывает время события, поэтому после неё ставится 에.', 'Sana voqea vaqtini bildiradi, shuning uchun undan keyin 에 qo‘yiladi.', 'Вечеринка в честь дня рождения будет 3 мая. Впиши частицу времени.', 'Tug‘ilgan kun ziyofati 3-mayda bo‘ladi. Vaqt yuklamasini yoz.']
];
export function contextTasks(selected) {
  return contexts.filter(([unit]) => selected.has(unit)).map(([unit,type,prompt,form,wrong,ru,uz,clueRu,clueUz]) => ({
    word:{unit}, type, prompt, accepted:prompt === '피아노를 □' ? [form,'연주하다'] : [form], contextual:true,
    hint:{ru,uz}, instruction:clueRu && {ru:clueRu,uz:clueUz}, wrong
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
