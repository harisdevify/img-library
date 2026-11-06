/* Portfolio runtime: progressive enhancement, no authentication tokens. */
(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const desktop = window.matchMedia('(min-width: 861px)').matches;
  const projects = {
    debate: {
      kind: '01 / REAL-TIME PLATFORM', title: 'Debate — Real-time dialogue',
      description: 'An open-source discussion platform with live video, real-time chat, and cookie-based authentication.',
      points: ['Next.js 16 / React 19 frontend with TypeScript.', 'NestJS 11 API with PostgreSQL and Prisma.', 'Socket.IO and WebRTC support real-time messaging and video.', 'JWT-based httpOnly cookie authentication and documented test setup.'],
      tags: ['NEXT.JS', 'NESTJS', 'TYPESCRIPT', 'POSTGRESQL', 'PRISMA', 'SOCKET.IO', 'WEBRTC'],
      href: 'https://github.com/harisdevify/debateNextJS'
    },
    pos: {
      kind: '02 / BUSINESS SOFTWARE', title: 'POS Web App',
      description: 'A public Next.js business application repository. Its README currently contains standard framework setup instructions, so detailed feature claims are intentionally omitted.',
      points: ['Built with the Next.js application framework.', 'Explore the source repository for current implementation and available features.', 'Detailed architecture and performance metrics are not documented publicly.'],
      tags: ['NEXT.JS', 'BUSINESS APPLICATION'],
      href: 'https://github.com/harisdevify/POS-Web-App'
    },
    commerce: {
      kind: '03 / BACKEND EXPLORATION', title: 'E-commerce backend',
      description: 'A backend repository with a minimal public README referencing Prisma installation. This is presented as an engineering exploration rather than an undocumented production system.',
      points: ['Backend-oriented open-source project.', 'Public README mentions Prisma installation.', 'No unsupported uptime, API throughput, or deployment claims.'],
      tags: ['BACKEND', 'PRISMA'],
      href: 'https://github.com/harisdevify/e-commerce-backed'
    }
  };
  const nav = $('#nav-links');
  const menu = $('#menu-toggle');
  const closeMenu = () => {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open navigation');
  };
  menu.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(isOpen));
    menu.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });
  nav.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  document.addEventListener('click', e => {
    if (!nav.contains(e.target) && !menu.contains(e.target)) closeMenu();
  });
  const time = $('#pkt');
  function updateClock() {
    time.textContent = 'PKT ' + new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Karachi',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
  }
  updateClock();
  const clockTimer = window.setInterval(() => { if (!document.hidden) updateClock(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateClock(); });
  // Accessible native dialog: showModal manages focus trapping and inert background.
  const dialog = $('#project-dialog');
  const close = $('#dialog-close');
  let invoker = null;
  $$('[data-open]').forEach(button => button.addEventListener('click', () => {
    const project = projects[button.dataset.open];
    if (!project || typeof dialog.showModal !== 'function') return;
    invoker = button;
    $('#dialog-kind').textContent = project.kind;
    $('#dialog-title').textContent = project.title;
    $('#dialog-description').textContent = project.description;
    const list = $('#dialog-points');
    list.replaceChildren(...project.points.map(text => {
      const li = document.createElement('li');
      li.textContent = text;
      return li;
    }));
    const tags = $('#dialog-tags');
    tags.replaceChildren(...project.tags.map(text => {
      const span = document.createElement('span');
      span.textContent = text;
      return span;
    }));
    $('#dialog-source').href = project.href;
    dialog.showModal();
    document.body.classList.add('dialog-open');
    close.focus();
  }));
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    invoker?.focus();
  });
  // Intro must never block the page if script / third-party assets fail.
  const intro = $('#intro');
  let dismissed = false;
  const removeIntro = () => {
    if (dismissed) return;
    dismissed = true;
    intro.classList.add('is-hidden');
    try { sessionStorage.setItem('haris-intro-seen', '1'); } catch {}
    window.setTimeout(() => intro.remove(), 650);
  };
  try {
    if (!motion || sessionStorage.getItem('haris-intro-seen') === '1') removeIntro();
    else window.setTimeout(removeIntro, 1150);
  } catch { removeIntro(); }
  window.setTimeout(removeIntro, 2000);
  // Intersection-based nav highlighting does not require scroll event layout reads.
  const sections = $$('main section[id]');
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      const candidate = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
      if (!candidate) return;
      $$('.nav-links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + candidate.target.id));
    }, {rootMargin:'-20% 0px -55% 0px',threshold:[0,.1,.25,.5]});
    sections.forEach(section => sectionObserver.observe(section));
  }
  // GSAP is optional; all content is visible without it.
  if (motion && desktop && window.gsap && window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    document.documentElement.classList.add('js-motion');
    $$('.reveal').forEach(el => {
      window.gsap.fromTo(el,{autoAlpha:0,y:22},{autoAlpha:1,y:0,duration:.8,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 92%',once:true}});
    });
  }
  // Fine-pointer cursor follows with exponential damping and a single RAF.
  if (fine && motion) {
    const cursor = $('#cursor');
    let targetX = -50, targetY = -50, x = -50, y = -50, active = true;
    document.addEventListener('pointermove', event => {
      targetX = event.clientX; targetY = event.clientY;
      cursor.classList.add('visible');
      cursor.classList.toggle('hovering', Boolean(event.target.closest('a,button')));
    }, {passive:true});
    document.addEventListener('pointerleave', () => cursor.classList.remove('visible'));
    const renderCursor = () => {
      if (!active) return;
      x += (targetX - x) * .18;
      y += (targetY - y) * .18;
      cursor.style.transform = 'translate3d(' + (x-11) + 'px,' + (y-11) + 'px,0)';
      requestAnimationFrame(renderCursor);
    };
    requestAnimationFrame(renderCursor);
    window.addEventListener('pagehide', () => { active = false; }, {once:true});
  }
  // Public-only API, no token: 6h session cache and a stable static fallback.
  async function loadRepos() {
    const container = $('#repo-list');
    const status = $('#github-status');
    const cacheKey = 'haris-public-repos-v1';
    let data = null;
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
      if (cached && Date.now() - cached.timestamp < 21600000) data = cached.data;
    } catch {}
    if (!data) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 6500);
      try {
        const response = await fetch('https://api.github.com/users/harisdevify/repos?per_page=60&sort=updated', {signal:controller.signal,headers:{Accept:'application/vnd.github+json'}});
        if (!response.ok) throw new Error('GitHub responded ' + response.status);
        const payload = await response.json();
        if (!Array.isArray(payload)) throw new Error('Unexpected GitHub response');
        data = payload.filter(repo => !repo.fork && !repo.archived && !/test/i.test(repo.name)).slice(0,4)
          .map(repo => ({name:repo.name,url:repo.html_url,language:repo.language||'SOURCE CODE'}));
        try { sessionStorage.setItem(cacheKey, JSON.stringify({timestamp:Date.now(),data})); } catch {}
      } catch {
        status.textContent = 'GitHub activity is temporarily unavailable. Explore the selected work above.';
        return;
      } finally { clearTimeout(timeout); }
    }
    const fragment = document.createDocumentFragment();
    data.forEach(repo => {
      if (!/^https:\/\/github\.com\/harisdevify\/[A-Za-z0-9_.-]+\/?$/.test(repo.url)) return;
      const a = document.createElement('a');
      a.className = 'repo-item';
      a.href = repo.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      const strong = document.createElement('strong');
      strong.textContent = repo.name + ' ↗';
      const meta = document.createElement('span');
      meta.textContent = String(repo.language).toUpperCase() + ' / PUBLIC REPOSITORY';
      a.append(strong,meta); fragment.append(a);
    });
    if (!fragment.childNodes.length) { status.textContent = 'Explore public source code on GitHub.'; return; }
    container.replaceChildren(fragment);
    status.textContent = 'Selected recently updated public repositories.';
  }
  loadRepos();
  // Progressive WebGL: no particle DOM nodes, BufferGeometry + typed arrays, reduced device resolution.
  async function startUniverse() {
    if (!motion || !desktop || !('WebGLRenderingContext' in window)) return;
    const canvas = $('#universe');
    if (!canvas) return;
    let THREE;
    try { THREE = await import('https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js'); } catch { return; }
    const hero = $('#home');
    if (!hero || !hero.isConnected) return;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'low-power'}); } catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58,1,.1,150);
    camera.position.z = 33;
    const count = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4 ? 650 : 1450;
    const positions = new Float32Array(count * 3);
    const origins = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i=0;i<count;i++) {
      const i3=i*3;
      const x=(Math.random()-.5)*58, y=(Math.random()-.5)*35, z=(Math.random()-.5)*27;
      positions[i3]=origins[i3]=x; positions[i3+1]=origins[i3+1]=y; positions[i3+2]=origins[i3+2]=z;
      const bright=Math.random()>.8;
      colors[i3]=bright?.72:.18; colors[i3+1]=bright?1:.38; colors[i3+2]=bright?.35:.23;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    const material = new THREE.PointsMaterial({size:.105,vertexColors:true,transparent:true,opacity:.82,sizeAttenuation:true,depthWrite:false});
    const cloud = new THREE.Points(geometry,material);
    scene.add(cloud);
    let targetX=0,targetY=0,mouseX=0,mouseY=0,visible=true,running=true,last=performance.now(),frame=0;
    function resize() {
      const rect=hero.getBoundingClientRect();
      const width=Math.max(rect.width,1),height=Math.max(rect.height,1);
      renderer.setSize(width,height,false);
      camera.aspect=width/height;camera.updateProjectionMatrix();
    }
    resize();
    const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(hero);
    const onResize=()=>resize();
    window.addEventListener('resize',onResize,{passive:true});
    const onPointer = event => { targetX=(event.clientX/window.innerWidth-.5)*35;targetY=-(event.clientY/window.innerHeight-.5)*19; };
    window.addEventListener('pointermove',onPointer,{passive:true});
    // IntersectionObserver suspends GPU work if the hero is out of view.
    const observer = new IntersectionObserver(entries => { visible=entries[0].isIntersecting; },{threshold:0});
    observer.observe(hero);
    function render(now) {
      if (!running) return;
      requestAnimationFrame(render);
      const delta=Math.min((now-last)/1000,.05);last=now;
      if (!visible || document.hidden) return;
      frame+=delta;
      // Exponential damping, stable across variable refresh rates.
      const follow=1-Math.exp(-5*delta);
      mouseX+=(targetX-mouseX)*follow;mouseY+=(targetY-mouseY)*follow;
      const friction=Math.exp(-8*delta);
      const attract=1-Math.exp(-4*delta);
      for(let i=0;i<count;i++){
        const j=i*3;
        const ox=origins[j],oy=origins[j+1],oz=origins[j+2];
        const swirl=Math.sin(frame*.22 + ox*.09 + oz*.04)*.48;
        const dx=ox-mouseX,dy=oy-mouseY;
        const d2=dx*dx+dy*dy+2;
        const repel=Math.min(13/d2,1.6);
        const wantedX=ox+swirl+dx*repel;
        const wantedY=oy+Math.cos(frame*.2+ox*.11)*.33+dy*repel;
        velocities[j]=velocities[j]*friction+(wantedX-positions[j])*attract;
        velocities[j+1]=velocities[j+1]*friction+(wantedY-positions[j+1])*attract;
        positions[j]+=velocities[j]*delta*20;
        positions[j+1]+=velocities[j+1]*delta*20;
      }
      geometry.attributes.position.needsUpdate=true;
      cloud.rotation.y=Math.sin(frame*.12)*.08;
      renderer.render(scene,camera);
    }
    requestAnimationFrame(render);
    window.addEventListener('pagehide',()=>{running=false;observer.disconnect();resizeObserver?.disconnect();window.removeEventListener('resize',onResize);window.removeEventListener('pointermove',onPointer);geometry.dispose();material.dispose();renderer.dispose();},{once:true});
  }
  startUniverse();
  window.addEventListener('pagehide',()=>window.clearInterval(clockTimer),{once:true});
})();