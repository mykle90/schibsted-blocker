const $ = id => document.getElementById(id);
async function request(message) {
  const result = await chrome.runtime.sendMessage(message);
  if (result?.error) throw new Error(result.error);
  return result;
}
function render(s) {
  for (const key of ['hideBanner', 'cleanup', 'rotateDaily']) $(key).checked = s[key];
  $('keepNames').value = s.keepNames.join('\n');
}
async function inventory() {
  const result = await request({type: 'inventory'});
  $('inventory').replaceChildren();
  for (const item of result.items) {
    const li = document.createElement('li');
    const labels = {'protected': 'beskyttet', 'tracking': 'sporing', 'daily identifier': 'daglig identifikator', 'unknown — kept': 'ukjent — beholdes', 'outside scope': 'utenfor tilgangen'};
    li.textContent = `${item.name} · ${item.domain}${item.path} · ${labels[item.category] || item.category}`;
    $('inventory').append(li);
  }
  if (!result.items.length) $('inventory').textContent = 'Ingen tilgjengelige Aftenposten-cookies.';
}
async function save() {
  const s = Object.fromEntries(['hideBanner', 'cleanup', 'rotateDaily'].map(k => [k, $(k).checked]));
  s.keepNames = [...new Set($('keepNames').value.split('\n').map(n => n.trim()).filter(Boolean))];
  render(await request({type: 'save', settings: s}));
}
async function action(task) {
  const buttons = [...document.querySelectorAll('button')];
  buttons.forEach(b => b.disabled = true);
  try {await task(); await inventory();} catch (e) {$('status').textContent = e.message;}
  finally {buttons.forEach(b => b.disabled = false);}
}
$('save').addEventListener('click', () => action(async () => {await save(); $('status').textContent = 'Lagret. Banneret oppdateres i åpne faner.';}));
$('reset').addEventListener('click', () => action(async () => {
  await save();
  const r = await request({type: 'sweep', manual: true});
  $('status').textContent = `${r.deleted} cookies slettet; ${r.errors} feil. ${$('cleanup').checked ? '' : 'Slå på opprydding for å nullstille sporing.'}`;
}));
$('show').addEventListener('click', () => action(async () => {$('hideBanner').checked = false; await save(); $('status').textContent = 'Banneret er aktivert. Last inn Aftenposten på nytt.';}));
action(async () => {render(await request({type: 'settings'})); $('status').textContent = 'Klar · Gjelder bare Aftenposten';});
