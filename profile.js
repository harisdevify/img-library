const USER = 'harisdevify',
  TTL = 30 * 60e3,
  $ = (s) => document.querySelector(s);
const COL = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  HTML: '#e34c26',
  CSS: '#8d6bd1',
  Python: '#3572a5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#888',
  PHP: '#4f5d95',
  Shell: '#89e051',
};
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]
  );
async function get(url, key) {
  // fetch with 30 min cache so GitHub rate limits are never hit
  try {
    const c = JSON.parse(localStorage.getItem(key));
    if (c && Date.now() - c.t < TTL) return c.d;
  } catch {}
  try {
    const r = await fetch(url);
    if (!r.ok) throw 0;
    const d = await r.json();
    try {
      localStorage.setItem(key, JSON.stringify({ t: Date.now(), d }));
    } catch {}
    return d;
  } catch {
    try {
      return JSON.parse(localStorage.getItem(key)).d;
    } catch {
      return null;
    }
  }
}
const set = (k, v) => {
  const e = $(`[data-k=${k}]`);
  if (e) e.textContent = v;
};
let repos = [],
  lang = 'All';

function drawRepos() {
  const q = $('#q').value.toLowerCase(),
    el = $('#repos');
  const list = repos.filter(
    (r) =>
      (lang === 'All' || r.language === lang) &&
      (r.name + ' ' + (r.description || '')).toLowerCase().includes(q)
  );
  el.innerHTML = list.length
    ? list
        .map(
          (
            r
          ) => `<a class="card tilt" href="${esc(r.html_url)}" target="_blank" rel="noopener">
    <h3>${esc(r.name)}</h3><p>${esc(r.description || 'No description yet.')}</p>
    <div class="meta">${r.language ? `<span><i class="dot" style="background:${COL[r.language] || '#8d9bc4'}"></i>${esc(r.language)}</span>` : ''}
    <span>★ ${r.stargazers_count}</span><span>⑂ ${r.forks_count}</span><span>${new Date(r.pushed_at).toLocaleDateString('en', { month: 'short', year: 'numeric' })}</span>
    ${r.homepage ? `<span class="live" data-live="${esc(r.homepage)}">Live demo</span>` : ''}</div></a>`
        )
        .join('')
    : '<p>No repos match. Clear the search or pick another language.</p>';
}
el_live();
function el_live() {
  document.addEventListener('click', (e) => {
    const l = e.target.closest('[data-live]');
    if (l) {
      e.preventDefault();
      window.open(l.dataset.live, '_blank', 'noopener');
    }
  });
}

function drawLangs() {
  const n = {};
  repos.forEach(
    (r) => r.language && (n[r.language] = (n[r.language] || 0) + 1)
  );
  const keys = Object.keys(n).sort((a, b) => n[b] - n[a]),
    tot = repos.filter((r) => r.language).length;
  $('#lbar').innerHTML = keys
    .map(
      (k) =>
        `<span style="width:${(n[k] / tot) * 100}%;background:${COL[k] || '#8d9bc4'}"></span>`
    )
    .join('');
  $('#llist').innerHTML = keys
    .map(
      (k) =>
        `<span><i class="dot" style="background:${COL[k] || '#8d9bc4'}"></i>${esc(k)} ${Math.round((n[k] / tot) * 100)}%</span>`
    )
    .join('');
  $('#langs').innerHTML = ['All', ...keys]
    .map(
      (k) =>
        `<button class="${k === lang ? 'on' : ''}" data-l="${esc(k)}">${esc(k)}</button>`
    )
    .join('');
}
$('#langs').onclick = (e) => {
  const b = e.target.closest('button');
  if (b) {
    lang = b.dataset.l;
    drawLangs();
    drawRepos();
  }
};
$('#q').oninput = drawRepos;

async function loadRepos() {
  const [u, rs] = await Promise.all([
    get(`https://api.github.com/users/${USER}`, 'gh_u'),
    get(
      `https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`,
      'gh_r'
    ),
  ]);
  if (!Array.isArray(rs)) {
    $('#repos').innerHTML =
      `<p>GitHub is not responding right now. <a class="live" href="https://github.com/${USER}?tab=repositories">Open my repositories on GitHub</a>.</p>`;
    return;
  }
  repos = rs.filter(
    (r) =>
      !r.fork &&
      !/test/i.test(r.name) &&
      !['debatenextjs', USER + '.github.io', USER].includes(
        r.name.toLowerCase()
      )
  );
  set('repos', u ? u.public_repos : repos.length);
  set('followers', u ? u.followers : '–');
  set(
    'stars',
    repos.reduce((a, r) => a + r.stargazers_count, 0)
  );
  drawLangs();
  drawRepos();
}
async function loadHeat() {
  const d = await get(
    `https://github-contributions-api.jogruber.de/v4/${USER}?y=last`,
    'gh_c'
  );
  const h = $('#heat');
  if (!d || !d.contributions) {
    h.outerHTML = `<p>Contribution graph is unavailable right now. <a class="live" href="https://github.com/${USER}">See it on GitHub</a>.</p>`;
    return;
  }
  const days = d.contributions,
    total = days.reduce((a, x) => a + x.count, 0);
  set('contrib', total);
  $('#ctotal').textContent = `${total} contributions in the last year`;
  const pad = new Date(days[0].date).getUTCDay(),
    M = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
  let html = '',
    cur = -1;
  const cells = [...Array(pad).fill(null), ...days];
  for (let w = 0; w * 7 < cells.length; w++) {
    const f = cells[w * 7] || cells[w * 7 + pad] || cells[w * 7 + 1],
      m = f ? new Date(f.date).getUTCMonth() : -1;
    html += `<b>${m !== cur && w % 1 === 0 && ((cur = m), true) ? M[m] : ''}</b>`;
    for (let i = 0; i < 7; i++) {
      const x = cells[w * 7 + i];
      html += x
        ? `<i class="l${x.level}" data-t="${x.count} on ${x.date}"></i>`
        : '<i style="visibility:hidden"></i>';
    }
  }
  h.innerHTML = html;
  h.style.gridTemplateColumns = `repeat(${Math.ceil(cells.length / 7)},12px)`;
}
const tip = $('#tip');
document.addEventListener('pointerover', (e) => {
  const t = e.target.dataset?.t;
  if (t) {
    tip.textContent = t;
    tip.style.opacity = 1;
  }
});
document.addEventListener('pointermove', (e) => {
  tip.style.left = e.clientX + 12 + 'px';
  tip.style.top = e.clientY - 34 + 'px';
});
document.addEventListener('pointerout', (e) => {
  if (e.target.dataset?.t) tip.style.opacity = 0;
});

// ---- Interactions (vanilla JS, no libraries) ----
const root = document.documentElement,
  RM = matchMedia('(prefers-reduced-motion:reduce)').matches,
  FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
$('#stackGrid').innerHTML = [
  'React',
  'Next.js',
  'TypeScript',
  'Tailwind',
  'Node.js',
  'NestJS',
  'PostgreSQL',
  'Prisma',
  'Socket.IO',
  'WebRTC',
  'Docker',
  'Git',
  'Java',
  'C++',
  'Python',
]
  .map((s) => `<span>${s}</span>`)
  .join('');
// Typing effect for the sub-roles
const roles = [
  'Full Stack Engineer',
  'Dashboards and SaaS builder',
  'React, Next.js, NestJS, PostgreSQL',
];
let ri = 0,
  ci = 0,
  del = false;
(function type() {
  const w = roles[ri],
    el = $('#typed');
  el.textContent = w.slice(0, ci);
  if (RM) {
    el.textContent = roles[0];
    return;
  }
  if (!del && ci === w.length) {
    del = true;
    return setTimeout(type, 1400);
  }
  if (del && ci === 0) {
    del = false;
    ri = (ri + 1) % roles.length;
  }
  ci += del ? -1 : 1;
  setTimeout(type, del ? 30 : 70);
})();
// Burger drawer
const bg = $('#bg'),
  dr = $('#dr');
bg.onclick = () => {
  const o = dr.classList.toggle('open');
  bg.setAttribute('aria-expanded', o);
};
dr.onclick = (e) => {
  if (e.target.closest('a')) {
    dr.classList.remove('open');
    bg.setAttribute('aria-expanded', false);
  }
};
// Stagger reveal on scroll
const io = new IntersectionObserver(
  (es) =>
    es.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }),
  { threshold: 0.12 }
);
document.querySelectorAll('.rv').forEach((e, i) => {
  e.style.transitionDelay = (i % 4) * 90 + 'ms';
  io.observe(e);
});
// Contact form: no backend, so it opens WhatsApp with the message prefilled
$('#cf').onsubmit = (e) => {
  e.preventDefault();
  const t = `Hi Haris, I am ${$('#n').value}. ${$('#m').value}`;
  window.open(
    'https://wa.me/923048994097?text=' + encodeURIComponent(t),
    '_blank',
    'noopener'
  );
};
// 3D particle sphere. Points sit on a unit sphere (Fibonacci spiral). Each frame we rotate them
// around Y then X (rotation matrices), then apply perspective: scale = d/(d - z), so near points
// grow and far points shrink. Pointer position (mouse or touch drag) sets the target tilt.
const cv = $('#mesh'),
  g = cv.getContext('2d');
let W,
  H,
  pts = [],
  spin = 0,
  rx = 0,
  ry = 0,
  tx = 0,
  ty = 0,
  vis = true;
function size() {
  const d = Math.min(devicePixelRatio || 1, 2);
  W = cv.clientWidth;
  H = cv.clientHeight;
  cv.width = W * d;
  cv.height = H * d;
  g.setTransform(d, 0, 0, d, 0, 0);
  const n = innerWidth < 700 ? 46 : 96; // fewer points on phones to hold 60fps
  pts = [...Array(n)].map((_, i) => {
    const y = 1 - (2 * (i + 0.5)) / n,
      r = Math.sqrt(1 - y * y),
      a = i * 2.39996;
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  });
}
function draw() {
  g.clearRect(0, 0, W, H);
  spin += RM ? 0 : 0.004;
  rx += (ty * 1.1 - rx) * 0.06;
  ry += (tx * 1.4 - ry) * 0.06;
  const A = spin + ry,
    cA = Math.cos(A),
    sA = Math.sin(A),
    cX = Math.cos(rx),
    sX = Math.sin(rx),
    R = Math.min(W, H) * (innerWidth < 860 ? 0.38 : 0.36),
    cx = W * (innerWidth < 860 ? 0.5 : 0.5),
    cy = H * 0.5;
  const P = pts.map(([x, y, z]) => {
    const x1 = x * cA + z * sA,
      z1 = -x * sA + z * cA,
      y1 = y * cX - z1 * sX,
      z2 = y * sX + z1 * cX,
      k = 2.4 / (2.4 - z2);
    return { x: cx + x1 * R * k, y: cy + y1 * R * k, z: z2, k };
  });
  for (let i = 0; i < P.length; i++)
    for (let j = i + 1; j < P.length; j++) {
      const dx = P[i].x - P[j].x,
        dy = P[i].y - P[j].y,
        d = Math.hypot(dx, dy);
      if (d < R * 0.42) {
        g.strokeStyle = `rgba(0,242,254,${(1 - d / (R * 0.42)) * 0.35})`;
        g.beginPath();
        g.moveTo(P[i].x, P[i].y);
        g.lineTo(P[j].x, P[j].y);
        g.stroke();
      }
    }
  P.forEach((p) => {
    g.fillStyle = p.z > 0 ? '#00F2FE' : '#7F00FF';
    g.globalAlpha = 0.4 + (0.6 * (p.z + 1)) / 2;
    g.beginPath();
    g.arc(p.x, p.y, 1.2 * p.k + 0.6, 0, 7);
    g.fill();
  });
  g.globalAlpha = 1;
  if (vis && !RM) requestAnimationFrame(draw);
}
size();
addEventListener('resize', size);
new IntersectionObserver(([e]) => {
  const was = vis;
  vis = e.isIntersecting;
  if (vis && !was) draw();
}).observe(cv);
draw();
// Pointer: sphere tilt (mouse or touch drag), magnetic buttons, cursor ring, card 3D tilt
const mags = [...document.querySelectorAll('.mag')],
  cur = $('#cur');
let mx = 0,
  my = 0,
  px = 0,
  py = 0;
addEventListener('pointermove', (e) => {
  tx = e.clientX / innerWidth - 0.5;
  ty = e.clientY / innerHeight - 0.5; // normalised to -0.5..0.5 from screen centre
  if (!FINE) return;
  mx = e.clientX;
  my = e.clientY;
  cur.classList.toggle(
    'big',
    !!e.target.closest('a,button,input,textarea,.tilt')
  );
  mags.forEach((m) => {
    const r = m.getBoundingClientRect(),
      dx = e.clientX - (r.left + r.width / 2),
      dy = e.clientY - (r.top + r.height / 2);
    m.style.transform =
      Math.hypot(dx, dy) < 90 ? `translate(${dx * 0.25}px,${dy * 0.25}px)` : '';
  });
  const t = e.target.closest('.tilt');
  document.querySelectorAll('.tilt').forEach((n) => {
    if (n !== t) n.style.transform = '';
  });
  if (t) {
    const r = t.getBoundingClientRect(),
      x = (e.clientX - r.left) / r.width - 0.5,
      y = (e.clientY - r.top) / r.height - 0.5;
    t.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
  }
});
if (FINE && !RM) {
  root.classList.add('fine');
  (function f() {
    px += (mx - px) * 0.2;
    py += (my - py) * 0.2;
    cur.style.transform = `translate(${px}px,${py}px)`;
    requestAnimationFrame(f);
  })();
}
loadRepos();
loadHeat();
