'use strict';

const HanyuPlayback = (() => {
  const rateKey = 'hanyu-playback-rate:v1';
  const rates = [.5, .75, 1, 1.25, 1.5, 2];
  const validRate = rate => Number.isFinite(rate) && rate >= .25 && rate <= 4;
  const t = (ru, uz) => document.documentElement.lang === 'uz' ? uz : ru;
  let preference = 1;
  try {
    const saved = Number(localStorage.getItem(rateKey));
    if (validRate(saved)) preference = saved;
  } catch { /* Keep the preference in memory. */ }

  function addSpeedControl(audio, onChange) {
    const field = document.createElement('label');
    field.className = 'audio-speed';
    const label = document.createElement('span');
    const select = document.createElement('select');
    field.append(label, select);
    const syncLabel = () => { label.textContent = t('Скорость','Tezlik'); };
    new MutationObserver(syncLabel).observe(document.documentElement, {attributeFilter:['lang']});
    syncLabel();
    function addOption(rate) {
      const option = document.createElement('option');
      option.value = rate;
      option.textContent = String(rate).replace('.', ',') + '×';
      select.append(option);
    }
    rates.forEach(addOption);
    let current;
    function set(rate) {
      current = rate;
      if (![...select.options].some(option => Number(option.value) === rate)) addOption(rate);
      select.value = String(rate);
      if (audio.defaultPlaybackRate !== rate) audio.defaultPlaybackRate = rate;
      if (audio.playbackRate !== rate) audio.playbackRate = rate;
    }
    function choose(rate) {
      preference = rate;
      try { localStorage.setItem(rateKey, String(rate)); } catch { /* Keep the preference in memory. */ }
      set(rate);
      onChange?.();
    }
    select.addEventListener('change', () => choose(Number(select.value)));
    audio.addEventListener('ratechange', () => {
      if (audio.playbackRate !== current && validRate(audio.playbackRate)) choose(audio.playbackRate);
    });
    window.addEventListener('storage', event => {
      if (event.key !== rateKey) return;
      const rate = Number(event.newValue);
      preference = validRate(rate) ? rate : 1;
      set(preference);
    });
    audio.preservesPitch = true;
    set(preference);
    return {field, reset:slow => set(slow ? Math.min(.75,preference) : preference), rate:() => current};
  }

  function createPlayer() {
    const panel = document.createElement('section');
    panel.className = 'audio-player';
    panel.hidden = true;
    panel.innerHTML = '<div class="audio-heading"><strong></strong><button type="button" data-close-player>×</button></div>' +
      '<audio controls preload="metadata" playsinline></audio><div class="speech-controls" hidden>' +
      '<button type="button" data-replay-speech></button><button type="button" data-stop-speech></button></div>' +
      '<p class="audio-status" role="status"></p>';
    const heading = panel.querySelector('strong');
    const close = panel.querySelector('[data-close-player]');
    const audio = panel.querySelector('audio');
    const speechControls = panel.querySelector('.speech-controls');
    const replay = panel.querySelector('[data-replay-speech]');
    const silence = panel.querySelector('[data-stop-speech]');
    const status = panel.querySelector('.audio-status');
    let active = null;
    let utterance = null;
    const speed = addSpeedControl(audio, () => {
      if (active?.speech && utterance) speak();
    });
    speechControls.after(speed.field);
    document.body.append(panel);

    const messages = {
      loading:['Загружается запись…','Yozuv yuklanyapti…'],
      playing:['Воспроизведение','Ijro etilyapti'],
      paused:['Пауза','To‘xtatib turildi'],
      ended:['Запись завершена','Yozuv tugadi'],
      blocked:['Нажми ▶ в плеере, чтобы включить звук.','Ovozni eshitish uchun pleyerda ▶ ni bos.'],
      unavailable:['Для этого задания запись недоступна.','Bu mashq uchun yozuv mavjud emas.'],
      error:['Не удалось воспроизвести звук. Попробуй ещё раз.','Ovozni ijro etib bo‘lmadi. Yana urinib ko‘r.']
    };
    function setStatus(state) {
      status.dataset.state = state;
      status.textContent = state ? t(...messages[state]) : '';
    }
    function localize() {
      const title = t('Произношение','Talaffuz');
      heading.textContent = title;
      panel.setAttribute('aria-label',title);
      audio.setAttribute('aria-label',t('Прослушать запись','Yozuvni tinglash'));
      close.setAttribute('aria-label',t('Закрыть плеер','Pleyerni yopish'));
      replay.textContent = t('Повторить','Takrorlash');
      silence.textContent = t('Остановить','To‘xtatish');
      if (status.dataset.state) setStatus(status.dataset.state);
    }
    new MutationObserver(localize).observe(document.documentElement, {attributeFilter:['lang']});
    localize();

    function stopSpeech() {
      if (!utterance) return;
      utterance = null;
      window.speechSynthesis.cancel();
      silence.disabled = true;
    }
    function stop() {
      active = null;
      stopSpeech();
      audio.pause();
      panel.hidden = true;
    }
    function started(item) {
      if (active !== item) return;
      setStatus('playing');
      if (!item.started) {
        item.started = true;
        item.onStart?.();
      }
    }
    function speak() {
      const item = active;
      stopSpeech();
      const {text,voice} = item.speech;
      const next = new SpeechSynthesisUtterance(text);
      next.voice = voice;
      next.lang = voice.lang;
      next.rate = speed.rate();
      next.onstart = () => { if (utterance === next) started(item); };
      next.onend = next.onerror = event => {
        if (utterance !== next) return;
        utterance = null;
        silence.disabled = true;
        setStatus(event.type === 'error' ? 'error' : 'ended');
      };
      utterance = next;
      silence.disabled = false;
      setStatus('loading');
      window.speechSynthesis.speak(next);
    }
    function useFallback(item) {
      item.speech = item.fallback?.();
      if (!item.speech) return false;
      audio.pause();
      audio.hidden = true;
      speechControls.hidden = false;
      speak();
      return true;
    }
    function fail(item, error) {
      if (active !== item || item.speech || error?.name === 'AbortError') return;
      if (error?.name === 'NotAllowedError') {
        setStatus('blocked');
      } else if (!useFallback(item)) {
        setStatus('error');
      }
    }
    const currentMedia = () => active && !active.speech && active.src &&
      audio.currentSrc === active.src && !audio.hidden;
    audio.addEventListener('playing', () => { if (currentMedia() && !audio.paused) started(active); });
    audio.addEventListener('waiting', () => { if (currentMedia()) setStatus('loading'); });
    audio.addEventListener('ended', () => { if (currentMedia() && audio.ended) setStatus('ended'); });
    audio.addEventListener('pause', () => {
      if (currentMedia() && audio.paused && !audio.ended && audio.currentTime > 0) setStatus('paused');
    });
    audio.addEventListener('error', () => { if (currentMedia() && audio.error) fail(active); });
    replay.onclick = speak;
    silence.onclick = () => { stopSpeech(); setStatus('paused'); };
    close.onclick = () => {
      const origin = active?.origin;
      stop();
      if (origin?.isConnected) origin.focus({preventScroll:true});
    };
    window.addEventListener('pagehide',stop);

    function play({src,slow,onStart,fallback,origin=document.activeElement}) {
      stop();
      const host = origin?.closest('dialog[open]') || document.body;
      if (panel.parentElement !== host) host.append(panel);
      const item = {src:src && new URL(src,document.baseURI).href,onStart,fallback,origin,started:false};
      active = item;
      panel.hidden = false;
      audio.hidden = !item.src;
      speechControls.hidden = true;
      if (item.src && audio.src !== item.src) audio.src = item.src;
      else if (item.src && audio.error) audio.load();
      speed.reset(slow);
      if (!item.src) {
        if (!useFallback(item)) setStatus('unavailable');
        return;
      }
      if (audio.currentTime > 0) audio.currentTime = 0;
      setStatus('loading');
      // Keep play() in the user's tap handler for browsers with autoplay restrictions.
      try {
        audio.play()?.then(() => { if (!item.speech && !audio.ended) started(item); })
          .catch(error => fail(item,error));
      } catch (error) { fail(item,error); }
    }

    return {play,stop};
  }

  return {addSpeedControl,createPlayer};
})();
