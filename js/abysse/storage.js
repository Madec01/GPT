const KEY = 'abysse-expedition-v1';
const defaults = { music: 0.6, effects: 0.75, quality: 'high', reducedMotion: false, testMode: false };
export function loadSave() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    const options = { ...defaults };
    for (const k of ['music', 'effects']) if (Number.isFinite(raw.options?.[k])) options[k] = Math.max(0, Math.min(1, raw.options[k]));
    for (const k of ['reducedMotion', 'testMode']) options[k] = raw.options?.[k] === true;
    if (raw.options?.quality === 'eco') options.quality = 'eco';
    const records = {};
    for (let i = 0; i < 5; i++) {
      const r = raw.records?.[i];
      if (r && Number.isFinite(r.score) && r.score >= 0 && Number.isFinite(r.time) && r.time >= 0 && Number.isFinite(r.cargo) && r.cargo >= 0) {
        records[i] = {score: Math.round(r.score), time: Math.round(r.time), cargo: Math.floor(r.cargo)};
      }
    }
    return { unlocked: Math.max(0, Math.min(4, Math.floor(Number(raw.unlocked) || 0))), records, ending: ['open','shelter'].includes(raw.ending) ? raw.ending : null, options };
  } catch { return { unlocked: 0, records: {}, ending: null, options: { ...defaults } }; }
}
export function writeSave(save) {
  try { localStorage.setItem(KEY, JSON.stringify(save)); return true; } catch { return false; }
}
export function recordDive(save, index, result, {testMode = save.options.testMode} = {}) {
  if (testMode || !Number.isInteger(index) || index < 0 || index > 4) return false;
  const old = save.records[index];
  if (!old || result.score > old.score) save.records[index] = result;
  save.unlocked = Math.max(save.unlocked, Math.min(4, index + 1));
  return writeSave(save);
}
