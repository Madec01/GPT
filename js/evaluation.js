const CATEGORIES = [
  ['plaisir', 'Plaisir de jeu', 'Est-ce que tu t’amuses vraiment ? As-tu envie de continuer après une mission ?'],
  ['mecaniques', 'Mécaniques et intérêt des missions', 'Les gardes, leurres et lasers créent-ils des choix intéressants ? Les missions sont-elles assez variées ?'],
  ['commandes', 'Commandes et précision', 'Le personnage répond-il comme tu le souhaites, au clavier comme au clic ?'],
  ['graphismes', 'Graphismes et direction artistique', 'Que penses-tu des personnages, des galeries, des couleurs et de l’identité visuelle ?'],
  ['fluidite', 'Fluidité, animations et sensations', 'Le jeu paraît-il fluide ? Les mouvements, effets et réactions sont-ils satisfaisants ?'],
  ['audio', 'Musiques et bruitages', 'Les sons et la musique renforcent-ils l’ambiance et les actions, sans devenir gênants ?'],
  ['clarte', 'Menus, lisibilité et apprentissage', 'Comprends-tu rapidement les objectifs, les dangers et les commandes ? Les menus sont-ils agréables ?'],
  ['difficulte', 'Équilibrage et progression', 'La difficulté est-elle bien dosée et progressive ? 10 signifie bien équilibré, pas très difficile.'],
  ['histoire', 'Histoire et immersion', 'L’univers et le récit te donnent-ils une bonne raison de jouer ? Ressens-tu la tension du cambriolage ?'],
  ['rejouabilite', 'Contenu et envie de rejouer', 'Le jeu te semble-t-il suffisamment riche ? Aurais-tu envie de revenir améliorer tes parcours ?']
];
const KEY = 'minuit-musee-evaluation-v1';
const form = document.getElementById('review-form');
const draft = { version: 1, ratings: {}, comments: {}, bilan: '' };
let storageAvailable = true;
try {
  const stored = JSON.parse(localStorage.getItem(KEY));
  if (stored?.version === 1) {
    for (const [id] of CATEGORIES) {
      const score = stored.ratings?.[id];
      if (Number.isInteger(score) && score >= 0 && score <= 10) draft.ratings[id] = score;
      if (typeof stored.comments?.[id] === 'string') draft.comments[id] = stored.comments[id];
    }
    if (typeof stored.bilan === 'string') draft.bilan = stored.bilan;
  }
} catch { storageAvailable = false; }

const container = document.getElementById('categories');
for (const [index, [id, title, question]] of CATEGORIES.entries()) {
  const field = document.createElement('fieldset');
  field.className = 'category';
  // Only fixed editorial strings are inserted as HTML. Draft text uses value/textContent.
  field.innerHTML = `<legend><span class="number">${String(index + 1).padStart(2, '0')}</span>${title}</legend><p class="question" id="question-${id}">${question}</p><div class="rating" role="radiogroup" aria-label="Note : ${title}" aria-describedby="question-${id}">${Array.from({length: 11}, (_, n) => `<label class="score"><input type="radio" name="${id}" value="${n}" aria-label="${n} sur 10"><span aria-hidden="true">${n}</span></label>`).join('')}</div><div class="rating-meta"><span id="status-${id}">Non évalué</span><button type="button" class="clear-rating" data-clear="${id}" disabled>Retirer la note</button></div><label class="comment-label" for="comment-${id}">Ton commentaire</label><textarea id="comment-${id}" name="comment-${id}" rows="3" placeholder="Ce qui fonctionne, ce qui te gêne, ton idée pour améliorer…"></textarea>`;
  container.append(field);
  const value = draft.ratings[id];
  if (value !== undefined) field.querySelector(`input[value="${value}"]`).checked = true;
  field.querySelector('textarea').value = draft.comments[id] || '';
  field.querySelector('[data-clear]').addEventListener('click', () => {
    field.querySelectorAll('input').forEach(input => { input.checked = false; });
    delete draft.ratings[id];
    persist();
  });
}
document.getElementById('bilan').value = draft.bilan;

function updateSummary() {
  const values = Object.values(draft.ratings);
  document.getElementById('progress').textContent = `${values.length} / ${CATEGORIES.length}`;
  document.getElementById('average').textContent = values.length ? `${(values.reduce((a, b) => a + b, 0) / values.length).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} / 10` : '— / 10';
  for (const [id] of CATEGORIES) {
    const n = draft.ratings[id];
    document.getElementById(`status-${id}`).textContent = n === undefined ? 'Non évalué' : `Ta note : ${n} / 10`;
    container.querySelector(`[data-clear="${id}"]`).disabled = n === undefined;
  }
  document.getElementById('save-state').textContent = storageAvailable ? 'Brouillon enregistré automatiquement dans ce navigateur.' : 'Sauvegarde locale indisponible. Copie ou télécharge ton avis avant de fermer cette page.';
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(draft)); storageAvailable = true; }
  catch { storageAvailable = false; }
  updateSummary();
  document.getElementById('export-state').textContent = '';
  if (!document.getElementById('manual-copy').hidden) document.getElementById('export-text').value = buildReport();
}
form.addEventListener('submit', e => e.preventDefault());
form.addEventListener('input', e => {
  const target = e.target;
  if (target.type === 'radio') draft.ratings[target.name] = Number(target.value);
  else if (target.id === 'bilan') draft.bilan = target.value;
  else if (target.name.startsWith('comment-')) draft.comments[target.name.slice(8)] = target.value;
  persist();
});
function buildReport() {
  const lines = ['ÉVALUATION — MINUIT AU MUSÉE', `Date : ${new Date().toLocaleDateString('fr-FR')}`, `Catégories notées : ${Object.keys(draft.ratings).length} / ${CATEGORIES.length}`, `Moyenne des notes saisies : ${document.getElementById('average').textContent}`, ''];
  for (const [id, title] of CATEGORIES) {
    lines.push(`${title} — ${draft.ratings[id] === undefined ? 'Non évalué' : `${draft.ratings[id]}/10`}`, draft.comments[id]?.trim() || '(Aucun commentaire)', '');
  }
  lines.push('MA PRIORITÉ POUR LA SUITE', draft.bilan.trim() || '(Non renseignée)');
  return lines.join('\n');
}
document.getElementById('copy').addEventListener('click', async () => {
  const report = buildReport();
  try {
    await navigator.clipboard.writeText(report);
    document.getElementById('manual-copy').hidden = true;
    document.getElementById('export-state').textContent = 'Avis copié. Colle-le maintenant dans notre conversation.';
  } catch {
    document.getElementById('manual-copy').hidden = false;
    const output = document.getElementById('export-text');
    output.value = report;
    output.focus(); output.select();
    document.getElementById('export-state').textContent = 'La copie automatique est indisponible. Le texte est sélectionné ci-dessous : utilise Copier ou Ctrl+C.';
  }
});
document.getElementById('download').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob(['\uFEFF', buildReport()], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = 'Mon_avis_Minuit_au_Musee.txt';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  document.getElementById('export-state').textContent = 'Téléchargement lancé. Joins le fichier à notre conversation pour me transmettre ton avis.';
});
updateSummary();
