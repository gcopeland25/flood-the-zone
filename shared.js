// shared.js — loaded on every page

// ── HELPERS ──────────────────────────────────────────────────────────────────
function pillClass(status) {
  return { hot:'pill-hot', developing:'pill-developing', fading:'pill-fading', resolved:'pill-resolved' }[status] || 'pill-developing';
}
function statusEmoji(status) {
  return { hot:'🔴', developing:'◎', fading:'↘', resolved:'✓' }[status] || '◎';
}
function isMobile() { return window.innerWidth < 768; }

// ── LOAD stories.json ─────────────────────────────────────────────────────────
async function loadStories() {
  try {
    const res = await fetch('/stories.json?v=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (err) {
    console.warn('stories.json load failed:', err.message);
    return null;
  }
}

// ── TICKER ────────────────────────────────────────────────────────────────────
function renderTicker(items) {
  const el = document.getElementById('ticker-inner');
  if (!el || !items) return;
  const doubled = [...items, ...items];
  el.innerHTML = doubled.map(t => `<span class="ticker-item">${t}</span>`).join('');
}

// ── MODAL (mobile) ────────────────────────────────────────────────────────────
let currentStory = null;

function openModal(story) {
  currentStory = story;
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  document.getElementById('modal-status').innerHTML = `<span class="status-pill ${pillClass(story.status)}">${statusEmoji(story.status)} ${story.status_label}</span>`;
  document.getElementById('modal-category').textContent = story.category;
  document.getElementById('modal-title').textContent = story.title;
  document.getElementById('modal-summary').textContent = story.summary;
  document.getElementById('modal-analysis').textContent = story.analysis;

  const tl = document.getElementById('modal-timeline');
  if (tl && story.timeline) {
    tl.innerHTML = story.timeline.map(t => `
      <div class="tl-item ${t.latest ? 'latest' : ''}">
        <div class="tl-date">${t.date}</div>
        <div class="tl-event">${t.event}</div>
      </div>`).join('');
  }

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
}

// ── STORY CLICK HANDLER ───────────────────────────────────────────────────────
function handleStoryClick(story) {
  if (isMobile()) {
    openModal(story);
  } else {
    window.location.href = `/story.html?id=${story.id}`;
  }
}

// ── MODAL HTML (injected into pages that need it) ─────────────────────────────
function injectModal() {
  const html = `
  <div class="modal-overlay" id="modal-overlay" onclick="if(event.target===this)closeModal()">
    <div class="modal">
      <div class="modal-handle"></div>
      <div class="modal-header">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span id="modal-status"></span>
            <span id="modal-category" style="font-family:var(--mono);font-size:0.62rem;color:var(--text3);letter-spacing:0.08em;"></span>
          </div>
          <div id="modal-title" style="font-family:var(--serif);font-size:1.3rem;color:var(--text);line-height:1.3;"></div>
        </div>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p id="modal-summary" style="font-size:0.88rem;color:var(--text2);line-height:1.7;font-weight:300;margin-bottom:1.5rem;"></p>
        <div style="font-family:var(--mono);font-size:0.62rem;color:var(--blue);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:0.75rem;">AI Analysis</div>
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:1rem;margin-bottom:1.5rem;">
          <p id="modal-analysis" style="font-size:0.82rem;color:var(--text2);line-height:1.7;font-weight:300;"></p>
        </div>
        <div style="font-family:var(--mono);font-size:0.62rem;color:var(--blue);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:0.75rem;">Timeline</div>
        <div id="modal-timeline" class="timeline-list"></div>
        <a id="modal-full-link" href="#" style="display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:0.7rem;color:var(--blue);text-decoration:none;margin-top:1rem;" onclick="if(currentStory)this.href='/story.html?id='+currentStory.id">
          View full story page →
        </a>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

// ── NAV ACTIVE STATE ──────────────────────────────────────────────────────────
function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.remove('active');
    const href = a.getAttribute('href');
    if (href && (path.endsWith(href) || (href === '/index.html' && path === '/'))) {
      a.classList.add('active');
    }
  });
}

// ── FOOTER TIME ───────────────────────────────────────────────────────────────
function updateFooterTime(lastUpdated) {
  const el = document.getElementById('footer-updated');
  if (!el || !lastUpdated) return;
  const mins = Math.round((Date.now() - new Date(lastUpdated).getTime()) / 60000);
  el.textContent = mins < 60 ? `Updated ${mins}m ago` : `Updated ${Math.round(mins/60)}h ago`;
}

// ── FADE UP OBSERVER ──────────────────────────────────────────────────────────
function initFadeUp() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

// ── SHARED NAV HTML ───────────────────────────────────────────────────────────
function renderNav() {
  return `
  <nav>
    <div class="nav-inner">
      <a href="/index.html" class="nav-logo"><div class="nav-logo-dot"></div>Flood the Zone</a>
      <div class="nav-links">
        <a href="/index.html">Home</a>
        <a href="/active.html">Active Events</a>
        <a href="/fading.html">Fading Stories</a>
        <a href="/outcomes.html">Policy Outcomes</a>
        <a href="/narratives.html">Narratives</a>
        <a href="/about.html">About</a>
      </div>
      <a href="/index.html#signup" class="nav-cta">Get Weekly Digest</a>
    </div>
  </nav>
  <div class="ticker-wrap"><div class="ticker-inner" id="ticker-inner"></div></div>`;
}

function renderFooter() {
  return `
  <footer>
    <div class="footer-inner">
      <div class="footer-copy">© 2026 Flood the Zone. All rights reserved.</div>
      <div class="footer-links">
        <a href="/about.html">About</a>
        <a href="#">Privacy</a>
        <a href="#">Contact</a>
      </div>
      <div class="footer-status"><span></span>AI monitoring active · <span id="footer-updated">Loading...</span></div>
    </div>
  </footer>`;
}
