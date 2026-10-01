export const defaults = {hideBanner: true, cleanup: true, rotateDaily: true, keepNames: []};
export function inScope(domain) {
  const host = domain.replace(/^\./, '').toLowerCase();
  return host === 'aftenposten.no' || host.endsWith('.aftenposten.no');
}
export function category(cookie, settings = defaults) {
  if (!inScope(cookie.domain)) return 'outside scope';
  const n = cookie.name;
  if (settings.keepNames.includes(n)) return 'protected';
  if (/^(id-jwt|SPID_NO|csrfToken|device_fingerprint|identity|nonce|schacc-browser-id|schacc-session|vgs_email|abx2)$/i.test(n)
    || /^(?:__Host-|__Secure-)?(?:session|auth|token)/i.test(n)
    || /^(?:_sp_|sp_|consent|euconsent|IABTCF|usprivacy)/i.test(n)) return 'protected';
  if (/^(?:_pulse2data|__pulseEnvironmentId)$/i.test(n)) return 'daily identifier';
  if (/^(?:_ga(?:_|$)|_gid$|_gat(?:_|$)|_gcl_|_fbp$|_fbc$|_hj|__utm[a-z]$|_scid(?:_|$)|cto_bundle$|cto_bidid$|uid$|anj$|uuid2$)/i.test(n)) return 'tracking';
  return 'unknown — kept';
}
export function removalDetails(cookie) {
  return {url: `https://${cookie.domain.replace(/^\./, '')}${cookie.path}`,
    name: cookie.name, storeId: cookie.storeId,
    ...(cookie.partitionKey ? {partitionKey: cookie.partitionKey} : {})};
}
