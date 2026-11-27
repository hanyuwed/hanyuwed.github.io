const PERSONS = ['je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles'];
const PERSON_INDEX = {je:0, tu:1, il:2, elle:2, on:2, nous:3, vous:4, ils:5, elles:5};
const AUXILIARIES = {
  avoir: ['ai', 'as', 'a', 'avons', 'avez', 'ont'],
  être: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont']
};
const PAST_SUBJECTS = [
  {person:'je', gender:'m', plural:false, hint:['Говорит мужчина.','Erkak kishi gapiryapti.']},
  {person:'je', gender:'f', plural:false, hint:['Говорит женщина.','Ayol kishi gapiryapti.']},
  {person:'tu', gender:'m', plural:false, hint:['Обращение к мужчине.','Erkak kishiga murojaat.']},
  {person:'tu', gender:'f', plural:false, hint:['Обращение к женщине.','Ayol kishiga murojaat.']},
  {person:'il', gender:'m', plural:false},
  {person:'elle', gender:'f', plural:false},
  {person:'on', gender:'m', plural:false, hint:['On обозначает людей вообще.','On umumiy ma’noda, aniq shaxsni bildirmaydi.']},
  {person:'nous', gender:'m', plural:true, hint:['Группа мужчин или смешанная группа.','Erkaklar yoki aralash guruh.']},
  {person:'nous', gender:'f', plural:true, hint:['Группа женщин.','Ayollar guruhi.']},
  {person:'vous', gender:'m', plural:false, hint:['Вежливое обращение к одному мужчине.','Bitta erkak kishiga hurmat bilan murojaat.']},
  {person:'vous', gender:'f', plural:false, hint:['Вежливое обращение к одной женщине.','Bitta ayol kishiga hurmat bilan murojaat.']},
  {person:'vous', gender:'m', plural:true, hint:['Обращение к группе мужчин или смешанной группе.','Erkaklar yoki aralash guruhga murojaat.']},
  {person:'vous', gender:'f', plural:true, hint:['Обращение к группе женщин.','Ayollar guruhiga murojaat.']},
  {person:'ils', gender:'m', plural:true},
  {person:'elles', gender:'f', plural:true}
];

function requiresElision(text) {
  // Only h muet occurs at the start of these conjugated verbs.
  return /^[aàâäeéèêëiîïoôöœuùûüyh]/i.test(text);
}

function subjectPhrase(subject, verb) {
  return subject === 'je' && requiresElision(verb) ? 'j’' + verb : subject + ' ' + verb;
}

const negativeForm = verb => (requiresElision(verb) ? 'n’' : 'ne ') + verb + ' pas';

const negation = (subject, verb) => subject + ' ' + negativeForm(verb);

function question(phrase) {
  return (requiresElision(phrase) ? 'est-ce qu’' : 'est-ce que ') + phrase + ' ?';
}

function capitalize(sentence) {
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

const OBJECTS = {
  manger:'à midi', chanter:'souvent', penser:'à ma famille', danser:'ensemble', chercher:'un emploi',
  trouver:'un logement', écouter:'la radio', quitter:'la maison', aimer:'cette ville',
  travailler:'en ville', parler:'français', déjeuner:'à midi', regarder:'la télévision',
  voyager:'souvent', regretter:'ce choix', habiter:'ici', étudier:'le français',
  visiter:'le quartier', préparer:'le repas', répéter:'la phrase', raconter:'une histoire',
  jouer:'aux échecs', commencer:'le cours', demander:'des précisions',
  donner:'des informations', conjuguer:'ce verbe'
};

function presentForms(entry, person) {
  const verb = entry.forms[PERSON_INDEX[person]];
  const object = OBJECTS[entry.verb];
  const sentence = subjectPhrase(person, verb) + ' ' + object;
  const liaison = /^(il|elle|on)$/.test(person) && !/[td]$/.test(verb) ? '-t-' : '-';
  return {
    verb,
    affirmative: capitalize(sentence) + '.',
    negative: capitalize(negation(person, verb)) + ' ' + object + '.',
    question: capitalize(question(sentence)),
    intonation: capitalize(sentence) + ' ?',
    inversion: person === 'je' ? null : capitalize(verb + liaison + person + ' ' + object) + ' ?'
  };
}

const PAST_CONTEXT = {
  entrer:'dans la cuisine', sortir:'de la maison', aller:'au marché', venir:'ici',
  arriver:'à midi', partir:'ce matin', rentrer:'à la maison', revenir:'hier soir',
  monter:'au premier étage', descendre:'au rez-de-chaussée', naître:'en mai',
  mourir:'il y a deux ans', tomber:'dans la rue', rester:'à la maison', devenir:'juriste',
  faire:'une recherche', dire:'bonjour', prendre:'le métro', mettre:'la table',
  écrire:'une annonce', suivre:'les cours', savoir:'la vérité', lire:'un commentaire',
  connaître:'ce quartier', devoir:'partir', voir:'le propriétaire', répondre:'à la question',
  tenir:'la porte', vouloir:'visiter le logement', pouvoir:'visiter le logement',
  vivre:'en ville', traduire:'le texte', construire:'une maison',
  avoir:'un bon accueil', être:'en retard'
};

function pastExercise(entry, {person,gender,plural,hint}, mode) {
  const aux = AUXILIARIES[entry.aux][PERSON_INDEX[person]];
  const agrees = entry.aux === 'être';
  const extra = agrees ? (gender === 'f' ? 'e' : '') + (plural ? 's' : '') : '';
  const participle = entry.participle + extra;
  const context = PAST_CONTEXT[entry.verb];
  const subjectId = agrees ? person + '-' + gender + (plural ? 'p' : 's') : person;
  const base = {fr:true,promptFr:true,id:'pc-' + entry.verb + '-' + subjectId + '-' + mode, note:entry.verb};
  if (mode === 'participle') return {
    ...base,id:'pc-pp-' + entry.verb,title:entry.verb,
    label:['Впиши базовую форму причастия прошедшего времени.', 'O‘tgan zamon sifatdoshining asosiy shaklini yoz.'],
    accepted:[entry.participle],
    rule:['После вспомогательного глагола нужно причастие прошедшего времени.', 'Yordamchi fe’ldan keyin o‘tgan zamon sifatdoshi ishlatiladi.']
  };
  const negative = mode === 'negative';
  const expected = mode === 'aux' ? aux : mode === 'agreement' ? participle :
    (negative ? negativeForm(aux) : aux) + ' ' + participle;
  const subjectBlank = person === 'je' && !negative && requiresElision(aux) ? 'J’___' : capitalize(person) + ' ___';
  const blanks = {full:subjectBlank, aux:subjectBlank + ' ' + participle,
    agreement:capitalize(subjectPhrase(person,aux)) + ' ___', negative:subjectBlank};
  const solved = negative ? negation(person,aux) : subjectPhrase(person,aux);
  return {
    ...base,title:blanks[mode] + ' ' + context + '.', hint:agrees ? hint : undefined,
    accepted:[expected], negative, elision:negative,
    label:{
      full:['Впиши обе части passé composé.', 'Passé composé shaklining ikkala qismini yoz.'],
      aux:['Впиши вспомогательный глагол.', 'Yordamchi fe’lni yoz.'],
      agreement:['Впиши причастие, согласованное с подлежащим.', 'Sifatdoshni egaga moslab yoz.'],
      negative:['Впиши отрицательную форму с ne/n’ и pas.', 'Ne/n’ va pas bilan inkor shaklini yoz.']
    }[mode],
    aux,
    participle,
    grammarMode:mode,
    rule:agrees ?
      ['Здесь используется être. Согласуй причастие с подлежащим. В этом примере нужна форма ' + participle + '.',
       'Bu gapda être ishlatiladi. Sifatdosh ega bilan moslashadi. Bu misolda ' + participle + ' shakli kerak.'] :
      ['Здесь используется avoir. В этом предложении причастие сохраняет базовую форму.', 'Bu gapda avoir ishlatiladi va sifatdosh asosiy shaklda qoladi.'],
    solution:capitalize(solved) + ' ' + participle + ' ' + context + '.'
  };
}

const CONTEXT_EXERCISES = [
  ['article','___ mère',['Определённый артикль · «мать»','Aniq artikl · «ona»'],['la'],['Mère — женский род.','Mère — ayol jinsi.']],
  ['article','___ père',['Определённый артикль · «отец»','Aniq artikl · «ota»'],['le'],['Père — мужской род.','Père — erkak jinsi.']],
  ['article','___ entrée',['Определённый артикль · «вход»','Aniq artikl · «kirish»'],['l’'],['Перед гласной le и la сокращаются до l’.','Unli oldidan le va la o‘rniga l’ yoziladi.']],
  ['article','___ parents',['Определённый артикль · «родители»','Aniq artikl · «ota-ona»'],['les'],['В определённой форме множественного числа используется les.','Aniq artiklning ko‘plik shakli les.']],
  ['article','Elle est ___ . (boulanger)',['Назови её профессию.','Uning kasbini yozing.'],['boulangère'],['В таком предложении профессия после être употребляется без артикля.','Bu gapda être dan keyin kasb artiklsiz keladi.']],
  ['article','C’est ___ boulangère.',['Впиши неопределённый артикль.','Noaniq artiklni yozing.'],['une'],['После c’est в этом представлении нужен артикль une.','Bu tanishtirishda c’est dan keyin une artikli kerak.']],
  ['agreement','un ___ appartement (beau)',['Согласуй прилагательное.','Sifatni mos shaklda yozing.'],['bel'],['Перед гласной в мужском роде используется bel.','Erkak rodida unli oldidan bel ishlatiladi.']],
  ['agreement','une ___ maison (beau)',['Согласуй прилагательное.','Sifatni mos shaklda yozing.'],['belle'],['Maison — женский род.','Maison — ayol jinsi.']],
  ['agreement','La cuisine est ___ . (équipé)',['Согласуй прилагательное.','Sifatni mos shaklda yozing.'],['équipée'],['Cuisine — женский род, единственное число.','Cuisine — ayol jinsi, birlik.']],
  ['agreement','Paul et Marc sont ___ . (content)',['Согласуй прилагательное.','Sifatni mos shaklda yozing.'],['contents'],['Два человека. Для мужского рода во множественном числе добавь -s.','Ikki kishi. Erkak jinsidagi ko‘plik shakli uchun -s qo‘sh.']],
  ['agreement','Elle est ___ . (serveur)',['Впиши форму женского рода.','Ayol kasb shaklini yozing.'],['serveuse'],['Serveur → serveuse.','Serveur → serveuse.']],
  ['location','Le livre est ___ la table.',['«Книга на столе» · впиши предлог.','«Kitob stol ustida» · predlogni yozing.'],['sur'],['Sur означает «на».','Sur — ustida.']],
  ['location','Le sac est ___ la chaise.',['«Сумка под стулом» · впиши предлог.','«Sumka stul ostida» · predlogni yozing.'],['sous'],['Sous означает «под».','Sous — ostida.']],
  ['location','Le canapé est ___ la fenêtre.',['«Диван перед окном» · впиши предлог.','«Divan deraza oldida» · predlogni yozing.'],['devant'],['Devant означает «перед».','Devant — oldida.']],
  ['location','Le parking est ___ l’immeuble.',['«Парковка за зданием» · впиши предлог.','«Avtoturargoh bino orqasida» · predlogni yozing.'],['derrière'],['Derrière означает «за, позади».','Derrière — orqasida.']],
  ['location','L’appartement est près ___ marché.',['Объедини de + le.','De + le shakllarini birlashtiring.'],['du'],['De + le → du.','De + le → du.']],
  ['location','Ils jouent ___ échecs.',['Объедини à + les.','À + les shakllarini birlashtiring.'],['aux'],['À + les → aux.','À + les → aux.']],
  ['location','Nous participons ___ une rencontre.',['Впиши предлог для participer.','Participer bilan keladigan predlogni yozing.'],['à'],['Запомни оборот participer à.','Participer à birikmasini eslab qoling.']],
  ['location','Ils discutent ___ la location.',['Впиши предлог для discuter.','Discuter bilan keladigan predlogni yozing.'],['de'],['Запомни оборот discuter de.','Discuter de birikmasini eslab qoling.']],
  ['location','Je vais ___ marché.',['Объедини à + le.','À + le shakllarini birlashtiring.'],['au'],['À + le → au.','À + le → au.']],
  ['location','Nous parlons ___ équipements.',['Объедини de + les.','De + les shakllarini birlashtiring.'],['des'],['De + les → des.','De + les → des.']],
  ['agreement','Je ___ présente.',['«Я представляюсь» · впиши возвратное местоимение.','«Men o‘zimni tanishtiraman» · olmoshni yozing.'],['me'],['С je используется me.','Je bilan me ishlatiladi.']],
  ['agreement','Nous ___ retrouvons à midi.',['«Мы встречаемся в полдень» · впиши возвратное местоимение.','«Tushda uchrashamiz» · olmoshni yozing.'],['nous'],['Nous nous retrouvons. Первое nous — подлежащее.','Nous nous retrouvons. Birinchi nous — ega.']]
].map(([group,title,label,accepted,rule], index) => ({id:'context-' + (index + 1),group,title,label,accepted,rule,fr:true,promptFr:true}));
