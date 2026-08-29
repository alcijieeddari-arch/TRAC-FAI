// ===== LANDING PAGE JS =====

document.addEventListener('DOMContentLoaded', () => {
  // Animated counters
  animateCounters();

  // Populate dynamic election data
  const elections = ElectionDB.getElections();
  const active = elections.find(e => e.status === 'ongoing');
  const upcoming = elections.find(e => e.status === 'upcoming');
  const featured = active || upcoming;

  // Hero election status card
  const titleEl = document.getElementById('heroElectionTitle');
  const statusEl = document.getElementById('heroElectionStatus');
  if (featured && titleEl && statusEl) {
    titleEl.textContent = featured.title;
    if (featured.status === 'ongoing') {
      statusEl.textContent = '● Ongoing Now';
      statusEl.className = 'es-status ongoing';
    } else {
      statusEl.textContent = '⏳ Upcoming';
      statusEl.className = 'es-status';
    }
  } else if (titleEl) {
    titleEl.textContent = 'No Active Election';
    statusEl.textContent = 'Check back soon';
    statusEl.className = 'es-status';
  }

  // Hero timer
  if (active) {
    const timerEl = document.getElementById('heroTimer');
    if (timerEl) {
      updateTimer(timerEl, active.endDate);
      setInterval(() => updateTimer(timerEl, active.endDate), 1000);
    }
  }

  // Election banner
  const bannerText = document.getElementById('bannerText');
  const bannerBtn = document.getElementById('bannerVoteBtn');
  if (active && bannerText) {
    bannerText.innerHTML = `
      <strong>Active Election:</strong> ${active.title} is currently ongoing.
      <span class="banner-deadline">Voting closes on ${Utils.formatDate(active.endDate)}.</span>
    `;
    if (bannerBtn) { bannerBtn.style.display = ''; }
  } else if (upcoming && bannerText) {
    bannerText.innerHTML = `
      <strong>Upcoming Election:</strong> ${upcoming.title} starts on ${Utils.formatDate(upcoming.startDate)}.
      <span class="banner-deadline">Stay tuned for voting to begin.</span>
    `;
  }

  // Contact Form
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('contactName').value;
      Toast.show(`Thank you, ${name}! Your message has been sent.`, 'success');
      contactForm.reset();
    });
  }

  // Scroll animations
  initScrollAnimations();

  // Redirect if logged in
  const session = Auth.getSession();
  if (session) {
    const voteBtn = document.getElementById('voteNowBtn');
    if (voteBtn) {
      voteBtn.href = session.role === 'admin' ? 'admin-dashboard.html' : 'voter-dashboard.html';
      voteBtn.textContent = session.role === 'admin' ? '📊 Go to Admin Panel' : '🗳️ Go to Dashboard';
    }
  }
});

function updateTimer(el, endDate) {
  el.textContent = Utils.countdown(endDate);
}

function animateCounters() {
  document.querySelectorAll('[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    let current = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        el.textContent = target + (el.dataset.suffix || '');
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(current) + (el.dataset.suffix || '');
      }
    }, 25);
  });
}

function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.feature-card, .step-card, .about-point, .contact-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}
