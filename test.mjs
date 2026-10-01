import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const policyURI = 'data:text/javascript;base64,' + Buffer.from(fs.readFileSync(new URL('policy.js', import.meta.url))).toString('base64');
const {defaults, inScope, category, removalDetails} = await import(policyURI);
const c = (name, domain = '.aftenposten.no', extra = {}) => ({name, domain, path: '/', secure: true, storeId: '0', value: 'SECRET', ...extra});
assert(inScope('.aftenposten.no')); assert(inScope('id.aftenposten.no'));
for (const d of ['evil-aftenposten.no', 'aftenposten.no.evil.com', '.schibsted.no']) assert(!inScope(d));
for (const name of ['id-jwt', 'schacc-session', 'csrfToken', 'nonce', 'abx2', '_sp_id', 'consentUUID', 'euconsent-v2', 'IABTCF_TCString']) assert.equal(category(c(name)), 'protected');
for (const name of ['_ga', '_ga_ABCD', '_gid', '_fbp', '_hjSessionUser_123', 'uuid2']) assert.equal(category(c(name)), 'tracking');
assert.equal(category(c('new-cookie')), 'unknown — kept');
assert.equal(category(c('_ga', '.schibsted.no')), 'outside scope');
assert.equal(category(c('_ga'), {...defaults, keepNames: ['_ga']}), 'protected');
const partitionKey = {topLevelSite: 'https://aftenposten.no', hasCrossSiteAncestor: true};
assert.deepEqual(removalDetails(c('_ga', 'www.aftenposten.no', {path: '/news', secure: false, storeId: '1', partitionKey})), {url: 'https://www.aftenposten.no/news', name: '_ga', storeId: '1', partitionKey});
let jar = [c('_ga'), c('id-jwt'), c('consentUUID'), c('unrecognized'), c('_pulse2data'), c('_gid', 'www.aftenposten.no', {partitionKey})];
const data = {}; const events = {};
const event = name => ({addListener(fn) {events[name] = fn;}});
let alarm;
globalThis.chrome = {
  storage: {local: {async get(keys) {const out = {}; for (const k of typeof keys === 'string' ? [keys] : keys) if (k in data) out[k] = data[k]; return out;}, async set(value) {Object.assign(data, value);}}},
  alarms: {async get() {return alarm;}, async create(name, options) {alarm = {name, ...options};}, onAlarm: event('alarm')},
  cookies: {async getAll(query) {assert.deepEqual(query, {domain: 'aftenposten.no', partitionKey: {}}); return [...jar];}, async remove(details) {const i = jar.findIndex(x => x.name === details.name && x.storeId === details.storeId); if (i < 0) return undefined; jar.splice(i, 1); return details;}, onChanged: event('changed')},
  runtime: {getURL: () => 'chrome-extension://test/', onInstalled: event('installed'), onStartup: event('startup'), onMessage: event('message')}
};
const worker = fs.readFileSync(new URL('background.js', import.meta.url), 'utf8').replace("'./policy.js'", JSON.stringify(policyURI));
await import('data:text/javascript;base64,' + Buffer.from(worker).toString('base64'));
const sender = {url: 'chrome-extension://test/popup.html'};
const message = m => new Promise(resolve => {assert.equal(events.message(m, sender, resolve), true);});
await message({type: 'settings'}); // Wait behind worker initialization.
assert.deepEqual(jar.map(x => x.name), ['id-jwt', 'consentUUID', 'unrecognized']);
assert.equal(alarm.periodInMinutes, 60);
jar.push(c('_pulse2data'));
await message({type: 'sweep'});
assert(jar.some(x => x.name === '_pulse2data')); // Daily interval not yet elapsed.
data.lastRotation = Date.now() - 86400001;
await message({type: 'sweep'});
assert(!jar.some(x => x.name === '_pulse2data'));
await message({type: 'save', settings: {...defaults, cleanup: false}});
jar.push(c('_ga'));
assert.equal((await message({type: 'sweep', manual: true})).deleted, 0);
assert(jar.some(x => x.name === '_ga'));
await message({type: 'save', settings: {...defaults, keepNames: ['_ga']}});
assert(jar.some(x => x.name === '_ga'));
const inv = await message({type: 'inventory'});
assert(!JSON.stringify(inv).includes('SECRET'));
jar.push(c('_fbp'));
events.changed({removed: false, cookie: jar.at(-1)});
await message({type: 'settings'});
assert(!jar.some(x => x.name === '_fbp'));
assert.equal(events.message({type: 'inventory'}, {tab: {}, url: 'https://www.aftenposten.no/'}, () => {}), undefined);

// Observed Sourcepoint markup represented by a small DOM fixture.
let observer, storageChanged, styles = [], removedClasses = 0;
function root() {const classes = new Set(['sp-message-open', 'unrelated-dialog']); return {classList: {contains: n => classes.has(n), remove(n) {removedClasses++; classes.delete(n);}, add(n) {classes.add(n);}}, append(s) {s.isConnected = true; styles.push(s);}};}
const html = root(), body = root();
const banner = {id: 'sp_message_container_1489174'};
const document = {documentElement: html, body, querySelector: () => banner,
  createElement: () => ({isConnected: false, remove() {this.isConnected = false;}})};
vm.runInNewContext(fs.readFileSync(new URL('content.js', import.meta.url), 'utf8'), {
  document, MutationObserver: class {constructor(fn) {observer = fn;} observe() {}}, queueMicrotask,
  getComputedStyle: () => ({display: 'block'}),
  chrome: {storage: {local: {async get() {return {settings: defaults};}}, onChanged: {addListener(fn) {storageChanged = fn;}}}, runtime: {sendMessage: async () => ({})}}
});
await new Promise(resolve => setImmediate(resolve));
assert.equal(styles.length, 1);
assert(styles[0].textContent.includes('sp_message_container_'));
assert(!html.classList.contains('sp-message-open'));
assert(html.classList.contains('unrelated-dialog'));
for (let i = 0; i < 5; i++) {observer(); await new Promise(resolve => setImmediate(resolve));}
assert.equal(removedClasses, 2, 'Repeated observer calls must not repeatedly mutate root classes');
storageChanged({settings: {newValue: {hideBanner: false}}}, 'local');
assert(!styles[0].isConnected); assert(html.classList.contains('sp-message-open'));
storageChanged({settings: {newValue: {hideBanner: true}}}, 'local');
assert(styles[0].isConnected); assert(!html.classList.contains('sp-message-open'));
const manifest = JSON.parse(fs.readFileSync(new URL('manifest.json', import.meta.url)));
for (const path of [manifest.background.service_worker, manifest.action.default_popup, ...manifest.content_scripts.flatMap(x => x.js)]) assert(fs.existsSync(new URL(path, import.meta.url)));
assert.deepEqual(manifest.host_permissions, ['https://*.aftenposten.no/*']);
console.log('PASS: policy, worker lifecycle, partition-aware deletion, daily rotation, disabled cleanup, inventory privacy, banner hiding/restoration, bounded mutations, manifest references.');
