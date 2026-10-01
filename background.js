import {defaults, category, removalDetails} from './policy.js';
const settings = async () => ({...defaults, ...((await chrome.storage.local.get('settings')).settings || {})});
let queue = Promise.resolve();
function serialized(task) {const job = queue.then(task); queue = job.catch(() => {}); return job;}
async function cookies() {
  // An empty partition key selects both partitioned and unpartitioned cookies.
  return chrome.cookies.getAll({domain: 'aftenposten.no', partitionKey: {}});
}
async function remove(cookie) {
  return Boolean(await chrome.cookies.remove(removalDetails(cookie)));
}
async function sweep(manual = false) {
  const s = await settings();
  if (!s.cleanup) return {deleted: 0, errors: 0};
  const {lastRotation = 0} = await chrome.storage.local.get('lastRotation');
  const rotate = manual || (s.rotateDaily && Date.now() - lastRotation >= 86400000);
  let deleted = 0, errors = 0;
  for (const c of await cookies()) {
    const kind = category(c, s);
    if (kind !== 'tracking' && !(rotate && kind === 'daily identifier')) continue;
    try {if (await remove(c)) deleted++;} catch {errors++;}
  }
  const result = {deleted, errors, time: Date.now()};
  await chrome.storage.local.set({lastSweep: result, ...(rotate && !errors ? {lastRotation: Date.now()} : {})});
  return result;
}
async function initialize() {
  if (!await chrome.alarms.get('cleanup')) await chrome.alarms.create('cleanup', {periodInMinutes: 60});
  await sweep();
}
chrome.runtime.onInstalled.addListener(() => {serialized(initialize).catch(console.error);});
chrome.runtime.onStartup.addListener(() => {serialized(initialize).catch(console.error);});
chrome.alarms.onAlarm.addListener(a => {if (a.name === 'cleanup') serialized(() => sweep()).catch(console.error);});
chrome.cookies.onChanged.addListener(({removed, cookie}) => {
  if (removed) return;
  serialized(async () => {const s = await settings(); if (s.cleanup && category(cookie, s) === 'tracking') await remove(cookie);}).catch(console.error);
});
chrome.runtime.onMessage.addListener((m, sender, reply) => {
  // Content scripts may request a sweep; settings and inventory are extension-page-only.
  const page = !sender.tab && sender.url?.startsWith(chrome.runtime.getURL(''));
  const content = sender.tab && /^https:\/\/(?:www\.)?aftenposten\.no\//.test(sender.url || '');
  if (!page && !(content && m.type === 'sweep')) return;
  serialized(async () => {
    if (m.type === 'settings') return settings();
    if (m.type === 'save') {
      const s = {hideBanner: Boolean(m.settings.hideBanner), cleanup: Boolean(m.settings.cleanup),
        rotateDaily: Boolean(m.settings.rotateDaily), keepNames: m.settings.keepNames.filter(n => typeof n === 'string').slice(0, 200)};
      await chrome.storage.local.set({settings: s}); await sweep(); return s;
    }
    if (m.type === 'sweep') return sweep(Boolean(page && m.manual));
    if (m.type === 'inventory') {
      const s = await settings();
      return {items: (await cookies()).map(c => ({name: c.name, domain: c.domain, path: c.path, category: category(c, s)})),
        ...(await chrome.storage.local.get(['lastSweep', 'lastRotation']))};
    }
    throw new Error('Unknown request');
  }).then(reply, error => reply({error: error.message}));
  return true;
});
// Recheck alarm persistence whenever the service worker wakes.
serialized(initialize).catch(console.error);
