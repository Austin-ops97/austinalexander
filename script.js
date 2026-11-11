const header = document.querySelector('[data-header]');
const reveals = document.querySelectorAll('.reveal');
const deviceStories = document.querySelectorAll('.device-motion');

const onScroll = () => {
  header.classList.toggle('scrolled', window.scrollY > 20);
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px' });

reveals.forEach((el) => observer.observe(el));

const deviceObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('activated');
      deviceObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2, rootMargin: '0px 0px -8%' });

deviceStories.forEach((story) => deviceObserver.observe(story));
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

document.getElementById('year').textContent = new Date().getFullYear();
