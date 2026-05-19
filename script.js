// ============================================================
// ad1xmohd — cinematic portfolio engine
// ============================================================

const USER = "ad1xmohd";

const PROJECTS = [
  {
    repo: "EtherWare",
    name: "EtherWare",
    tier: "mid",
    badge: { text: "Early access on EtherWare", cls: "dev" },
    summary: "Desinged to use external WiFi Adapter in Android Devices and its safe and no-root and no developer mode required.",
    fallbackTech: ["Systems", "Networking"],
    icon: { type: "img", src: "assets/etherware.svg" },
    download: { label: "Download EtherWare 2.0", url: "https://github.com/ad1xmohd/EtherWare/releases/download/EtherWare/EtherWare.v2.apk" }
  },
  {
    repo: "XcelSync",
    name: "XcelSync",
    tier: "hero",
    badge: { text: "Project", cls: "legacy" },
    summary: "An advanced synchronization engine for Excel - orchestrating data pipelines, automation, and real-time spreadsheet intelligence at scale.",
    fallbackTech: ["Python", "Automation", "Excel API", "Data Sync"],
    icon: { type: "img", src: "assets/xcelsync.png" }
  },
  {
    repo: "Termix",
    name: "Termix",
    tier: "small",
    badge: { text: "Legacy", cls: "legacy" },
    summary: "An earlier terminal-centric system - minimal, fast, and built without AI assistance. A baseline of pure engineering.",
    fallbackTech: ["Shell", "Terminal", "CLI"],
    icon: { type: "termix" }
  }
];

// ===== Helpers =====

/**
 * Fetch JSON with an optional AbortSignal.
 * Throws on non-2xx or network error.
 */
async function fetchJSON(url, signal) {
  const r = await fetch(url, signal ? { signal } : undefined);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/**
 * Check whether the marked library has been loaded.
 * Returns false gracefully instead of throwing.
 */
function markedAvailable() {
  return typeof window.marked !== "undefined" && typeof window.marked.parse === "function";
}

// ===== Footer year =====
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== Reveal observer =====
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add("in");
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// ===== Parallax orbs (throttled mouse follow) =====
const orbs = document.querySelectorAll(".orb");
let _rafId = null;
let _pendingX = 0, _pendingY = 0;

window.addEventListener("mousemove", (e) => {
  _pendingX = (e.clientX / window.innerWidth - 0.5) * 2;
  _pendingY = (e.clientY / window.innerHeight - 0.5) * 2;
  if (_rafId) return; // already queued
  _rafId = requestAnimationFrame(() => {
    _rafId = null;
    orbs.forEach((o, i) => {
      const f = (i + 1) * 14;
      o.style.transform = `translate3d(${_pendingX * f}px, ${_pendingY * f}px, 0)`;
    });
  });
}, { passive: true });

// ===== Build cards =====
const cardsRoot = document.getElementById("cards");
const directions = ["up", "left", "right", "scale"];

function iconHTML(p) {
  if (p.icon.type === "img") return `<img src="${p.icon.src}" alt="${p.name} logo" loading="lazy" />`;
  if (p.icon.type === "termix") return `<div class="termix-t">T</div>`;
  return "";
}

function tierClass(t) {
  return t === "hero" ? "card-hero" : t === "mid" ? "card-mid" : "card-small";
}

PROJECTS.forEach((p, i) => {
  const card = document.createElement("article");
  card.className = `card ${tierClass(p.tier)} reveal`;
  card.dataset.dir = directions[i % directions.length];
  card.dataset.repo = p.repo;

  card.innerHTML = `
    <div class="glow"></div>
    <div class="card-top">
      <div class="card-icon">${iconHTML(p)}</div>
      <div class="card-badges">
        <span class="badge ${p.badge.cls}">${p.badge.text}</span>
        <span class="badge tech-badge" data-lang>—</span>
      </div>
    </div>
    <h3>${p.name}</h3>
    <p>${p.summary}</p>
    <div class="tech" data-tech>
      ${p.fallbackTech.map(t => `<span>${t}</span>`).join("")}
    </div>
    <div class="card-actions">
      <button class="btn btn-primary open-btn">Open Case File</button>
      ${p.download ? `<a class="btn btn-primary" href="${p.download.url}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${p.download.label}</a>` : ""}
      <a class="btn btn-ghost" href="https://github.com/${USER}/${p.repo}" target="_blank" rel="noopener" onclick="event.stopPropagation()">GitHub ↗</a>
      <a class="btn btn-ghost demo-btn" data-demo style="display:none" target="_blank" rel="noopener" onclick="event.stopPropagation()">Live ↗</a>
    </div>
  `;

  // hover glow tracking — throttled via RAF
  let _glowRaf = null;
  card.addEventListener("mousemove", (e) => {
    if (_glowRaf) return;
    _glowRaf = requestAnimationFrame(() => {
      _glowRaf = null;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  }, { passive: true });

  card.addEventListener("click", () => openModal(p));
  io.observe(card);
  cardsRoot.appendChild(card);
});

// ===== GitHub data hydration =====
async function hydrateRepo(p) {
  const card = cardsRoot.querySelector(`[data-repo="${p.repo}"]`);
  if (!card) return;

  try {
    const repo = await fetchJSON(`https://api.github.com/repos/${USER}/${p.repo}`);
    p._repo = repo;

    const lang = card.querySelector("[data-lang]");
    if (lang) {
      if (repo.language) lang.textContent = repo.language;
      else lang.style.display = "none";
    }

    if (repo.homepage && repo.homepage.trim()) {
      const demo = card.querySelector("[data-demo]");
      if (demo) {
        demo.href = repo.homepage;
        demo.textContent = "Live ↗";
        demo.style.display = "";
      }
    }

    // Fetch language breakdown
    try {
      const langs = await fetchJSON(`https://api.github.com/repos/${USER}/${p.repo}/languages`);
      const keys = Object.keys(langs);
      if (keys.length) {
        const tech = card.querySelector("[data-tech]");
        if (tech) {
          tech.innerHTML = keys.slice(0, 6).map(k => `<span>${k}</span>`).join("");
          p._tech = keys;
        }
      }
    } catch {
      // Fallback already shown — silent
    }
  } catch {
    // Rate-limited or network error — fallback already shown
  }
}

// Stagger hydration calls to reduce GitHub API rate-limit pressure
PROJECTS.forEach((p, i) => {
  setTimeout(() => hydrateRepo(p), i * 300);
});

// ===== Profile stats =====
(async () => {
  try {
    const u = await fetchJSON(`https://api.github.com/users/${USER}`);
    const repoEl = document.getElementById("stat-repos");
    const followEl = document.getElementById("stat-followers");
    const bioEl = document.getElementById("stat-bio");
    if (repoEl) repoEl.textContent = u.public_repos ?? "—";
    if (followEl) followEl.textContent = u.followers ?? "—";
    if (bioEl) bioEl.textContent =
      u.bio || "Systems-focused developer & cybersecurity engineer. Building experimental software, secure communications, and advanced digital infrastructure.";
  } catch {
    const bioEl = document.getElementById("stat-bio");
    if (bioEl) bioEl.textContent =
      "Systems-focused developer & cybersecurity engineer. Building experimental software, secure communications, and advanced digital infrastructure.";
  }
})();

// ===== Modal =====
const modal      = document.getElementById("modal");
const modalBody  = document.getElementById("modal-body");
const modalTitle = document.getElementById("modal-title");
const modalEyebrow = document.getElementById("modal-eyebrow");
const modalIcon  = document.getElementById("modal-icon");
const modalGh    = document.getElementById("modal-gh");
const modalDownload = document.getElementById("modal-download");
const modalMeta  = document.getElementById("modal-meta");

// Active fetch abort controller — prevents race conditions when user
// opens a card while another card's README is still loading.
let _activeReadmeController = null;

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  // Cancel any in-flight README fetch
  if (_activeReadmeController) {
    _activeReadmeController.abort();
    _activeReadmeController = null;
  }
}

modal.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeModal));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

// Close on backdrop click (touch-friendly — check exact target)
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

async function openModal(p) {
  // Abort any previous in-flight fetch first
  if (_activeReadmeController) {
    _activeReadmeController.abort();
    _activeReadmeController = null;
  }

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  if (modalTitle)   modalTitle.textContent   = p.name;
  if (modalEyebrow) modalEyebrow.textContent = p.badge.text;
  if (modalIcon)    modalIcon.innerHTML      = iconHTML(p);
  if (modalGh)      modalGh.href             = `https://github.com/${USER}/${p.repo}`;
  if (modalDownload) {
    if (p.download) {
      modalDownload.href = p.download.url;
      modalDownload.textContent = p.download.label;
      modalDownload.hidden = false;
    } else {
      modalDownload.hidden = true;
    }
  }

  // meta
  const tech = p._tech || p.fallbackTech;
  if (modalMeta) modalMeta.innerHTML = tech.slice(0, 8).map(t => `<span class="badge">${t}</span>`).join("");

  if (modalBody) modalBody.innerHTML = `<div class="loader"><span></span><span></span><span></span></div>`;

  // Create abort controller for this fetch
  _activeReadmeController = new AbortController();
  const { signal } = _activeReadmeController;

  try {
    const r = await fetch(`https://api.github.com/repos/${USER}/${p.repo}/readme`, {
      headers: { Accept: "application/vnd.github.v3.raw" },
      signal
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const md = await r.text();
    // Guard: signal could have been aborted while awaiting
    if (signal.aborted) return;
    renderMarkdown(md, p);
  } catch (err) {
    // Ignore AbortError — user navigated away intentionally
    if (err.name === "AbortError") return;
    renderFallback(p);
  } finally {
    // Clear controller only if it's still this request's controller
    if (_activeReadmeController && _activeReadmeController.signal === signal) {
      _activeReadmeController = null;
    }
  }
}

function renderMarkdown(md, p) {
  if (!markedAvailable()) {
    renderFallback(p);
    return;
  }
  // Rewrite relative image paths to GitHub raw
  const base = `https://raw.githubusercontent.com/${USER}/${p.repo}/HEAD/`;
  const html = window.marked.parse(md, { breaks: true, gfm: true });
  const fixed = html
    .replace(/(<img[^>]+src=")(?!https?:|data:)([^"]+)/gi, (_, a, src) => a + base + src.replace(/^\.?\//, ""));
  if (modalBody) {
    modalBody.innerHTML = fixed;
    // Open all links in new tab
    modalBody.querySelectorAll("a").forEach(a => {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    });
  }
}

function renderFallback(p) {
  const tech = (p._tech || p.fallbackTech).map(t => `<li>${t}</li>`).join("");
  if (modalBody) modalBody.innerHTML = `
    <h1>${p.name}</h1>
    <p>${p.summary}</p>
    <h2>Overview</h2>
    <p>This project is part of an ongoing exploration into ${
      p.tier === "hero"  ? "advanced data orchestration" :
      p.tier === "mid"   ? "secure systems infrastructure" :
                           "low-level terminal tooling"
    }. Documentation is being prepared.</p>
    <h2>Tech Stack</h2>
    <ul>${tech}</ul>
    <h2>Status</h2>
    <blockquote>${p.badge.text}</blockquote>
    <p>Visit the <a href="https://github.com/${USER}/${p.repo}" target="_blank" rel="noopener noreferrer">GitHub repository</a> for source and updates.</p>
  `;
}

// ===== Hero SVG ambient (background ether shape) =====
(() => {
  const host = document.querySelector(".hero-bg-svg");
  if (!host) return;
  host.style.cssText = `
    position:absolute;inset:0;pointer-events:none;z-index:1;
    background-image:url("assets/etherware.svg");
    background-repeat:no-repeat;background-position:center;
    background-size:min(680px,80vw);
    opacity:.06;filter:blur(.5px) drop-shadow(0 0 60px rgba(64,201,206,.5));
    animation:heroPulse 8s ease-in-out infinite;
  `;
  const style = document.createElement("style");
  style.textContent = `@keyframes heroPulse{0%,100%{transform:scale(1) rotate(0deg);opacity:.06}50%{transform:scale(1.06) rotate(2deg);opacity:.1}}`;
  document.head.appendChild(style);
})();
