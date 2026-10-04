/* StealthyNote / Chat feedback widget — vanilla JS, no dependencies.
 * Usage:
 *   <script src="https://your-domain/widget.js"
 *     data-username="amank736836"
 *     data-position="bottom-right"
  *     data-color="#4facfe"
 *     data-title="Send feedback"
 *     async defer></script>
 *
 * Supported data-* attributes:
 *   data-username (required), data-position (bottom-right|bottom-left|top-right|top-left|bottom-center),
 *   data-color, data-bg, data-text, data-title, data-subtitle, data-placeholder,
 *   data-button, data-bubble, data-shape (round|square|pill), data-size (sm|md|lg),
 *   data-auto-open (seconds, 0 = off), data-suggestions (1|0), data-api-base (override API origin)
 */
(function () {
  'use strict';

  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  function attr(name, fallback) {
    if (!currentScript || !currentScript.getAttribute) return fallback;
    var v = currentScript.getAttribute(name);
    return v === null || v === undefined || v === '' ? fallback : v;
  }

  var POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left', 'bottom-center'];

  function sanitizePosition(p) {
    return POSITIONS.indexOf(p) !== -1 ? p : 'bottom-right';
  }

  function sanitizeColor(c, fallback) {
    if (typeof c !== 'string') return fallback;
    var t = c.trim();
    if (/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(t)) return t;
    return fallback;
  }

  var scriptSrc = (currentScript && currentScript.src) || '';
  var scriptOrigin = '';
  try {
    scriptOrigin = new URL(scriptSrc).origin;
  } catch (e) {
    scriptOrigin = window.location.origin;
  }

  var cfg = {
    username: (attr('data-username', '') || '').trim().toLowerCase(),
    position: sanitizePosition((attr('data-position', 'bottom-right') || '').trim()),
    color: sanitizeColor(attr('data-color', '#4facfe'), '#4facfe'),
    bg: sanitizeColor(attr('data-bg', '#ffffff'), '#ffffff'),
    text: sanitizeColor(attr('data-text', '#1a1a2e'), '#1a1a2e'),
    title: attr('data-title', 'Send feedback') || 'Send feedback',
    subtitle: attr('data-subtitle', 'We read every message') || '',
    placeholder: attr('data-placeholder', 'Write your anonymous message here...') || '',
    button: attr('data-button', 'Send') || 'Send',
    bubble: attr('data-bubble', '💬') || '💬',
    shape: ['round', 'square', 'pill'].indexOf(attr('data-shape', 'round')) !== -1 ? attr('data-shape', 'round') : 'round',
    size: ['sm', 'md', 'lg'].indexOf(attr('data-size', 'md')) !== -1 ? attr('data-size', 'md') : 'md',
    autoOpen: Math.min(Math.max(parseInt(attr('data-auto-open', '0'), 10) || 0, 0), 120),
    suggestions: attr('data-suggestions', '1') !== '0',
    apiBase: (attr('data-api-base', '') || '').replace(/\/$/, '') || scriptOrigin,
  };

  if (!cfg.username) {
    console.warn('[feedback-widget] data-username is required.');
    return;
  }

  // Allow ?sn_* query overrides for quick testing without redeploying the snippet.
  try {
    var qs = new URLSearchParams(window.location.search);
    if (qs.get('sn_position') && POSITIONS.indexOf(qs.get('sn_position')) !== -1) cfg.position = qs.get('sn_position');
    if (qs.get('sn_color')) cfg.color = sanitizeColor(qs.get('sn_color'), cfg.color);
  } catch (e) {}

  // Fetch server-side defaults first so the dashboard panel controls the widget
  // even when the snippet only carries data-username + data-position.
  function fetchServerSettings() {
    var url = cfg.apiBase + '/api/v1/widget/settings?username=' + encodeURIComponent(cfg.username);
    return fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.success || !j.settings) return null;
        var s = j.settings;
        // snippet attributes win over server settings
        function pick(snippetVal, serverVal, isDefault) {
          return isDefault ? serverVal || snippetVal : snippetVal;
        }
        var defaults = { color: '#4facfe', bg: '#ffffff', text: '#1a1a2e', title: 'Send feedback' };
        if (currentScript && currentScript.getAttribute) {
          if (!currentScript.getAttribute('data-color') && s.themeColor) cfg.color = sanitizeColor(s.themeColor, cfg.color);
          if (!currentScript.getAttribute('data-bg') && s.backgroundColor) cfg.bg = sanitizeColor(s.backgroundColor, cfg.bg);
          if (!currentScript.getAttribute('data-text') && s.textColor) cfg.text = sanitizeColor(s.textColor, cfg.text);
          if (!currentScript.getAttribute('data-title') && s.title) cfg.title = s.title;
          if (!currentScript.getAttribute('data-subtitle') && s.subtitle !== undefined) cfg.subtitle = s.subtitle;
          if (!currentScript.getAttribute('data-placeholder') && s.placeholder) cfg.placeholder = s.placeholder;
          if (!currentScript.getAttribute('data-button') && s.buttonText) cfg.button = s.buttonText;
          if (!currentScript.getAttribute('data-bubble') && s.bubbleLabel) cfg.bubble = s.bubbleLabel;
          if (!currentScript.getAttribute('data-position') && s.position) cfg.position = sanitizePosition(s.position);
        } else {
          cfg.color = sanitizeColor(s.themeColor || cfg.color, cfg.color);
          if (s.title) cfg.title = s.title;
        }
        void pick; void defaults;
        return s;
      })
      .catch(function () { return null; });
  }

  var SIZES = { sm: { bubble: 48, panel: 300 }, md: { bubble: 56, panel: 340 }, lg: { bubble: 64, panel: 380 } };
  var dims = SIZES[cfg.size] || SIZES.md;

  function posStyle() {
    var o = '20px';
    switch (cfg.position) {
      case 'top-left': return 'top:' + o + ';left:' + o + ';';
      case 'top-right': return 'top:' + o + ';right:' + o + ';';
      case 'bottom-left': return 'bottom:' + o + ';left:' + o + ';';
      case 'bottom-center': return 'bottom:' + o + ';left:50%;transform:translateX(-50%);';
      default: return 'bottom:' + o + ';right:' + o + ';';
    }
  }

  function panelAnchor() {
    // panel opens on the opposite side of the screen edge
    if (cfg.position.indexOf('top-') === 0) return 'top:calc(100% + 12px);';
    return 'bottom:calc(100% + 12px);';
  }

  var host = document.createElement('div');
  host.id = 'sn-feedback-widget';
  host.style.cssText = 'position:fixed;z-index:2147483647;' + posStyle();
  var shadow = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;

  var bubbleRadius = cfg.shape === 'square' ? '14px' : cfg.shape === 'pill' ? '999px' : '50%';

  shadow.innerHTML =
    '<style>' +
    '.sn-bubble{width:' + dims.bubble + 'px;height:' + dims.bubble + 'px;border-radius:' + bubbleRadius + ';' +
    'background:' + cfg.color + ';color:#fff;border:0;cursor:pointer;font-size:22px;' +
    'box-shadow:0 8px 24px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;}' +
    '.sn-panel{position:absolute;' + panelAnchor() + (cfg.position === 'bottom-center' ? 'left:50%;transform:translateX(-50%);' : cfg.position.indexOf('-left') !== -1 ? 'left:0;' : 'right:0;') +
    'width:' + dims.panel + 'px;max-width:calc(100vw - 40px);background:' + cfg.bg + ';color:' + cfg.text + ';' +
    'border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.28);padding:16px;' +
    'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;display:none;box-sizing:border-box;}' +
    '.sn-panel.open{display:block;}' +
    '.sn-title{font-weight:700;font-size:15px;margin:0 0 2px;}' +
    '.sn-sub{font-size:12px;opacity:.65;margin:0 0 10px;}' +
    '.sn-input{width:100%;box-sizing:border-box;border-radius:10px;border:1px solid rgba(0,0,0,.15);' +
    'padding:9px 10px;font-size:13px;resize:vertical;min-height:70px;font-family:inherit;color:inherit;background:transparent;}' +
    '.sn-sugg{display:flex;flex-direction:column;gap:6px;margin:8px 0;}' +
    '.sn-sugg button{text-align:left;border:1px solid rgba(0,0,0,.12);background:transparent;color:inherit;' +
    'border-radius:8px;padding:6px 8px;font-size:12px;cursor:pointer;}' +
    '.sn-send{width:100%;border:0;border-radius:' + (cfg.shape === 'pill' ? '999px' : '10px') + ';' +
    'background:' + cfg.color + ';color:#fff;padding:10px;font-weight:700;cursor:pointer;margin-top:4px;}' +
    '.sn-send:disabled{opacity:.6;cursor:default;}' +
    '.sn-status{font-size:12px;margin-top:6px;min-height:16px;}' +
    '.sn-close{position:absolute;top:8px;right:10px;border:0;background:transparent;cursor:pointer;font-size:14px;opacity:.5;}' +
    '</style>' +
    '<button class="sn-bubble" aria-label="Open feedback">' + escapeHtml(cfg.bubble) + '</button>' +
    '<div class="sn-panel" role="dialog" aria-label="' + escapeHtml(cfg.title) + '">' +
    '<button class="sn-close" aria-label="Close">✕</button>' +
    '<p class="sn-title">' + escapeHtml(cfg.title) + '</p>' +
    (cfg.subtitle ? '<p class="sn-sub">' + escapeHtml(cfg.subtitle) + '</p>' : '') +
    '<textarea class="sn-input" rows="3" placeholder="' + escapeHtml(cfg.placeholder) + '"></textarea>' +
    '<div class="sn-sugg"></div>' +
    '<button class="sn-send">' + escapeHtml(cfg.button) + '</button>' +
    '<div class="sn-status"></div>' +
    '</div>';

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  document.body.appendChild(host);

  var bubble = shadow.querySelector('.sn-bubble');
  var panel = shadow.querySelector('.sn-panel');
  var input = shadow.querySelector('.sn-input');
  var send = shadow.querySelector('.sn-send');
  var status = shadow.querySelector('.sn-status');
  var suggBox = shadow.querySelector('.sn-sugg');
  var closeBtn = shadow.querySelector('.sn-close');

  function setStatus(msg, ok) {
    status.textContent = msg || '';
    status.style.color = ok ? 'green' : '#b00020';
  }

  function toggle(force) {
    var open = typeof force === 'boolean' ? force : !panel.classList.contains('open');
    panel.classList.toggle('open', open);
    if (open && cfg.suggestions) loadSuggestions();
  }

  bubble.addEventListener('click', function () { toggle(); });
  closeBtn.addEventListener('click', function () { toggle(false); });

  function loadSuggestions() {
    if (!cfg.suggestions) { suggBox.innerHTML = ''; return; }
    fetch(cfg.apiBase + '/api/v1/chat/questions?username=' + encodeURIComponent(cfg.username), { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var list = (j.suggestions || []).slice(0, 3);
        suggBox.innerHTML = '';
        list.forEach(function (q) {
          var b = document.createElement('button');
          b.type = 'button';
          b.textContent = q;
          b.addEventListener('click', function () { input.value = q; input.focus(); });
          suggBox.appendChild(b);
        });
      })
      .catch(function () {});
  }

  send.addEventListener('click', function () {
    var q = (input.value || '').trim();
    if (!q) { setStatus('Please write a message first.'); return; }
    send.disabled = true;
    setStatus('Sending…', true);
    fetch(cfg.apiBase + '/api/v1/chat/ask-and-record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cfg.username, question: q, content: q }),
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        var data = res.body || {};
        if (data.success) {
          setStatus(data.alreadyAnswered ? 'Already answered — thanks!' : 'Thanks! Your feedback was sent.', true);
          input.value = '';
          loadSuggestions();
          setTimeout(function () { toggle(false); setStatus(''); }, 2200);
        } else {
          setStatus(data.message || 'Failed to send. Try again.');
        }
      })
      .catch(function () { setStatus('Failed to send. Try again.'); })
      .finally(function () { send.disabled = false; });
  });

  // Apply server settings then optional auto-open
  fetchServerSettings().then(function () {
    if (cfg.autoOpen > 0) setTimeout(function () { toggle(true); }, cfg.autoOpen * 1000);
  });
  if (cfg.autoOpen > 0) {
    // fallback in case settings fetch is slow — open once
    setTimeout(function () {
      if (!panel.classList.contains('open')) toggle(true);
    }, cfg.autoOpen * 1000 + 1500);
  }
})();
