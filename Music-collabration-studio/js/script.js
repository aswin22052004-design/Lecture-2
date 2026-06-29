/* ==============================
   MAIN SCRIPT — public pages
   ============================== */

// Navbar scroll effect
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// Mobile menu
function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  const hamburger = document.getElementById('hamburger');
  if (menu) menu.classList.toggle('open');
  if (hamburger) hamburger.classList.toggle('open');
}

function closeMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.remove('open');
}

// Scroll reveal
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Animated counters
function animateCounter(el, target) {
  const duration = 2000;
  const start = performance.now();
  const run = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = current.toLocaleString() + '+';
    if (progress < 1) requestAnimationFrame(run);
  };
  requestAnimationFrame(run);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const count = parseInt(el.dataset.count);
      if (count && !el.dataset.animated) {
        el.dataset.animated = 'true';
        animateCounter(el, count);
      }
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

// Hero waveform bars
const heroWave = document.getElementById('heroWave');
if (heroWave) {
  for (let i = 0; i < 40; i++) {
    const bar = document.createElement('div');
    bar.className = 'waveform-bar';
    const h = Math.random() * 70 + 10;
    bar.style.height = h + '%';
    bar.style.animationDuration = (Math.random() * 0.8 + 0.6) + 's';
    bar.style.animationDelay = (Math.random() * 0.6) + 's';
    heroWave.appendChild(bar);
  }
}

// Contact form handler
function handleContact(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  const original = btn.innerHTML;
  btn.innerHTML = '✓ Sent!';
  btn.style.background = 'linear-gradient(135deg,#34d399,#059669)';
  setTimeout(() => {
    btn.innerHTML = original;
    btn.style.background = '';
    e.target.reset();
  }, 3000);
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeMenu();
    }
  });
});
