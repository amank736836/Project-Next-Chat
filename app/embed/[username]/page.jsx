import connectDB from '../../../lib/server/db.js';
import User from '../../../lib/server/models/user.model.js';
import WidgetSettings from '../../../lib/server/models/widgetSettings.model.js';
import { sanitizeWidgetSettings, WIDGET_DEFAULTS } from '../../../lib/widgetConfig.js';

export async function generateMetadata({ params }) {
  const { username } = await params;
  return {
    title: `Send feedback to @${username}`,
    description: `Anonymous feedback widget for @${username}`,
  };
}

const esc = (v = '') =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export default async function EmbedPage({ params, searchParams }) {
  const { username: rawUsername } = await params;
  const sp = await searchParams;
  const username = (rawUsername || '').toLowerCase();

  let settings = { ...WIDGET_DEFAULTS };
  let userExists = true;

  try {
    await connectDB();
    const [user, doc] = await Promise.all([
      User.findOne({ username }).select('_id username').lean(),
      WidgetSettings.findOne({ username }).lean(),
    ]);
    if (!user) userExists = false;
    settings = sanitizeWidgetSettings({
      ...(doc || {}),
      position: typeof sp?.position === 'string' ? sp.position : doc?.position,
      themeColor: sp?.color || doc?.themeColor,
      backgroundColor: sp?.bg || doc?.backgroundColor,
      textColor: sp?.text || doc?.textColor,
      title: sp?.title || doc?.title,
      subtitle: sp?.subtitle || doc?.subtitle,
      placeholder: sp?.placeholder || doc?.placeholder,
      buttonText: sp?.button || doc?.buttonText,
      shape: sp?.shape || doc?.shape,
      size: sp?.size || doc?.size,
      showSuggestions: sp?.suggestions === '0' ? false : doc?.showSuggestions,
    });
  } catch {
    // fall back to query-param-only settings when DB is unreachable
    settings = sanitizeWidgetSettings({
      position: sp?.position,
      themeColor: sp?.color,
      backgroundColor: sp?.bg,
      textColor: sp?.text,
      title: sp?.title,
      subtitle: sp?.subtitle,
      placeholder: sp?.placeholder,
      buttonText: sp?.button,
      shape: sp?.shape,
      size: sp?.size,
      showSuggestions: sp?.suggestions !== '0',
    });
  }

  return (
    <div style={{ margin: 0, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f4f8', padding: 12, boxSizing: 'border-box' }}>
      <div
        id="sn-embed"
          data-username={username}
          data-color={settings.themeColor}
          data-bg={settings.backgroundColor}
          data-text={settings.textColor}
          data-title={settings.title}
          data-subtitle={settings.subtitle}
          data-placeholder={settings.placeholder}
          data-button={settings.buttonText}
          data-shape={settings.shape}
          data-size={settings.size}
          data-suggestions={settings.showSuggestions ? '1' : '0'}
          data-user-exists={userExists ? '1' : '0'}
          style={{
            fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
            background: settings.backgroundColor,
            color: settings.textColor,
            borderRadius: 16,
            padding: 20,
            maxWidth: 380,
            margin: '0 auto',
            boxSizing: 'border-box',
            border: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{esc(settings.title)}</div>
          <div style={{ opacity: 0.7, fontSize: 13, marginBottom: 12 }}>
            {esc(settings.subtitle)} · @{esc(username)}
          </div>
          {!userExists ? (
            <div style={{ fontSize: 14, opacity: 0.8 }}>User @{esc(username)} not found.</div>
          ) : (
            <form id="sn-form">
              <textarea
                id="sn-input"
                rows={4}
                placeholder={settings.placeholder}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: 10,
                  border: '1px solid rgba(0,0,0,0.15)',
                  padding: 10,
                  fontSize: 14,
                  resize: 'vertical',
                }}
              />
              <div id="sn-suggestions" style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '10px 0' }} />
              <button
                id="sn-send"
                type="submit"
                style={{
                  width: '100%',
                  border: 0,
                  borderRadius: settings.shape === 'pill' ? 999 : 10,
                  background: settings.themeColor,
                  color: '#fff',
                  padding: '10px 14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {esc(settings.buttonText)}
              </button>
              <div id="sn-status" style={{ fontSize: 13, marginTop: 8, minHeight: 18 }} />
            </form>
          )}
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var root=document.getElementById('sn-embed');if(!root)return;var username=root.dataset.username||'';var form=document.getElementById('sn-form');if(!form)return;var input=document.getElementById('sn-input');var status=document.getElementById('sn-status');var sugg=document.getElementById('sn-suggestions');var showSugg=root.dataset.suggestions!=='0';function setStatus(m,ok){status.textContent=m||'';status.style.color=ok?'green':'#b00020';}async function loadSugg(){if(!showSugg)return;try{var r=await fetch('/api/v1/chat/questions?username='+encodeURIComponent(username),{headers:{'Accept':'application/json'}});var j=await r.json();var list=(j.suggestions||[]).slice(0,3);sugg.innerHTML='';list.forEach(function(q){var b=document.createElement('button');b.type='button';b.textContent=q;b.style.cssText='text-align:left;border:1px solid rgba(0,0,0,0.12);background:transparent;border-radius:8px;padding:6px 8px;font-size:12px;cursor:pointer';b.onclick=function(){input.value=q;};sugg.appendChild(b);});}catch(e){}}form.addEventListener('submit',async function(e){e.preventDefault();var q=input.value.trim();if(!q){setStatus('Please write a message first.');return;}setStatus('Sending…',true);try{var res=await fetch('/api/v1/chat/ask-and-record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:username,question:q,content:q})});var data=await res.json();if(data.success){if(data.alreadyAnswered){setStatus('Already answered — thanks!',true);}else{setStatus('Thanks! Your feedback was sent.',true);}input.value='';loadSugg();}else{setStatus(data.message||'Failed to send. Try again.');}}catch(err){setStatus('Failed to send. Try again.');}});loadSugg();})();`,
          }}
        />
    </div>
  );
}
