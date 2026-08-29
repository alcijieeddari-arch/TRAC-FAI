/**
 * ===== TRAC-FAI VOTING SYSTEM — SHARED JS =====
 * Handles: Theme, Toast, Modal, Auth Session, Utility Functions
 */

// ===== USER PREFERENCES & ACCESSIBILITY MANAGER =====
const PreferenceManager = {
  THEME_KEY: 'tracfai_theme',
  FONT_SIZE_KEY: 'tracfai_fontsize',
  DENSITY_KEY: 'tracfai_density',
  MOTION_KEY: 'tracfai_motion',

  init() {
    // 1. Theme (light, dark, contrast)
    const savedTheme = localStorage.getItem(this.THEME_KEY) || localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme);

    // 2. Font Size (normal, medium, large, xlarge)
    const savedFontSize = localStorage.getItem(this.FONT_SIZE_KEY) || 'normal';
    this.setFontSize(savedFontSize);

    // 3. Display Density (comfortable, compact)
    const savedDensity = localStorage.getItem(this.DENSITY_KEY) || 'comfortable';
    this.setDensity(savedDensity);

    // 4. Motion (normal, reduced)
    const savedMotion = localStorage.getItem(this.MOTION_KEY) || 'normal';
    this.setMotion(savedMotion);

    // Hook up theme toggle buttons across the page
    document.querySelectorAll('#themeToggle, .btn-theme-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (e.shiftKey || e.altKey) {
          this.openModal();
        } else {
          this.cycleTheme();
        }
      });
    });

    // Hook up preference settings buttons
    document.querySelectorAll('[data-open-prefs], #prefToggle, .btn-pref-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openModal();
      });
    });
  },

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.THEME_KEY, theme);
    localStorage.setItem('theme', theme);
    this.updateThemeIcons(theme);
  },

  cycleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const sequence = ['light', 'dark', 'contrast'];
    const nextIndex = (sequence.indexOf(current) + 1) % sequence.length;
    const nextTheme = sequence[nextIndex];
    this.setTheme(nextTheme);
    Toast.show(`Theme set to ${nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1)}`, 'info', 2000);
  },

  updateThemeIcons(theme) {
    document.querySelectorAll('#themeToggle, .btn-theme-toggle').forEach(btn => {
      const labels = { light: 'Switch to Dark Mode', dark: 'Switch to High Contrast Mode', contrast: 'Switch to Light Mode' };
      btn.title = labels[theme] || 'Toggle Theme';
    });
  },

  setFontSize(size) {
    document.documentElement.setAttribute('data-font-size', size);
    localStorage.setItem(this.FONT_SIZE_KEY, size);
  },

  setDensity(density) {
    document.documentElement.setAttribute('data-density', density);
    localStorage.setItem(this.DENSITY_KEY, density);
  },

  setMotion(motion) {
    document.documentElement.setAttribute('data-motion', motion);
    localStorage.setItem(this.MOTION_KEY, motion);
  },

  openModal() {
    let modal = document.getElementById('preferenceModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.id = 'preferenceModal';
      modal.innerHTML = `
        <div class="modal" style="max-width: 480px;">
          <div class="modal-header">
            <h3>🎛️ Display & Accessibility Settings</h3>
            <button class="modal-close" data-modal-close>✕</button>
          </div>
          <div class="modal-body" style="display:flex; flex-direction:column; gap:1.25rem; padding:1.25rem 0;">
            <!-- Theme Selection -->
            <div class="pref-group">
              <label style="font-weight:600; font-size:0.9rem; margin-bottom:0.5rem; display:block; color:var(--text-primary);">🎨 Color Theme</label>
              <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:0.5rem;">
                <button type="button" class="pref-btn pref-theme-btn" data-val="light" style="padding:0.6rem; border:1.5px solid var(--border); border-radius:var(--radius-md); background:var(--bg-card); color:var(--text-primary); cursor:pointer; font-weight:500;">☀️ Light</button>
                <button type="button" class="pref-btn pref-theme-btn" data-val="dark" style="padding:0.6rem; border:1.5px solid var(--border); border-radius:var(--radius-md); background:var(--bg-card); color:var(--text-primary); cursor:pointer; font-weight:500;">🌙 Dark</button>
                <button type="button" class="pref-btn pref-theme-btn" data-val="contrast" style="padding:0.6rem; border:1.5px solid var(--border); border-radius:var(--radius-md); background:var(--bg-card); color:var(--text-primary); cursor:pointer; font-weight:500;">👁️ Contrast</button>
              </div>
            </div>

            <!-- Font Size -->
            <div class="pref-group">
              <label style="font-weight:600; font-size:0.9rem; margin-bottom:0.5rem; display:block; color:var(--text-primary);">🔍 Text / Font Size</label>
              <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:0.4rem;">
                <button type="button" class="pref-btn pref-font-btn" data-val="normal" style="padding:0.5rem; border:1.5px solid var(--border); border-radius:var(--radius-md); background:var(--bg-card); color:var(--text-primary); cursor:pointer; font-size:0.82rem;">Default</button>
                <button type="button" class="pref-btn pref-font-btn" data-val="medium" style="padding:0.5rem; border:1.5px solid var(--border); border-radius:var(--radius-md); background:var(--bg-card); color:var(--text-primary); cursor:pointer; font-size:0.9rem;">Medium</button>
                <button type="button" class="pref-btn pref-font-btn" data-val="large" style="padding:0.5rem; border:1.5px solid var(--border); border-radius:var(--radius-md); background:var(--bg-card); color:var(--text-primary); cursor:pointer; font-size:1rem;">Large</button>
                <button type="button" class="pref-btn pref-font-btn" data-val="xlarge" style="padding:0.5rem; border:1.5px solid var(--border); border-radius:var(--radius-md); background:var(--bg-card); color:var(--text-primary); cursor:pointer; font-size:1.05rem;">X-Large</button>
              </div>
            </div>

            <!-- Display Density -->
            <div class="pref-group">
              <label style="font-weight:600; font-size:0.9rem; margin-bottom:0.5rem; display:block; color:var(--text-primary);">📐 Interface Spacing / Density</label>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem;">
                <button type="button" class="pref-btn pref-density-btn" data-val="comfortable" style="padding:0.6rem; border:1.5px solid var(--border); border-radius:var(--radius-md); background:var(--bg-card); color:var(--text-primary); cursor:pointer;">🛋️ Comfortable</button>
                <button type="button" class="pref-btn pref-density-btn" data-val="compact" style="padding:0.6rem; border:1.5px solid var(--border); border-radius:var(--radius-md); background:var(--bg-card); color:var(--text-primary); cursor:pointer;">⚡ Compact</button>
              </div>
            </div>

            <!-- Animation Motion -->
            <div class="pref-group">
              <label style="font-weight:600; font-size:0.9rem; margin-bottom:0.5rem; display:block; color:var(--text-primary);">✨ Motion & Animations</label>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem;">
                <button type="button" class="pref-btn pref-motion-btn" data-val="normal" style="padding:0.6rem; border:1.5px solid var(--border); border-radius:var(--radius-md); background:var(--bg-card); color:var(--text-primary); cursor:pointer;">🎬 Normal</button>
                <button type="button" class="pref-btn pref-motion-btn" data-val="reduced" style="padding:0.6rem; border:1.5px solid var(--border); border-radius:var(--radius-md); background:var(--bg-card); color:var(--text-primary); cursor:pointer;">⏸️ Reduced Motion</button>
              </div>
            </div>
          </div>
          <div style="margin-top:1rem; text-align:right;">
            <button class="btn-primary" data-modal-close style="width:100%;">Save Preferences</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelectorAll('.pref-theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.setTheme(btn.dataset.val);
          this.updateModalState(modal);
        });
      });
      modal.querySelectorAll('.pref-font-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.setFontSize(btn.dataset.val);
          this.updateModalState(modal);
        });
      });
      modal.querySelectorAll('.pref-density-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.setDensity(btn.dataset.val);
          this.updateModalState(modal);
        });
      });
      modal.querySelectorAll('.pref-motion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.setMotion(btn.dataset.val);
          this.updateModalState(modal);
        });
      });

      modal.querySelectorAll('[data-modal-close]').forEach(b => {
        b.addEventListener('click', () => Modal.close('preferenceModal'));
      });
    }

    this.updateModalState(modal);
    Modal.open('preferenceModal');
  },

  updateModalState(modal) {
    const curTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const curFont = document.documentElement.getAttribute('data-font-size') || 'normal';
    const curDens = document.documentElement.getAttribute('data-density') || 'comfortable';
    const curMot = document.documentElement.getAttribute('data-motion') || 'normal';

    const highlight = (selector, val) => {
      modal.querySelectorAll(selector).forEach(b => {
        const isMatch = b.dataset.val === val;
        b.style.borderColor = isMatch ? 'var(--primary)' : 'var(--border)';
        b.style.background = isMatch ? 'var(--bg-input)' : 'var(--bg-card)';
        b.style.fontWeight = isMatch ? '700' : '500';
      });
    };

    highlight('.pref-theme-btn', curTheme);
    highlight('.pref-font-btn', curFont);
    highlight('.pref-density-btn', curDens);
    highlight('.pref-motion-btn', curMot);
  }
};

const ThemeManager = PreferenceManager;

// ===== TOAST NOTIFICATIONS =====
const Toast = {
  container: null,
  init() {
    this.container = document.getElementById('toastContainer');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.id = 'toastContainer';
      document.body.appendChild(this.container);
    }
  },
  show(message, type = 'info', duration = 3500) {
    if (!this.container) this.init();
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
    `;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

// ===== MODAL MANAGER =====
const Modal = {
  open(id) {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },
  close(id) {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  },
  init() {
    document.querySelectorAll('[data-modal-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.closest('.modal-overlay')?.id;
        if (modalId) this.close(modalId);
      });
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) this.close(overlay.id);
      });
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => {
          this.close(m.id);
        });
      }
    });
  }
};

// ===== AUTH SESSION (Backend-connected) =====
const Auth = {
  SESSION_KEY: 'tracfai_session',
  INACTIVITY_LIMIT: 30 * 60 * 1000,

  // ── Password strength checker (still client-side for UX) ──
  checkPasswordStrength(pw) {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 2) return { label: 'Weak', color: '#ef4444', score };
    if (score <= 4) return { label: 'Fair', color: '#f59e0b', score };
    return { label: 'Strong', color: '#22c55e', score };
  },

  // ── Async Registration → backend ──
  async register(data) {
    try {
      const res = await ApiClient.post('/auth/register', data);
      return { success: true, message: res.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ── Async Login → backend ──
  async login(username, password, role = null) {
    try {
      const res = await ApiClient.post('/auth/login', { username, password, role });
      // Store token for subsequent requests
      ApiClient.setToken(res.token);
      // Cache session locally for quick getSession() access
      const session = {
        ...res.user,
        loginTime: new Date().toISOString(),
        lastActivity: Date.now()
      };
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      return { success: true, user: session };
    } catch (err) {
      const data = err.data || {};
      return { success: false, error: err.message, roleMismatch: data.roleMismatch || false };
    }
  },

  // ── Logout → backend + clear local ──
  async logout() {
    try { await ApiClient.post('/auth/logout', {}); } catch (_) {}
    ApiClient.clearToken();
    localStorage.removeItem(this.SESSION_KEY);
    window.location.href = 'login.html';
  },

  // ── Get cached session ──
  getSession() {
    const stored = localStorage.getItem(this.SESSION_KEY);
    if (!stored) return null;
    const session = JSON.parse(stored);
    if (session.lastActivity && (Date.now() - session.lastActivity) > this.INACTIVITY_LIMIT) {
      ApiClient.clearToken();
      localStorage.removeItem(this.SESSION_KEY);
      return null;
    }
    return session;
  },

  touchSession() {
    const stored = localStorage.getItem(this.SESSION_KEY);
    if (stored) {
      const session = JSON.parse(stored);
      session.lastActivity = Date.now();
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    }
  },

  startInactivityMonitor() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    let debounce = null;
    const touch = () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => this.touchSession(), 1000);
    };
    events.forEach(ev => document.addEventListener(ev, touch, { passive: true }));
    setInterval(() => {
      if (!this.getSession()) {
        window.location.href = 'login.html';
      }
    }, 60000);
  },

  requireAuth(requiredRole = null) {
    // Restore token from session cache on page load
    const session = this.getSession();
    if (!session) { window.location.href = 'login.html'; return null; }
    if (requiredRole && session.role !== requiredRole) {
      window.location.href = session.role === 'admin' ? 'admin-dashboard.html' : 'voter-dashboard.html';
      return null;
    }
    // Make sure ApiClient has the token (restored after page refresh)
    if (!ApiClient.getToken()) {
      // Token lost (server restart wipes in-memory tokens) — force re-login
      localStorage.removeItem(this.SESSION_KEY);
      window.location.href = 'login.html';
      return null;
    }
    this.startInactivityMonitor();
    return session;
  },

  // ── Change password ──
  async changePassword(currentPassword, newPassword) {
    try {
      const res = await ApiClient.post('/auth/change-password', { currentPassword, newPassword });
      return { success: true, message: res.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ── Audit log (async, non-blocking) ──
  addAuditLog(action, description, userId = null) {
    // Fire-and-forget — backend logs automatically on API calls
    // This is kept for compatibility with any inline calls in HTML pages
  },
  getAuditLogs() { return []; }
};

// ===== ELECTION DATA (Backend-connected) =====
const ElectionDB = {
  // ── In-memory cache (populated on first API call per page) ──
  _elections: null,
  _candidates: null,

  // ── Async: fetch all elections from server ──
  async fetchElections() {
    try {
      const res = await ApiClient.get('/elections');
      this._elections = res.elections || [];
      return this._elections;
    } catch (err) {
      console.warn('ElectionDB.fetchElections error:', err.message);
      return this._elections || [];
    }
  },

  // ── Sync cache getter (use after fetchElections()) ──
  getElections() { return this._elections || []; },

  // ── Auto-update statuses: server handles this via auto_status() ──
  autoUpdateStatuses() { return this.getElections(); },

  // ── Async: fetch candidates (optionally filtered by election) ──
  async fetchCandidates(electionId = null) {
    try {
      const path = electionId ? `/candidates?election_id=${electionId}` : '/candidates';
      const res = await ApiClient.get(path);
      this._candidates = res.candidates || [];
      return this._candidates;
    } catch (err) {
      console.warn('ElectionDB.fetchCandidates error:', err.message);
      return this._candidates || [];
    }
  },

  // ── Sync cache getter ──
  getCandidates() { return this._candidates || []; },

  // ── Async: cast vote ──
  async castVote(voterId, electionId, selections) {
    try {
      const res = await ApiClient.post('/votes/cast', { electionId, selections });
      return { success: true, receiptCode: res.receiptCode };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ── Async: check if current voter has voted ──
  async hasVotedAsync(electionId) {
    try {
      const res = await ApiClient.get(`/votes/my/${electionId}`);
      return { hasVoted: res.hasVoted, receiptCode: res.receiptCode };
    } catch (_) {
      return { hasVoted: false };
    }
  },

  // ── Async: get vote results for an election ──
  async getResults(electionId) {
    try {
      const res = await ApiClient.get(`/votes/results/${electionId}`);
      return res;
    } catch (err) {
      console.warn('ElectionDB.getResults error:', err.message);
      return { election: null, totalVotes: 0, results: [] };
    }
  },

  // ── Async: create election (admin) ──
  async createElection(data) {
    try {
      const res = await ApiClient.post('/elections', data);
      return { success: true, election: res.election };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ── Async: update election (admin) ──
  async updateElection(id, data) {
    try {
      const res = await ApiClient.put(`/elections/${id}`, data);
      return { success: true, election: res.election };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ── Async: delete election (admin) ──
  async deleteElection(id) {
    try {
      await ApiClient.del(`/elections/${id}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ── Async: reset all votes for an election (admin) ──
  async resetVotes(electionId) {
    try {
      const res = await ApiClient.post(`/elections/${electionId}/reset-votes`, {});
      return { success: true, message: res.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ── Async: add candidate (admin) ──
  async addCandidate(formData) {
    try {
      const res = await ApiClient.upload('/candidates', formData);
      return { success: true, candidate: res.candidate };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ── Async: update candidate (admin) ──
  async updateCandidate(id, formData) {
    try {
      const res = await ApiClient.uploadPut(`/candidates/${id}`, formData);
      return { success: true, candidate: res.candidate };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ── Async: delete candidate (admin) ──
  async deleteCandidate(id) {
    try {
      await ApiClient.del(`/candidates/${id}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ── Async: fetch all voters (admin) ──
  async fetchVoters(status = null) {
    try {
      const path = status ? `/voters?status=${status}` : '/voters';
      const res = await ApiClient.get(path);
      return res.voters || [];
    } catch (err) {
      console.warn('ElectionDB.fetchVoters error:', err.message);
      return [];
    }
  },

  // ── Async: update voter (admin) ──
  async updateVoter(id, data) {
    try {
      const res = await ApiClient.put(`/voters/${id}`, data);
      return { success: true, voter: res.voter };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ── Async: delete voter (admin) ──
  async deleteVoter(id) {
    try {
      await ApiClient.del(`/voters/${id}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ── Async: fetch audit logs (admin) ──
  async fetchAuditLogs(page = 1) {
    try {
      const res = await ApiClient.get(`/audit?page=${page}&per_page=100`);
      return res.logs || [];
    } catch (err) {
      console.warn('ElectionDB.fetchAuditLogs error:', err.message);
      return [];
    }
  },

  // ── Async: fetch faculty roster (admin) ──
  async fetchFaculty() {
    try {
      const res = await ApiClient.get('/faculty');
      return res.faculty || [];
    } catch (err) {
      return [];
    }
  },

  // ── Async: verify receipt ──
  async verifyReceipt(code) {
    try {
      const res = await ApiClient.get(`/votes/receipt/${code}`);
      return { valid: true, ...res };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }
};



// ===== UTILITY =====
const Utils = {
  formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  },
  formatDateTime(iso) {
    return new Date(iso).toLocaleString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  },
  timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  },
  countdown(endDateISO) {
    const end = new Date(endDateISO).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return 'Ended';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },
  generateId() { return Date.now() + Math.floor(Math.random() * 1000); },
  percent(part, total) { return total === 0 ? 0 : Math.round((part / total) * 100); },

  // Download data as a CSV file
  exportCSV(filename, headers, rows) {
    const escape = v => {
      if (v === null || v === undefined) return '';
      const str = String(v).replace(/"/g, '""');
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
    };
    const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  },

  // Animate bar widths after render (supports both data-w and data-width)
  animateBars() {
    setTimeout(() => {
      document.querySelectorAll('[data-w]').forEach(el => { el.style.width = el.dataset.w; });
      document.querySelectorAll('[data-width]').forEach(el => { el.style.width = el.dataset.width; });
    }, 120);
  }
};

// ===== SIDEBAR MANAGER (mobile overlay sidebar) =====
const SidebarManager = {
  overlay: null,
  sidebar: null,
  init() {
    this.sidebar = document.getElementById('sidebar');
    if (!this.sidebar) return;

    // Mark active sidebar link based on current page
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.sidebar-link').forEach(link => {
      if (link.getAttribute('href') === current) link.classList.add('active');
    });

    // Create overlay backdrop
    this.overlay = document.createElement('div');
    this.overlay.className = 'sidebar-overlay';
    this.overlay.id = 'sidebarOverlay';
    document.body.appendChild(this.overlay);

    // Menu button toggles sidebar
    const menuBtn = document.getElementById('topbarMenuBtn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => this.toggle());
    }

    // Click overlay → close
    this.overlay.addEventListener('click', () => this.close());

    // Escape key → close
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.close();
    });

    // Swipe left on sidebar → close
    let touchStartX = 0;
    this.sidebar.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    this.sidebar.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (diff > 60) this.close();
    }, { passive: true });

    // Swipe right from left edge → open
    document.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    document.addEventListener('touchend', e => {
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (touchStartX < 30 && diff > 60) this.open();
    }, { passive: true });
  },
  open() {
    if (!this.sidebar) return;
    this.sidebar.classList.add('open');
    if (this.overlay) this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  },
  close() {
    if (!this.sidebar) return;
    this.sidebar.classList.remove('open');
    if (this.overlay) this.overlay.classList.remove('active');
    document.body.style.overflow = '';
  },
  toggle() {
    if (this.sidebar && this.sidebar.classList.contains('open')) {
      this.close();
    } else {
      this.open();
    }
  }
};

// ===== NAV MANAGER (landing page navbar) =====
const NavManager = {
  init() {
    // Scroll effect on landing navbar
    const navbar = document.getElementById('navbar');
    if (navbar) {
      window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 30);
      }, { passive: true });
    }
    // Hamburger open
    const hamburger = document.querySelector('.nav-hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (!hamburger || !navLinks) return;
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
    // Close on nav link click
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => navLinks.classList.remove('open'));
    });
    // Close button inside mobile panel
    const closeBtn = document.getElementById('navCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => navLinks.classList.remove('open'));
  }
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  Modal.init();
  Toast.init();
  NavManager.init();
  SidebarManager.init();
  // Auto-update election statuses on every page load
  ElectionDB.autoUpdateStatuses();
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') lucide.createIcons();
});

// Re-run icon render after dynamic content insertions
const _origCreateIcons = () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();
};
// Expose globally so page scripts can call it after dynamic renders
window.renderIcons = _origCreateIcons;
window.Auth = Auth;
window.ThemeManager = ThemeManager;
window.PreferenceManager = PreferenceManager;
window.Modal = Modal;
window.Toast = Toast;
window.NavManager = NavManager;
window.SidebarManager = SidebarManager;
window.ElectionDB = ElectionDB;
window.Utils = Utils;
