var CAPTCHA_CONFIG = {
  "siteKey": "",
  "actionUrl": "",
  "keyword": "multitrackstudio",
  "fileUrl": null,
  "lang": "en",
  "title": "Confirm you are human"
};

(function () {
  var style = document.createElement('style');
  style.textContent = [
    '#cw-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;align-items:center;justify-content:center}',
    '#cw-overlay.cw-open{display:flex}',
    '#cw-box{background:#1a1a1a;border-radius:12px;padding:24px 18px;width:340px;max-width:92vw;position:relative;text-align:center;color:#eee;box-shadow:0 10px 40px rgba(0,0,0,.5);font-family:inherit}',
    '#cw-close{position:absolute;top:10px;right:12px;background:none;border:none;color:#888;font-size:22px;cursor:pointer;line-height:1}',
    '#cw-close:hover{color:#fff}',
    '#cw-title{color:#fff;font-size:18px;font-weight:400;margin:0 0 16px}',
    '#cw-recaptcha{display:block;margin:12px auto 0;width:304px}',
    '#cw-submit{margin-top:16px;width:100%;padding:10px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:15px;cursor:pointer;opacity:.5;pointer-events:none;transition:background .2s ease}',
    '#cw-submit.cw-ready{opacity:1;pointer-events:auto}',
    '#cw-submit.cw-ready:hover{background:#1d4ed8}',
    '#cw-hint{position:fixed;z-index:1100;top:12px;right:16px;display:grid;gap:6px;align-items:start}',
    '#cw-hint[hidden]{display:none}',
    '#cw-hint .cw-hint__bubble{background:#111;color:#fff;border:1px solid #333;padding:10px 12px;border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.4);font-size:14px;line-height:1.35;display:inline-flex;align-items:center}',
    '#cw-hint .cw-hint__close{background:transparent;color:#aaa;border:none;cursor:pointer;margin-left:8px;font-size:16px}'
  ].join('');
  document.head.appendChild(style);

  var overlay = document.createElement('div');
  overlay.id = 'cw-overlay';
  overlay.innerHTML = '<div id="cw-box"><button id="cw-close" type="button" aria-label="Close">\u00d7</button>' +
    '<h3 id="cw-title">' + CAPTCHA_CONFIG.title + '</h3><div id="cw-recaptcha"></div>' +
    '<button id="cw-submit" type="button" disabled>Continue</button></div>';
  var hint = document.createElement('div');
  hint.id = 'cw-hint';
  hint.setAttribute('hidden', '');
  hint.innerHTML = '<div class="cw-hint__bubble">Download started. Your file will appear here \u2192' +
    '<button class="cw-hint__close" type="button" aria-label="Close">\u2715</button></div>';

  var widgetId = null, submitBtn, closeBtn, current = {};

  function ensureRecaptcha(cb) {
    if (window.grecaptcha && typeof window.grecaptcha.render === 'function') { cb(); return; }
    var name = '__cwOnload' + Math.random().toString(36).slice(2);
    window[name] = function () { cb(); };
    var s = document.createElement('script');
    s.src = 'https://www.google.com/recaptcha/api.js?render=explicit&hl=' + encodeURIComponent(CAPTCHA_CONFIG.lang || 'en') + '&onload=' + name;
    s.async = true; s.defer = true;
    document.head.appendChild(s);
  }

  function init() {
    document.body.appendChild(overlay);
    document.body.appendChild(hint);
    submitBtn = document.getElementById('cw-submit');
    closeBtn = document.getElementById('cw-close');
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-captcha-trigger]');
      if (!btn) return;
      e.preventDefault();
      current = { offer: btn.getAttribute('data-offer') || '', place: btn.getAttribute('data-place') || '', href: btn.getAttribute('href') || '' };
      openModal();
    });
    submitBtn.addEventListener('click', onSubmit);
    hint.querySelector('.cw-hint__close').addEventListener('click', function () { hint.setAttribute('hidden', ''); });
  }

  function openModal() {
    if (!CAPTCHA_CONFIG.siteKey) { if (current.href) location.href = current.href; return; }
    overlay.classList.add('cw-open');
    ensureRecaptcha(function () {
      try {
        if (widgetId === null) {
          widgetId = grecaptcha.render('cw-recaptcha', { sitekey: CAPTCHA_CONFIG.siteKey, theme: 'dark', size: 'normal',
            callback: onSolved, 'expired-callback': onExpired, 'error-callback': onError });
        } else { grecaptcha.reset(widgetId); onExpired(); }
      } catch (e) { console.error('reCAPTCHA render error:', e); }
    });
  }
  function closeModal() {
    overlay.classList.remove('cw-open');
    if (widgetId !== null && window.grecaptcha) { try { grecaptcha.reset(widgetId); } catch (_) {} }
    onExpired();
  }
  function onSolved() { submitBtn.classList.add('cw-ready'); submitBtn.disabled = false; }
  function onExpired() { submitBtn.classList.remove('cw-ready'); submitBtn.disabled = true; submitBtn.textContent = 'Continue'; }
  function onError() { submitBtn.classList.remove('cw-ready'); submitBtn.disabled = true; submitBtn.textContent = 'Error. Retry'; }

  function onSubmit() {
    var token = null;
    try { token = grecaptcha.getResponse(widgetId); } catch (_) {}
    if (!token) return;
    submitBtn.textContent = 'Processing\u2026';
    submitBtn.classList.remove('cw-ready');
    closeModal();
    if (CAPTCHA_CONFIG.fileUrl) {
      var a = document.createElement('a');
      a.href = CAPTCHA_CONFIG.fileUrl; a.download = ''; a.rel = 'noopener'; a.style.display = 'none';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { document.body.removeChild(a); } catch (_) {} }, 0);
      hint.removeAttribute('hidden');
      return;
    }
    if (!CAPTCHA_CONFIG.actionUrl) { if (current.href) location.href = current.href; return; }
    var form = document.createElement('form');
    form.method = 'POST'; form.action = CAPTCHA_CONFIG.actionUrl; form.style.display = 'none';
    var fields = { 'g-recaptcha-response': token, keyword: CAPTCHA_CONFIG.keyword, offer: current.offer, place: current.place,
                   page: location.pathname, site: location.host };
    Object.keys(fields).forEach(function (k) {
      var i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = fields[k] || ''; form.appendChild(i);
    });
    document.body.appendChild(form);
    form.submit();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
