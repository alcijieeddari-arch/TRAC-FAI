/**
 * TRA-FAI Voting System — PWA Helper & Mobile Install Banner
 * Handles Service Worker registration, mobile install prompts, and app-like experience.
 */

(function () {
  'use strict';

  // 1. Register Service Worker
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(reg => {
          // Check for worker updates
          reg.onupdatefound = () => {
            const installing = reg.installing;
            if (installing) {
              installing.onstatechange = () => {
                if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New TRA-FAI update available; reloading on next visit.');
                }
              };
            }
          };
        })
        .catch(err => console.warn('PWA ServiceWorker registration error:', err));
    });
  }

  // 2. Check if already installed / standalone
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isStandalone) {
    document.documentElement.classList.add('is-pwa-standalone');
    return; // Don't show install banners inside the installed app
  }

  // 3. Handle Android / Chromium Install Prompt
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', e => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    deferredPrompt = e;

    // Check if dismissed previously within 3 days
    const dismissedTime = localStorage.getItem('tracfai_pwa_dismissed');
    if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 3 * 86400000) {
      return;
    }

    showInstallBanner();
  });

  function showInstallBanner() {
    if (document.getElementById('pwaInstallBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwaInstallBanner';
    banner.style.cssText = `
      position: fixed;
      bottom: 1rem;
      left: 1rem;
      right: 1rem;
      max-width: 440px;
      margin: 0 auto;
      background: var(--bg-card, #1e293b);
      color: var(--text-primary, #f8fafc);
      border: 1px solid var(--border, rgba(255,255,255,0.15));
      border-radius: 16px;
      padding: 0.85rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.85rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
      z-index: 9999;
      animation: pwaSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      backdrop-filter: blur(12px);
    `;

    banner.innerHTML = `
      <img src="img/icon-192.png" alt="App Icon" style="width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.3);" />
      <div style="flex: 1; min-width: 0;">
        <div style="font-weight: 700; font-size: 0.88rem; line-height: 1.2; margin-bottom: 2px;">Install TRA-FAI Vote</div>
        <div style="font-size: 0.74rem; color: var(--text-muted, #94a3b8); line-height: 1.2;">Add to home screen for fast mobile voting</div>
      </div>
      <div style="display: flex; align-items: center; gap: 0.4rem;">
        <button id="pwaInstallBtn" style="background: var(--primary, #6366f1); color: #ffffff; border: none; font-size: 0.78rem; font-weight: 700; padding: 0.45rem 0.85rem; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
          Install
        </button>
        <button id="pwaDismissBtn" aria-label="Dismiss" style="background: transparent; border: none; color: var(--text-muted, #94a3b8); cursor: pointer; padding: 6px; display: flex; align-items: center; font-size: 1.1rem; border-radius: 6px;">
          ✕
        </button>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('pwaInstallBtn')?.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      banner.style.display = 'none';
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User installed the PWA');
      }
      deferredPrompt = null;
    });

    document.getElementById('pwaDismissBtn')?.addEventListener('click', () => {
      banner.remove();
      localStorage.setItem('tracfai_pwa_dismissed', Date.now().toString());
    });
  }

  // 4. iOS Safari Guide (optional prompt if on iOS and not standalone)
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIos && !isStandalone) {
    const iosPrompted = sessionStorage.getItem('tracfai_ios_prompted');
    if (!iosPrompted) {
      sessionStorage.setItem('tracfai_ios_prompted', 'true');
      // Subtle tooltip or guidance can be triggered on first visit
    }
  }
})();
