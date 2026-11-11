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
const createMotionChannel = (initialValues, apply, onSettle) => {
  const values = { ...initialValues };
  const targets = { ...initialValues };
  let frame = 0;
  let lastTime = 0;

  const tick = (time) => {
    const elapsed = lastTime ? Math.min(time - lastTime, 34) : 16.7;
    const blend = 1 - Math.exp(-elapsed / 72);
    let moving = false;
    lastTime = time;

    Object.keys(values).forEach((key) => {
      const distance = targets[key] - values[key];
      values[key] += distance * blend;
      if (Math.abs(distance) > 0.01) moving = true;
      else values[key] = targets[key];
    });

    apply(values);
    if (moving) frame = window.requestAnimationFrame(tick);
    else {
      frame = 0;
      lastTime = 0;
      onSettle?.(values, targets);
    }
  };

  return (nextTargets) => {
    Object.assign(targets, nextTargets);
    if (!frame) frame = window.requestAnimationFrame(tick);
  };
};
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
  let heroResting = false;
  const moveHero = createMotionChannel({ x: 0, y: 0 }, ({ x, y }) => {
    hero?.style.setProperty('--hero-x', `${x.toFixed(2)}px`);
    hero?.style.setProperty('--hero-y', `${y.toFixed(2)}px`);
  }, () => {
    if (heroResting) hero?.classList.remove('motion-active');
  });

  hero?.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    heroResting = false;
    hero.classList.add('motion-active');
    moveHero({ x: x * 18, y: y * 14 });
  }, { passive: true });

  hero?.addEventListener('pointerleave', () => {
    heroResting = true;
    moveHero({ x: 0, y: 0 });
  });

  productStories.forEach((story) => {
    let storyResting = false;
    const moveStory = createMotionChannel({ tiltX: 0, tiltY: 0, lift: 0 }, ({ tiltX, tiltY, lift }) => {
      story.style.setProperty('--tilt-x', `${tiltX.toFixed(3)}deg`);
      story.style.setProperty('--tilt-y', `${tiltY.toFixed(3)}deg`);
      story.style.setProperty('--lift', `${lift.toFixed(2)}px`);
    }, () => {
      if (storyResting) story.classList.remove('is-tilting');
    });

    story.addEventListener('pointermove', (event) => {
      const rect = story.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      storyResting = false;
      story.classList.add('is-tilting');
      moveStory({ tiltX: (0.5 - y) * 4, tiltY: (x - 0.5) * 5, lift: -5 });
    }, { passive: true });

    story.addEventListener('pointerleave', () => {
      storyResting = true;
      moveStory({ tiltX: 0, tiltY: 0, lift: 0 });
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
