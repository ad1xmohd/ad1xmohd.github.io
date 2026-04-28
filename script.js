// ============================================================
// ad1xmohd — cinematic portfolio engine
// ============================================================

const USER = "ad1xmohd";

const PROJECTS = [
  {
    repo: "EtherWare",
    name: "EtherWare",
    tier: "mid",
    badge: { text: "Under Development", cls: "dev" },
    summary: "Desinged to use external WiFi Adapter in Android Devices and its safe and no-root and no developer mode required.",
    fallbackTech: ["Systems", "Networking"],
    icon: { type: "img", src: "assets/etherware.svg" }
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

// ===== Footer year =====
document.getElementById("year").textContent = new Date().getFullYear();

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

// ===== Parallax orbs (subtle mouse follow) =====
const orbs = document.querySelectorAll(".orb");
window.addEventListener("mousemove", (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 2;
  const y = (e.clientY / window.innerHeight - 0.5) * 2;
  orbs.forEach((o, i) => {
    const f = (i + 1) * 14;
    o.style.transform = `translate3d(${x * f}px, ${y * f}px, 0)`;
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
      <a class="btn btn-ghost" href="https://github.com/${USER}/${p.repo}" target="_blank" rel="noopener" onclick="event.stopPropagation()">GitHub ↗</a>
      <a class="btn btn-ghost demo-btn" data-demo style="display:none" target="_blank" rel="noopener" onclick="event.stopPropagation()">Live ↗</a>
    </div>
  `;

  // hover glow tracking
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });

  card.addEventListener("click", () => openModal(p));
  io.observe(card);
  cardsRoot.appendChild(card);
});

// ===== GitHub data hydration =====
async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

async function hydrateRepo(p) {
  const card = cardsRoot.querySelector(`[data-repo="${p.repo}"]`);
  if (!card) return;
  try {
    const repo = await fetchJSON(`https://api.github.com/repos/${USER}/${p.repo}`);
    p._repo = repo;
    const lang = card.querySelector("[data-lang]");
    if (repo.language) lang.textContent = repo.language;
    else lang.style.display = "none";

    if (repo.homepage && repo.homepage.trim()) {
      const demo = card.querySelector("[data-demo]");
      demo.href = repo.homepage;
      demo.textContent = "Live ↗";
      demo.style.display = "";
    }

    // tech: fetch languages
    try {
      const langs = await fetchJSON(`https://api.github.com/repos/${USER}/${p.repo}/languages`);
      const keys = Object.keys(langs);
      if (keys.length) {
        const tech = card.querySelector("[data-tech]");
        tech.innerHTML = keys.slice(0, 6).map(k => `<span>${k}</span>`).join("");
        p._tech = keys;
      }
    } catch {}
  } catch {
    // silent — fallback already shown
  }
}

PROJECTS.forEach(hydrateRepo);

// ===== Profile stats =====
(async () => {
  try {
    const u = await fetchJSON(`https://api.github.com/users/${USER}`);
    document.getElementById("stat-repos").textContent = u.public_repos ?? "—";
    document.getElementById("stat-followers").textContent = u.followers ?? "—";
    document.getElementById("stat-bio").textContent =
      u.bio || "Systems-focused developer & cybersecurity engineer. Building experimental software, secure communications, and advanced digital infrastructure.";
  } catch {
    document.getElementById("stat-bio").textContent =
      "Systems-focused developer & cybersecurity engineer. Building experimental software, secure communications, and advanced digital infrastructure.";
  }
})();

// ===== Modal =====
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modal-body");
const modalTitle = document.getElementById("modal-title");
const modalEyebrow = document.getElementById("modal-eyebrow");
const modalIcon = document.getElementById("modal-icon");
const modalGh = document.getElementById("modal-gh");
const modalMeta = document.getElementById("modal-meta");

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
modal.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closeModal));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

async function openModal(p) {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  modalTitle.textContent = p.name;
  modalEyebrow.textContent = p.badge.text;
  modalIcon.innerHTML = iconHTML(p);
  modalGh.href = `https://github.com/${USER}/${p.repo}`;

  // meta
  const tech = p._tech || p.fallbackTech;
  modalMeta.innerHTML = tech.slice(0, 8).map(t => `<span class="badge">${t}</span>`).join("");

  modalBody.innerHTML = `<div class="loader"><span></span><span></span><span></span></div>`;

  try {
    const r = await fetch(`https://api.github.com/repos/${USER}/${p.repo}/readme`, {
      headers: { Accept: "application/vnd.github.v3.raw" }
    });
    if (!r.ok) throw new Error(r.status);
    const md = await r.text();
    renderMarkdown(md, p);
  } catch {
    renderFallback(p);
  }
}

function renderMarkdown(md, p) {
  // rewrite relative image paths to GitHub raw
  const base = `https://raw.githubusercontent.com/${USER}/${p.repo}/HEAD/`;
  const html = window.marked.parse(md, { breaks: true, gfm: true });
  const fixed = html
    .replace(/(<img[^>]+src=")(?!https?:|data:)([^"]+)/gi, (_, a, src) => a + base + src.replace(/^\.?\//, ""));
  modalBody.innerHTML = fixed;
  // open external links in new tab
  modalBody.querySelectorAll("a").forEach(a => {
    a.target = "_blank"; a.rel = "noopener";
  });
}

function renderFallback(p) {
  const tech = (p._tech || p.fallbackTech).map(t => `<li>${t}</li>`).join("");
  modalBody.innerHTML = `
    <h1>${p.name}</h1>
    <p>${p.summary}</p>
    <h2>Overview</h2>
    <p>This project is part of an ongoing exploration into ${p.tier === "hero" ? "advanced data orchestration" : p.tier === "mid" ? "secure systems infrastructure" : "low-level terminal tooling"}. Documentation is being prepared.</p>
    <h2>Tech Stack</h2>
    <ul>${tech}</ul>
    <h2>Status</h2>
    <blockquote>${p.badge.text}</blockquote>
    <p>Visit the <a href="https://github.com/${USER}/${p.repo}" target="_blank" rel="noopener">GitHub repository</a> for source and updates.</p>
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