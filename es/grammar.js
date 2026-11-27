'use strict';

// Each question carries the accepted forms, a specific hint and the complete spoken model.
const ES_LESSONS = [
  {
    rules: [
      ['Кто выполняет действие?', 'Harakatni kim bajaryapti?', 'Abre, lee, escribe — формы для él/ella. В испанском часто опускают местоимение, если понятно, о ком речь.', 'Abre, lee, escribe — él/ella shakllari. Kim haqida gap ketayotgani aniq bo‘lsa, olmosh tushiriladi.', ['abrir','abre','Abre el libro.','Lee una novela.']],
      ['Как читать h и ñ', 'h va ñ qanday o‘qiladi?', 'Букву h в hijo и hermano не произносят. Ñ — отдельная буква. Сравни año и cuñado.', 'Hijo va hermano so‘zlarida h talaffuz qilinmaydi. Ñ alohida harf.', ['el hijo','el hermano','el año','el cuñado','pero','perro']]
    ],
    scene: [
      ['Abre el libro.','Он открывает книгу.','U kitobni ochadi.'],
      ['Lee una novela.','Она читает роман.','U roman o‘qiyapti.'],
      ['No bebe café.','Он не пьёт кофе.','U qahva ichmaydi.']
    ],
    task: ['Скажи, что она пишет письмо.', 'U xat yozayotganini ayting.'],
    model: ['Escribe una carta.','Она пишет письмо.','U xat yozayapti.'],
    drills: [
      ['Какой артикль у libro?', 'Libro so‘zining artikli qaysi?', '___ libro', 'el', 'El libro.', 'У libro мужской род.', 'Libro — muzakkar jinsda.', 'article', 'el|la|las'],
      ['Вставь «пишет».','“Yozayapti” shaklini yozing.','Ella ___ una carta.','escribe','Ella escribe una carta.','Escribir → escribe для ella.','Ella uchun escribir → escribe.'],
      ['Вставь «читает».','“O‘qiyapti” shaklini yozing.','Él ___ un libro.','lee','Él lee un libro.','Leer → lee для él.','Él uchun leer → lee.'],
      ['Собери «Он не пьёт кофе».','“U qahva ichmaydi” gapini tuzing.','','No bebe café.','No bebe café.','','','','','café|No|bebe']
    ]
  },
  {
    rules: [
      ['Где, откуда и куда?', 'Qayerda, qayerdan va qayerga?', 'С estar употребляй en для места, с salir — de для точки выхода, с ir — a для направления.', 'Joy uchun estar en, chiqish joyi uchun salir de, yo‘nalish uchun ir a ishlatiladi.', ['Está en casa.','Sale de casa.','Va a correos.']],
      ['Есть или находится?', 'Bor yoki joylashgan?', 'Hay вводит предмет. Estar показывает, где находится уже известный предмет.', 'Hay narsaning borligini bildiradi. Estar ma’lum narsaning qayerdaligini aytadi.', ['Hay un libro en la mesa.','El libro está en la mesa.']]
    ],
    scene: [
      ['Está en casa.','Он дома.','U uyda.'],
      ['Sale de casa.','Он выходит из дома.','U uydan chiqadi.'],
      ['Va a correos.','Он идёт на почту.','U pochtaga boradi.']
    ],
    task: ['Скажи, что книга лежит на столе.','Kitob stol ustida ekanini ayting.'],
    model: ['El libro está en la mesa.','Книга на столе.','Kitob stol ustida.'],
    drills: [
      ['«Он выходит из дома».','“U uydan chiqadi.”','Sale ___ casa.','de','Sale de casa.','После salir укажи исходную точку через de.','Chiqish joyi uchun salir de ishlatiladi.','','a|de|por'],
      ['«Он идёт на почту».','“U pochtaga boradi.”','Va ___ correos.','a','Va a correos.','A указывает направление.','A yo‘nalishni bildiradi.'],
      ['Сообщи, что на столе есть книга.','Stol ustida kitob borligini ayting.','___ un libro en la mesa.','hay','Hay un libro en la mesa.','Hay вводит новый предмет.','Hay narsaning borligini bildiradi.','','hay|está|tiene'],
      ['Укажи, где лежит эта книга.','Ma’lum kitob qayerdaligini ayting.','El libro ___ en la mesa.','está','El libro está en la mesa.','Estar указывает местонахождение.','Estar joylashuvni bildiradi.']
    ]
  },
  {
    rules: [
      ['El aula, las aulas', 'El aula, las aulas', 'Aula женского рода. В единственном числе el перед ударным a, во множественном числе las.', 'Aula — muannas jins. Urg‘uli a dan oldin birlikda el, ko‘plikda las ishlatiladi.', ['el aula pequeña','las aulas pequeñas','el mapa','el lápiz','los lápices']]
    ],
    scene: [
      ['El profesor hace preguntas.','Преподаватель задаёт вопросы.','O‘qituvchi savol beradi.'],
      ['El alumno contesta.','Ученик отвечает.','O‘quvchi javob beradi.'],
      ['Hoy asiste a clase de español.','Сегодня он посещает урок испанского.','Bugun u ispan tili darsiga qatnashadi.']
    ],
    task: ['Скажи, что сегодня слушаешь преподавателя.', 'Bugun o‘qituvchini tinglayotganingizni ayting.'],
    model: ['Hoy escucho al profesor.','Сегодня я слушаю преподавателя.','Bugun o‘qituvchini tinglayapman.'],
    drills: [
      ['Вставь предлог. «Он присутствует на занятии».','Predlogni qo‘ying. “U darsga qatnashadi.”','Asiste ___ clase.','a','Asiste a clase.','Учи сочетание asistir a.','Asistir a birikmasini yodlang.'],
      ['Выбери артикль во множественном числе.','Ko‘plik artiklini tanlang.','___ aulas pequeñas','las','Las aulas pequeñas.','Aula женского рода.','Aula — muannas jins.','article','las|los|el'],
      ['Поставь lápiz во множественное число.','Lápiz so‘zini ko‘plikka qo‘ying.','Un lápiz → dos ___','lápices','Dos lápices.','Во множественном числе z меняется на c перед es.','Ko‘plikda es oldidan z harfi c ga almashadi.'],
      ['Собери «Преподаватель задаёт вопросы».','“O‘qituvchi savol beradi” gapini tuzing.','','El profesor hace preguntas.','El profesor hace preguntas.','','','','','hace|preguntas|El|profesor']
    ]
  },
  {
    rules: [
      ['Как спросить о погоде?', 'Ob-havo haqida qanday so‘raymiz?', 'Вопрос начинается с ¿ и заканчивается ?. Hace sol — «солнечно». В вопросительном qué пишем ударение.', 'Savol ¿ bilan boshlanib ? bilan tugaydi. Hace sol — quyoshli. So‘roqdagi qué urg‘u bilan yoziladi.', ['¿Qué tiempo hace hoy?','Hace sol.','Hace buen tiempo.']]
    ],
    scene: [
      ['Buenos días.','Доброе утро.','Xayrli tong.'],
      ['¿Qué tiempo hace hoy?','Какая сегодня погода?','Bugun ob-havo qanday?'],
      ['Hace buen tiempo.','Хорошая погода.','Ob-havo yaxshi.']
    ],
    task: ['Ответь по-испански, что сегодня солнечно.', 'Bugun quyoshli ekanini ispancha ayting.'],
    model: ['Hoy hace sol.','Сегодня солнечно.','Bugun quyoshli.'],
    drills: [
      ['Вставь «сегодня».','“Bugun” so‘zini qo‘ying.','¿Qué tiempo hace ___?','hoy','¿Qué tiempo hace hoy?','Hoy означает «сегодня».','Hoy — bugun.'],
      ['Выбери прилагательное от Perú.','Perú dan yasalgan sifatni tanlang.','Perú → ___','peruano','Peruano.','Perú — страна, peruano — перуанский.','Perú — davlat, peruano — perulik.','','Perú|peruano|cubano'],
      ['Напиши «год».','“Yil” so‘zini yozing.','el ___','año','El año.','Нужна буква ñ.','Ñ harfi kerak.'],
      ['Собери вопрос со знаками ¿ и ?.','Savolni ¿ va ? belgilari bilan tuzing.','','¿Qué tiempo hace hoy?','¿Qué tiempo hace hoy?','В испанском вопрос имеет два знака.','Ispan tilida savolda ikkita belgi bor.','','','hace|¿Qué|hoy?|tiempo',true]
    ]
  },
  {
    rules: [
      ['Кто кому родственник?', 'Kim kimga qarindosh?', 'Дочь брата или сестры — sobrina. Дочь дяди или тёти — prima.', 'Aka, uka, opa yoki singilning qizi — sobrina. Amaki, tog‘a, amma yoki xolaning qizi — prima.', ['la sobrina','la prima','el sobrino','el primo']],
      ['Mi и mis', 'Mi va mis', 'Форма притяжательного слова зависит от числа предметов или людей: mi hermano, mis primos. С su и sus действует то же правило.', 'Egalik shakli odam yoki narsa soniga mos bo‘ladi: mi hermano, mis primos. Su va sus ham shu tartibda.', ['mi hermano','mis primos','su libro','sus libros']]
    ],
    scene: [
      ['Ana tiene un hermano, Luis.','У Аны есть брат Луис.','Ananing Luis ismli akasi yoki ukasi bor.'],
      ['Luis tiene una hija, Eva.','У Луиса есть дочь Эва.','Luisning Eva ismli qizi bor.'],
      ['Eva es la sobrina de Ana.','Эва — племянница Аны.','Eva Ananing jiyani.']
    ],
    task: ['Скажи, что твои двоюродные братья — близнецы.', 'Amakivachchalaringiz egizak ekanini ayting.'],
    model: ['Mis primos son gemelos.','Мои двоюродные братья — близнецы.','Amakivachchalarim egizak.'],
    drills: [
      ['У Аны есть брат Луис. Эва — дочь Луиса. Кто Эва для Аны?','Ananing Luis ismli akasi yoki ukasi bor. Eva Luisning qizi. Eva Anaga kim?','Eva es la ___ de Ana.','sobrina','Eva es la sobrina de Ana.','Sobrina — дочь брата или сестры.','Sobrina — aka-uka yoki opa-singilning qizi.','','prima|sobrina|tía'],
      ['«Мои двоюродные братья».','“Mening amakivachchalarim”.','___ primos','mis','Mis primos.','Primos во множественном числе.','Primos ko‘plikda.','agreement','mi|mis|su'],
      ['«Мои двоюродные братья — близнецы».','“Amakivachchalarim egizak.”','Mis primos ___ gemelos.','son','Mis primos son gemelos.','С mis primos нужна форма son.','Mis primos bilan son ishlatiladi.','agreement'],
      ['Собери «Это моя сестра».','“Bu mening opam yoki singlim” gapini tuzing.','','Es mi hermana.','Es mi hermana.','','','','','hermana|Es|mi']
    ]
  },
  {
    rules: [
      ['Профессия с ser', 'Kasbni ser bilan aytish', 'В простом предложении о профессии после ser обычно ставим название профессии без артикля: Es médico.', 'Oddiy gapda ser dan keyin kasb nomi artiklsiz keladi: Es médico.', ['Es médico.','Es ingeniera.']]
    ],
    scene: [['Es mi marido.','Это мой муж.','Bu mening erim.'],['Es intérprete.','Он устный переводчик.','U og‘zaki tarjimon.']],
    task: ['Скажи, что она инженер.', 'U muhandis ekanini ayting.'],
    model: ['Es ingeniera.','Она инженер.','U muhandis.'],
    drills: [
      ['«Он врач». Напиши название профессии.','“U shifokor”. Kasb nomini yozing.','Es ___.','médico','Es médico.','Профессия в таком предложении без артикля.','Bunday gapda kasb nomi artiklsiz keladi.','article'],
      ['«Она замужем».','“U turmushga chiqqan.”','Ella está ___.','casada','Ella está casada.','С ella требуется форма casada.','Ella bilan casada shakli kerak.','agreement','casado|casada'],
      ['Собери «Она инженер».','“U muhandis” gapini tuzing.','','Es ingeniera.','Es ingeniera.','','','','','ingeniera|Es']
    ]
  },
  {
    rules: [
      ['Ser, tener или llevar?', 'Ser, tener yoki llevar?', 'Для роста — es alta. Для волос и глаз — tiene. Для очков, бороды и усов — lleva. Возраст в годах выражают через tener.', 'Bo‘y uchun es alta. Soch va ko‘z uchun tiene. Ko‘zoynak, soqol va mo‘ylov uchun lleva. Yosh tener bilan aytiladi.', ['Es alta.','Tiene el pelo rizado.','Tiene los ojos verdes.','Lleva gafas.','Tiene veinte años.']]
    ],
    scene: [
      ['Mi hermano es muy alto, tiene el pelo rizado y lleva barba.','Мой брат очень высокий, у него кудрявые волосы и он носит бороду.','Akam yoki ukam juda baland bo‘yli, sochi jingalak va soqol qo‘ygan.'],
      ['Tiene los ojos verdes.','У него зелёные глаза.','Uning ko‘zlari yashil.']
    ],
    task: ['Скажи, что у неё карие глаза и она носит очки.', 'Uning ko‘zlari jigarrangligini va ko‘zoynak taqishini ayting.'],
    model: ['Tiene los ojos marrones y lleva gafas.','У неё карие глаза, и она носит очки.','Uning ko‘zlari jigarrang va u ko‘zoynak taqadi.'],
    drills: [
      ['«Она высокая». Вставь глагол.','“U baland bo‘yli”. Fe’lni qo‘ying.','Ella ___ alta.','es','Ella es alta.','Рост описывают с ser.','Bo‘y ser bilan aytiladi.','','es|está|lleva'],
      ['«У неё зелёные глаза».','“Uning ko‘zlari yashil.”','Tiene los ojos ___.','verdes','Tiene los ojos verdes.','Ojos во множественном числе.','Ojos ko‘plikda.','agreement'],
      ['«Он носит очки».','“U ko‘zoynak taqadi.”','___ gafas.','lleva','Lleva gafas.','Для «носит очки» употреби lleva.','Ko‘zoynak taqmoq uchun llevar ishlatiladi.','','es|lleva|está'],
      ['«Ему 20 лет».','“U yigirma yoshda.”','___ veinte años.','tiene','Tiene veinte años.','Возраст в годах выражают через tener.','Yosh tener bilan aytiladi.']
    ]
  },
  {
    rules: [
      ['Характер и согласование', 'Xarakter va sifatning moslashuvi', 'У simpático меняется окончание: simpática. Alegre не меняется по роду, но во множественном числе становится alegres.', 'Simpático muannasda simpática bo‘ladi. Alegre jins bo‘yicha o‘zgarmaydi, ko‘plikda alegres bo‘ladi.', ['simpático','simpática','alegre','alegres']]
    ],
    scene: [
      ['La suegra de Pedro es una mujer muy simpática y trabajadora.','Свекровь или тёща Педро — очень приятная и трудолюбивая женщина.','Pedroning qaynonasi juda yoqimli va mehnatkash ayol.'],
      ['Mis primos son gemelos, tienen los ojos azules y son muy alegres.','Мои двоюродные братья — близнецы, у них голубые глаза и они очень весёлые.','Amakivachchalarim egizak, ularning ko‘zlari ko‘k va ular juda quvnoq.']
    ],
    task: ['Опиши родственника в трёх коротких предложениях. Назови родство, внешность и характер.', 'Qarindoshingizni uchta qisqa gap bilan tasvirlang. Qarindoshlik, tashqi ko‘rinish va xarakterni ayting.'],
    model: ['Es mi hermana. Tiene los ojos azules. Es muy alegre.','Это моя сестра. У неё голубые глаза. Она очень весёлая.','Bu mening opam yoki singlim. Ko‘zlari ko‘k. U juda quvnoq.'],
    drills: [
      ['«Она очень приятная».','“U juda yoqimli.”','Ella es muy ___.','simpática','Ella es muy simpática.','Согласуй прилагательное с ella.','Sifatni ella bilan moslang.','agreement'],
      ['«Они очень весёлые».','“Ular juda quvnoq.”','Son muy ___.','alegres','Son muy alegres.','В этом предложении множественное число.','Bu gapda ko‘plik shakli kerak.','agreement','alegre|alegres'],
      ['Собери «Она трудолюбивая».','“U mehnatkash” gapini tuzing.','','Ella es trabajadora.','Ella es trabajadora.','','','','','es|Ella|trabajadora']
    ]
  },
  {
    rules: [
      ['Привычка с soler', 'Soler bilan odatni aytish', 'После soler идёт инфинитив: suele viajar — «обычно путешествует».', 'Soler dan keyin fe’lning noaniq shakli keladi: suele viajar — odatda sayohat qiladi.', ['soler','Suele viajar.']]
    ],
    scene: [['Los veo juntos.','Я вижу их вместе.','Ularni birga ko‘ryapman.']],
    task: ['Скажи, что он обычно путешествует.', 'U odatda sayohat qilishini ayting.'],
    model: ['Suele viajar.','Он обычно путешествует.','U odatda sayohat qiladi.'],
    drills: [
      ['«Он обычно путешествует».','“U odatda sayohat qiladi.”','Suele ___.','viajar','Suele viajar.','После suele поставь инфинитив.','Suele dan keyin fe’lning noaniq shaklini qo‘ying.','','viajar|viaja']
    ]
  }
];
