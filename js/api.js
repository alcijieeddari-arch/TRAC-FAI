/**
 * ===== TRAC-FAI VOTING SYSTEM — API CLIENT =====
 * Dynamic fetch wrapper that connects to Python/Flask backend on port 5000.
 * Supports dual-host resolution (127.0.0.1 & localhost) for Windows IPv4/IPv6 compatibility.
 */

let CURRENT_API_BASE = 'http://127.0.0.1:5000/api';
const CANDIDATE_BASES = ['http://127.0.0.1:5000/api', 'http://localhost:5000/api'];

const ApiClient = {
  // ── Token management ──
  getToken() { return localStorage.getItem('tracfai_token'); },
  setToken(t) { localStorage.setItem('tracfai_token', t); },
  clearToken() { localStorage.removeItem('tracfai_token'); },

  // ── Generic fetch wrapper with fallback ──
  async _fetch(method, path, body = null, isFormData = false) {
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

    let lastError = null;

    // Try current base first, then alternate if network error occurs
    const basesToTry = [CURRENT_API_BASE, ...CANDIDATE_BASES.filter(b => b !== CURRENT_API_BASE)];

    for (const base of basesToTry) {
      try {
        const res = await fetch(`${base}${path}`, buildOpts());
        let data = {};
        try { data = await res.json(); } catch (_) {}

        if (!res.ok) {
          const err = new Error(data.error || `HTTP ${res.status}`);
          err.status = res.status;
          err.data = data;
          throw err;
        }

        // Remember working base
        CURRENT_API_BASE = base;
        return data;
      } catch (err) {
        // If it's a 4xx/5xx HTTP error response, propagate it directly
        if (err.status) throw err;
        lastError = err;
      }
    }

    throw new Error('Cannot connect to the server. Make sure the Python backend is running on port 5000.');
  },

  async get(path) { return this._fetch('GET', path); },
  async post(path, body) { return this._fetch('POST', path, body); },
  async put(path, body) { return this._fetch('PUT', path, body); },
  async del(path) { return this._fetch('DELETE', path); },
  async upload(path, formData) { return this._fetch('POST', path, formData, true); },
  async uploadPut(path, formData) { return this._fetch('PUT', path, formData, true); },
};

window.ApiClient = ApiClient;
