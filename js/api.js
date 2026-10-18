/**
 * ===== TRA-FAI VOTING SYSTEM — API CLIENT =====
 * Dynamic fetch wrapper that connects to Python/Flask backend on port 5000.
 * Supports:
 *   - Dual-host fallback (127.0.0.1 & localhost) for Windows IPv4/IPv6
 *   - Automatic retry with exponential backoff on network failure
 *   - Auto-reconnect: polls silently in the background and restores when backend returns
 *   - Offline login fallback using locally cached credentials
 *   - User-friendly banner (suppressed on login page)
 */

const API_HOSTS = (() => {
  const hosts = [];
  if (typeof window !== 'undefined' && window.location && window.location.origin && !window.location.origin.startsWith('file:')) {
    hosts.push(window.location.origin);
  }
  hosts.push('http://127.0.0.1:5000', 'http://localhost:5000');
  return [...new Set(hosts)];
})();
const API_TIMEOUT_MS    = 10000; // max wait for a normal API request
const HEALTH_TIMEOUT_MS = 2500;  // max wait for a health ping
let _activeBase = API_HOSTS[0] + '/api';

/* ── fetch() with a hard timeout so requests can never hang forever ── */
async function _fetchWithTimeout(url, opts = {}, ms = API_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}
let _backendOnline = null;       // null = unknown, true = up, false = down
let _reconnectTimer = null;
let _bannerEl = null;

/* ── Offline Credential Cache ──────────────────────────────────
   Stores a simple hash of username+password after every successful
   backend login so users can still sign in when the server is down.
   Key: 'trafai_cred_cache'  Value: JSON array of {key, session}
──────────────────────────────────────────────────────────────── */
const OfflineAuth = {
  CACHE_KEY: 'trafai_cred_cache',

  // Simple djb2 hash — NOT cryptographic, just a local cache key
  _hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
    return (h >>> 0).toString(36);
  },

  // Save credentials after a successful backend login
  save(username, password, session) {
    try {
      const key = this._hash(username.toLowerCase() + '|' + password);
      const cache = this._load();
      // Remove old entry for same user, then prepend new one
      const filtered = cache.filter(e => e.u !== username.toLowerCase());
      filtered.unshift({ u: username.toLowerCase(), key, session });
      // Keep only last 10 users
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(filtered.slice(0, 10)));
    } catch (_) {}
  },

  // Try to match credentials offline; returns session or null
  verify(username, password) {
    try {
      const key = this._hash(username.toLowerCase() + '|' + password);
      const cache = this._load();
      const entry = cache.find(e => e.u === username.toLowerCase() && e.key === key);
      return entry ? entry.session : null;
    } catch (_) { return null; }
  },

  _load() {
    try { return JSON.parse(localStorage.getItem(this.CACHE_KEY) || '[]'); } catch (_) { return []; }
  }
};

window.OfflineAuth = OfflineAuth;

/* ── Is this the login page? (suppress full-page banner there) ── */
function _isLoginPage() {
  return window.location.pathname.toLowerCase().includes('login');
}

/* ── Offline banner UI ── */
function _showOfflineBanner() {
  // Don't show the banner on the login page — login handles it inline
  if (_isLoginPage()) return;
  if (_bannerEl && document.body.contains(_bannerEl)) return;

  _bannerEl = document.createElement('div');
  _bannerEl.id = 'api-offline-banner';
  _bannerEl.innerHTML = `
    <span style="font-size:1.15rem;">⚡</span>
    <div style="flex:1">
      <strong>Connecting to server…</strong>
      <span style="opacity:0.85;"> The backend is starting up. Pages will refresh automatically when ready.</span>
    </div>
    <button id="api-retry-now" style="background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.4);color:#fff;border-radius:6px;padding:3px 12px;cursor:pointer;font-size:0.82rem;">Retry now</button>
    <div id="api-retry-dots" style="letter-spacing:3px;">●○○</div>`;

  Object.assign(_bannerEl.style, {
    position: 'fixed', bottom: '0', left: '0', right: '0', zIndex: '999999',
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.75rem 1.25rem',
    background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
    color: '#fff', fontFamily: 'Inter,system-ui,sans-serif', fontSize: '0.88rem',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
    animation: 'slideUpBanner 0.35s ease'
  });

  if (!document.getElementById('api-banner-style')) {
    const s = document.createElement('style');
    s.id = 'api-banner-style';
    s.textContent = `
      @keyframes slideUpBanner { from { transform:translateY(100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
      @keyframes slideDownBanner { from { transform:translateY(0); opacity:1; } to { transform:translateY(100%); opacity:0; } }
    `;
    document.head.appendChild(s);
  }

  document.body.appendChild(_bannerEl);

  // Retry now button
  document.getElementById('api-retry-now')?.addEventListener('click', async () => {
    const ok = await ApiClient.checkHealth();
    if (ok) { _backendOnline = true; _hideOfflineBanner(); }
  });

  // Animated dots
  const dots = ['●○○','○●○','○○●'];
  let di = 0;
  _bannerEl._dotsInterval = setInterval(() => {
    const el = document.getElementById('api-retry-dots');
    if (el) el.textContent = dots[di++ % dots.length];
  }, 600);
}

function _hideOfflineBanner() {
  if (!_bannerEl || !document.body.contains(_bannerEl)) return;
  clearInterval(_bannerEl._dotsInterval);
  _bannerEl.style.animation = 'slideDownBanner 0.3s ease forwards';
  setTimeout(() => { _bannerEl && _bannerEl.remove(); _bannerEl = null; }, 310);
}

/* ── Background reconnect polling ── */
function _startReconnectPolling() {
  if (_reconnectTimer) return;
  _reconnectTimer = setInterval(async () => {
    const ok = await ApiClient.checkHealth();
    if (ok) {
      _backendOnline = true;
      clearInterval(_reconnectTimer);
      _reconnectTimer = null;
      _hideOfflineBanner();

      // Show green toast if Toast is available
      if (typeof Toast !== 'undefined') {
        Toast.show('✅ Backend server reconnected!', 'success', 4000);
      }
    }
  }, 6000); // retry every 6 seconds
}

/* ── Core API fetch with retry + fallback ── */
const ApiClient = {

  getToken()     { return localStorage.getItem('trafai_token') || localStorage.getItem('tracfai_token'); },
  setToken(t)    { localStorage.setItem('trafai_token', t); localStorage.setItem('tracfai_token', t); },
  clearToken()   { localStorage.removeItem('trafai_token'); localStorage.removeItem('tracfai_token'); },

  async _fetch(method, path, body = null, isFormData = false, retries = 2) {
    const token = this.getToken();

    const buildOpts = () => {
      const opts = { method, headers: {} };
      if (token) opts.headers['Authorization'] = `Bearer ${token}`;
      if (body !== null) {
        if (isFormData) {
          opts.body = body;
        } else {
          opts.headers['Content-Type'] = 'application/json';
          opts.body = JSON.stringify(body);
        }
      }
      return opts;
    };

    // Build the list: try last-known-working base first, then all others
    const allBases = [_activeBase, ...API_HOSTS.map(h => h + '/api').filter(b => b !== _activeBase)];

    for (let attempt = 0; attempt <= retries; attempt++) {
      for (const base of allBases) {
        try {
          const res = await _fetchWithTimeout(`${base}${path}`, buildOpts());
          let data = {};
          try { data = await res.json(); } catch (_) {}

          if (!res.ok) {
            const err = new Error(data.error || `HTTP ${res.status}`);
            err.status = res.status;
            err.data = data;
            throw err;
          }

          // ── Success ──
          _activeBase = base;
          if (_backendOnline === false) {
            _backendOnline = true;
            _hideOfflineBanner();
          }
          _backendOnline = true;
          return data;

        } catch (err) {
          // HTTP error (4xx/5xx) — propagate immediately, don't retry
          if (err.status) throw err;
          // Timed-out write request — don't retry (could double-submit)
          if (err.name === 'AbortError' && method !== 'GET') {
            const te = new Error('The server took too long to respond. Please try again.');
            te.isTimeout = true;
            throw te;
          }
          // Network error — try next base / retry
        }
      }

      // Wait before next retry attempt (exponential: 500ms, 1000ms)
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }

    // All retries exhausted — backend is offline
    _backendOnline = false;
    _showOfflineBanner();
    _startReconnectPolling();

    const err = new Error('Backend server is offline. Reconnecting automatically…');
    err.isOffline = true;
    throw err;
  },

  async get(path)                  { return this._fetch('GET',    path); },
  async post(path, body)           { return this._fetch('POST',   path, body); },
  async put(path, body)            { return this._fetch('PUT',    path, body); },
  async del(path)                  { return this._fetch('DELETE', path); },
  async upload(path, formData)     { return this._fetch('POST',   path, formData, true); },
  async uploadPut(path, formData)  { return this._fetch('PUT',    path, formData, true); },

  async checkHealth() {
    for (const host of API_HOSTS) {
      try {
        const res = await _fetchWithTimeout(`${host}/api/health`, { method: 'GET', cache: 'no-store' }, HEALTH_TIMEOUT_MS);
        if (res.ok) {
          _activeBase = `${host}/api`;
          return true;
        }
      } catch (_) {}
    }
    return false;
  },

  /** Call on page load to silently check backend and show banner if down */
  async initCheck() {
    const ok = await this.checkHealth();
    if (!ok) {
      _backendOnline = false;
      _showOfflineBanner();
      _startReconnectPolling();
    } else {
      _backendOnline = true;
    }
    return ok;
  }
};

window.ApiClient = ApiClient;

// ── Auto-check on every page load (non-blocking) ──
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ApiClient.initCheck());
} else {
  ApiClient.initCheck();
}
