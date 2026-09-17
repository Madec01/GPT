const KEY = 'minuit-musee-v1';
const defaults = () => ({
  version: 1,
  results: {},
  options: {
    music: .38,
    sfx: .65,
    muted: false,
    reducedMotion: false,
    testMode: false,
    diagnostics: false
  }
});
export function load() {
  const data = defaults();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw?.version !== 1) return data;
    for (const key of ['music', 'sfx']) {
      const value = raw.options?.[key];
      if (typeof value === 'number' && Number.isFinite(value)) data.options[key] = Math.max(0, Math.min(1, value));
    }
    for (const key of ['muted', 'reducedMotion', 'testMode', 'diagnostics']) {
      if (typeof raw.options?.[key] === 'boolean') data.options[key] = raw.options[key];
    }
    for (const [id, result] of Object.entries(raw.results || {})) {
      const number = Number(id);
      if (!Number.isInteger(number) || number < 1 || number > 9 || String(number) !== id || !result) continue;
      if (Number.isFinite(result.time) && Number.isFinite(result.stars)) {
        data.results[id] = {
          time: Math.max(0, result.time),
          stars: Math.max(1, Math.min(3, Math.floor(result.stars)))
        };
      }
    }
  } catch {/* Storage can be disabled, unavailable or contain a previous damaged save. */}
  return data;
}
export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
export function record(data, id, stats) {
  if (data.options.testMode) return;
  const previous = data.results[id];
  data.results[id] = {
    stars: Math.max(previous?.stars || 0, stats.stars),
    time: Math.min(previous?.time ?? Infinity, stats.elapsed)
  };
  return save(data);
}
export function unlocked(data) {
  if (data.options.testMode) return 9;
  let next = 1;
  while (next < 9 && data.results[next]) next++;
  return next;
}
