'use strict';

const HanyuCourse = (() => {
  const languageKey = 'hanyu-language-v1';
  const labels = {
    units: ['Уроки', 'Darslar'],
    cards: ['Карточки', 'Kartochkalar'],
    practice: ['Практика', 'Mashqlar'],
    dictionary: ['Словарь', 'Lug‘at']
  };

  function readLanguage(key = languageKey) {
    try { return localStorage.getItem(key) === 'uz' ? 'uz' : 'ru'; }
    catch { return 'ru'; }
  }

  function readStored(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }

  function writeStored(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  }

  function normalizeSearch(value) {
    return String(value ?? '').normalize('NFC').toLowerCase().replaceAll('ё', 'е')
      .replace(/['’‘ʻʼ`]/gu, '').replace(/\s+/gu, ' ').trim();
  }

  function rankedDictionary(entries, query, fields, normalize = normalizeSearch) {
    const needle = normalize(query);
    if (!needle) return entries;
    const matched = [];
    for (const entry of entries) {
      let score = 0;
      for (const value of fields(entry)) {
        if (!value) continue;
        const text = normalize(value);
        if (text === needle) { score = 3; break; }
        if (text.startsWith(needle)) score = Math.max(score, 2);
        else if (text.includes(needle)) score = Math.max(score, 1);
      }
      if (score) matched.push({entry, score});
    }
    return matched.sort((a, b) => b.score - a.score).map(match => match.entry);
  }

  function keepHeaderOnEntry() {
    if (!location.hash || performance.getEntriesByType('navigation')[0]?.type === 'back_forward') return;
    window.addEventListener('load', () => requestAnimationFrame(() => window.scrollTo(0, 0)), {once:true});
  }

  function initOfflineAudio(container, paths, siteBase) {
    if (!container || !paths.length || !('caches' in window) || !('serviceWorker' in navigator)) return;
    const button = container.querySelector('button');
    const status = container.querySelector('[role="status"]');
    const urls = [...new Set(paths.map(path => new URL(path, location.href).href))];
    const cacheName = 'hanyuwed-media:' + siteBase.pathname;
    let count = 0;
    let running = false;
    let error = false;

    function render() {
      const t = (ru, uz) => document.documentElement.lang === 'uz' ? uz : ru;
      button.disabled = running || count === urls.length || !navigator.serviceWorker.controller;
      button.textContent = count === urls.length ? t('Аудио сохранено', 'Audio saqlandi') : running ?
        t('Загрузка аудио…', 'Audio yuklanmoqda…') : t('Скачать аудио для офлайн-занятий', 'Oflayn mashqlar uchun audio yuklash');
      status.textContent = error ? t(`Сохранено ${count} из ${urls.length}. Нажми кнопку, чтобы продолжить.`,
        `${urls.length} tadan ${count} tasi saqlandi. Davom etish uchun tugmani bos.`) : `${count} / ${urls.length}`;
    }

    async function readCount(cache) {
      const available = new Set((await cache.keys()).map(request => request.url));
      count = urls.filter(url => available.has(url)).length;
    }

    button.addEventListener('click', async () => {
      if (running || !navigator.serviceWorker.controller) return;
      running = true;
      error = false;
      render();
      try {
        const cache = await caches.open(cacheName);
        await readCount(cache);
        const available = new Set((await cache.keys()).map(request => request.url));
        const missing = urls.filter(url => !available.has(url));
        for (let index = 0; index < missing.length; index += 5) {
          const batch = await Promise.allSettled(missing.slice(index,index+5).map(async url => {
            const response = await fetch(url);
            if (response.status !== 200) throw new Error('Audio download failed');
            if (!await cache.match(url)) await cache.put(url,response);
          }));
          count += batch.filter(item => item.status === 'fulfilled').length;
          render();
          if (batch.some(item => item.status === 'rejected')) throw new Error('Audio download incomplete');
        }
      } catch { error = true; }
      finally { running = false; render(); }
    });
    container.hidden = false;
    render();
    caches.open(cacheName).then(readCount).then(render).catch(() => { error = true; render(); });
    new MutationObserver(render).observe(document.documentElement, {attributeFilter:['lang']});
    navigator.serviceWorker.addEventListener('controllerchange', render);
  }

  return Object.freeze({languageKey, labels, readLanguage, readStored, writeStored, normalizeSearch, rankedDictionary, initOfflineAudio, keepHeaderOnEntry});
})();
