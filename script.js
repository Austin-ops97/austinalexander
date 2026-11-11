const header = document.querySelector('[data-header]');
const progressBar = document.querySelector('[data-scroll-progress]');
const mobileDock = document.querySelector('[data-mobile-dock]');
const chapterStatus = document.querySelector('[data-chapter]');
const hero = document.querySelector('.hero');
const timeline = document.querySelector('.timeline');
const roles = document.querySelectorAll('.role');
const reveals = document.querySelectorAll('.reveal');
const parallaxVisuals = document.querySelectorAll('.project-visual');
const productStories = document.querySelectorAll('.product-story');
const printTriggers = document.querySelectorAll('[data-print]');
const navLinks = document.querySelectorAll('[data-nav]');
const chapterSections = document.querySelectorAll('#intro, #work, #products, #capabilities, #contact');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const precisePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
let ticking = false;
let lastScrollY = window.scrollY;
let dockTimer;

const updateParallax = () => {
  if (reducedMotion) return;
  const viewportCenter = window.innerHeight / 2;

  parallaxVisuals.forEach((visual) => {
    const rect = visual.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    const visualCenter = rect.top + rect.height / 2;
    const offset = Math.round(clamp((viewportCenter - visualCenter) * 0.035, -22, 22));
    visual.style.setProperty('--parallax', `${offset}px`);
  });
};

const updateTimeline = () => {
  if (!timeline) return;
  const rect = timeline.getBoundingClientRect();
  const start = window.innerHeight * 0.68;
  const distance = Math.max(rect.height - window.innerHeight * 0.2, 1);
  const progress = clamp((start - rect.top) / distance, 0, 1);
  timeline.style.setProperty('--timeline-progress', progress.toFixed(4));

  roles.forEach((role) => {
    const roleRect = role.getBoundingClientRect();
    const roleCenter = roleRect.top + roleRect.height / 2;
    role.classList.toggle('in-focus', roleCenter > window.innerHeight * 0.26 && roleCenter < window.innerHeight * 0.72);
  });
};

const settleMobileDock = () => {
  if (!mobileDock || window.innerWidth > 700) return;
  const movingDown = window.scrollY > lastScrollY;
  const moved = Math.abs(window.scrollY - lastScrollY) > 5;

  if (movingDown && moved && window.scrollY > 140) mobileDock.classList.add('hidden');
  window.clearTimeout(dockTimer);
  dockTimer = window.setTimeout(() => mobileDock.classList.remove('hidden'), 220);
  lastScrollY = window.scrollY;
};

const updateScene = () => {
  updateParallax();
  updateTimeline();
  ticking = false;
};

const onScroll = () => {
  header?.classList.toggle('scrolled', window.scrollY > 20);
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  if (progressBar) progressBar.style.transform = `scaleX(${clamp(progress, 0, 1)})`;
  settleMobileDock();

  if (!ticking) {
    window.requestAnimationFrame(updateScene);
    ticking = true;
  }
};

if (!reducedMotion && precisePointer) {
  hero?.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    hero.style.setProperty('--hero-x', `${x * 18}px`);
    hero.style.setProperty('--hero-y', `${y * 14}px`);
  }, { passive: true });

  hero?.addEventListener('pointerleave', () => {
    hero.style.setProperty('--hero-x', '0px');
    hero.style.setProperty('--hero-y', '0px');
  });

  productStories.forEach((story) => {
    story.addEventListener('pointermove', (event) => {
      const rect = story.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      story.style.setProperty('--mx', `${x * 100}%`);
      story.style.setProperty('--my', `${y * 100}%`);
      story.style.setProperty('--tilt-x', `${(0.5 - y) * 4}deg`);
      story.style.setProperty('--tilt-y', `${(x - 0.5) * 5}deg`);
      story.style.setProperty('--lift', '-5px');
      story.classList.add('is-tilting');
    }, { passive: true });

    story.addEventListener('pointerleave', () => {
      story.classList.remove('is-tilting');
      story.style.setProperty('--tilt-x', '0deg');
      story.style.setProperty('--tilt-y', '0deg');
      story.style.setProperty('--lift', '0px');
    });
  });
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    entry.target.closest('.manifesto')?.classList.add('activated');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px' });

reveals.forEach((element) => revealObserver.observe(element));

const projectObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.closest('.project-motion')?.classList.add('activated');
    projectObserver.unobserve(entry.target);
  });
}, { threshold: 0.14, rootMargin: '0px 0px -6%' });

parallaxVisuals.forEach((visual) => projectObserver.observe(visual));

const chapterNames = {
  intro: 'Profile',
  work: 'Experience',
  products: 'Independent work',
  capabilities: 'Capabilities',
  contact: 'Contact'
};

const chapterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const chapter = entry.target.id;
    if (chapterStatus) chapterStatus.textContent = chapterNames[chapter] || 'Profile';
    navLinks.forEach((link) => link.classList.toggle('active', link.dataset.nav === chapter));
  });
}, { threshold: 0, rootMargin: '-38% 0px -56%' });

chapterSections.forEach((section) => chapterObserver.observe(section));
printTriggers.forEach((trigger) => trigger.addEventListener('click', () => window.print()));
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', updateScene, { passive: true });

onScroll();
updateScene();

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
