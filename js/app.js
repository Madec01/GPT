import { LEVELS } from './levels.js';
import { Simulation } from './engine.js';
import { Renderer, loadArt } from './renderer.js';
import { load, save, record, unlocked } from './storage.js';
import { Soundtrack } from './audio.js';
const $ = id => document.getElementById(id);
const data = load(),
  audio = new Soundtrack(data.options),
  keys = new Set();
let renderer,
  sim = null,
  current = 0,
  screen = 'home',
  paused = false,
  modalKind = '',
  pointer = null,
  last = 0,
  toastTimer,
  previousHUD = '',
  resultHandled = false;
const fmt = t => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[c]);
const stars = n => '★'.repeat(n) + '☆'.repeat(3 - n);
function toast(text) {
  $('toast').textContent = text;
  $('toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 2700);
}
function persist() {
  if (!save(data)) toast('La sauvegarde est indisponible dans ce navigateur. La partie reste jouable.');
}
function applyOptions() {
  audio.apply(data.options);
  document.body.classList.toggle('reduced-motion', data.options.reducedMotion);
  $('test-badge').hidden = !data.options.testMode;
  $('sound-toggle').setAttribute('aria-label', data.options.muted ? 'Activer le son' : 'Couper le son');
  $('sound-toggle').style.opacity = data.options.muted ? '.45' : '1';
  if (renderer) renderer.reduced = data.options.reducedMotion;
}
function showScreen(name) {
  screen = name;
  keys.clear();
  for (const id of ['home', 'missions', 'game', 'ending']) $(id).hidden = id !== name;
  audio.scene(name);
  if (name === 'home') updateHome();
  if (name === 'missions') renderMissions();
  if (name === 'ending') $('ending-score').textContent = `${Object.keys(data.results).length} / 9 galeries libérées · ${Object.values(data.results).reduce((a, r) => a + r.stars, 0)} / 27 étoiles`;
  window.scrollTo(0, 0);
}
function updateHome() {
  const done = Object.keys(data.results).length;
  $('home-progress').textContent = `${String(done).padStart(2, '0')} / 09 GALERIES LIBÉRÉES`;
  $('play').querySelector('span').textContent = done === 9 ? 'Revenir au musée' : done ? 'Continuer la nuit' : 'Entrer dans le musée';
}
function renderMissions() {
  $('mission-grid').innerHTML = LEVELS.map((level, i) => {
    const r = data.results[level.id],
      locked = level.id > unlocked(data);
    return `<button class="mission-card" data-level="${i}" ${locked ? 'disabled' : ''}><span class="eyebrow">ACTE ${['I', 'II', 'III'][level.act - 1]}</span><span class="number">${String(level.id).padStart(2, '0')}</span><h3>${esc(level.title)}</h3><p>${esc(level.subtitle)}</p><div class="card-bottom"><span class="stars">${r ? stars(r.stars) : locked ? 'VERROUILLÉE' : 'À EXPLORER'}</span><span>${r ? fmt(r.time) : `${level.loot.length} ŒUVRES`}</span></div></button>`;
  }).join('');
  for (const b of $('mission-grid').querySelectorAll('[data-level]')) b.onclick = () => startLevel(Number(b.dataset.level));
}
function openModal(kind, html) {
  keys.clear();
  modalKind = kind;
  $('modal-content').innerHTML = html;
  if (!$('modal').open) $('modal').showModal();
  const close = $('modal-content').querySelector('[data-close]');
  if (close) close.onclick = closeModal;
}
function closeModal() {
  $('modal').close();
  modalKind = '';
  keys.clear();
  if (screen === 'game') $('board').focus({
    preventScroll: true
  });
}
function startLevel(index) {
  closeModal();
  current = index;
  resultHandled = false;
  paused = false;
  previousHUD = '';
  pointer = null;
  const level = LEVELS[index];
  sim = new Simulation(level, onEvent);
  renderer.configure(level);
  $('mission-kicker').textContent = `ACTE ${['I', 'II', 'III'][level.act - 1]} / GALERIE ${String(level.id).padStart(2, '0')} SUR 09`;
  $('mission-title').textContent = level.title;
  $('hint').textContent = level.hint.replace('Appuie sur Q', 'Appuie sur A (AZERTY) ou Q (QWERTY)');
  showScreen('game');
  updateHUD();
  renderer.draw(sim, 1 / 60);
  openModal('briefing', `<span class="eyebrow">DOSSIER ${String(level.id).padStart(2, '0')} — ${level.loot.length} ŒUVRES À RESTITUER</span><h2>${esc(level.title)}</h2><p>${esc(level.story)}</p><div class="field-note"><span>LE PLAN</span><p>${esc($('hint').textContent)}</p></div><p class="micro">Récupérez toutes les œuvres, puis rejoignez la porte. Le temps cible de ${level.par} s est facultatif.</p>${data.options.testMode ? '<p class="eyebrow">MODE TEST : AUCUN RECORD NI DÉBLOCAGE ENREGISTRÉ</p>' : ''}<button id="begin" class="button primary">Commencer l'infiltration <span>↗</span></button><button id="brief-back" class="button secondary">Retour aux missions</button>`);
  $('begin').onclick = () => {
    closeModal();
    sim.start();
    audio.unlock();
    audio.effect('switch');
    $('board').focus();
  };
  $('brief-back').onclick = () => {
    closeModal();
    showScreen('missions');
  };
}
function onEvent(event) {
  renderer?.event(event);
  updateHUD();
  if (event.type === 'pickup') {
    audio.effect('delivery');
    toast(`Œuvre récupérée : ${event.item.name}`);
  }
  if (event.type === 'decoy') audio.effect('switch');
  if (event.type === 'emp') {
    audio.effect('switch');
    toast('Impulsion active — lasers neutralisés pendant 6 secondes.');
  }
  if (event.type === 'alert') {
    audio.effect('error');
    if (!data.options.reducedMotion) {
      const board = document.querySelector('.board-wrap');
      board.classList.remove('shake');
      void board.offsetWidth;
      board.classList.add('shake');
    }
  }
  if (event.type === 'win' || event.type === 'lose') {
    if (resultHandled) return;
    resultHandled = true;
    queueMicrotask(() => result(event.type === 'win'));
  }
}
function result(won) {
  keys.clear();
  const stats = sim.stats(),
    level = LEVELS[current];
  if (won) {
    const saved = record(data, level.id, stats);
    if (saved === false) toast('Progression conservée pour cette session uniquement.');
    audio.effect('delivery');
  } else audio.effect('error');
  openModal('result', `<span class="eyebrow">${won ? 'ŒUVRES EN SÉCURITÉ' : 'INFILTRATION INTERROMPUE'}</span><h2>${won ? 'Une galerie libérée.' : 'On vous a repéré.'}</h2>${won ? `<div class="stars">${stars(stats.stars)}</div><p>${esc(level.epilogue)}</p>` : `<p>${esc(sim.reason)}</p><div class="field-note"><span>POUR LE PROCHAIN ESSAI</span><p>Utilisez les murs pour disparaître. Le clic planifie un trajet, mais ne tient pas compte des gardes ni des lasers.</p></div>`}<div class="result-metrics"><div>${fmt(stats.elapsed)}<small>TEMPS</small></div><div>${stats.loot} / ${stats.total}<small>ŒUVRES</small></div><div>${stats.alerts}<small>ALERTES</small></div></div>${won ? `<p class="micro">1 étoile pour réussir · 1 sous ${level.par} s · 1 sans alerte.${data.options.testMode ? ' Mode test : résultat non enregistré.' : ''}</p><button id="next" class="button primary">${current === 8 ? 'Voir l’épilogue' : 'Galerie suivante'}</button>` : ''}<button id="retry" class="button ${won ? 'secondary' : 'primary'}">${won ? 'Améliorer mon parcours' : 'Réessayer'}</button><button id="result-missions" class="button secondary">Choisir une mission</button>`);
  $('retry').onclick = () => startLevel(current);
  $('result-missions').onclick = () => {
    closeModal();
    showScreen('missions');
  };
  if (won) $('next').onclick = () => {
    closeModal();
    if (current === 8) showScreen('ending');else startLevel(current + 1);
  };
}
function updateHUD() {
  if (!sim) return;
  const stats = sim.stats();
  $('timer').textContent = fmt(stats.elapsed);
  const signature = sim.loot.map(l => l.collected ? '1' : '0').join('');
  if (signature !== previousHUD) {
    previousHUD = signature;
    $('loot-list').innerHTML = sim.loot.map(l => `<div class="loot-item ${l.collected ? 'collected' : ''}"><img src="assets/graphics/${l.asset}.svg" alt=""><span>${esc(l.name)}</span><span>${l.collected ? '✓' : String(l.id + 1).padStart(2, '0')}</span></div>`).join('');
  }
  $('detection-fill').style.width = `${sim.detection * 100}%`;
  $('detection-text').textContent = sim.detection > .65 ? 'DANGER' : sim.detection > .05 ? 'REPÉRÉ' : 'À COUVERT';
  $('decoy-count').textContent = sim.charges.decoy;
  $('emp-count').textContent = sim.charges.emp;
  $('decoy').disabled = sim.charges.decoy === 0 || sim.state !== 'running';
  $('emp').disabled = sim.charges.emp === 0 || sim.state !== 'running';
  const ready = stats.loot === stats.total;
  $('exit-status').textContent = ready ? 'SORTIE OUVERTE →' : 'RÉCUPÉREZ LES ŒUVRES';
  $('board-status').textContent = sim.empUntil > sim.time ? `EMP · ${Math.ceil(sim.empUntil - sim.time)} s` : ready ? 'Toutes les œuvres sont à vous. Rejoignez la sortie.' : sim.time < 5 ? 'Cliquez au sol ou utilisez les touches de déplacement.' : '';
  const debug = data.options.testMode && data.options.diagnostics;
  $('debug').hidden = !debug;
  if (debug) $('debug').textContent = `${Math.round(renderer.fps)} fps | x:${Math.round(sim.player.x)} y:${Math.round(sim.player.y)} | ${sim.state} | t=${sim.time.toFixed(1)}`;
}
function pauseGame() {
  if (screen !== 'game' || sim?.state !== 'running' || $('modal').open) return;
  paused = true;
  openModal('pause', `<span class="eyebrow">LE TEMPS S'ARRÊTE</span><h2>À l'abri, pour l'instant.</h2><p>La ronde reprendra exactement là où vous l'avez laissée.</p><button id="resume" class="button primary">Reprendre</button><button id="pause-retry" class="button secondary">Recommencer la mission</button><button id="pause-options" class="button secondary">Options</button><button id="pause-home" class="button secondary">Retour à l'accueil</button>`);
  $('resume').onclick = () => {
    paused = false;
    closeModal();
  };
  $('pause-retry').onclick = () => startLevel(current);
  $('pause-options').onclick = options;
  $('pause-home').onclick = () => {
    closeModal();
    showScreen('home');
  };
}
function options() {
  // Retain real nodes so briefing, pause and result button callbacks survive Options.
  if (modalKind === 'options') return;
  const origin = {
    kind: modalKind,
    paused,
    nodes: Array.from($('modal-content').childNodes),
    open: $('modal').open
  };
  openModal('options', `<span class="eyebrow">PRÉPARER SA NUIT</span><h2>Options</h2><div class="modal-row"><label for="music-volume">Musique</label><input id="music-volume" aria-label="Volume musique" type="range" min="0" max="1" step=".01" value="${data.options.music}"></div><div class="modal-row"><label for="sfx-volume">Bruitages</label><input id="sfx-volume" aria-label="Volume bruitages" type="range" min="0" max="1" step=".01" value="${data.options.sfx}"></div><div class="modal-row"><label for="motion">Réduire les animations<small>Limite les effets décoratifs et les particules.</small></label><input id="motion" type="checkbox" ${data.options.reducedMotion ? 'checked' : ''}></div><div class="modal-row"><label for="test-mode">Mode test<small>Toutes les missions accessibles. Aucun record enregistré.<br>Changer ce réglage termine la mission en cours.</small></label><input id="test-mode" type="checkbox" ${data.options.testMode ? 'checked' : ''}></div><div class="modal-row"><label for="diagnostics">Diagnostic du mode test<small>Images par seconde, position et trajets des gardes.</small></label><input id="diagnostics" type="checkbox" ${data.options.diagnostics ? 'checked' : ''}></div><p class="micro">La progression est enregistrée automatiquement sur ce navigateur. La pause ne pénalise pas le score.</p><button id="options-done" class="button primary">Enregistrer et revenir</button>`);
  for (const [id, key] of [['music-volume', 'music'], ['sfx-volume', 'sfx']]) $(id).oninput = e => {
    data.options[key] = Number(e.target.value);
    applyOptions();
  };
  $('motion').onchange = e => {
    data.options.reducedMotion = e.target.checked;
    applyOptions();
  };
  const previousTest = data.options.testMode;
  $('options-done').onclick = () => {
    data.options.testMode = $('test-mode').checked;
    data.options.diagnostics = $('diagnostics').checked;
    applyOptions();
    persist();
    if (previousTest !== data.options.testMode && screen === 'game') {
      closeModal();
      sim = null;
      paused = false;
      showScreen('missions');
    } else if (origin.open) {
      $('modal-content').replaceChildren(...origin.nodes);
      modalKind = origin.kind;
      paused = origin.paused;
      keys.clear();
      $('modal-content').querySelector('button')?.focus();
    } else {
      closeModal();
      paused = origin.paused;
      if (screen === 'missions') renderMissions();
    }
  };
}
function help() {
  openModal('help', `<span class="eyebrow">PETIT MANUEL D'INFILTRATION</span><h2>L'art de disparaître.</h2><div class="instruction"><b>1</b><p><strong>Observez, puis déplacez-vous.</strong><br>Flèches, ZQSD (AZERTY), WASD (QWERTY) ou clic au sol. Maj : marche lente, plus difficile à repérer. Le clic trouve un chemin, pas un chemin sûr.</p></div><div class="instruction"><b>2</b><p><strong>Récupérez, puis ressortez.</strong><br>Approchez chaque œuvre. Quand elles sont toutes récupérées, la sortie s'allume en vert. Le temps cible ne bloque jamais la réussite.</p></div><div class="instruction"><b>3</b><p><strong>Détournez les regards.</strong><br>Leurre : A sur AZERTY, Q sur QWERTY, ou bouton latéral. Visez au pointeur, à 180 unités maximum. Les gardes proches enquêtent pendant cinq secondes.</p></div><div class="instruction"><b>4</b><p><strong>Coupez les faisceaux.</strong><br>E : EMP, tous les lasers coupés six secondes. Sinon, attendez leur extinction. Les charges sont renouvelées à chaque mission.</p></div><p class="micro">Échap / P : pause · R : recommencer · 1 : leurre (alternative) · 2 : EMP<br>Les gadgets apparaissent progressivement. Une alerte complète impose de réessayer.</p><button class="button primary" data-close>Compris</button>`);
}
function credits() {
  openModal('credits', `<span class="eyebrow">LES MAINS DERRIÈRE LA NUIT</span><h2>Crédits</h2><p>Un jeu conçu et développé pour Martin, avec une équipe d'agents spécialisés en conception, moteur, ressources et assurance qualité.</p><ul class="credit-list"><li><strong>Illustrations et icônes :</strong> Delapouite, Lorc, DarkZaitzev, Guard13007 — <a href="https://game-icons.net" target="_blank" rel="noopener">Game-icons.net</a>, CC BY 3.0. Couleurs adaptées, fonds retirés.</li><li><strong>Musique du menu :</strong> Snowfall — Kistol, CC0. <strong>Musique des galeries :</strong> Project Utopia (seamless loop) — Cong Xu, CC0. Sources : OpenGameArt.</li><li><strong>Bruitages :</strong> Kenney, CC0.</li><li><strong>Polices :</strong> Manrope Project Authors et Cormorant Garamond (Christian Thalmann / Catharsis Fonts), SIL Open Font License 1.1.</li></ul><p class="micro">Les sources exactes, licences et modifications sont détaillées dans <a href="CREDITS.md" target="_blank">CREDITS.md</a> et <a href="assets/manifest.json" target="_blank">le manifeste des ressources</a>. Toutes les ressources sont distribuées localement.</p><button class="button primary" data-close>Retour au musée</button>`);
}
function useDecoy() {
  if (screen !== 'game' || paused || $('modal').open || sim?.state !== 'running') return;
  if (!sim.decoy(pointer || undefined)) toast('Aucun leurre disponible.');
}
function useEMP() {
  if (screen !== 'game' || paused || $('modal').open || sim?.state !== 'running') return;
  if (!sim.emp()) toast('Aucune impulsion disponible.');
}
$('play').onclick = () => startLevel(unlocked(data) - 1);
$('missions-open').onclick = () => showScreen('missions');
$('ending-replay').onclick = () => showScreen('missions');
$('brand').onclick = e => {
  e.preventDefault();
  if (screen === 'game' && sim?.state === 'running') {
    pauseGame();
    return;
  }
  closeModal();
  showScreen('home');
};
for (const b of document.querySelectorAll('[data-home]')) b.onclick = () => showScreen('home');
$('settings-open').onclick = options;
$('home-options').onclick = options;
$('how-open').onclick = help;
$('help-game').onclick = help;
$('credits-open').onclick = credits;
$('sound-toggle').onclick = () => {
  data.options.muted = !data.options.muted;
  applyOptions();
  persist();
};
$('pause').onclick = pauseGame;
$('restart').onclick = () => startLevel(current);
$('decoy').onclick = useDecoy;
$('emp').onclick = useEMP;
$('modal').addEventListener('cancel', e => {
  e.preventDefault();
  if (modalKind === 'pause') {
    paused = false;
    closeModal();
  } else if (['help', 'credits'].includes(modalKind)) closeModal();
});
document.addEventListener('pointerdown', () => audio.unlock(), {
  once: true
});
document.addEventListener('keydown', () => audio.unlock(), {
  once: true
});
document.addEventListener('click', e => {
  if (e.target.closest('button')) audio.effect('click');
});
const movement = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight']);
window.addEventListener('keydown', e => {
  if (screen !== 'game' || $('modal').open) return;
  if (movement.has(e.code)) {
    e.preventDefault();
    keys.add(e.code);
  }
  if (e.repeat) return;
  if (e.code === 'Escape' || e.code === 'KeyP') {
    e.preventDefault();
    pauseGame();
  }
  if (e.code === 'KeyR') startLevel(current);
  if (e.code === 'KeyQ' || e.code === 'Digit1') useDecoy();
  if (e.code === 'KeyE' || e.code === 'Digit2') useEMP();
});
window.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', () => {
  keys.clear();
  pauseGame();
});
document.addEventListener('visibilitychange', () => {
  audio.suspend(document.hidden);
  if (document.hidden) {
    keys.clear();
    pauseGame();
  }
});
function point(e) {
  const rect = $('board').getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * 960 / rect.width,
    y: (e.clientY - rect.top) * 576 / rect.height
  };
}
$('board').addEventListener('pointermove', e => pointer = point(e));
$('board').addEventListener('pointerdown', e => {
  if (sim?.state !== 'running' || paused || $('modal').open) return;
  pointer = point(e);
  if (e.button === 2) {
    useDecoy();
    return;
  }
  if (!sim.setTarget(pointer.x, pointer.y)) toast('Choisissez un point au sol, à l’intérieur de la galerie.');
  $('board').focus({
    preventScroll: true
  });
});
$('board').addEventListener('contextmenu', e => e.preventDefault());
function frame(now) {
  const frameTime = (now - last) / 1000 || 1 / 60;
  const dt = Math.min(frameTime, .05);
  last = now;
  if (sim && screen === 'game') {
    const sneak = keys.has('ShiftLeft') || keys.has('ShiftRight');
    if (!paused && !$('modal').open) sim.update(dt, {
      x: Number(keys.has('ArrowRight') || keys.has('KeyD')) - Number(keys.has('ArrowLeft') || keys.has('KeyA')),
      y: Number(keys.has('ArrowDown') || keys.has('KeyS')) - Number(keys.has('ArrowUp') || keys.has('KeyW')),
      sneak
    });
    renderer.draw(sim, dt, {
      sneak,
      diagnostics: data.options.testMode && data.options.diagnostics,
      frameTime
    });
    updateHUD();
  }
  requestAnimationFrame(frame);
}
async function init() {
  try {
    const art = await loadArt();
    renderer = new Renderer($('board'), art);
    applyOptions();
    updateHome();
    $('loading').hidden = true;
    $('app').hidden = false;
    requestAnimationFrame(frame);
  } catch (error) {
    $('load-status').textContent = `${error.message}. Vérifiez que le dossier assets est présent puis rechargez la page.`;
  }
}
init();
