// Original practice prompts keyed to the corresponding textbook unit.
const IT_LESSONS = [
  {
    rules: [
      ['Звуки, h и удвоение','Tovushlar, h va qo‘sh undoshlar','В cena и gelato начальные c/g звучат мягко. В che и spaghetti буква h сохраняет твёрдые [k]/[g]. Сравни сцепления scena/schema, bagno и figlio. Одна или две согласные могут менять значение.','Cena va gelato so‘zlarida boshlanish yumshoq. Che va spaghetti so‘zlarida h qattiq [k]/[g] tovushini saqlaydi. Scena/schema, bagno va figlio bilan solishtiring. Bitta yoki ikkita undosh ma’noni o‘zgartirishi mumkin.',['cena','che','gelato','spaghetti','scena','schema','bagno','figlio','pala','palla','casa','cassa']],
      ['Род, число и артикль','Jins, son va artikl','Сравни il gatto / i gatti, lo zaino / gli zaini, l’amica / le amiche. Артикль зависит и от первого звука.','Il gatto / i gatti, lo zaino / gli zaini, l’amica / le amiche ni solishtiring. Artiklda bosh tovush ham muhim.',['lo zaino','gli zaini','l’amica','le amiche']],
      ['Essere, avere, chiamarsi','Essere, avere, chiamarsi','Имя можно сказать через mi chiamo. Возраст выражают через avere. Io sono, tu sei, lei è.','Ismni mi chiamo orqali ayting. Yoshni avere bilan ifodalang. Io sono, tu sei, lei è.',['Mi chiamo Eva.','Ho diciotto anni.']]
    ],
    drills: [
      ['Какое слово значит «мяч»? Впиши слово.','«To‘p» italyanchada qanday yoziladi?','pala / palla','palla','pala'],
      ['Впиши определённый артикль.','Aniq artiklni yozing.','___ zaino','lo'],
      ['Напиши «подруга» с определённым артиклем.','«Dugona» so‘zini aniq artikl bilan yozing.','','l’amica'],
      ['Впиши форму essere.','Essere shaklini yozing.','Io ___ italiana.','sono'],
      ['Впиши форму essere.','Essere shaklini yozing.','Roma ___ in Italia.','è'],
      ['Напиши «мне 18 лет», число пропиши.','«Men 18 yoshdaman» deb yozing. Sonni harflar bilan yozing.','','Ho diciotto anni.|Io ho diciotto anni.'],
      ['Впиши форму chiamarsi.','Chiamarsi shaklini yozing.','Io ___ Nadia.','mi chiamo']
    ],
    sounds:['pala','palla','casa','cassa','cena','bagno','figlio'],
    scene:[['Ciao, come ti chiami?','Привет, как тебя зовут?','Salom, isming nima?'],['Mi chiamo Sara. E tu?','Меня зовут Сара. А тебя?','Ismim Sara. Seniki-chi?'],['Io sono Luca. Piacere!','Я Лука. Приятно познакомиться!','Men Lukaman. Tanishganimdan xursandman!']],
    task:['Представься и назови возраст.','O‘zingizni tanishtiring va yoshingizni ayting.'],
    model:['Mi chiamo Luca. Ho vent’anni.','Меня зовут Лука. Мне двадцать лет.','Ismim Luka. Men yigirma yoshdaman.']
  },
  {
    rules:[
      ['Настоящее и три спряжения','Hozirgi zamon va uch tuslanish','Сравни lavoro, prendo, dormo и finisco. У finire в части форм появляется -isc-.','Lavoro, prendo, dormo va finisco shakllarini solishtiring. Finire fe’lining ayrim shakllarida -isc- qo‘shiladi.',['lavoro','prendo','dormo','finisco']],
      ['Неопределённый артикль','Noaniq artikl','Перед гласной в мужском роде un amico. В женском роде un’amica. Перед st в мужском роде uno studente.','Unli oldidan muzakkar jinsda un amico, muannas jinsda un’amica. St oldidan muzakkar jinsda uno studente.',['un amico','un’amica','uno studente']],
      ['Вежливое Lei и прилагательные','Hurmat shakli Lei va sifatlar','При обращении Lei глагол стоит в третьем лице. Gentile подходит любому роду в единственном, множественное gentili.','Lei bilan fe’l uchinchi shaxsda bo‘ladi. Gentile birlikda ikkala jinsga mos, ko‘pligi gentili.',['Come si chiama?','due studenti gentili']]
    ],
    drills:[
      ['Впиши форму lavorare.','Lavorare shaklini yozing.','Marta ___ in farmacia.','lavora'],
      ['Впиши форму finire.','Finire shaklini yozing.','Io ___ alle cinque.','finisco'],
      ['Впиши форму prendere.','Prendere shaklini yozing.','Noi ___ il treno.','prendiamo'],
      ['Напиши «друг» с неопределённым артиклем.','«Erkak do‘st»ni noaniq artikl bilan yozing.','','un amico'],
      ['Впиши неопределённый артикль.','Noaniq artiklni yozing.','___ studente','uno'],
      ['Впиши правильную форму gentile.','Gentile ning to‘g‘ri shaklini yozing.','due studentesse ___','gentili'],
      ['Вежливо спроси, как зовут собеседника.','Suhbatdoshning ismini hurmat bilan so‘rang.','','Come si chiama?|Come si chiama Lei?']
    ],
    scene:[['Buongiorno, come si chiama?','Добрый день, как Вас зовут?','Xayrli kun, ismingiz nima?'],['Mi chiamo Marta. Lavoro qui vicino.','Меня зовут Марта. Я работаю неподалёку.','Ismim Marta. Shu yaqin atrofda ishlayman.'],['Piacere, sono Luca.','Приятно познакомиться, я Лука.','Tanishganimdan xursandman, men Lukaman.']],
    task:['Представь коллегу и опиши его характер.','Hamkasbingizni tanishtiring va xarakterini ayting.'],
    model:['Lui è Marco. È molto gentile.','Это Марко. Он очень любезный.','Bu Marko. U juda xushmuomala.']
  },
  {
    rules:[
      ['Модальные и неправильные формы','Modal va noto‘g‘ri shakllar','Potere, volere и dovere соединяются с инфинитивом. Сравни posso venire, voglio uscire и devo andare. Запомни vado, vai, viene, facciamo.','Potere, volere va dovere dan keyin infinitiv keladi. Posso venire, voglio uscire va devo andare ni solishtiring. Vado, vai, viene, facciamo ni yodlang.',['posso venire','voglio uscire','devo andare']],
      ['Время, адрес и приглашение','Vaqt, manzil va taklif','Со временем встречи употребляется alle, но all’una. 08:45 — le nove meno un quarto. Адрес можно начать с in via.','Uchrashuv vaqti uchun alle, bir soat uchun all’una ishlatiladi. 08:45 — le nove meno un quarto. Manzilni in via bilan boshlash mumkin.',['alle otto','all’una','le nove meno un quarto']],
      ['Простые предлоги','Sodda predloglar','Запоминай сочетания целиком. A Roma, in Italia, a casa, in treno, di lunedì в значении «по понедельникам».','A Roma, in Italia, a casa, in treno, di lunedì birikmalarini butun holda yodlang.',['a Roma','in Italia','in treno']]
    ],
    drills:[
      ['Впиши форму potere.','Potere shaklini yozing.','Sabato io ___ venire alle otto.','posso'],
      ['Впиши форму volere.','Volere shaklini yozing.','Tu ___ uscire?','vuoi'],
      ['Впиши форму dovere.','Dovere shaklini yozing.','Noi ___ andare.','dobbiamo'],
      ['Впиши форму andare.','Andare shaklini yozing.','Io ___ al cinema.','vado'],
      ['Впиши предлог.','Predlogni yozing.','Abito ___ Roma.','a'],
      ['Впиши предлог.','Predlogni yozing.','Siamo ___ Italia.','in'],
      ['Напиши 08:45 словами после Sono.','08:45 ni Sono dan keyin so‘z bilan yozing.','Sono ___ .','le nove meno un quarto|le otto e quarantacinque'],
      ['Напиши порядковое «пятый».','«Beshinchi» tartib sonini yozing.','','quinto']
    ],
    scene:[['Ti va di andare al cinema sabato?','Хочешь сходить в кино в субботу?','Shanba kuni kinoga borishni xohlaysanmi?'],['Volentieri! A che ora?','С удовольствием! Во сколько?','Bajonidil! Soat nechada?'],['Alle otto davanti al cinema.','В восемь перед кинотеатром.','Soat sakkizda kinoteatr oldida.']],
    task:['Пригласи друга и назови место и время.','Do‘stingizni taklif qiling, joy va vaqtni ayting.'],
    model:['Vuoi andare al cinema domenica alle sette?','Хочешь пойти в кино в воскресенье в семь?','Yakshanba kuni soat yettida kinoga borishni xohlaysanmi?']
  },
  {
    rules:[
      ['Предлоги с артиклем и количество','Artiklli predloglar va miqdor','A + il даёт al, su + il даёт sul. В compro del pane выражение del pane означает некоторое количество хлеба.','A + il = al, su + il = sul. Compro del pane gapida del pane bir oz nonni anglatadi.',['al cinema','sul tavolo','del pane']],
      ['Расположение и обладание','Joylashuv va egalik','C’è употребляют с одним предметом, ci sono с несколькими. Притяжательное согласуется с предметом: il mio pacco, la mia lettera.','Bir narsa uchun c’è, ko‘p narsa uchun ci sono. Egalik shakli narsaga moslashadi: il mio pacco, la mia lettera.',['C’è un pacco.','Ci sono due lettere.','la mia lettera']],
      ['Письмо и телефон','Xat va telefon','Для неформального письма подойдут Ciao… и A presto! В почтовом отделении спроси о времени работы.','Norasmiy xat uchun Ciao… va A presto! ishlatiladi. Pochta bo‘limida ish vaqtini so‘rang.',['A che ora apre l’ufficio postale?','A presto!']]
    ],
    drills:[
      ['Соедини su + il.','Su + il ni birlashtiring.','La busta è ___ tavolo.','sul'],
      ['Соедини a + il.','A + il ni birlashtiring.','Vado ___ cinema.','al'],
      ['Впиши частичный артикль.','Qism bildiruvchi artiklni yozing.','Compro ___ pane.','del'],
      ['Выбери форму: c’è или ci sono.','C’è yoki ci sono shaklini tanlang.','Sul tavolo ___ due lettere.','ci sono'],
      ['Выбери форму: c’è или ci sono.','C’è yoki ci sono shaklini tanlang.','Sul tavolo ___ un pacco.','c’è'],
      ['Впиши «моя».','«Mening» shaklini yozing.','la ___ lettera','mia'],
      ['Напиши «январь».','«Yanvar»ni italyancha yozing.','','gennaio']
    ],
    scene:[['Buongiorno, vorrei spedire un pacco.','Добрый день, я хотел бы отправить посылку.','Xayrli kun, jo‘natma yubormoqchiman.'],['Ha scritto l’indirizzo?','Вы написали адрес?','Manzilni yozdingizmi?'],['Sì, è qui sulla scatola.','Да, вот он на коробке.','Ha, mana qutining ustida.']],
    task:['Спроси, в котором часу открывается почта.','Pochta soat nechada ochilishini so‘rang.'],
    model:['A che ora apre l’ufficio postale?','Во сколько открывается почта?','Pochta bo‘limi soat nechada ochiladi?']
  },
  {
    rules:[
      ['Passato prossimo','Passato prossimo','Прошедшее состоит из формы avere или essere и причастия. С essere согласуй причастие: Anna è arrivata, Anna e Giulia sono arrivate. Сравни ho camminato.','O‘tgan zamon avere yoki essere va sifatdoshdan tuziladi. Essere bilan sifatdosh moslashadi: Anna è arrivata, Anna e Giulia sono arrivate. Ho camminato bilan solishtiring.',['Anna è arrivata.','Anna e Giulia sono arrivate.','Ho camminato.']],
      ['Неправильные формы и модальные','Noto‘g‘ri shakllar va modal fe’llar','Fare → fatto, prendere → preso, bere → bevuto, vedere → visto. Модальную конструкцию учи в контексте: ho potuto lavorare, sono dovuta uscire.','Fare → fatto, prendere → preso, bere → bevuto, vedere → visto. Modal qurilmalarni kontekstda o‘rganing: ho potuto lavorare, sono dovuta uscire.',['fatto','preso','bevuto','visto','sono dovuta uscire']],
      ['Наречия и ci места','Ravishlar va joy bildiruvchi ci','Обрати внимание на позицию già в ho già mangiato. В Ci siamo andati ieri ci отсылает к уже известному месту.','Ho già mangiato shaklida già ning o‘rniga e’tibor bering. Ci siamo andati ieri gapida ci ma’lum joyni anglatadi.',['Ho già mangiato.','Ci siamo andati ieri.']]
    ],
    drills:[
      ['Впиши полное passato prossimo от arrivare.','Arrivare fe’lini passato prossimo da to‘liq yozing.','Ieri Anna ___ a Roma.','è arrivata'],
      ['Впиши полное passato prossimo от partire.','Partire fe’lini passato prossimo da to‘liq yozing.','Ieri Giulia e Anna ___ .','sono partite'],
      ['Впиши причастие от prendere.','Prendere sifatdoshini yozing.','Ho ___ un caffè.','preso'],
      ['Впиши причастие от fare.','Fare sifatdoshini yozing.','Ho ___ colazione.','fatto'],
      ['Впиши форму вспомогательного глагола.','Yordamchi fe’l shaklini yozing.','Io ___ camminato molto.','ho'],
      ['Замени al bar частицей места.','Al bar o‘rniga joy yuklamasini yozing.','Sei andato al bar? Sì, ___ sono andato ieri.','ci'],
      ['Впиши «уже».','«Allaqachon»ni yozing.','Ho ___ mangiato.','già']
    ],
    scene:[['Buongiorno. Cosa prende?','Добрый день. Что будете?','Xayrli kun. Nima olasiz?'],['Un cappuccino e un cornetto, grazie.','Капучино и круассан, спасибо.','Bitta kapuchino va kruassan, rahmat.'],['Subito!','Сейчас принесу!','Hozir olib kelaman!']],
    task:['Закажи напиток и скажи, что ты пил вчера.','Ichimlik buyurtma qiling va kecha nima ichganingizni ayting.'],
    model:['Un tè, per favore. Ieri ho bevuto un caffè.','Чай, пожалуйста. Вчера я выпил кофе.','Bir choy, iltimos. Kecha qahva ichdim.']
  },
  {
    rules:[
      ['Futuro semplice','Sodda kelasi zamon','У многих глаголов основы регулярны: parlerò, partirai. Запомни andrò, avrò, sarò, farò.','Ko‘p fe’llar muntazam: parlerò, partirai. Andrò, avrò, sarò va farò ni yodlang.',['parlerò','partirai','andrò','avrò','sarò','farò']],
      ['Futuro anteriore и условие','Oldingi kelasi zamon va shart','Когда одно будущее событие предшествует другому: Quando avrò finito, partirò. При реальном условии возможны формы будущего: Se pioverà, resteremo a casa.','Kelajakdagi bir ish ikkinchisidan oldin tugasa: Quando avrò finito, partirò. Haqiqiy shartda kelasi zamon mumkin: Se pioverà, resteremo a casa.',['Quando avrò finito, partirò.','Se pioverà, resteremo a casa.']],
      ['Поезд и погода','Poyezd va ob-havo','Andata и andata e ritorno описывают тип билета. Che tempo fa? — Piove, fa freddo, c’è il sole.','Andata va andata e ritorno chipta turini bildiradi. Che tempo fa? — Piove, fa freddo, c’è il sole.',['andata e ritorno','Che tempo fa?','Piove.']]
    ],
    drills:[
      ['Поставь andare в futuro semplice.','Andare ni futuro semplice da yozing.','Domani io ___ a Roma.','andrò'],
      ['Поставь partire в futuro semplice.','Partire ni futuro semplice da yozing.','Domani noi ___ presto.','partiremo'],
      ['Поставь finire в futuro anteriore.','Finire ni futuro anteriore da yozing.','Quando ___ , partirò.','avrò finito'],
      ['Поставь piovere в futuro semplice.','Piovere ni futuro semplice da yozing.','Se ___ , resteremo a casa.','pioverà'],
      ['Напиши «поездка туда и обратно» как тип билета.','Chipta turi sifatida «borish va qaytish»ni yozing.','','andata e ritorno'],
      ['Напиши «идёт дождь».','«Yomg‘ir yog‘yapti» deb yozing.','','piove']
    ],
    scene:[['Vorrei un biglietto per Bologna.','Я хотел бы билет до Болоньи.','Bolonya uchun chipta olmoqchiman.'],['Solo andata?','Только в одну сторону?','Faqat borishgami?'],['Andata e ritorno, per favore.','Туда и обратно, пожалуйста.','Borish va qaytishga, iltimos.']],
    task:['Попроси билет и уточни, с какого пути отправляется поезд.','Chipta so‘rang va poyezd qaysi yo‘ldan jo‘nashini aniqlang.'],
    model:['Un biglietto per Bologna, per favore. Da quale binario parte il treno?','Билет до Болоньи, пожалуйста. С какого пути отправляется поезд?','Bolonyaga bitta chipta, iltimos. Poyezd qaysi platformadan jo‘naydi?']
  },
  {
    rules:[
      ['Притяжательные с родственниками','Qarindoshlik nomlari bilan egalik','Один член семьи: mia sorella. Множественное: le mie sorelle. Loro сохраняет артикль: la loro sorella.','Bitta oila a’zosi: mia sorella. Ko‘plik: le mie sorelle. Loro bilan artikl saqlanadi: la loro sorella.',['mia sorella','le mie sorelle','la loro sorella']],
      ['Нравиться и описание','Yoqtirish va tavsif','Форма piacere зависит от того, что нравится: mi piace l’insalata, mi piacciono gli spaghetti. Перед существительным bello и quello ведут себя подобно артиклю: un bel piatto, quello zaino.','Piacere yoqadigan narsaga mos: mi piace l’insalata, mi piacciono gli spaghetti. Otdan oldin bello va quello artiklga o‘xshaydi: un bel piatto, quello zaino.',['Mi piace l’insalata.','Mi piacciono gli spaghetti.','un bel piatto','quello zaino']],
      ['Volerci и metterci','Volerci va metterci','Ci vogliono dieci minuti — требуется десять минут. Ci metto dieci minuti — я трачу десять минут.','Ci vogliono dieci minuti — o‘n daqiqa kerak. Ci metto dieci minuti — men o‘n daqiqa sarflayman.',['Ci vogliono dieci minuti.','Ci metto dieci minuti.']]
    ],
    drills:[
      ['Переведи «моя сестра».','«Mening opa-singlim»ni tarjima qiling.','','mia sorella'],
      ['Переведи «мои сёстры».','«Mening opa-singillarim»ni tarjima qiling.','','le mie sorelle'],
      ['Впиши форму piacere.','Piacere shaklini yozing.','Mi ___ l’insalata.','piace'],
      ['Впиши форму piacere.','Piacere shaklini yozing.','Mi ___ gli spaghetti.','piacciono'],
      ['Впиши подходящую форму bello.','Bello ning mos shaklini yozing.','un ___ piatto','bel'],
      ['Впиши форму quello.','Quello shaklini yozing.','___ zaino è nuovo.','quello'],
      ['Впиши форму volerci.','Volerci shaklini yozing.','Ci ___ dieci minuti.','vogliono'],
      ['Впиши форму metterci от первого лица.','Metterci ni birinchi shaxsda yozing.','Io ci ___ dieci minuti.','metto']
    ],
    scene:[['Per me gli spaghetti, grazie.','Мне спагетти, спасибо.','Menga spagetti, rahmat.'],['E come contorno?','А на гарнир?','Garnirga-chi?'],['Un’insalata, per favore.','Салат, пожалуйста.','Bitta salat, iltimos.']],
    task:['Закажи блюдо и попроси счёт.','Taom buyurtma qiling va hisobni so‘rang.'],
    model:['Per me gli spaghetti. Possiamo avere il conto?','Мне спагетти. Можно счёт?','Menga spagetti. Hisobni bersangiz.']
  },
  {
    rules:[
      ['Imperfetto и passato prossimo','Imperfetto va passato prossimo','Imperfetto описывает фон или привычку: da piccolo andavo al cinema. Passato prossimo передаёт завершённое событие: ieri sono andato al cinema.','Imperfetto fon yoki odatni bildiradi: da piccolo andavo al cinema. Passato prossimo tugagan voqeani bildiradi: ieri sono andato al cinema.',['Da piccolo andavo al cinema.','Ieri sono andato al cinema.']],
      ['Trapassato prossimo','Trapassato prossimo','Когда одно прошлое событие произошло раньше другого, используй imperfetto вспомогательного и причастие: era già iniziato. Сравни привычное volevo с отдельной ситуацией ho voluto.','Bir o‘tgan hodisa boshqasidan avval bo‘lsa, yordamchi fe’lning imperfetto shakli va sifatdosh keladi: era già iniziato. Volevo va ho voluto ni kontekstda solishtiring.',['Il film era già iniziato quando siamo arrivati.','Volevo andare al cinema.']]
    ],
    drills:[
      ['Впиши imperfetto от andare.','Andare ni imperfetto da yozing.','Da piccolo ogni sabato ___ al cinema.','andavo'],
      ['Впиши imperfetto от piovere для фона.','Fon uchun piovere ni imperfetto da yozing.','Mentre ___ , Anna è arrivata.','pioveva'],
      ['Впиши passato prossimo от arrivare.','Arrivare ni passato prossimo da yozing.','Anna ___ alle nove.','è arrivata'],
      ['Впиши trapassato prossimo от iniziare.','Iniziare ni trapassato prossimo da yozing.','Quando siamo arrivati, il film ___ .','era già iniziato|era iniziato'],
      ['Впиши imperfetto от volere.','Volere ni imperfetto da yozing.','Da piccolo io ___ fare l’attore.','volevo'],
      ['Переведи «по-моему».','«Menimcha»ni tarjima qiling.','','secondo me']
    ],
    scene:[['Ti è piaciuto il film?','Тебе понравился фильм?','Film senga yoqdimi?'],['Sì, ma era un po’ lungo.','Да, но он был немного длинным.','Ha, lekin bir oz uzun edi.'],['Sono d’accordo.','Я согласен.','Men roziman.']],
    task:['Объясни, каким был фильм и что произошло в одной из сцен.','Film qanday bo‘lganini va sahnalardan birida nima bo‘lganini ayting.'],
    model:['Il film era divertente. Alla fine tutti hanno riso.','Фильм был смешным. В конце все засмеялись.','Film kulgili edi. Oxirida hamma kuldi.']
  },
  {
    rules:[
      ['Прямой объект и его согласование','Vositasiz to‘ldiruvchi va moslashuv','Vedo Anna → la vedo. Для lo/la/li/le перед passato prossimo согласуй причастие с местоимением: le ho comprate. Lo so, lo sapevo и lo saprò выражают три времени глагола sapere.','Vedo Anna → la vedo. Passato prossimo dan avvalgi lo/la/li/le bilan sifatdoshni moslang: le ho comprate. Lo so, lo sapevo va lo saprò sapere fe’lining uch zamonini ko‘rsatadi.',['La vedo.','Le ho comprate.','Lo so.','Lo sapevo.','Lo saprò.']],
      ['Количество, наличие и модальные','Miqdor, mavjudlik va modal fe’llar','При известном продукте: ne prendo due. Наличие: ce l’ho и ce n’è. С модальным возможны lo posso comprare и posso comprarlo.','Ma’lum mahsulot uchun ne prendo due. Mavjudlik: ce l’ho va ce n’è. Modal fe’l bilan lo posso comprare va posso comprarlo mumkin.',['Ne prendo due.','Ce l’ho.','Ce n’è.','Lo posso comprare.','Posso comprarlo.']]
    ],
    drills:[
      ['Замени le mele коротким местоимением.','Le mele ni qisqa olmosh bilan almashtiring.','Compri le mele? Sì, ___ compro.','le'],
      ['Впиши частицу количества.','Miqdor yuklamasini yozing.','Quante mele prendi? ___ prendo tre.','ne'],
      ['Ответь «я их купила», имея в виду яблоки.','Olmalar haqida «men ularni sotib oldim» deb ayting.','','Le ho comprate.|Io le ho comprate.'],
      ['Переведи «я могу его купить», о сыре.','Pishloq haqida «men uni sotib ola olaman» deb ayting.','','Lo posso comprare.|Posso comprarlo.|Io lo posso comprare.|Io posso comprarlo.'],
      ['Переведи «он у меня есть», о билете.','Chipta haqida «u menda bor» deb ayting.','','ce l’ho'],
      ['Напиши «двести граммов пармезана», используя etti.','Etti bilan «ikki yuz gramm parmezan»ni yozing.','','due etti di parmigiano']
    ],
    scene:[['Vorrei due etti di parmigiano.','Я хотел бы двести граммов пармезана.','Ikki yuz gramm parmezan olmoqchiman.'],['Altro?','Что-нибудь ещё?','Yana biror narsa kerakmi?'],['Sì, queste mele. Ne prendo tre.','Да, эти яблоки. Возьму три.','Ha, mana bu olmalar. Uchtasini olaman.']],
    task:['Попроси хлеб и скажи, сколько яблок возьмёшь.','Non so‘rang va nechta olma olishingizni ayting.'],
    model:['Vorrei del pane. Di mele ne prendo quattro.','Мне бы хлеба. Яблок возьму четыре.','Bir oz non olmoqchiman. Olmadan to‘rtta olaman.']
  },
  {
    rules:[
      ['Возвратность и взаимность','O‘zlik va birgalik','Mi vesto, ti vesti, si veste. В прошедшем с essere согласуй: Marta e Anna si sono vestite. В Si incontrano местоимение может значить «друг друга».','Mi vesto, ti vesti, si veste. O‘tgan zamonda essere bilan moslang: Marta e Anna si sono vestite. Si incontrano da si «bir-birini» anglatishi mumkin.',['Mi vesto.','Marta e Anna si sono vestite.','Si incontrano.']],
      ['Безличное si и положение при модальном','Shaxssiz si va modal fe’l bilan o‘rin','Qui si paga in contanti — общее правило для посетителей. С модальным возможны mi devo vestire и devo vestirmi.','Qui si paga in contanti — xaridorlar uchun umumiy qoida. Modal fe’l bilan mi devo vestire va devo vestirmi mumkin.',['Qui si paga in contanti.','Mi devo vestire.','Devo vestirmi.']]
    ],
    drills:[
      ['Впиши местоимение.','Olmoshni yozing.','Io ___ vesto.','mi'],
      ['Впиши форму vestire.','Vestire shaklini yozing.','Anna si ___ .','veste'],
      ['Впиши passato prossimo от vestirsi, без имени.','Vestirsi ni passato prossimo da, ismsiz yozing.','Marta e Anna ___ .','si sono vestite'],
      ['Переведи «мне нужно одеться».','«Kiyinishim kerak»ni tarjima qiling.','','mi devo vestire|devo vestirmi|io mi devo vestire|io devo vestirmi'],
      ['Впиши безличную частицу.','Shaxssiz yuklamani yozing.','Qui ___ paga in contanti.','si'],
      ['Переведи «Какой это размер?» о куртке.','Kurtka haqida «Bu qaysi o‘lcham?» deb so‘rang.','','Che taglia è?|Di che taglia è?']
    ],
    scene:[['Posso provare questa giacca?','Можно примерить эту куртку?','Bu kurtkani kiyib ko‘rsam bo‘ladimi?'],['Certo. Il camerino è lì a destra.','Конечно. Примерочная справа.','Albatta. Kiyib ko‘rish xonasi o‘ng tomonda.'],['Grazie! Quanto costa?','Спасибо! Сколько стоит?','Rahmat! Qancha turadi?']],
    task:['Уточни размер и спроси, можно ли заплатить картой.','O‘lchamni aniqlang va karta bilan to‘lash mumkinligini so‘rang.'],
    model:['Che taglia è? Posso pagare con la carta?','Какой это размер? Можно расплатиться картой?','Bu qaysi o‘lcham? Karta bilan to‘lasam bo‘ladimi?']
  },
  {
    rules:[
      ['Прямое или косвенное местоимение','Vositasiz yoki vositali olmosh','Chiamo Anna → la chiamo. Telefono ad Anna → le telefono. С модальным: le posso telefonare или posso telefonarle.','Chiamo Anna → la chiamo. Telefono ad Anna → le telefono. Modal bilan le posso telefonare yoki posso telefonarle.',['La chiamo.','Le telefono.','Le posso telefonare.','Posso telefonarle.']],
      ['Императив и местоимение','Buyruq mayli va olmosh','Для tu: gira, prendi, apri. В положительной команде местоимение присоединяется: prendilo. Отрицательная форма от prendere: non prendere. С местоимением возможны non lo prendere и non prenderlo.','Tu uchun gira, prendi, apri. Tasdiq buyruqda olmosh qo‘shiladi: prendilo. Inkor shakli non prendere. Olmosh bilan non lo prendere va non prenderlo mumkin.',['Gira a destra.','Prendilo.','Non lo prendere.','Non prenderlo.']]
    ],
    drills:[
      ['Замени Anna прямым местоимением.','Anna ni vositasiz olmosh bilan almashtiring.','Chiamo Anna. ___ chiamo.','la'],
      ['Замени ad Anna косвенным местоимением.','Ad Anna ni vositali olmosh bilan almashtiring.','Telefono ad Anna. ___ telefono.','le'],
      ['Попроси знакомого повернуть направо.','Tanishingizdan o‘ngga burilishini so‘rang.','','gira a destra'],
      ['Замени il libro местоимением в команде для tu.','Tu buyrug‘ida il libro ni olmosh bilan almashtiring.','Prendi il libro!','prendilo'],
      ['Сделай Prendilo отрицательной командой.','Prendilo ni inkor buyruqqa aylantiring.','','non lo prendere|non prenderlo'],
      ['Переведи «я могу ей позвонить».','«Men unga qo‘ng‘iroq qila olaman»ni tarjima qiling.','','le posso telefonare|posso telefonarle|io le posso telefonare|io posso telefonarle']
    ],
    scene:[['Scusi, dov’è la piazza?','Извините, где площадь?','Kechirasiz, maydon qayerda?'],['Vada dritto e poi giri a destra.','Идите прямо, потом поверните направо.','To‘g‘riga boring, keyin o‘ngga buriling.'],['Grazie mille!','Большое спасибо!','Katta rahmat!']],
    task:['Подскажи другу, как дойти до площади.','Do‘stingizga maydongacha yo‘lni tushuntiring.'],
    model:['Vai dritto e gira a sinistra. La piazza è lì.','Иди прямо и поверни налево. Площадь там.','To‘g‘riga bor va chapga buril. Maydon o‘sha yerda.']
  },
  {
    rules:[
      ['Condizionale semplice','Sodda shart mayli','Vorrei un biglietto — вежливая просьба. Dovresti prenotare — совет. Potresti venire? — вопрос о возможности.','Vorrei un biglietto — muloyim iltimos. Dovresti prenotare — maslahat. Potresti venire? — imkoniyat haqida savol.',['Vorrei un biglietto.','Dovresti prenotare.','Potresti venire?']],
      ['Condizionale composto','Qo‘shma shart mayli','С sarei/avrei и причастием выражают несбывшийся замысел или будущее с точки зрения прошлого: Sarei andata, ma… и Ha detto che sarebbe venuta.','Sarei/avrei va sifatdosh bilan amalga oshmagan niyat yoki o‘tmish nuqtasidan kelajak aytiladi: Sarei andata, ma… va Ha detto che sarebbe venuta.',['Sarei andata, ma non ho trovato un biglietto.','Ha detto che sarebbe venuta.']]
    ],
    drills:[
      ['Впиши condizionale semplice от volere.','Volere ni condizionale semplice da yozing.','Io ___ un biglietto per il concerto.','vorrei'],
      ['Впиши condizionale semplice от dovere.','Dovere ni condizionale semplice da yozing.','Tu ___ prenotare prima.','dovresti'],
      ['Впиши condizionale semplice от potere.','Potere ni condizionale semplice da yozing.','Tu ___ venire con me?','potresti'],
      ['Впиши condizionale composto от andare. Говорит девушка.','Andare ni condizionale composto da yozing. Qiz gapiryapti.','Io ___ al concerto, ma non ho trovato un biglietto.','sarei andata'],
      ['Впиши будущее с точки зрения прошлого от venire.','Venire ni o‘tmish nuqtasidan kelajakda yozing.','Anna ha detto che ___ al concerto.','sarebbe venuta'],
      ['Впиши condizionale composto от comprare.','Comprare ni condizionale composto da yozing.','Io ___ il biglietto, ma erano esauriti.','avrei comprato']
    ],
    scene:[['Ti piacerebbe andare al concerto?','Ты хотел бы пойти на концерт?','Konsertga borishni xohlarmiding?'],['Sì, volentieri. Potresti prenotare due biglietti?','Да, с удовольствием. Можешь забронировать два билета?','Ha, bajonidil. Ikkita chipta band qila olarmiding?'],['Certo, controllo subito.','Конечно, сейчас проверю.','Albatta, hozir tekshirib ko‘raman.']],
    task:['Предложи пойти на концерт и попроси друга купить билеты.','Konsertga borishni taklif qiling va do‘stingizdan chipta olishni so‘rang.'],
    model:['Ti piacerebbe andare al concerto? Potresti prendere due biglietti?','Хочешь пойти на концерт? Можешь взять два билета?','Konsertga borishni xohlarmiding? Ikkita chipta ola olarmiding?']
  }
];
