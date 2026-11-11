const header = document.querySelector('[data-header]');
const progressBar = document.querySelector('[data-scroll-progress]');
const reveals = document.querySelectorAll('.reveal');
const parallaxVisuals = document.querySelectorAll('.project-visual');
const productStories = document.querySelectorAll('.product-story');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let ticking = false;

const updateParallax = () => {
  if (reducedMotion) return;
  const viewportCenter = window.innerHeight / 2;
  parallaxVisuals.forEach((visual) => {
    const rect = visual.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    const visualCenter = rect.top + rect.height / 2;
    const offset = Math.max(-22, Math.min(22, (viewportCenter - visualCenter) * 0.035));
    visual.style.setProperty('--parallax', `${offset}px`);
  });
};

const onScroll = () => {
  header.classList.toggle('scrolled', window.scrollY > 20);
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  progressBar.style.transform = `scaleX(${Math.max(0, Math.min(1, progress))})`;
  if (!ticking) {
    requestAnimationFrame(() => {
      updateParallax();
      ticking = false;
    });
    ticking = true;
  }
};

productStories.forEach((story) => {
  story.addEventListener('pointermove', (event) => {
    const rect = story.getBoundingClientRect();
    story.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width) * 100}%`);
    story.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height) * 100}%`);
  }, { passive: true });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px' });

reveals.forEach((el) => observer.observe(el));

const projectObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.closest('.project-motion')?.classList.add('activated');
      projectObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14, rootMargin: '0px 0px -6%' });

parallaxVisuals.forEach((visual) => projectObserver.observe(visual));
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
updateParallax();

document.getElementById('year').textContent = new Date().getFullYear();
