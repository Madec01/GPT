import { Simulation } from './simulation.js';
import { LEVELS, ENDINGS } from './levels.js';
import { AbyssRenderer } from './renderer.js';
import { Soundscape } from './audio.js';
import { loadSave, writeSave, recordDive } from './storage.js';

const $ = id => document.getElementById(id);
const escape = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const save = loadSave();
const sound = new Soundscape(save.options);
let renderer = null;
let simulation = null, sector = 0, mode = 'home', modalReturn = 'home', paused = false;
let light = true, lastTime = 0, radioUntil = 0, toastUntil = 0, radioIndex = 0;
let previousFocus = null, muted = false, completedHandled = false;
const keys = new Set(), pressedTools = new Set(), radioSeen = new Set();
const pendingActions = new Set();
const chart = document.createElement('canvas');
chart.id = 'chart'; chart.width = 240; chart.height = 140; chart.setAttribute('aria-label', 'Carte des reliefs et des signaux repérés');
$('hud').append(chart);
const chartCtx = chart.getContext('2d');

function persist() { if (!writeSave(save)) toast('Sauvegarde indisponible dans ce navigateur. La partie reste jouable.'); }
function setMode(next) {
  mode = next; keys.clear(); pressedTools.clear();
  pendingActions.clear();
  document.querySelectorAll('[data-tool]').forEach(el => el.classList.remove('active'));
  document.body.classList.toggle('playing', next === 'playing');
  $('hud').hidden = next !== 'playing'; $('screen').hidden = next === 'playing';
  $('masthead').hidden = next === 'playing'; $('footer').hidden = next === 'playing';
  $('modal').hidden = true;
  if (next !== 'playing') { simulation = null; renderer.setLevel(LEVELS[sector]); sound.motion(0); sound.play('menu'); }
}
function bind(id, fn) { $(id)?.addEventListener('click', () => { sound.unlock(); sound.effect('click'); fn(); }); }
function home() {
  paused = false; setMode('home');
  $('screen').innerHTML = `<section class="home"><span class="eyebrow">UNE EXPÉDITION AUX CONFINS DU VIVANT</span><h1>ABYSSE</h1><p class="tagline">Le silence répond.</p><p class="intro">Une station disparue depuis vingt ans.<br>Un signal qui connaît votre nom.<br>Sous la surface, quelque chose vous attend.</p><nav class="menu" aria-label="Menu principal"><button class="primary" id="play">${save.unlocked ? 'Continuer l’expédition' : 'Commencer l’expédition'}<span class="arrow">↗</span></button><button id="sectors">Carnet de plongée <span class="arrow">→</span></button><button id="options">Options <span class="arrow">→</span></button><button id="credits">Crédits <span class="arrow">→</span></button></nav><p class="home-note">CINQ PLONGÉES · DEUX DESTINS · UNE MER VIVANTE</p></section><aside class="expedition-tag"><span class="eyebrow">DERNIÈRE TRANSMISSION</span><br><b>Station Nacre</b><p>48° 16′ N &nbsp; / &nbsp; − 1 240 M</p></aside>`;
  bind('play', () => briefing(save.unlocked)); bind('sectors', sectors); bind('options', options); bind('credits', credits);
}
function sectors() {
  setMode('sectors');
  $('screen').innerHTML = `<section class="page"><button class="back" id="back">← Accueil</button><br><span class="eyebrow">CARNET DE PLONGÉE</span><h1>Plus bas, une autre histoire.</h1><p class="intro">Chaque plongée vous rapproche de Nacre. Les secteurs accomplis peuvent être rejoués pour améliorer votre bilan et récupérer les archives oubliées.</p><div class="sector-list">${LEVELS.map((l,i) => `<button class="sector-row" data-sector="${i}" ${i > save.unlocked && !save.options.testMode ? 'disabled' : ''}><span class="sector-num">0${i+1}</span><span><strong>${escape(l.name)}</strong><small>${l.depth} m · ${escape(l.subtitle.split(' · ')[1])}</small></span><span class="sector-status">${save.records[i] ? `ACCOMPLI · ${save.records[i].score} PTS` : i <= save.unlocked || save.options.testMode ? 'PLONGÉE DISPONIBLE' : 'SIGNAL INACCESSIBLE'}</span><span class="arrow">↘</span></button>`).join('')}</div>${save.ending ? '<button class="back" id="read-ending">Relire votre épilogue →</button>' : ''}</section>`;
  bind('back', home); bind('read-ending', () => ending(save.ending));
  document.querySelectorAll('[data-sector]').forEach(b => b.onclick = () => { sound.unlock(); sound.effect('click'); briefing(Number(b.dataset.sector)); });
}
function briefing(index) {
  sector = index; setMode('briefing'); const l = LEVELS[index];
  $('screen').innerHTML = `<section class="page"><button class="back" id="back">← Carnet de plongée</button><br><span class="eyebrow">${escape(l.subtitle)} / ${l.depth} M</span><h1>${escape(l.name)}</h1><div class="brief-grid"><div><p class="brief-story">${escape(l.briefing)}</p><div class="brief-goal"><span class="eyebrow">VOTRE OBJECTIF</span><h3>${escape(l.objectiveText)}</h3><p>Le sas répare la coque et recharge les instruments. Une charge accrochée y est déposée automatiquement.</p></div><div class="button-row"><button id="launch" class="primary-button">Plonger ↘</button></div>${save.options.testMode ? '<p class="home-note">MODE TEST · INVINCIBILITÉ · AUCUN RECORD ENREGISTRÉ</p>' : ''}</div><div><span class="eyebrow">AVANT LA DESCENTE</span><ul class="tutorial-list">${l.tutorial.map(t=>`<li>${escape(t)}</li>`).join('')}<li><strong>Commandes</strong><kbd>E</kbd> Accrocher / activer &nbsp; <kbd>F</kbd> Découper<br><kbd>Espace</kbd> Sonar &nbsp; <kbd>L</kbd> Phare &nbsp; <kbd>Maj</kbd> Poussée<br><kbd>Échap</kbd> Pause</li></ul></div></div></section>`;
  bind('back', sectors); bind('launch', launch);
}
function launch() {
  const l = LEVELS[sector]; simulation = new Simulation(l, { testMode: save.options.testMode });
  renderer.setLevel(l); setMode('playing'); completedHandled = false; paused = false; light = true;
  radioSeen.clear(); radioIndex = 0; radioUntil = 0; toastUntil = 0; lastTime = performance.now();
  $('sector-label').textContent = `${l.name} / ${l.depth} M`;
  $('objective-title').textContent = l.objectiveText;
  $('test-badge').hidden = !save.options.testMode;
  for (const el of document.querySelectorAll('[data-tool]')) {
    const tool = el.dataset.tool;
    el.hidden = tool === 'sonar' && !l.tools.includes('sonar') || tool === 'cut' && !l.tools.includes('cut') || tool === 'light' && !l.tools.includes('light');
  }
  sound.unlock(); sound.play(sector >= 3 ? 'deep' : 'dive'); sayTrigger('start'); updateHUD();
}
function dialog(html, wide = false) {
  previousFocus = document.activeElement;
  $('modal').innerHTML = `<section class="dialog ${wide ? 'wide' : ''}">${html}</section>`;
  $('modal').hidden = false;
  requestAnimationFrame(() => $('modal').querySelector('button,input,select')?.focus());
}
function closeDialog() { $('modal').hidden = true; previousFocus?.focus(); }
function pause() {
  if (mode !== 'playing') return;
  paused = true; keys.clear(); pressedTools.clear(); sound.suspend(true);
  pendingActions.clear();
  document.querySelectorAll('[data-tool]').forEach(el => el.classList.remove('active'));
  dialog(`<span class="eyebrow">BATHYS / PILOTAGE SUSPENDU</span><h1>Entre deux eaux.</h1><p>La plongée est en pause. Prenez le temps de préparer la suite.</p><div class="menu"><button class="primary" id="resume">Reprendre <span class="arrow">→</span></button><button id="pause-options">Options <span>→</span></button><button id="restart">Recommencer la plongée <span>↻</span></button><button id="quit">Retour à l’accueil <span>→</span></button></div>`);
  bind('resume', resume); bind('pause-options', options); bind('restart', () => { closeDialog(); sound.suspend(false); launch(); });
  bind('quit', () => { sound.suspend(false); home(); });
}
function resume() { closeDialog(); paused = false; keys.clear(); sound.suspend(false); lastTime = performance.now(); }
function options() {
  modalReturn = mode === 'playing' ? 'pause' : mode;
  const o = save.options;
  dialog(`<span class="eyebrow">RÉGLAGES DU BATHYS</span><h1>À votre écoute.</h1><div class="option-row"><label for="music-volume">Musique<small>Musique enregistrée pendant les plongées.</small></label><div class="volume-control"><input id="music-volume" type="range" min="0" max="100" value="${Math.round(o.music*100)}"><output id="music-value">${Math.round(o.music*100)}</output></div></div><div class="option-row"><label for="effects-volume">Bruitages</label><div class="volume-control"><input id="effects-volume" type="range" min="0" max="100" value="${Math.round(o.effects*100)}"><output id="effects-value">${Math.round(o.effects*100)}</output></div></div><div class="option-row"><label for="quality">Qualité du rendu<small>Économique réduit la résolution sur écran haute densité.</small></label><select id="quality"><option value="high" ${o.quality==='high'?'selected':''}>Élevée</option><option value="eco" ${o.quality==='eco'?'selected':''}>Économique</option></select></div><div class="option-row"><label for="reduced">Mouvements réduits<small>Atténue les effets de caméra et les transitions.</small></label><input id="reduced" type="checkbox" ${o.reducedMotion?'checked':''}></div><div class="option-row"><label for="test-mode">Mode test<small>Tous les secteurs accessibles, coque invincible.<br>Prend effet à la prochaine plongée. Aucun record sauvegardé.</small></label><input id="test-mode" type="checkbox" ${o.testMode?'checked':''}></div><div class="button-row"><button id="options-close" class="primary-button">Enregistrer et revenir</button></div>`);
  for (const name of ['music','effects']) $(name+'-volume').oninput = e => { save.options[name] = Number(e.target.value)/100; $(name+'-value').textContent = e.target.value; sound.update(muted ? {...save.options,music:0,effects:0} : save.options); };
  bind('options-close', () => {
    save.options.quality = $('quality').value; save.options.reducedMotion = $('reduced').checked; save.options.testMode = $('test-mode').checked;
    document.body.classList.toggle('reduced',save.options.reducedMotion);
    renderer.setOptions(save.options); persist();
    if (modalReturn === 'pause') pause(); else { closeDialog(); if (mode==='sectors') sectors(); }
  });
}
async function credits(onClose = closeDialog) {
  let content = '<p>Les sources complètes, auteurs, licences et adaptations sont conservés dans le manifeste et la documentation du dépôt.</p>';
  try { const r = await fetch('assets/abysse/credits.json'); if (r.ok) { const data=await r.json(); content = data.map(c=>`<h3>${escape(c.category)}</h3><p>${escape(c.text)} ${c.url?`<a href="${escape(c.url)}" target="_blank" rel="noopener noreferrer">Source et licence ↗</a>`:''}</p>`).join(''); } } catch {}
  dialog(`<span class="eyebrow">LES VOIX DERRIÈRE L’EXPÉDITION</span><h1>Crédits.</h1><div class="credits">${content}<h3>Conception et réalisation</h3><p>ABYSSE — projet de Martin Decaux. Conception, programmation et intégration : Codex et ses agents spécialisés. Direction du projet, tests et retours : Martin.</p><h3>Polices et moteur</h3><p>Manrope — Mikhail Sharanda, SIL OFL 1.1. Cormorant Garamond — Catharsis Fonts, SIL OFL 1.1. Three.js — auteurs de Three.js, MIT.</p><p><a href="https://github.com/Madec01/GPT/blob/main/docs/ABYSSE_ASSETS.md" target="_blank" rel="noopener noreferrer">Inventaire détaillé des licences ↗</a></p></div><div class="button-row"><button id="credits-close" class="primary-button">Revenir</button></div>`, true);
  bind('credits-close',onClose);
}
function say(text, seconds=10) {
  const parts=text.split(' — '); $('radio-speaker').textContent=parts.length>1?parts.shift():'JOURNAL DE BORD'; $('radio-text').textContent=parts.join(' — ');
  radioUntil=simulation.time+seconds; $('radio').style.opacity='1';
}
function sayTrigger(trigger) {
  if(radioSeen.has(trigger))return;
  const line=LEVELS[sector].radio.find(r=>r.trigger===trigger); if(line){say(line.text);radioSeen.add(trigger);}
}
function toast(text) { $('toast').textContent=text; toastUntil=(simulation?.time||0)+4; }
function eventFeedback(e) {
  const messages={ attached:'Câble accroché. Anticipez les virages.', detached:'Câble libéré.', cutComplete:'Support libéré.', delivered:'Charge déposée au sas.', beaconActivated:'Relais synchronisé.', tetherBroken:'Câble décroché : revenez accrocher la charge.', damage:'Impact sur la coque.', warning:'Le chasseur vous a repéré. Changez de trajectoire !' };
  if(messages[e.type])toast(messages[e.type]);
  const sounds={attached:'attach',detached:'click',cutComplete:'success',delivered:'success',beaconActivated:'success',sonar:'sonar',damage:'damage',warning:'warning'};
  if(sounds[e.type])sound.effect(sounds[e.type]);
  const radioTriggers={attached:'cargoAttached',cutComplete:'cargoUnlocked',beaconActivated:'beaconActivated'};
  if(radioTriggers[e.type])sayTrigger(radioTriggers[e.type]);
  if(e.type==='unavailable') toast({range:'Approchez-vous à moins de 7 mètres.',locked:'Le support est verrouillé : maintenez F pour le découper.',sequence:'Un relais précédent attend votre signal.',sonar:'Sonar indisponible : attendez la recharge.'}[e.reason]||'Instrument indisponible.');
}
function updateHUD() {
  const s=simulation,p=s.player,l=LEVELS[sector];
  $('hull-text').textContent=Math.ceil(p.hull); $('hull-meter').style.width=`${p.hull}%`; $('hull-meter').style.background=p.hull<30?'#ff9279':'var(--mint)';
  $('energy-text').textContent=Math.floor(p.energy);$('energy-meter').style.width=`${p.energy}%`;
  $('depth').textContent=Math.round(l.depth+p.y);
  const beacons=s.entities.filter(o=>o.type==='beacon'), active=beacons.filter(o=>o.active).length;
  $('objective-detail').textContent=s.objectivesComplete?'Objectifs accomplis. Revenez au sas.':`${l.objectives.cargo?`Charge : ${s.requiredDelivered}/${l.objectives.cargo}`:''}${beacons.length?`${l.objectives.cargo?' · ':''}Relais : ${active}/${beacons.length}`:''} · Sas : ${Math.round(Math.hypot(p.x-l.dock.x,p.y-l.dock.y))} m`;
  $('sonar-state').textContent=s.sonarCooldown>0?`${s.sonarCooldown.toFixed(1)} S`:p.energy<18?'ÉNERGIE FAIBLE':'PRÊT';
  $('light-state').textContent=light?'ALLUMÉ':'ÉTEINT';$('tether-state').textContent=s.tether?s.tether.name:'LIBRE';
  const nearest=s.entities.filter(o=>!o.recovered&&!(o.type==='beacon'&&o.active)).sort((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-b.x,p.y-b.y))[0];
  let context='';
  if(nearest&&Math.hypot(p.x-nearest.x,p.y-nearest.y)<9)context=nearest.locked?`F · Découper ${nearest.name} — ${Math.round(nearest.cutProgress/nearest.cutTime*100)} %`:`E · ${nearest.type==='beacon'?'Activer':'Accrocher'} ${nearest.name}`;
  if(s.tether)context=`E · Lâcher ${s.tether.name}`;
  if(s.inRefuge)context='REFUGE · Le récif masque votre présence';
  $('context-action').textContent=context;
  $('radio').style.opacity=s.time<radioUntil?'1':'0';
  if(s.time>toastUntil)$('toast').textContent='';
  if(s.time>radioUntil+3&&radioIndex<l.tutorial.length&&s.time>8+radioIndex*17){say(l.tutorial[radioIndex++],10);}
  drawChart();
}
function drawChart(){
 const s=simulation,l=LEVELS[sector],c=chartCtx,w=chart.width,h=chart.height,scale=Math.min((w-20)/l.bounds.width,(h-26)/l.bounds.height),ox=10,oy=20;
 c.clearRect(0,0,w,h);c.fillStyle='#061c26c9';c.fillRect(0,0,w,h);c.font='8px Manrope';c.fillStyle='#9cb9bc';c.fillText('RELIEF / SIGNAUX REPÉRÉS',10,11);
 c.fillStyle='#36616c';for(const o of l.obstacles)c.fillRect(ox+o.x*scale,oy+o.y*scale,o.w*scale,o.h*scale);
 c.strokeStyle='#72c8af';for(const r of l.refuges){c.beginPath();c.arc(ox+r.x*scale,oy+r.y*scale,r.r*scale,0,Math.PI*2);c.stroke();}
 const point=(p,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(ox+p.x*scale,oy+p.y*scale,r,0,Math.PI*2);c.fill();};
 point(l.dock,4,'#9bf4d3');for(const o of s.entities)if(o.revealed&&!o.recovered)point(o,3,o.active?'#9bf4d3':o.required===false?'#b69be8':'#ffc47b');
 if(s.sonarPulse)for(const e of s.creatures)point(e,3,'#ff9279');point(s.player,3,'#fff');
 const target=s.objectivesComplete||s.tether?l.dock:s.entities.find(o=>!o.recovered&&!o.active&&o.required!==false&&(!o.requires||o.requires.every(id=>s.entities.find(e=>e.id===id)?.active)));
 if(target){c.strokeStyle='#ffc47b';c.setLineDash([2,4]);c.beginPath();c.moveTo(ox+s.player.x*scale,oy+s.player.y*scale);c.lineTo(ox+target.x*scale,oy+target.y*scale);c.stroke();c.setLineDash([]);}
}
function result() {
  if(completedHandled)return;completedHandled=true;paused=true;keys.clear();pressedTools.clear();
  const s=simulation,l=LEVELS[sector],won=s.status==='won';
  const score=Math.max(0,Math.round(1000-s.time*1.5-s.stats.damage*4+s.delivered*150));
  // Use the mode captured at launch, not an option changed halfway through a dive.
  if(won&&!s.testMode){recordDive(save,sector,{score,time:Math.round(s.time),cargo:s.delivered},{testMode:s.testMode});persist();}
  sound.motion(0);sound.effect(won?'success':'damage');sound.play('menu');
  dialog(`<span class="eyebrow">${won?'EXTRACTION CONFIRMÉE':'LIAISON INTERROMPUE'}</span><h1>${won?'Une réponse de plus.':'La mer garde ses secrets.'}</h1><p>${escape(won?l.debrief:'La coque a cédé. Reprenez la plongée : votre progression des secteurs précédents est conservée. Utilisez les refuges et réduisez le bruit près des chasseurs.')}</p><div class="results"><div><b>${Math.floor(s.time/60)}:${String(Math.floor(s.time%60)).padStart(2,'0')}</b><span>TEMPS DE PLONGÉE</span></div><div><b>${s.delivered}</b><span>CHARGES EXTRAITES</span></div><div><b>${won?score:Math.ceil(s.stats.damage)}</b><span>${won?'POINTS':'DÉGÂTS SUBIS'}</span></div></div>${s.testMode?'<p>Mode test : aucun record enregistré.</p>':''}<div class="button-row">${won?`<button id="next" class="primary-button">${l.final?'Décider de l’avenir de Nacre':'Plongée suivante ↘'}</button>`:''}<button id="retry" class="${won?'secondary':'primary'}-button">Rejouer cette plongée</button><button id="result-home" class="secondary-button">Accueil</button></div>`);
  bind('retry',launch);bind('result-home',home);bind('next',()=>{if(l.final)finalChoice();else briefing(sector+1);});
}
function finalChoice(){
 dialog(`<span class="eyebrow">LE CŒUR DE NACRE EST LIBRE</span><h1>Que saura la surface ?</h1><p>Les neuf chercheurs souhaitent rester. Votre décision concerne leur lien avec le monde : révéler le refuge, ou lui laisser le temps d’être compris.</p><div class="brief-goal"><h3>Ouvrir le réseau</h3><p>Transmettre la voix de Nacre et ses coordonnées. Permettre la rencontre, avec le risque d’attirer les convoitises.</p></div><div class="brief-goal"><h3>Protéger le refuge</h3><p>Effacer les coordonnées publiques. Maintenir une liaison privée et apporter les secours dont les chercheurs ont besoin.</p></div><div class="button-row"><button id="ending-open" class="primary-button">Ouvrir le réseau</button><button id="ending-shelter" class="secondary-button">Protéger le refuge</button></div>`);
 bind('ending-open',()=>ending('open',true));bind('ending-shelter',()=>ending('shelter',true));
}
function ending(choice,record=false){
 const e=ENDINGS[choice]||ENDINGS.open;
 if(record&&!simulation?.testMode){save.ending=choice;persist();}
 dialog(`<span class="eyebrow">ABYSSE / ÉPILOGUE</span><h1>${escape(e.title)}</h1><p class="ending-text">${escape(e.text)}</p><p>${escape(e.epilogue)}</p><p>Merci d’avoir écouté les profondeurs.</p><div class="button-row"><button id="ending-home" class="primary-button">Retour à l’accueil</button><button id="ending-credits" class="secondary-button">Crédits</button></div>`,true);
 bind('ending-home',home);bind('ending-credits',()=>credits(()=>ending(choice)));
}
function handleKey(e,down){
 if(e.code==='Tab'&&!$('modal').hidden){const els=[...$('modal').querySelectorAll('button:not(:disabled),input,select,a')];if(els.length){if(e.shiftKey&&document.activeElement===els[0]){e.preventDefault();els.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===els.at(-1)){e.preventDefault();els[0].focus();}}return;}
 if(mode!=='playing'||(!down&&e.code==='Escape'))return;
 if(e.code==='Escape'&&down&&!e.repeat){e.preventDefault();if(!paused)pause();else if($('resume'))resume();return;}
 if(paused)return;
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD','KeyE','KeyF','KeyL','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();if(down)keys.add(e.code);else keys.delete(e.code);}
 // Preserve a short press even when keyup arrives before the next frame.
 if(down&&!e.repeat&&(e.code==='Space'||e.code==='KeyE'))pendingActions.add(e.code==='Space'?'sonar':'interact');
 if(e.code==='KeyL'&&down&&!e.repeat&&LEVELS[sector].tools.includes('light')){light=!light;sound.effect('click');}
}
window.addEventListener('keydown',e=>handleKey(e,true));window.addEventListener('keyup',e=>handleKey(e,false));
window.addEventListener('blur',()=>{if(mode==='playing'&&!paused)pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(mode==='playing'&&!paused)pause();sound.suspend(true);}else if(!paused)sound.suspend(false);});
window.addEventListener('resize',()=>renderer?.resize());
bind('pause-button',pause);bind('brand',home);
bind('sound-toggle',()=>{muted=!muted;sound.update(muted?{...save.options,music:0,effects:0}:save.options);$('sound-toggle').textContent=muted?'SON COUPÉ':'SON ACTIVÉ';$('sound-toggle').setAttribute('aria-label',muted?'Activer le son':'Couper le son');});
for(const button of document.querySelectorAll('[data-tool]')){
 const tool=button.dataset.tool;
 if(tool==='cut'){button.onpointerdown=e=>{e.preventDefault();button.setPointerCapture(e.pointerId);pressedTools.add('cut');button.classList.add('active');};button.onpointerup=button.onpointercancel=()=>{pressedTools.delete('cut');button.classList.remove('active');};}
 else button.onclick=()=>{if(paused)return;if(tool==='light')light=!light;else pendingActions.add(tool);};
}
function tick(now){
 const dt=Math.min(.05,Math.max(0,(now-lastTime)/1000));lastTime=now;
 if(simulation&&mode==='playing'&&!paused){
  const input={x:Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),y:Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp')),boost:keys.has('ShiftLeft')||keys.has('ShiftRight'),sonar:keys.has('Space')||pendingActions.has('sonar'),interact:keys.has('KeyE')||pendingActions.has('interact'),cut:keys.has('KeyF')||pressedTools.has('cut'),light};
  simulation.update(dt,input);pendingActions.clear();simulation.drainEvents().forEach(eventFeedback);
  const p=simulation.player,cutting=input.cut&&p.energy>0&&simulation.entities.some(o=>o.locked&&Math.hypot(o.x-p.x,o.y-p.y)<7);
  sound.motion(Math.hypot(p.vx,p.vy),cutting,dt);
  updateHUD();if(simulation.status!=='playing')result();
 }
 renderer.render(simulation,paused?0:dt);requestAnimationFrame(tick);
}
async function boot(){
 try{
  renderer = new AbyssRenderer($('ocean'), save.options);
  await renderer.init();
  const r=await fetch('assets/abysse/audio.json');if(!r.ok)throw new Error('Le manifeste audio ne peut pas être chargé.');sound.configure(await r.json());
  document.body.classList.toggle('reduced',save.options.reducedMotion);$('loading').hidden=true;home();lastTime=performance.now();requestAnimationFrame(tick);
 }catch(error){$('load-status').textContent=`Le Bathys ne peut pas démarrer : ${error.message}. Rechargez la page ou vérifiez que WebGL est disponible.`;const b=document.createElement('button');b.className='primary-button';b.textContent='Réessayer';b.onclick=()=>location.reload();$('loading').append(b);console.error(error);}
}
boot();
