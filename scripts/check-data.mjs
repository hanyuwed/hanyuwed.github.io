import assert from 'node:assert/strict';
import {readFileSync, statSync} from 'node:fs';
import vm from 'node:vm';
import {words as chinese} from '../data.js';
import {entries as arabic} from '../ar/data.js';
import {recordings as arAudio} from '../ar/speech-data.js';
import {entries as korean} from '../ko/data.js';
import {KO_AUDIO as koAudio} from '../ko/audio-index.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const readData = (path, variable) => vm.runInNewContext(`${read(path)}\n${variable}`, {}, {filename:path});
const french = readData('fr/course-data.js', 'COURSE').entries;
const italian = readData('it/course-data.js', 'IT_WORDS');
const spanish = readData('es/course-data.js', 'ES_WORDS');
const frAudio = readData('fr/audio-index.js', 'FR_AUDIO');
const itAudio = readData('it/audio-index.js', 'IT_AUDIO');
const esAudio = readData('es/audio-index.js', 'ES_AUDIO');

function populated(value) {
  return Array.isArray(value) ? value.length > 0 && value.every(populated) : typeof value === 'string' && value.trim().length > 0;
}

function translations(label, entries, original) {
  const ids = new Set();
  for (const entry of entries) {
    assert(entry.id && !ids.has(entry.id), `${label}: missing or duplicate ID ${entry.id}`);
    ids.add(entry.id);
    assert(populated(entry[original]), `${label}/${entry.id}: missing original`);
    assert(populated(entry.ru) && populated(entry.uz), `${label}/${entry.id}: missing RU or UZ translation`);
  }
  console.log(`${label}: ${ids.size} cards with IDs and both translations`);
}

function verifyAudio(course, paths) {
  for (const path of new Set(paths)) {
    const file = new URL(`../${course ? course + '/' : ''}${path}`, import.meta.url);
    assert(statSync(file).size > 100, `Invalid MP3: ${file.pathname}`);
  }
}

translations('Chinese', chinese, 'hanzi');
translations('French', french.map(entry => ({...entry,
  ru:entry.meanings.map(item => item.ru), uz:entry.meanings.map(item => item.uz)})), 'fr');
translations('Korean', korean, 'hangul');
translations('Arabic', arabic, 'ar');
translations('Italian', italian, 'it');
translations('Spanish', spanish, 'es');
assert(chinese.every(word => populated(word.note) && populated(word.noteUz)), 'Missing Chinese example');
assert(arabic.every(entry => arAudio[entry.id]), 'Missing Arabic recording');
assert(korean.every(entry => koAudio[entry.spoken.trim()]), 'Missing Korean recording');
assert(french.every(entry => frAudio[entry.fr.split(' / ')[0].replace('(e)', '').replace('(s)', '').replaceAll('…', '').trim()]), 'Missing French recording');
verifyAudio('',chinese.map(word => `audio/${word.id}.mp3`));
verifyAudio('fr',Object.values(frAudio));
verifyAudio('ko',Object.values(koAudio));
verifyAudio('ar',Object.values(arAudio));
verifyAudio('it',Object.values(itAudio).map(id => `audio/${id}.mp3`));
verifyAudio('es',Object.values(esAudio).map(id => `audio/${id}.mp3`));

const shell = vm.runInNewContext(`${read('sw.js')}\nASSETS`, {
  self:{registration:{scope:'https://check.local/'},addEventListener() {}}, URL
}, {filename:'sw.js'});
const shellUrls = new Set(shell);
for (const url of shell) {
  const path = new URL(url).pathname.slice(1);
  const file = path.endsWith('/') || path === '' ? path + 'index.html' : path;
  assert(statSync(new URL('../' + file, import.meta.url)).isFile(), `${file} missing in offline shell`);
}
for (const url of shell.filter(url => url.endsWith('.html'))) {
  for (const match of read(new URL(url).pathname.slice(1)).matchAll(/<script[^>]+src="([^"]+)"/gu)) {
    assert(shellUrls.has(new URL(match[1],url).href), `${match[1]} was omitted from the offline shell`);
  }
}
console.log('Audio references and offline page scripts verified');
