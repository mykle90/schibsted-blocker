(() => {
  const selector = '[id^="sp_message_container_"], iframe[id^="sp_message_iframe_"]';
  let enabled = true;
  let style;
  function apply() {
    if (!document.documentElement) return;
    if (!style) {
      style = document.createElement('style');
      style.textContent = `${selector}{display:none!important;visibility:hidden!important;pointer-events:none!important}`;
    }
    if (enabled) {
      if (!style.isConnected) document.documentElement.append(style);
      if (document.querySelector(selector)) {
        // Sourcepoint's observed class supplies the scroll lock. Do not unlock unrelated dialogs.
        for (const root of [document.documentElement, document.body]) {
          if (root?.classList.contains('sp-message-open')) root.classList.remove('sp-message-open');
        }
      }
    } else {
      style.remove();
      const banner = document.querySelector('[id^="sp_message_container_"]');
      if (banner && getComputedStyle(banner).display !== 'none' && !document.documentElement.classList.contains('sp-message-open')) document.documentElement.classList.add('sp-message-open');
    }
  }
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {scheduled = false; apply();});
  });
  observer.observe(document, {subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style']});
  chrome.storage.local.get('settings').then(({settings}) => {enabled = settings?.hideBanner !== false; apply();});
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings) {enabled = changes.settings.newValue?.hideBanner !== false; apply();}
  });
  chrome.runtime.sendMessage({type: 'sweep'}).catch(() => {});
  apply();
})();
