const header = document.querySelector('[data-header]');
const progressBar = document.querySelector('[data-scroll-progress]');
const cursorRing = document.querySelector('[data-cursor]');
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
const portfolioImages = document.querySelectorAll('[data-portfolio-image]');
const portfolioTransitions = new WeakMap();
const chapterSections = document.querySelectorAll('#intro, #work, #products, #capabilities, #contact');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const precisePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const createMotionChannel = (initialValues, apply, onSettle, response = 72) => {
  const values = { ...initialValues };
  const targets = { ...initialValues };
  let frame = 0;
  let lastTime = 0;

  const tick = (time) => {
    const elapsed = lastTime ? Math.min(time - lastTime, 34) : 16.7;
    const blend = 1 - Math.exp(-elapsed / response);
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
let wheelFrame = 0;
let wheelTarget = window.scrollY;
let wheelFrameTime = 0;

if (!reducedMotion && precisePointer && cursorRing) {
  const interactiveSelector = 'a,button,input,textarea,select,label,summary,[role="button"],[tabindex]';
  let moveCursor;

  const applyCursorPosition = ({ x, y }) => {
    cursorRing.style.setProperty('--cursor-x', `${x.toFixed(2)}px`);
    cursorRing.style.setProperty('--cursor-y', `${y.toFixed(2)}px`);
  };

  document.addEventListener('pointermove', (event) => {
    if (!moveCursor) {
      applyCursorPosition({ x: event.clientX, y: event.clientY });
      moveCursor = createMotionChannel({ x: event.clientX, y: event.clientY }, applyCursorPosition, null, 34);
      document.body.classList.add('cursor-enhanced');
    }

    cursorRing.classList.remove('is-hidden');
    cursorRing.classList.toggle('is-hovering', event.target instanceof Element && Boolean(event.target.closest(interactiveSelector)));
    moveCursor({ x: event.clientX, y: event.clientY });
  }, { passive: true });

  document.addEventListener('pointerdown', () => cursorRing.classList.add('is-pressed'), { passive: true });
  document.addEventListener('pointerup', () => cursorRing.classList.remove('is-pressed'), { passive: true });
  document.addEventListener('pointercancel', () => cursorRing.classList.remove('is-pressed'), { passive: true });
  document.addEventListener('pointerout', (event) => {
    if (!event.relatedTarget) cursorRing.classList.add('is-hidden');
  }, { passive: true });
  window.addEventListener('blur', () => cursorRing.classList.add('is-hidden'));
}

const getParallaxOffsets = () => {
  if (reducedMotion) return [];
  const viewportCenter = window.innerHeight / 2;
  const offsets = [];

  parallaxVisuals.forEach((visual) => {
    const rect = visual.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    const visualCenter = rect.top + rect.height / 2;
    const offset = Math.round(clamp((viewportCenter - visualCenter) * 0.035, -22, 22));
    offsets.push([visual, offset]);
  });

  return offsets;
};

const getTimelineProgress = () => {
  if (!timeline) return null;
  const rect = timeline.getBoundingClientRect();
  const start = window.innerHeight * 0.68;
  const distance = Math.max(rect.height - window.innerHeight * 0.2, 1);
  return clamp((start - rect.top) / distance, 0, 1);
};

const settleMobileDock = (scrollY) => {
  if (!mobileDock || window.innerWidth > 700) return;
  const movingDown = scrollY > lastScrollY;
  const moved = Math.abs(scrollY - lastScrollY) > 5;

  if (movingDown && moved && scrollY > 140) mobileDock.classList.add('hidden');
  window.clearTimeout(dockTimer);
  dockTimer = window.setTimeout(() => mobileDock.classList.remove('hidden'), 220);
  lastScrollY = scrollY;
};

const updateScene = () => {
  const scrollY = window.scrollY;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? scrollY / scrollable : 0;
  const timelineProgress = getTimelineProgress();
  const parallaxOffsets = getParallaxOffsets();

  settleMobileDock(scrollY);
  header?.classList.toggle('scrolled', scrollY > 20);
  if (progressBar) progressBar.style.transform = `scaleX(${clamp(progress, 0, 1)})`;
  if (timelineProgress !== null) timeline.style.setProperty('--timeline-progress', timelineProgress.toFixed(4));
  parallaxOffsets.forEach(([visual, offset]) => visual.style.setProperty('--parallax', `${offset}px`));
  ticking = false;
};

const scheduleSceneUpdate = () => {
  if (!ticking) {
    window.requestAnimationFrame(updateScene);
    ticking = true;
  }
};

const onScroll = () => scheduleSceneUpdate();

if (!reducedMotion && precisePointer) {
  const animateWheelScroll = (time) => {
    const elapsed = wheelFrameTime ? Math.min(time - wheelFrameTime, 34) : 16.7;
    wheelFrameTime = time;
    const current = window.scrollY;
    const distance = wheelTarget - current;
    const next = Math.abs(distance) < 0.6
      ? wheelTarget
      : current + distance * (1 - Math.exp(-elapsed / 105));

    window.scrollTo({ top: next, behavior: 'instant' });
    if (next === wheelTarget) {
      wheelFrame = 0;
      wheelFrameTime = 0;
      return;
    }

    wheelFrame = window.requestAnimationFrame(animateWheelScroll);
  };

  window.addEventListener('wheel', (event) => {
    if (event.ctrlKey || event.shiftKey || event.deltaX !== 0 || event.deltaY === 0) return;

    const isSteppedWheel = event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL
      || Math.abs(event.deltaY) >= 60;

    if (!isSteppedWheel) {
      if (wheelFrame) {
        window.cancelAnimationFrame(wheelFrame);
        wheelFrame = 0;
        wheelFrameTime = 0;
      }
      return;
    }

    event.preventDefault();
    const lineScale = event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? 40
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? window.innerHeight
        : 1;
    if (!wheelFrame) wheelTarget = window.scrollY;
    wheelTarget = clamp(wheelTarget + event.deltaY * lineScale, 0, document.documentElement.scrollHeight - window.innerHeight);
    if (!wheelFrame) wheelFrame = window.requestAnimationFrame(animateWheelScroll);
  }, { passive: false });
}

const updatePortfolioPressedState = (visual, activeImage) => {
  visual.querySelectorAll('[data-portfolio-image]').forEach((portfolioImage) => {
    portfolioImage.setAttribute('aria-pressed', String(portfolioImage.dataset.portfolioImage === activeImage));
  });
};

const completePortfolioTransition = (visual, activeImage, animations, frame) => {
  if (frame) window.cancelAnimationFrame(frame);
  visual.dataset.activeImage = activeImage;
  visual.removeAttribute('data-transitioning');
  visual.querySelectorAll('[data-portfolio-image]').forEach((portfolioImage) => {
    portfolioImage.style.removeProperty('z-index');
  });
  animations.forEach((animation) => animation.cancel());
  updatePortfolioPressedState(visual, activeImage);
};

const animatePortfolioImageFront = (visual, imageMode) => {
  const outgoingMode = visual.dataset.activeImage;
  const incoming = visual.querySelector(`[data-portfolio-image="${imageMode}"]`);
  const outgoing = visual.querySelector(`[data-portfolio-image="${outgoingMode}"]`);
  if (!incoming || !outgoing || incoming === outgoing) return;

  const direction = imageMode === 'dark' ? 1 : -1;
  const duration = 920;
  const easing = 'cubic-bezier(.2,.72,.16,1)';

  visual.dataset.transitioning = 'true';
  updatePortfolioPressedState(visual, imageMode);
  incoming.style.zIndex = '1';
  outgoing.style.zIndex = '4';

  const incomingAnimation = incoming.animate([
    { transform: 'translate3d(0,0,0) scale(1) rotateY(0deg)', offset: 0 },
    { transform: `translate3d(${direction * 14}px,8px,-72px) scale(.955) rotateY(${direction * -4}deg)`, offset: .2 },
    { transform: `translate3d(${direction * 78}px,-8px,-118px) scale(.91) rotateY(${direction * -8}deg)`, offset: .43 },
    { transform: `translate3d(${direction * 104}px,-18px,-38px) scale(.96) rotateY(${direction * -4}deg)`, offset: .58 },
    { transform: `translate3d(${direction * 44}px,-10px,24px) scale(1.018) rotateY(${direction * 1.4}deg)`, offset: .76 },
    { transform: 'translate3d(0,0,0) scale(1) rotateY(0deg)', offset: 1 }
  ], { duration, easing, fill: 'both' });

  const outgoingAnimation = outgoing.animate([
    { transform: 'translate3d(0,0,0) scale(1) rotateY(0deg)', offset: 0 },
    { transform: `translate3d(${direction * -10}px,-5px,18px) scale(1.008) rotateY(${direction * 1.5}deg)`, offset: .2 },
    { transform: `translate3d(${direction * -22}px,8px,-68px) scale(.95) rotateY(${direction * 4}deg)`, offset: .5 },
    { transform: `translate3d(${direction * -8}px,5px,-34px) scale(.975) rotateY(${direction * 2}deg)`, offset: .72 },
    { transform: 'translate3d(0,0,0) scale(1) rotateY(0deg)', offset: 1 }
  ], { duration, easing, fill: 'both' });

  const animations = [incomingAnimation, outgoingAnimation];
  const transition = { target: imageMode, animations, frame: 0, queuedTarget: null, planeSwapped: false };
  portfolioTransitions.set(visual, transition);

  const followAnimation = () => {
    const currentTransition = portfolioTransitions.get(visual);
    if (currentTransition !== transition) return;

    const timelineProgress = Math.max(0, Math.min(1, (incomingAnimation.currentTime || 0) / duration));
    const visualProgress = incomingAnimation.effect?.getComputedTiming().progress ?? timelineProgress;
    if (!transition.planeSwapped && visualProgress >= .59) {
      transition.planeSwapped = true;
      incoming.style.zIndex = '5';
      outgoing.style.zIndex = '1';
    }

    if (timelineProgress < 1) {
      transition.frame = window.requestAnimationFrame(followAnimation);
      return;
    }

    const queuedTarget = transition.queuedTarget;
    completePortfolioTransition(visual, imageMode, animations, transition.frame);
    portfolioTransitions.delete(visual);
    if (queuedTarget && queuedTarget !== imageMode) animatePortfolioImageFront(visual, queuedTarget);
  };

  transition.frame = window.requestAnimationFrame(followAnimation);
};

const setPortfolioImageFront = (image) => {
  const visual = image.closest('.dual-landscape');
  if (!visual) return;

  const imageMode = image.dataset.portfolioImage;
  const currentTransition = portfolioTransitions.get(visual);
  if (currentTransition) {
    if (currentTransition.target !== imageMode) currentTransition.queuedTarget = imageMode;
    return;
  }

  if (visual.dataset.activeImage === imageMode) return;

  if (reducedMotion || window.matchMedia('(max-width: 700px)').matches) {
    visual.dataset.activeImage = imageMode;
    updatePortfolioPressedState(visual, imageMode);
    return;
  }

  updatePortfolioPressedState(visual, imageMode);
  animatePortfolioImageFront(visual, imageMode);
};

portfolioImages.forEach((image) => {
  image.addEventListener('click', () => setPortfolioImageFront(image));
  image.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setPortfolioImageFront(image);
  });
  if (precisePointer) {
    image.addEventListener('pointerenter', () => setPortfolioImageFront(image), { passive: true });
  }
});

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
    if (story.querySelector('.dual-landscape')) return;
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

const roleFocusObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => entry.target.classList.toggle('in-focus', entry.isIntersecting));
}, { threshold: 0, rootMargin: '-26% 0px -28%' });

roles.forEach((role) => roleFocusObserver.observe(role));

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
window.addEventListener('resize', scheduleSceneUpdate, { passive: true });

onScroll();
updateScene();

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
